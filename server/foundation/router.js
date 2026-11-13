import { Router } from 'express'
import { randomUUID } from 'node:crypto'
import { unlink } from 'node:fs/promises'
import path from 'node:path'
import { audit, nowIso } from './db.js'
import {
  SESSION_COOKIE,
  attachSession,
  createSession,
  createUser,
  destroySession,
  destroyUserSessions,
  findUserByEmail,
  hashPassword,
  isValidEmail,
  nameProblem,
  normalizeEmail,
  originGuard,
  passwordProblem,
  publicUser,
  requireAdmin,
  requireAuth,
  sessionCookieOptions,
  verifyPassword,
  workspacesForUser,
} from './auth.js'
import { asyncRoute, fail } from './errors.js'
import { rateLimit } from './rateLimit.js'
import {
  fileExists,
  mapUpload,
  receiveUpload,
  removeUpload,
  removeUserFiles,
  storeUpload,
  uploadLimits,
  uploadPath,
  uploadUsage,
} from './uploads.js'
import {
  findInquiryById,
  inquiryCounts,
  inquiryUploadPath,
  isDraftId,
  listInquiries,
  listInquiryUploads,
  mapInquiry,
  mapInquiryUpload,
  removeInquiryUpload,
  storeInquiryUpload,
  updateInquiryStatus,
} from '../inquiries.js'

function toUser(row) {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    status: row.status,
    createdAt: row.created_at,
    lastLoginAt: row.last_login_at,
  }
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function isId(value) {
  return typeof value === 'string' && UUID_PATTERN.test(value)
}

function workspaceAccess(db, workspaceId, user) {
  if (!isId(workspaceId)) return null
  const workspace = db.prepare('SELECT * FROM workspaces WHERE id = ?').get(workspaceId)
  if (!workspace) return null
  if (user.role === 'admin') return { ...workspace, memberRole: 'admin' }
  const membership = db
    .prepare('SELECT role FROM workspace_members WHERE workspace_id = ? AND user_id = ?')
    .get(workspaceId, user.id)
  return membership ? { ...workspace, memberRole: membership.role } : null
}

