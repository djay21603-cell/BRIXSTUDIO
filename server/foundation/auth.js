import {
  createHash,
  randomBytes,
  randomUUID,
  scryptSync,
  timingSafeEqual,
} from 'node:crypto'
import { nowIso } from './db.js'

export const SESSION_COOKIE = 'brix_session'
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000
const SCRYPT_N = 16384
const SCRYPT_R = 8
const SCRYPT_P = 1
const KEY_LENGTH = 64
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

export function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase()
}

export function isValidEmail(value) {
  const email = normalizeEmail(value)
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function passwordProblem(password) {
  if (typeof password !== 'string') return 'Password is required.'
  if (password.length < 10) return 'Use at least 10 characters.'
  if (password.length > 200) return 'Password is too long.'
  return null
}

export function nameProblem(name) {
  const clean = String(name || '').trim()
  if (clean.length < 2) return 'Please use at least 2 characters for your name.'
  if (clean.length > 80) return 'Name is too long.'
  return null
}

export function hashPassword(password) {
  const salt = randomBytes(16)
  const hash = scryptSync(password, salt, KEY_LENGTH, { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P })
  return `scrypt$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${salt.toString('base64')}$${hash.toString('base64')}`
}

export function verifyPassword(password, stored) {
  try {
    const [scheme, n, r, p, saltB64, hashB64] = String(stored || '').split('$')
    if (scheme !== 'scrypt') return false
    const salt = Buffer.from(saltB64, 'base64')
    const expected = Buffer.from(hashB64, 'base64')
    const actual = scryptSync(password, salt, expected.length, {
      N: Number(n),
      r: Number(r),
      p: Number(p),
    })
    return actual.length === expected.length && timingSafeEqual(actual, expected)
  } catch {
    return false
  }
}

function hashToken(token) {
  return createHash('sha256').update(token).digest('hex')
}

export function parseCookies(header = '') {
  const result = {}
  for (const part of String(header).split(';')) {
    const index = part.indexOf('=')
    if (index < 0) continue
    const key = part.slice(0, index).trim()
    const value = part.slice(index + 1).trim()
    if (key) result[key] = decodeURIComponent(value)
  }
  return result
}

export function sessionCookieOptions(req) {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: Boolean(req.secure),
    path: '/',
    maxAge: SESSION_TTL_MS,
  }
}

