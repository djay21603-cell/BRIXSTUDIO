import { after, before, test } from 'node:test'
import assert from 'node:assert/strict'
import express from 'express'
import { mkdtemp, rm, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { initFoundation } from '../index.js'

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
)

let dataDir
let server
let base
let foundation
let ownerCookie
let memberCookie
let ownerId
let memberId
let ownerWorkspaceId

before(async () => {
  dataDir = await mkdtemp(path.join(tmpdir(), 'brix-foundation-'))
  process.env.DATA_DIR = dataDir
  process.env.UPLOAD_MAX_FILE_BYTES = '2048'
  process.env.UPLOAD_USER_QUOTA_BYTES = '10000'
  process.env.UPLOAD_USER_MAX_FILES = '20'

  const app = express()
  app.use(express.json())
  foundation = initFoundation(app)
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', resolve)
  })
  base = `http://127.0.0.1:${server.address().port}`
})

after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve))
  foundation?.close()
  delete process.env.DATA_DIR
  delete process.env.UPLOAD_MAX_FILE_BYTES
  delete process.env.UPLOAD_USER_QUOTA_BYTES
  delete process.env.UPLOAD_USER_MAX_FILES
  if (dataDir) await rm(dataDir, { recursive: true, force: true }).catch(() => {})
})