function safeFilenameHeader(name) {
  const ascii = name.replace(/[^\x20-\x7e]/g, '_').replace(/["\\]/g, '_')
  return `inline; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(name)}`
}

export function createFoundationRouter({ db, dataDir }) {
  const router = Router()
  router.use(attachSession(db))
  router.use(originGuard)

  router.get('/status', (_req, res) => {
    res.json({ ok: true, foundation: 'phase-0', auth: true, storage: 'local', payments: 'disabled' })
  })

  router.post(
    '/auth/register',
    rateLimit(db, { bucket: 'register', limit: 10, windowMs: 60 * 60 * 1000 }),
    asyncRoute(async (req, res) => {
      const body = req.body || {}
      const name = String(body.name || '').trim()
      const email = normalizeEmail(body.email)
      const password = body.password

      if (nameProblem(name)) fail(400, 'invalid_name', nameProblem(name))
      if (!isValidEmail(email)) fail(400, 'invalid_email', 'Enter a valid email address.')
      if (passwordProblem(password)) fail(400, 'weak_password', passwordProblem(password))
      if (body.acceptTerms !== true) {
        fail(400, 'terms_required', 'Please accept the terms of service and privacy policy.')
      }
      if (findUserByEmail(db, email)) {
        fail(409, 'email_taken', 'An account with this email already exists.')
      }

      let user
      try {
        user = createUser(db, { name, email, password, termsAcceptedAt: nowIso() })
      } catch (error) {
        if (String(error?.message || '').includes('UNIQUE')) {
          fail(409, 'email_taken', 'An account with this email already exists.')
        }
        throw error
      }

      const token = createSession(db, user.id, req)
      audit(db, { actorId: user.id, action: 'account.created', targetType: 'user', targetId: user.id, ip: req.ip })
      res.cookie(SESSION_COOKIE, token, sessionCookieOptions(req))
      res.status(201).json({ ok: true, user: publicUser(db, toUser(user)) })
    }),
  )

  router.post(
    '/auth/login',
    rateLimit(db, { bucket: 'login-ip', limit: 12, windowMs: 15 * 60 * 1000 }),
    rateLimit(db, { bucket: 'login-email', limit: 6, windowMs: 15 * 60 * 1000, by: 'email' }),
    asyncRoute(async (req, res) => {
      const email = normalizeEmail(req.body?.email)
      const password = req.body?.password
      if (!isValidEmail(email) || typeof password !== 'string' || !password) {
        fail(400, 'invalid_credentials', 'Enter your email and password.')
      }

      const row = findUserByEmail(db, email)
      if (!row || !verifyPassword(password, row.password_hash)) {
        audit(db, { action: 'account.login_failed', targetType: 'user', targetId: row?.id ?? null, ip: req.ip })
        fail(401, 'invalid_credentials', 'Email or password is incorrect.')
      }
      if (row.status !== 'active') {
        fail(403, 'account_suspended', 'This account is suspended. Contact the studio for help.')
      }

      db.prepare('UPDATE users SET last_login_at = ?, updated_at = ? WHERE id = ?').run(nowIso(), nowIso(), row.id)
      const token = createSession(db, row.id, req)
      audit(db, { actorId: row.id, action: 'account.login', targetType: 'user', targetId: row.id, ip: req.ip })
      res.cookie(SESSION_COOKIE, token, sessionCookieOptions(req))
      const fresh = db.prepare('SELECT * FROM users WHERE id = ?').get(row.id)
      res.json({ ok: true, user: publicUser(db, toUser(fresh)) })
    }),
  )

  router.post(
    '/auth/logout',
    asyncRoute(async (req, res) => {
      destroySession(db, req.sessionToken)
      if (req.user) {
        audit(db, { actorId: req.user.id, action: 'account.logout', targetType: 'user', targetId: req.user.id, ip: req.ip })
      }
      res.clearCookie(SESSION_COOKIE, { path: '/' })
      res.json({ ok: true })
    }),
  )

  router.get('/auth/me', requireAuth, (req, res) => {
    res.json({ ok: true, user: publicUser(db, req.user) })
  })

  router.patch(
    '/account',
    requireAuth,
    asyncRoute(async (req, res) => {
      const body = req.body || {}
      if (body.email && normalizeEmail(body.email) !== req.user.email) {
        fail(400, 'email_locked', 'Email changes are handled by the studio for now. Contact us to update it.')
      }
      const problem = nameProblem(body.name)
      if (problem) fail(400, 'invalid_name', problem)
      db.prepare('UPDATE users SET name = ?, updated_at = ? WHERE id = ?').run(String(body.name).trim(), nowIso(), req.user.id)
      audit(db, { actorId: req.user.id, action: 'account.profile_updated', targetType: 'user', targetId: req.user.id, ip: req.ip })
      const row = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id)
      res.json({ ok: true, user: publicUser(db, toUser(row)) })
    }),
  )

  router.post(
    '/account/password',
    rateLimit(db, { bucket: 'password', limit: 6, windowMs: 15 * 60 * 1000, by: 'user' }),
    requireAuth,
    asyncRoute(async (req, res) => {
      const { currentPassword, newPassword } = req.body || {}
      const row = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id)
      if (!row || !verifyPassword(String(currentPassword || ''), row.password_hash)) {
        fail(400, 'invalid_password', 'Your current password is incorrect.')
      }
      const problem = passwordProblem(newPassword)
      if (problem) fail(400, 'weak_password', problem)
      if (currentPassword === newPassword) fail(400, 'password_unchanged', 'Choose a new password that is different.')
      db.prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?').run(hashPassword(newPassword), nowIso(), row.id)
      destroyUserSessions(db, row.id)
      const token = createSession(db, row.id, req)
      audit(db, { actorId: row.id, action: 'account.password_changed', targetType: 'user', targetId: row.id, ip: req.ip })
      res.cookie(SESSION_COOKIE, token, sessionCookieOptions(req))
      res.json({ ok: true })
    }),
  )

  router.get(
    '/account/export',
    requireAuth,
    asyncRoute(async (req, res) => {
      const row = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id)
      const uploads = db
        .prepare('SELECT * FROM uploads WHERE user_id = ? ORDER BY created_at DESC')
        .all(req.user.id)
        .map(mapUpload)
      const events = db
        .prepare('SELECT action, target_type, target_id, created_at FROM audit_events WHERE actor_id = ? ORDER BY id DESC LIMIT 500')
        .all(req.user.id)
      const payload = {
        exportedAt: nowIso(),
        account: toUser(row),
        workspaces: workspacesForUser(db, req.user.id),
        uploads,
        activity: events.map((event) => ({
          action: event.action,
          targetType: event.target_type,
          targetId: event.target_id,
          createdAt: event.created_at,
        })),
      }
      audit(db, { actorId: req.user.id, action: 'account.exported', targetType: 'user', targetId: req.user.id, ip: req.ip })
      res.set('Content-Type', 'application/json; charset=utf-8')
      res.set('Content-Disposition', 'attachment; filename="brix-account-export.json"')
      res.set('Cache-Control', 'no-store')
      res.send(JSON.stringify(payload, null, 2))
    }),
  )

  router.delete(
    '/account',
    requireAuth,
    asyncRoute(async (req, res) => {
      const { password, confirm } = req.body || {}
      if (confirm !== 'DELETE') fail(400, 'confirm_required', 'Type DELETE to confirm account removal.')
      const row = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id)
      if (!row || !verifyPassword(String(password || ''), row.password_hash)) {
        fail(400, 'invalid_password', 'Your password is incorrect.')
      }
      await removeUserFiles(db, dataDir, row.id)
      audit(db, { actorId: row.id, action: 'account.deleted', targetType: 'user', targetId: row.id, ip: req.ip })
      db.prepare('DELETE FROM users WHERE id = ?').run(row.id)
      res.clearCookie(SESSION_COOKIE, { path: '/' })
      res.json({ ok: true })
    }),
  )

  router.get('/workspaces', requireAuth, (req, res) => {
    res.json({ ok: true, workspaces: workspacesForUser(db, req.user.id) })
  })

  router.post(
    '/workspaces',
    requireAuth,
    rateLimit(db, { bucket: 'workspace-create', limit: 10, windowMs: 60 * 60 * 1000, by: 'user' }),
    asyncRoute(async (req, res) => {
      const name = String(req.body?.name || '').trim()
      if (name.length < 2 || name.length > 80) fail(400, 'invalid_name', 'Workspace names need 2 to 80 characters.')
      const owned = db
        .prepare("SELECT COUNT(*) AS count FROM workspaces WHERE owner_id = ? AND kind = 'project'")
        .get(req.user.id)
      if (Number(owned.count) >= 10) fail(400, 'workspace_limit', 'You have reached the workspace limit.')
      const id = randomUUID()
      const now = nowIso()
      db.exec('BEGIN IMMEDIATE')
      try {
        db.prepare(
          `INSERT INTO workspaces (id, name, kind, owner_id, created_at, updated_at) VALUES (?, ?, 'project', ?, ?, ?)`,
        ).run(id, name, req.user.id, now, now)
        db.prepare(
          `INSERT INTO workspace_members (workspace_id, user_id, role, created_at) VALUES (?, ?, 'owner', ?)`,
        ).run(id, req.user.id, now)
        db.exec('COMMIT')
      } catch (error) {
        db.exec('ROLLBACK')
        throw error
      }
      audit(db, { actorId: req.user.id, action: 'workspace.created', targetType: 'workspace', targetId: id, ip: req.ip })
      res.status(201).json({ ok: true, workspace: { id, name, kind: 'project', role: 'owner', createdAt: now } })
    }),
  )

  router.patch(
    '/workspaces/:id',
    requireAuth,
    asyncRoute(async (req, res) => {
      const workspace = workspaceAccess(db, req.params.id, req.user)
      if (!workspace) fail(404, 'workspace_not_found', 'Workspace not found.')
      if (!['owner', 'admin'].includes(workspace.memberRole)) fail(403, 'forbidden', 'Only the workspace owner can rename it.')
      const name = String(req.body?.name || '').trim()
      if (name.length < 2 || name.length > 80) fail(400, 'invalid_name', 'Workspace names need 2 to 80 characters.')
      db.prepare('UPDATE workspaces SET name = ?, updated_at = ? WHERE id = ?').run(name, nowIso(), workspace.id)
      audit(db, { actorId: req.user.id, action: 'workspace.renamed', targetType: 'workspace', targetId: workspace.id, ip: req.ip })
      res.json({ ok: true, workspace: { id: workspace.id, name } })
    }),
  )

  router.delete(
    '/workspaces/:id',
    requireAuth,
    asyncRoute(async (req, res) => {
      const workspace = workspaceAccess(db, req.params.id, req.user)
      if (!workspace) fail(404, 'workspace_not_found', 'Workspace not found.')
      if (!['owner', 'admin'].includes(workspace.memberRole)) fail(403, 'forbidden', 'Only the workspace owner can delete it.')
      if (workspace.kind === 'personal') fail(400, 'personal_workspace', 'Your personal workspace cannot be deleted.')
      db.prepare('DELETE FROM workspaces WHERE id = ?').run(workspace.id)
      audit(db, { actorId: req.user.id, action: 'workspace.deleted', targetType: 'workspace', targetId: workspace.id, ip: req.ip })
      res.json({ ok: true })
    }),
  )

  router.get(
    '/workspaces/:id/members',
    requireAuth,
    asyncRoute(async (req, res) => {
      const workspace = workspaceAccess(db, req.params.id, req.user)
      if (!workspace) fail(404, 'workspace_not_found', 'Workspace not found.')
      const members = db
        .prepare(
          `SELECT u.id, u.name, u.email, m.role, m.created_at
           FROM workspace_members m JOIN users u ON u.id = m.user_id
           WHERE m.workspace_id = ? ORDER BY m.role = 'owner' DESC, u.name COLLATE NOCASE`,
        )
        .all(workspace.id)
        .map((row) => ({ id: row.id, name: row.name, email: row.email, role: row.role, joinedAt: row.created_at }))
      res.json({ ok: true, members })
    }),
  )

  router.post(
    '/workspaces/:id/members',
    requireAuth,
    asyncRoute(async (req, res) => {
      const workspace = workspaceAccess(db, req.params.id, req.user)
      if (!workspace) fail(404, 'workspace_not_found', 'Workspace not found.')
      if (!['owner', 'admin'].includes(workspace.memberRole)) fail(403, 'forbidden', 'Only the workspace owner can invite people.')
      const email = normalizeEmail(req.body?.email)
      const role = req.body?.role === 'viewer' ? 'viewer' : 'editor'
      const target = findUserByEmail(db, email)
      if (!target) fail(404, 'user_not_found', 'That person needs a BRIX Studio account first.')
      const existing = db
        .prepare('SELECT 1 FROM workspace_members WHERE workspace_id = ? AND user_id = ?')
        .get(workspace.id, target.id)
      if (existing) fail(409, 'already_member', 'That person is already in this workspace.')
      db.prepare('INSERT INTO workspace_members (workspace_id, user_id, role, created_at) VALUES (?, ?, ?, ?)').run(
        workspace.id,
        target.id,
        role,
        nowIso(),
      )
      audit(db, {
        actorId: req.user.id,
        action: 'workspace.member_added',
        targetType: 'workspace',
        targetId: workspace.id,
        meta: { userId: target.id, role },
        ip: req.ip,
      })
      res.status(201).json({
        ok: true,
        member: { id: target.id, name: target.name, email: target.email, role, joinedAt: nowIso() },
      })
    }),
  )

  router.delete(
    '/workspaces/:id/members/:userId',
    requireAuth,
    asyncRoute(async (req, res) => {
      const workspace = workspaceAccess(db, req.params.id, req.user)
      if (!workspace) fail(404, 'workspace_not_found', 'Workspace not found.')
      const targetId = req.params.userId
      const isSelf = targetId === req.user.id
      if (!['owner', 'admin'].includes(workspace.memberRole) && !isSelf) {
        fail(403, 'forbidden', 'Only the workspace owner can remove members.')
      }
      const membership = db
        .prepare('SELECT role FROM workspace_members WHERE workspace_id = ? AND user_id = ?')
        .get(workspace.id, targetId)
      if (!membership) fail(404, 'member_not_found', 'That person is not in this workspace.')
      if (membership.role === 'owner') fail(400, 'owner_locked', 'The workspace owner cannot be removed.')
      db.prepare('DELETE FROM workspace_members WHERE workspace_id = ? AND user_id = ?').run(workspace.id, targetId)
      audit(db, {
        actorId: req.user.id,
        action: 'workspace.member_removed',
        targetType: 'workspace',
        targetId: workspace.id,
        meta: { userId: targetId },
        ip: req.ip,
      })
      res.json({ ok: true })
    }),
  )

  /* Draft-scoped builder attachments. The draft id is a random UUID created in
     the browser; files are never listable without it and cannot be fetched
     publicly, only attached to a brief or reviewed by an admin. */
  router.get(
    '/inquiry-uploads',
    rateLimit(db, { bucket: 'inquiry-upload-list', limit: 240, windowMs: 15 * 60 * 1000 }),
    (req, res) => {
      const draftId = String(req.query.draftId || '')
      if (!isDraftId(draftId)) fail(400, 'invalid_draft', 'A valid draft id is required.')
      res.json({ ok: true, uploads: listInquiryUploads(db, draftId) })
    },
  )

  router.post(
    '/inquiry-uploads',
    rateLimit(db, { bucket: 'inquiry-upload', limit: 40, windowMs: 60 * 60 * 1000 }),
    asyncRoute(async (req, res) => {
      if (!String(req.get('content-type') || '').startsWith('multipart/form-data')) {
        fail(400, 'invalid_upload', 'Send the file as multipart form data.')
      }
      const draftId = String(req.query.draftId || '')
      const kind = String(req.query.kind || '')
      if (!isDraftId(draftId)) fail(400, 'invalid_draft', 'Reload the builder and try again.')
      if (!['logo', 'reference'].includes(kind)) fail(400, 'invalid_kind', 'Choose logo or reference.')
      const received = await receiveUpload(req, dataDir)
      try {
        const upload = await storeInquiryUpload(db, { dataDir, draftId, kind, received })
        res.status(201).json({ ok: true, upload })
      } catch (error) {
        await removeUploadTemp(received)
        throw error
      }
    }),
  )

  router.delete(
    '/inquiry-uploads/:id',
    rateLimit(db, { bucket: 'inquiry-upload-delete', limit: 60, windowMs: 60 * 60 * 1000 }),
    asyncRoute(async (req, res) => {
      const draftId = String(req.query.draftId || '')
      if (!isDraftId(draftId)) fail(400, 'invalid_draft', 'Reload the builder and try again.')
      await removeInquiryUpload(db, dataDir, { id: req.params.id, draftId })
      res.json({ ok: true })
    }),
  )

  router.get('/uploads', requireAuth, (req, res) => {
    const items = db
      .prepare('SELECT * FROM uploads WHERE user_id = ? ORDER BY created_at DESC LIMIT 500')
      .all(req.user.id)
      .map(mapUpload)
    res.json({ ok: true, items, usage: uploadUsage(db, req.user.id) })
  })

  router.post(
    '/uploads',
    requireAuth,
    rateLimit(db, { bucket: 'upload', limit: 60, windowMs: 60 * 60 * 1000, by: 'user' }),
    asyncRoute(async (req, res) => {
      if (!String(req.get('content-type') || '').startsWith('multipart/form-data')) {
        fail(400, 'invalid_upload', 'Send the file as multipart form data.')
      }
      const received = await receiveUpload(req, dataDir)
      const workspaceId = req.query.workspaceId
      if (workspaceId && !workspaceAccess(db, String(workspaceId), req.user)) {
        await removeUploadTemp(received)
        fail(404, 'workspace_not_found', 'Workspace not found.')
      }
      const upload = await storeUpload(db, { user: req.user, dataDir, received, workspaceId: workspaceId || null })
      audit(db, {
        actorId: req.user.id,
        action: 'upload.created',
        targetType: 'upload',
        targetId: upload.id,
        meta: { size: upload.size, mime: upload.mime },
        ip: req.ip,
      })
      res.status(201).json({ ok: true, upload, usage: uploadUsage(db, req.user.id) })
    }),
  )

  router.get(
    '/uploads/:id/content',
    requireAuth,
    asyncRoute(async (req, res) => {
      const row = db.prepare('SELECT * FROM uploads WHERE id = ?').get(req.params.id)
      if (!row) fail(404, 'upload_not_found', 'File not found.')
      if (row.user_id !== req.user.id && req.user.role !== 'admin') {
        fail(404, 'upload_not_found', 'File not found.')
      }
      const filePath = uploadPath(dataDir, row.user_id, row.stored_name)
      if (!(await fileExists(filePath))) fail(404, 'upload_missing', 'The stored file is missing.')
      res.set({
        'Content-Type': row.mime,
        'Content-Length': String(row.size),
        'Content-Disposition': safeFilenameHeader(row.original_name),
        'Cache-Control': 'private, max-age=60',
        'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy': "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox",
      })
      res.sendFile(path.resolve(filePath), (error) => {
        if (error && !res.headersSent) res.status(404).end()
      })
    }),
  )

  router.delete(
    '/uploads/:id',
    requireAuth,
    asyncRoute(async (req, res) => {
      const row = db.prepare('SELECT * FROM uploads WHERE id = ?').get(req.params.id)
      if (!row) fail(404, 'upload_not_found', 'File not found.')
      if (row.user_id !== req.user.id && req.user.role !== 'admin') {
        fail(404, 'upload_not_found', 'File not found.')
      }
      await removeUpload(db, dataDir, row)
      audit(db, { actorId: req.user.id, action: 'upload.deleted', targetType: 'upload', targetId: row.id, ip: req.ip })
      res.json({ ok: true, usage: uploadUsage(db, req.user.id) })
    }),
  )

  router.get('/admin/stats', requireAuth, requireAdmin, (_req, res) => {
    const users = db.prepare('SELECT COUNT(*) AS count FROM users').get()
    const active = db.prepare("SELECT COUNT(*) AS count FROM users WHERE status = 'active'").get()
    const admins = db.prepare("SELECT COUNT(*) AS count FROM users WHERE role = 'admin'").get()
    const workspaces = db.prepare('SELECT COUNT(*) AS count FROM workspaces').get()
    const uploads = db.prepare('SELECT COUNT(*) AS count, COALESCE(SUM(size), 0) AS bytes FROM uploads').get()
    const sessions = db.prepare('SELECT COUNT(*) AS count FROM sessions WHERE expires_at > ?').get(nowIso())
    const inq = inquiryCounts(db)
    res.json({
      ok: true,
      stats: {
        users: Number(users.count),
        activeUsers: Number(active.count),
        admins: Number(admins.count),
        workspaces: Number(workspaces.count),
        uploads: Number(uploads.count),
        uploadBytes: Number(uploads.bytes),
        activeSessions: Number(sessions.count),
        inquiries: inq.all,
        newInquiries: inq.new,
        limits: uploadLimits(),
      },
    })
  })

  router.get('/admin/users', requireAuth, requireAdmin, (req, res) => {
    const query = String(req.query.query || '').trim()
    const like = `%${query.replace(/[%_]/g, '')}%`
    const rows = query
      ? db
          .prepare(
            `SELECT * FROM users WHERE email LIKE ? COLLATE NOCASE OR name LIKE ? COLLATE NOCASE
             ORDER BY created_at DESC LIMIT 100`,
          )
          .all(like, like)
      : db.prepare('SELECT * FROM users ORDER BY created_at DESC LIMIT 100').all()
    const uploads = db.prepare('SELECT user_id, COUNT(*) AS count, COALESCE(SUM(size), 0) AS bytes FROM uploads GROUP BY user_id').all()
    const usage = new Map(uploads.map((row) => [row.user_id, { files: Number(row.count), bytes: Number(row.bytes) }]))
    res.json({
      ok: true,
      users: rows.map((row) => ({
        ...toUser(row),
        files: usage.get(row.id)?.files ?? 0,
        storageBytes: usage.get(row.id)?.bytes ?? 0,
      })),
    })
  })

  router.patch(
    '/admin/users/:id',
    requireAuth,
    requireAdmin,
    asyncRoute(async (req, res) => {
      if (!isId(req.params.id)) fail(404, 'user_not_found', 'User not found.')
      const row = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id)
      if (!row) fail(404, 'user_not_found', 'User not found.')
      if (row.id === req.user.id) fail(400, 'self_change', 'You cannot change your own role or status.')

      const role = req.body?.role ?? row.role
      const status = req.body?.status ?? row.status
      if (!['user', 'client', 'admin'].includes(role)) fail(400, 'invalid_role', 'Unknown role.')
      if (!['active', 'suspended'].includes(status)) fail(400, 'invalid_status', 'Unknown status.')

      db.prepare('UPDATE users SET role = ?, status = ?, updated_at = ? WHERE id = ?').run(role, status, nowIso(), row.id)
      if (status === 'suspended') destroyUserSessions(db, row.id)
      audit(db, {
        actorId: req.user.id,
        action: 'admin.user_updated',
        targetType: 'user',
        targetId: row.id,
        meta: { role, status },
        ip: req.ip,
      })
      const fresh = db.prepare('SELECT * FROM users WHERE id = ?').get(row.id)
      res.json({ ok: true, user: toUser(fresh) })
    }),
  )

  router.get('/admin/workspaces', requireAuth, requireAdmin, (_req, res) => {
    const rows = db
      .prepare(
        `SELECT w.id, w.name, w.kind, w.created_at, u.email AS owner_email, u.name AS owner_name,
                (SELECT COUNT(*) FROM workspace_members m WHERE m.workspace_id = w.id) AS member_count,
                (SELECT COUNT(*) FROM uploads up WHERE up.workspace_id = w.id) AS file_count
         FROM workspaces w JOIN users u ON u.id = w.owner_id
         ORDER BY w.created_at DESC LIMIT 200`,
      )
      .all()
    res.json({
      ok: true,
      workspaces: rows.map((row) => ({
        id: row.id,
        name: row.name,
        kind: row.kind,
        ownerEmail: row.owner_email,
        ownerName: row.owner_name,
        members: Number(row.member_count),
        files: Number(row.file_count),
        createdAt: row.created_at,
      })),
    })
  })

  router.get('/admin/inquiries', requireAuth, requireAdmin, (req, res) => {
    const status = String(req.query.status || '').trim()
    const query = String(req.query.query || '').trim()
    const limit = Math.min(300, Math.max(1, Number(req.query.limit) || 100))
    res.json({
      ok: true,
      inquiries: listInquiries(db, { status, query, limit }),
      counts: inquiryCounts(db),
    })
  })

  router.get('/admin/inquiries/:id', requireAuth, requireAdmin, (req, res) => {
    if (!isId(req.params.id)) fail(404, 'inquiry_not_found', 'Inquiry not found.')
    const row = findInquiryById(db, req.params.id)
    if (!row) fail(404, 'inquiry_not_found', 'Inquiry not found.')
    const files = db
      .prepare('SELECT * FROM inquiry_uploads WHERE inquiry_id = ? ORDER BY created_at ASC')
      .all(row.id)
      .map(mapInquiryUpload)
    res.json({ ok: true, inquiry: { ...mapInquiry(row, { includePayload: true }), files } })
  })

  router.patch(
    '/admin/inquiries/:id',
    requireAuth,
    requireAdmin,
    asyncRoute(async (req, res) => {
      if (!isId(req.params.id)) fail(404, 'inquiry_not_found', 'Inquiry not found.')
      const row = findInquiryById(db, req.params.id)
      if (!row) fail(404, 'inquiry_not_found', 'Inquiry not found.')
      const next = updateInquiryStatus(db, row.id, String(req.body?.status || ''))
      audit(db, {
        actorId: req.user.id,
        action: 'admin.inquiry_status_updated',
        targetType: 'inquiry',
        targetId: row.id,
        meta: { from: row.status, to: next.status },
        ip: req.ip,
      })
      res.json({ ok: true, inquiry: mapInquiry(next, { includePayload: true }) })
    }),
  )

  router.get(
    '/admin/inquiry-uploads/:id/content',
    requireAuth,
    requireAdmin,
    asyncRoute(async (req, res) => {
      const row = db.prepare('SELECT * FROM inquiry_uploads WHERE id = ?').get(req.params.id)
      if (!row) fail(404, 'upload_not_found', 'File not found.')
      const filePath = inquiryUploadPath(dataDir, row.draft_id, row.stored_name)
      if (!(await fileExists(filePath))) fail(404, 'upload_missing', 'The stored file is missing.')
      res.set({
        'Content-Type': row.mime,
        'Content-Length': String(row.size),
        'Content-Disposition': safeFilenameHeader(row.original_name),
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy': "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox",
      })
      res.sendFile(path.resolve(filePath), (error) => {
        if (error && !res.headersSent) res.status(404).end()
      })
    }),
  )

  router.get('/admin/audit', requireAuth, requireAdmin, (req, res) => {
    const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 50))
    const rows = db
      .prepare(
        `SELECT a.id, a.action, a.target_type, a.target_id, a.meta, a.ip, a.created_at, u.email AS actor_email
         FROM audit_events a LEFT JOIN users u ON u.id = a.actor_id
         ORDER BY a.id DESC LIMIT ?`,
      )
      .all(limit)
    res.json({
      ok: true,
      events: rows.map((row) => ({
        id: Number(row.id),
        action: row.action,
        targetType: row.target_type,
        targetId: row.target_id,
        meta: row.meta ? safeJson(row.meta) : null,
        ip: row.ip,
        actorEmail: row.actor_email,
        createdAt: row.created_at,
      })),
    })
  })

  router.use((_req, res) => {
    res.status(404).json({ ok: false, code: 'not_found', message: 'Unknown API endpoint.' })
  })

  return router
}

async function removeUploadTemp(received) {
  if (received?.tempPath) await unlink(received.tempPath).catch(() => {})
}

function safeJson(value) {
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}