export function createSession(db, userId, req) {
  const token = randomBytes(32).toString('base64url')
  const now = Date.now()
  db.prepare(
    `INSERT INTO sessions (token_hash, user_id, created_at, expires_at, last_seen_at, ip, user_agent)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    hashToken(token),
    userId,
    new Date(now).toISOString(),
    new Date(now + SESSION_TTL_MS).toISOString(),
    nowIso(),
    req.ip || null,
    String(req.get('user-agent') || '').slice(0, 300) || null,
  )
  return token
}

export function destroySession(db, token) {
  if (!token) return
  db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(hashToken(token))
}

export function destroyUserSessions(db, userId) {
  db.prepare('DELETE FROM sessions WHERE user_id = ?').run(userId)
}

export function lookupSession(db, token) {
  if (!token || typeof token !== 'string' || token.length > 200) return null
  const row = db
    .prepare(
      `SELECT s.token_hash, s.user_id, s.expires_at, s.last_seen_at,
              u.id, u.email, u.name, u.role, u.status, u.created_at, u.last_login_at
       FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = ?`,
    )
    .get(hashToken(token))
  if (!row) return null
  if (new Date(row.expires_at).getTime() <= Date.now()) {
    db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(row.token_hash)
    return null
  }
  if (Date.now() - new Date(row.last_seen_at).getTime() > 5 * 60 * 1000) {
    db.prepare('UPDATE sessions SET last_seen_at = ? WHERE token_hash = ?').run(nowIso(), row.token_hash)
  }
  return {
    user: {
      id: row.id,
      email: row.email,
      name: row.name,
      role: row.role,
      status: row.status,
      createdAt: row.created_at,
      lastLoginAt: row.last_login_at,
    },
    session: { tokenHash: row.token_hash, expiresAt: row.expires_at },
  }
}

export function workspacesForUser(db, userId) {
  return db
    .prepare(
      `SELECT w.id, w.name, w.kind, w.created_at, m.role
       FROM workspaces w JOIN workspace_members m ON m.workspace_id = w.id
       WHERE m.user_id = ?
       ORDER BY w.kind = 'personal' DESC, w.created_at ASC`,
    )
    .all(userId)
    .map((row) => ({
      id: row.id,
      name: row.name,
      kind: row.kind,
      role: row.role,
      createdAt: row.created_at,
    }))
}

export function publicUser(db, user) {
  return { ...user, workspaces: workspacesForUser(db, user.id) }
}

export function attachSession(db) {
  return (req, _res, next) => {
    const token = parseCookies(req.headers.cookie)[SESSION_COOKIE]
    req.sessionToken = token || null
    const found = token ? lookupSession(db, token) : null
    req.user = found?.user || null
    next()
  }
}

export function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ ok: false, code: 'unauthenticated', message: 'Please sign in to continue.' })
  }
  if (req.user.status !== 'active') {
    return res.status(403).json({ ok: false, code: 'account_suspended', message: 'This account is suspended.' })
  }
  next()
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ ok: false, code: 'forbidden', message: 'Administrator access is required.' })
  }
  next()
}

export function originGuard(req, res, next) {
  if (SAFE_METHODS.has(req.method)) return next()

  const host = String(req.get('host') || '')
  const origin = req.get('origin')
  const allowed = new Set([host])
  const publicOrigin = process.env.PUBLIC_ORIGIN?.trim()
  if (publicOrigin) {
    try {
      allowed.add(new URL(publicOrigin).host)
    } catch {
      /* ignore malformed configuration */
    }
  }

  let sameOrigin = false
  if (origin) {
    try {
      const originHost = new URL(origin).host
      sameOrigin = allowed.has(originHost)
      if (!sameOrigin && isLocalHost(originHost) && isLocalHost(host)) sameOrigin = true
    } catch {
      sameOrigin = false
    }
  } else {
    const site = req.get('sec-fetch-site')
    sameOrigin = site === 'same-origin' || site === 'none'
  }

  if (!sameOrigin) {
    return res.status(403).json({
      ok: false,
      code: 'csrf_failed',
      message: 'This request did not come from the BRIX Studio site.',
    })
  }
  next()
}

function isLocalHost(value) {
  return /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(value)
}

export function createUser(db, { name, email, password, role = 'user', termsAcceptedAt = nowIso() }) {
  const cleanName = String(name).trim()
  const cleanEmail = normalizeEmail(email)
  const now = nowIso()
  const id = randomUUID()
  const passwordHash = hashPassword(password)

  db.exec('BEGIN IMMEDIATE')
  try {
    db.prepare(
      `INSERT INTO users (id, email, name, password_hash, role, status, created_at, updated_at, terms_accepted_at)
       VALUES (?, ?, ?, ?, ?, 'active', ?, ?, ?)`,
    ).run(id, cleanEmail, cleanName, passwordHash, role, now, now, termsAcceptedAt)

    const workspaceId = randomUUID()
    db.prepare(
      `INSERT INTO workspaces (id, name, kind, owner_id, created_at, updated_at)
       VALUES (?, ?, 'personal', ?, ?, ?)`,
    ).run(workspaceId, 'Personal workspace', id, now, now)
    db.prepare(
      `INSERT INTO workspace_members (workspace_id, user_id, role, created_at) VALUES (?, ?, 'owner', ?)`,
    ).run(workspaceId, id, now)
    db.exec('COMMIT')
  } catch (error) {
    db.exec('ROLLBACK')
    throw error
  }

  return db.prepare('SELECT * FROM users WHERE id = ?').get(id)
}

export function findUserByEmail(db, email) {
  return db.prepare('SELECT * FROM users WHERE email = ? COLLATE NOCASE').get(normalizeEmail(email))
}
