import { randomUUID } from 'node:crypto'
import { mkdir, rename, rmdir, unlink } from 'node:fs/promises'
import path from 'node:path'
import { nowIso } from './foundation/db.js'
import { HttpError } from './foundation/errors.js'

export const INQUIRY_STATUSES = ['new', 'reviewing', 'quotation_sent', 'approved', 'completed']

export const INQUIRY_IMAGE_MIMES = new Set(['image/png', 'image/jpeg', 'image/gif', 'image/webp'])

const DRAFT_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isDraftId(value) {
  return typeof value === 'string' && DRAFT_ID_RE.test(value)
}

export function inquiryUploadLimits() {
  return {
    maxFiles: positiveInt(process.env.INQUIRY_UPLOAD_MAX_FILES, 8),
    totalBytes: positiveInt(process.env.INQUIRY_UPLOAD_TOTAL_BYTES, 20 * 1024 * 1024),
    maxFileBytes: positiveInt(process.env.UPLOAD_MAX_FILE_BYTES, 10 * 1024 * 1024),
  }
}

function positiveInt(value, fallback) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback
}

function safeJson(value) {
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

export function mapInquiry(row, { includePayload = false } = {}) {
  if (!row) return null
  return {
    id: row.id,
    submissionId: row.submission_id,
    kind: row.kind,
    status: row.status,
    name: row.name,
    email: row.email,
    phone: row.phone,
    location: row.location,
    businessName: row.business_name,
    category: row.category,
    template: row.template,
    message: row.message,
    emails: {
      studio: row.studio_email_status,
      customer: row.customer_email_status,
    },
    files: Number(row.file_count ?? 0),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ...(includePayload ? { payload: row.payload ? safeJson(row.payload) : null } : {}),
  }
}

export function findInquiryBySubmission(db, submissionId) {
  return db.prepare('SELECT * FROM inquiries WHERE submission_id = ?').get(submissionId)
}

export function findInquiryById(db, id) {
  return db.prepare('SELECT * FROM inquiries WHERE id = ?').get(id)
}

export function saveInquiry(db, { kind = 'brief', data }) {
  const existing = findInquiryBySubmission(db, data.submissionId)
  const now = nowIso()
  const name = data.contact?.name || 'Not provided'
  const email = data.contact?.email || ''
  const businessName = data.business?.name || 'Not provided'
  const category = data.business?.category || ''
  const template = data.design?.template || ''
  const message = data.message || data.business?.description || ''
  const payload = JSON.stringify(data)

  if (existing) {
    db.prepare(
      `UPDATE inquiries SET kind = ?, name = ?, email = ?, phone = ?, location = ?, business_name = ?,
              category = ?, template = ?, message = ?, payload = ?, updated_at = ?
       WHERE id = ?`,
    ).run(
      kind,
      name,
      email,
      data.contact?.phone || '',
      data.contact?.location || '',
      businessName,
      category,
      template,
      message,
      payload,
      now,
      existing.id,
    )
    return findInquiryById(db, existing.id)
  }

  const id = randomUUID()
  db.prepare(
    `INSERT INTO inquiries (id, submission_id, kind, name, email, phone, location, business_name, category,
                            template, message, payload, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', ?, ?)`,
  ).run(
    id,
    data.submissionId,
    kind,
    name,
    email,
    data.contact?.phone || '',
    data.contact?.location || '',
    businessName,
    category,
    template,
    message,
    payload,
    now,
    now,
  )
  return findInquiryById(db, id)
}

export function setInquiryEmailStatus(db, id, { studio, customer, studioMessageId, customerMessageId }) {
  const sets = []
  const args = []
  if (studio) {
    sets.push('studio_email_status = ?')
    args.push(studio)
  }
  if (customer) {
    sets.push('customer_email_status = ?')
    args.push(customer)
  }
  if (studioMessageId !== undefined) {
    sets.push('studio_message_id = ?')
    args.push(studioMessageId)
  }
  if (customerMessageId !== undefined) {
    sets.push('customer_message_id = ?')
    args.push(customerMessageId)
  }
  if (!sets.length) return
  sets.push('updated_at = ?')
  args.push(nowIso(), id)
  db.prepare(`UPDATE inquiries SET ${sets.join(', ')} WHERE id = ?`).run(...args)
}

export function listInquiries(db, { status, query, limit = 100 } = {}) {
  const where = []
  const args = []
  if (status && INQUIRY_STATUSES.includes(status)) {
    where.push('i.status = ?')
    args.push(status)
  }
  const search = String(query || '').trim()
  if (search) {
    const like = `%${search.replace(/[%_]/g, '')}%`
    where.push(
      '(i.name LIKE ? COLLATE NOCASE OR i.email LIKE ? COLLATE NOCASE OR i.business_name LIKE ? COLLATE NOCASE OR i.submission_id LIKE ?)',
    )
    args.push(like, like, like, like)
  }
  const size = Math.min(300, Math.max(1, Number(limit) || 100))
  args.push(size)
  const rows = db
    .prepare(
      `SELECT i.*, (SELECT COUNT(*) FROM inquiry_uploads u WHERE u.inquiry_id = i.id) AS file_count
       FROM inquiries i
       ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
       ORDER BY i.created_at DESC LIMIT ?`,
    )
    .all(...args)
  return rows.map((row) => mapInquiry(row, { includePayload: true }))
}

export function inquiryCounts(db) {
  const rows = db.prepare('SELECT status, COUNT(*) AS count FROM inquiries GROUP BY status').all()
  const counts = Object.fromEntries(INQUIRY_STATUSES.map((status) => [status, 0]))
  for (const row of rows) counts[row.status] = Number(row.count)
  counts.all = INQUIRY_STATUSES.reduce((total, status) => total + counts[status], 0)
  return counts
}

export function updateInquiryStatus(db, id, status) {
  if (!INQUIRY_STATUSES.includes(status)) {
    throw new HttpError(400, 'invalid_status', 'Choose a valid inquiry status.')
  }
  db.prepare('UPDATE inquiries SET status = ?, updated_at = ? WHERE id = ?').run(status, nowIso(), id)
  return findInquiryById(db, id)
}

/* ---- Draft-scoped uploads -------------------------------------------------
   The public builder can attach a logo or reference files before the brief is
   submitted. Files live under an unguessable draft id, are never listed to
   other visitors and are linked to the inquiry when the brief is saved. */

export function inquiryUploadPath(dataDir, draftId, storedName) {
  return path.join(dataDir, 'inquiry-uploads', draftId, storedName)
}

export function mapInquiryUpload(row) {
  return {
    id: row.id,
    kind: row.kind,
    name: row.original_name,
    mime: row.mime,
    size: Number(row.size),
    createdAt: row.created_at,
  }
}

export function listInquiryUploads(db, draftId) {
  return db
    .prepare('SELECT * FROM inquiry_uploads WHERE draft_id = ? ORDER BY created_at ASC')
    .all(draftId)
    .map(mapInquiryUpload)
}

export async function storeInquiryUpload(db, { dataDir, draftId, kind, received }) {
  if (!isDraftId(draftId)) {
    await unlink(received.tempPath).catch(() => {})
    throw new HttpError(400, 'invalid_draft', 'A valid draft id is required.')
  }
  if (!['logo', 'reference'].includes(kind)) {
    await unlink(received.tempPath).catch(() => {})
    throw new HttpError(400, 'invalid_kind', 'Choose whether this is a logo or a reference file.')
  }
  if (kind === 'logo' && !INQUIRY_IMAGE_MIMES.has(received.mime)) {
    await unlink(received.tempPath).catch(() => {})
    throw new HttpError(415, 'unsupported_file_type', 'Upload a PNG, JPEG, GIF or WebP logo.')
  }

  const limits = inquiryUploadLimits()
  const usage = db
    .prepare('SELECT COUNT(*) AS count, COALESCE(SUM(size), 0) AS bytes FROM inquiry_uploads WHERE draft_id = ?')
    .get(draftId)
  if (Number(usage.count) >= limits.maxFiles) {
    await unlink(received.tempPath).catch(() => {})
    throw new HttpError(413, 'file_count_limit', `You can attach up to ${limits.maxFiles} files.`, {
      maxFiles: limits.maxFiles,
    })
  }
  if (Number(usage.bytes) + received.size > limits.totalBytes) {
    await unlink(received.tempPath).catch(() => {})
    throw new HttpError(413, 'quota_exceeded', 'Those files are larger than the attachment allowance.', {
      totalBytes: limits.totalBytes,
    })
  }

  const id = randomUUID()
  const storedName = `${id}.${received.ext}`
  const dir = path.join(dataDir, 'inquiry-uploads', draftId)
  await mkdir(dir, { recursive: true })
  await rename(received.tempPath, path.join(dir, storedName))

  const createdAt = nowIso()
  db.prepare(
    `INSERT INTO inquiry_uploads (id, draft_id, kind, original_name, stored_name, mime, size, sha256, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(id, draftId, kind, received.filename, storedName, received.mime, received.size, received.sha256, createdAt)

  return {
    id,
    kind,
    name: received.filename,
    mime: received.mime,
    size: received.size,
    createdAt,
  }
}

export async function removeInquiryUpload(db, dataDir, { id, draftId }) {
  const row = db.prepare('SELECT * FROM inquiry_uploads WHERE id = ? AND draft_id = ?').get(id, draftId)
  if (!row) throw new HttpError(404, 'upload_not_found', 'File not found.')
  if (row.inquiry_id) {
    throw new HttpError(409, 'upload_locked', 'This file is already attached to a submitted request.')
  }
  await unlink(inquiryUploadPath(dataDir, row.draft_id, row.stored_name)).catch((error) => {
    if (error?.code !== 'ENOENT') throw error
  })
  db.prepare('DELETE FROM inquiry_uploads WHERE id = ?').run(row.id)
  return row
}

export function attachInquiryUploads(db, inquiryId, draftId) {
  if (!isDraftId(draftId)) return []
  db.prepare('UPDATE inquiry_uploads SET inquiry_id = ? WHERE draft_id = ? AND inquiry_id IS NULL').run(
    inquiryId,
    draftId,
  )
  return listInquiryUploads(db, draftId)
}

export function inquiryAttachments(db, dataDir, inquiryId) {
  return db
    .prepare('SELECT * FROM inquiry_uploads WHERE inquiry_id = ? ORDER BY created_at ASC')
    .all(inquiryId)
    .map((row) => ({
      name: row.original_name,
      mime: row.mime,
      size: Number(row.size),
      path: inquiryUploadPath(dataDir, row.draft_id, row.stored_name),
    }))
}

export async function cleanupInquiryUploads(db, dataDir, { maxAgeDays = 14 } = {}) {
  const cutoff = new Date(Date.now() - maxAgeDays * 24 * 60 * 60 * 1000).toISOString()
  const rows = db
    .prepare('SELECT * FROM inquiry_uploads WHERE inquiry_id IS NULL AND created_at < ?')
    .all(cutoff)
  for (const row of rows) {
    await unlink(inquiryUploadPath(dataDir, row.draft_id, row.stored_name)).catch(() => {})
    db.prepare('DELETE FROM inquiry_uploads WHERE id = ?').run(row.id)
    const remaining = db
      .prepare('SELECT COUNT(*) AS count FROM inquiry_uploads WHERE draft_id = ?')
      .get(row.draft_id)
    if (!Number(remaining.count)) {
      await rmdir(path.join(dataDir, 'inquiry-uploads', row.draft_id)).catch(() => {})
    }
  }
  return rows.length
}