async function jsonCall(pathname, { method = 'GET', body, cookie, origin = base } = {}) {
  const headers = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (cookie) headers.cookie = cookie
  if (origin) headers.Origin = origin
  const response = await fetch(`${base}${pathname}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const payload = await response.json().catch(() => null)
  const setCookie = response.headers.getSetCookie?.() ?? []
  return { status: response.status, body: payload, cookie: setCookie[0]?.split(';')[0] }
}

async function register(name, email) {
  return jsonCall('/api/v1/auth/register', {
    method: 'POST',
    body: { name, email, password: 'correct horse battery', acceptTerms: true },
  })
}

async function uploadFile(buffer, { name = 'pixel.png', type = 'image/png', cookie }) {
  const form = new FormData()
  form.append('file', new Blob([buffer], { type }), name)
  const response = await fetch(`${base}/api/v1/uploads`, {
    method: 'POST',
    headers: { Origin: base, cookie },
    body: form,
  })
  return { status: response.status, body: await response.json().catch(() => null) }
}

test('foundation integration', async (t) => {
  await t.test('status endpoint reports foundation readiness', async () => {
    const result = await jsonCall('/api/v1/status')
    assert.equal(result.status, 200)
    assert.equal(result.body.foundation, 'phase-0')
    assert.equal(result.body.payments, 'disabled')
  })

  await t.test('registration requires terms acceptance', async () => {
    const result = await jsonCall('/api/v1/auth/register', {
      method: 'POST',
      body: { name: 'No Terms', email: 'noterms@example.com', password: 'correct horse battery' },
    })
    assert.equal(result.status, 400)
    assert.equal(result.body.code, 'terms_required')
  })

  await t.test('registration rejects weak passwords and invalid emails', async () => {
    const weak = await jsonCall('/api/v1/auth/register', {
      method: 'POST',
      body: { name: 'Weak Pass', email: 'weak@example.com', password: 'short', acceptTerms: true },
    })
    assert.equal(weak.status, 400)
    assert.equal(weak.body.code, 'weak_password')

    const badEmail = await jsonCall('/api/v1/auth/register', {
      method: 'POST',
      body: { name: 'Bad Email', email: 'nope', password: 'correct horse battery', acceptTerms: true },
    })
    assert.equal(badEmail.status, 400)
    assert.equal(badEmail.body.code, 'invalid_email')
  })

  await t.test('registration creates a user, session and personal workspace', async () => {
    const result = await register('Ada Owner', 'ada@example.com')
    assert.equal(result.status, 201)
    assert.equal(result.body.user.role, 'user')
    assert.equal(result.body.user.workspaces.length, 1)
    assert.equal(result.body.user.workspaces[0].kind, 'personal')
    assert.ok(result.cookie?.startsWith('brix_session='))
    ownerCookie = result.cookie
    ownerId = result.body.user.id
    ownerWorkspaceId = result.body.user.workspaces[0].id
  })

  await t.test('duplicate email is rejected', async () => {
    const result = await register('Ada Again', 'ADA@example.com')
    assert.equal(result.status, 409)
    assert.equal(result.body.code, 'email_taken')
  })

  await t.test('session restore works and unauthenticated access is blocked', async () => {
    const me = await jsonCall('/api/v1/auth/me', { cookie: ownerCookie })
    assert.equal(me.status, 200)
    assert.equal(me.body.user.email, 'ada@example.com')

    const anonymous = await jsonCall('/api/v1/auth/me')
    assert.equal(anonymous.status, 401)
    assert.equal(anonymous.body.code, 'unauthenticated')
  })

  await t.test('state-changing requests without a trusted origin are rejected', async () => {
    const response = await fetch(`${base}/api/v1/auth/logout`, {
      method: 'POST',
      headers: { cookie: ownerCookie },
    })
    assert.equal(response.status, 403)
  })

  await t.test('login rejects wrong passwords and accepts correct ones', async () => {
    const wrong = await jsonCall('/api/v1/auth/login', {
      method: 'POST',
      body: { email: 'ada@example.com', password: 'wrong password' },
    })
    assert.equal(wrong.status, 401)
    assert.equal(wrong.body.code, 'invalid_credentials')

    const right = await jsonCall('/api/v1/auth/login', {
      method: 'POST',
      body: { email: 'ada@example.com', password: 'correct horse battery' },
    })
    assert.equal(right.status, 200)
    ownerCookie = right.cookie
    assert.equal(right.body.user.lastLoginAt.length > 0, true)
  })

  await t.test('second account can register and does not see the first account data', async () => {
    const result = await register('Milo Member', 'milo@example.com')
    assert.equal(result.status, 201)
    memberCookie = result.cookie
    memberId = result.body.user.id

    const uploads = await jsonCall('/api/v1/uploads', { cookie: memberCookie })
    assert.equal(uploads.status, 200)
    assert.equal(uploads.body.items.length, 0)
  })

  await t.test('workspaces can be created, renamed and shared', async () => {
    const created = await jsonCall('/api/v1/workspaces', {
      method: 'POST',
      body: { name: 'Hotel Meridian' },
      cookie: ownerCookie,
    })
    assert.equal(created.status, 201)
    const workspaceId = created.body.workspace.id

    const renamed = await jsonCall(`/api/v1/workspaces/${workspaceId}`, {
      method: 'PATCH',
      body: { name: 'Hotel Meridian — 2026' },
      cookie: ownerCookie,
    })
    assert.equal(renamed.status, 200)

    const added = await jsonCall(`/api/v1/workspaces/${workspaceId}/members`, {
      method: 'POST',
      body: { email: 'milo@example.com', role: 'editor' },
      cookie: ownerCookie,
    })
    assert.equal(added.status, 201)

    const members = await jsonCall(`/api/v1/workspaces/${workspaceId}/members`, { cookie: memberCookie })
    assert.equal(members.status, 200)
    assert.deepEqual(
      members.body.members.map((member) => member.role).sort(),
      ['editor', 'owner'],
    )

    const notOwner = await jsonCall(`/api/v1/workspaces/${workspaceId}`, {
      method: 'PATCH',
      body: { name: 'Hijacked' },
      cookie: memberCookie,
    })
    assert.equal(notOwner.status, 403)
  })

  await t.test('uploads validate content, quota and ownership', async () => {
    const good = await uploadFile(PNG, { cookie: ownerCookie })
    assert.equal(good.status, 201)
    assert.equal(good.body.upload.mime, 'image/png')
    assert.equal(good.body.usage.count, 1)
    const uploadId = good.body.upload.id

    const content = await fetch(`${base}/api/v1/uploads/${uploadId}/content`, {
      headers: { cookie: ownerCookie },
    })
    assert.equal(content.status, 200)
    assert.equal(content.headers.get('content-type'), 'image/png')
    assert.deepEqual(Buffer.from(await content.arrayBuffer()), PNG)

    const hidden = await fetch(`${base}/api/v1/uploads/${uploadId}/content`, {
      headers: { cookie: memberCookie },
    })
    assert.equal(hidden.status, 404)

    const text = await uploadFile(Buffer.from('not an image'), {
      name: 'note.txt',
      type: 'text/plain',
      cookie: ownerCookie,
    })
    assert.equal(text.status, 415)
    assert.equal(text.body.code, 'unsupported_file_type')

    const mismatch = await uploadFile(PNG, { name: 'fake.jpg', type: 'image/jpeg', cookie: ownerCookie })
    assert.equal(mismatch.status, 415)
    assert.equal(mismatch.body.code, 'file_type_mismatch')

    const oversized = await uploadFile(Buffer.concat([PNG, Buffer.alloc(4096)]), { cookie: ownerCookie })
    assert.equal(oversized.status, 413)
    assert.equal(oversized.body.code, 'file_too_large')

    const traversal = await uploadFile(PNG, { name: '../../escape.png', cookie: ownerCookie })
    assert.equal(traversal.status, 201)
    assert.equal(traversal.body.upload.name, 'escape.png')

    const removed = await jsonCall(`/api/v1/uploads/${traversal.body.upload.id}`, {
      method: 'DELETE',
      cookie: ownerCookie,
    })
    assert.equal(removed.status, 200)

    const gone = await fetch(`${base}/api/v1/uploads/${traversal.body.upload.id}/content`, {
      headers: { cookie: ownerCookie },
    })
    assert.equal(gone.status, 404)
  })

  await t.test('admin endpoints are role-gated and allow management', async () => {
    const denied = await jsonCall('/api/v1/admin/stats', { cookie: memberCookie })
    assert.equal(denied.status, 403)

    foundation.db.prepare("UPDATE users SET role = 'admin' WHERE id = ?").run(ownerId)

    const stats = await jsonCall('/api/v1/admin/stats', { cookie: ownerCookie })
    assert.equal(stats.status, 200)
    assert.equal(stats.body.stats.users, 2)

    const users = await jsonCall('/api/v1/admin/users', { cookie: ownerCookie })
    assert.equal(users.status, 200)
    assert.equal(users.body.users.length, 2)

    const promoted = await jsonCall(`/api/v1/admin/users/${memberId}`, {
      method: 'PATCH',
      body: { role: 'client' },
      cookie: ownerCookie,
    })
    assert.equal(promoted.status, 200)
    assert.equal(promoted.body.user.role, 'client')

    const me = await jsonCall('/api/v1/auth/me', { cookie: memberCookie })
    assert.equal(me.body.user.role, 'client')

    const selfChange = await jsonCall(`/api/v1/admin/users/${ownerId}`, {
      method: 'PATCH',
      body: { role: 'user' },
      cookie: ownerCookie,
    })
    assert.equal(selfChange.status, 400)
    assert.equal(selfChange.body.code, 'self_change')

    const audit = await jsonCall('/api/v1/admin/audit', { cookie: ownerCookie })
    assert.equal(audit.status, 200)
    assert.ok(audit.body.events.some((event) => event.action === 'admin.user_updated'))

    const workspaces = await jsonCall('/api/v1/admin/workspaces', { cookie: ownerCookie })
    assert.equal(workspaces.status, 200)
    assert.ok(workspaces.body.workspaces.length >= 3)
  })

  await t.test('account export returns the caller data without secrets', async () => {
    const exported = await jsonCall('/api/v1/account/export', { cookie: ownerCookie })
    assert.equal(exported.status, 200)
    assert.equal(exported.body.account.email, 'ada@example.com')
    assert.equal('passwordHash' in exported.body.account, false)
    assert.equal('password_hash' in exported.body.account, false)
    assert.ok(Array.isArray(exported.body.uploads))
  })

  await t.test('password change rotates the session', async () => {
    const wrong = await jsonCall('/api/v1/account/password', {
      method: 'POST',
      body: { currentPassword: 'nope', newPassword: 'a brand new passphrase' },
      cookie: ownerCookie,
    })
    assert.equal(wrong.status, 400)

    const changed = await jsonCall('/api/v1/account/password', {
      method: 'POST',
      body: { currentPassword: 'correct horse battery', newPassword: 'a brand new passphrase' },
      cookie: ownerCookie,
    })
    assert.equal(changed.status, 200)
    const newCookie = changed.cookie
    assert.ok(newCookie && newCookie !== ownerCookie)

    const oldSession = await jsonCall('/api/v1/auth/me', { cookie: ownerCookie })
    assert.equal(oldSession.status, 401)

    const newSession = await jsonCall('/api/v1/auth/me', { cookie: newCookie })
    assert.equal(newSession.status, 200)
    ownerCookie = newCookie
  })

  await t.test('account deletion removes files, memberships and the login', async () => {
    const before = await uploadFile(PNG, { cookie: memberCookie })
    assert.equal(before.status, 201)
    const storedPath = path.join(dataDir, 'uploads', memberId, `${before.body.upload.id}.png`)
    assert.equal((await stat(storedPath)).isFile(), true)

    const deleted = await jsonCall('/api/v1/account', {
      method: 'DELETE',
      body: { password: 'correct horse battery', confirm: 'DELETE' },
      cookie: memberCookie,
    })
    assert.equal(deleted.status, 200)

    await assert.rejects(stat(storedPath))
    assert.equal(foundation.db.prepare('SELECT COUNT(*) AS count FROM uploads WHERE user_id = ?').get(memberId).count, 0)

    const login = await jsonCall('/api/v1/auth/login', {
      method: 'POST',
      body: { email: 'milo@example.com', password: 'correct horse battery' },
    })
    assert.equal(login.status, 401)

    const exportGone = await jsonCall('/api/v1/account/export', { cookie: memberCookie })
    assert.equal(exportGone.status, 401)
  })

  await t.test('logout invalidates the session', async () => {
    const loggedOut = await jsonCall('/api/v1/auth/logout', { method: 'POST', cookie: ownerCookie })
    assert.equal(loggedOut.status, 200)
    const me = await jsonCall('/api/v1/auth/me', { cookie: ownerCookie })
    assert.equal(me.status, 401)
  })

  await t.test('registration is rate limited', async () => {
    const statuses = []
    for (let index = 0; index < 12; index += 1) {
      const result = await register(`Rate Test ${index}`, `rate${index}@example.com`)
      statuses.push(result.status)
      if (result.status === 429) break
    }
    assert.equal(statuses.at(-1), 429)
    assert.ok(statuses.includes(201))
  })
})
