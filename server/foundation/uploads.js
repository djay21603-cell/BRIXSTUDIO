import Busboy from 'busboy'
import { createHash, randomUUID } from 'node:crypto'
import { createWriteStream } from 'node:fs'
import { mkdir, rename, stat, unlink } from 'node:fs/promises'
import path from 'node:path'
import { nowIso } from './db.js'
import { HttpError } from './errors.js'

const ALLOWED_TYPES = [
  { mime: 'image/png', ext: 'png', matches: (head) => head.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  { mime: 'image/jpeg', ext: 'jpg', matches: (head) => head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff },
  { mime: 'image/gif', ext: 'gif', matches: (head) => ['GIF87a', 'GIF89a'].includes(head.subarray(0, 6).toString('latin1')) },
  { mime: 'image/webp', ext: 'webp', matches: (head) => head.subarray(0, 4).toString('latin1') === 'RIFF' && head.subarray(8, 12).toString('latin1') === 'WEBP' },
  { mime: 'application/pdf', ext: 'pdf', matches: (head) => head.subarray(0, 5).toString('latin1') === '%PDF-' },
]

const ALLOWED_MIME = new Set(ALLOWED_TYPES.map((type) => type.mime))

export function uploadLimits() {
  return {
    maxFileBytes: positiveInt(process.env.UPLOAD_MAX_FILE_BYTES, 10 * 1024 * 1024),
    quotaBytes: positiveInt(process.env.UPLOAD_USER_QUOTA_BYTES, 100 * 1024 * 1024),
    maxFiles: positiveInt(process.env.UPLOAD_USER_MAX_FILES, 200),
  }
}

function positiveInt(value, fallback) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback
}

export function sanitizeFilename(value) {
  const base = path.basename(String(value || 'file'))
  const clean = base
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .replace(/[\\/]/g, '-')
    .trim()
    .slice(0, 120)
  return clean || 'file'
}

export function mapUpload(row) {
  return {
    id: row.id,
    name: row.original_name,
    mime: row.mime,
    size: Number(row.size),
    workspaceId: row.workspace_id,
    createdAt: row.created_at,
  }
}

export function uploadUsage(db, userId) {
  const row = db
    .prepare('SELECT COUNT(*) AS count, COALESCE(SUM(size), 0) AS bytes FROM uploads WHERE user_id = ?')
    .get(userId)
  const limits = uploadLimits()
  return {
    count: Number(row.count),
    bytes: Number(row.bytes),
    maxFiles: limits.maxFiles,
    quotaBytes: limits.quotaBytes,
    maxFileBytes: limits.maxFileBytes,
  }
}

export function uploadPath(dataDir, userId, storedName) {
  return path.join(dataDir, 'uploads', userId, storedName)
}

export async function receiveUpload(req, dataDir) {
  const limits = uploadLimits()
  const tempDir = path.join(dataDir, 'tmp')
  await mkdir(tempDir, { recursive: true })

  return new Promise((resolve, reject) => {
    let busboy
    try {
      busboy = Busboy({
        headers: req.headers,
        limits: { files: 1, fields: 4, fileSize: limits.maxFileBytes },
      })
    } catch {
      reject(new HttpError(400, 'invalid_upload', 'Send the file as multipart form data.'))
      return
    }

    let result = null
    let failure = null
    let filePromise = null
    let finished = false

    const settle = (error, value) => {
      if (finished) return
      finished = true
      if (error) reject(error)
      else resolve(value)
    }

    busboy.on('file', (field, stream, info) => {
      if (field !== 'file') {
        stream.resume()
        return
      }

      const tempPath = path.join(tempDir, `${randomUUID()}.part`)
      const output = createWriteStream(tempPath)
      const hash = createHash('sha256')
      let size = 0
      let head = Buffer.alloc(0)
      let truncated = false

      const file = {
        filename: sanitizeFilename(info.filename),
        declaredMime: String(info.mimeType || '').toLowerCase(),
        tempPath,
        mime: null,
        ext: null,
        size: 0,
        sha256: null,
      }
      result = file

      filePromise = new Promise((resolveFile) => {
        stream.on('data', (chunk) => {
          size += chunk.length
          hash.update(chunk)
          output.write(chunk)
          if (head.length < 16) head = Buffer.concat([head, chunk.subarray(0, 16 - head.length)])
        })
        stream.on('limit', () => {
          truncated = true
        })
        stream.on('error', () => {
          truncated = true
          output.destroy()
        })
        stream.on('end', () => {
          output.end()
        })
        output.on('close', () => {
          file.size = size
          file.sha256 = hash.digest('hex')
          const detected = ALLOWED_TYPES.find((type) => type.matches(head))
          if (detected) {
            file.mime = detected.mime
            file.ext = detected.ext
          }
          if (truncated) {
            failure = new HttpError(413, 'file_too_large', 'That file is larger than the upload limit.', {
              maxFileBytes: limits.maxFileBytes,
            })
          } else if (!detected) {
            failure = new HttpError(415, 'unsupported_file_type', 'Upload a PNG, JPEG, GIF, WebP image or a PDF.')
          } else if (file.declaredMime && ALLOWED_MIME.has(file.declaredMime) && file.declaredMime !== detected.mime) {
            failure = new HttpError(415, 'file_type_mismatch', 'The file contents do not match its type.')
          }
          resolveFile()
        })
        output.on('error', () => {
          failure = new HttpError(500, 'upload_failed', 'The file could not be stored.')
          resolveFile()
        })
      })
    })

    busboy.on('filesLimit', () => {
      failure = failure || new HttpError(400, 'too_many_files', 'Upload one file at a time.')
    })
    busboy.on('error', () => {
      settle(new HttpError(400, 'invalid_upload', 'The upload could not be read.'))
    })
    busboy.on('close', async () => {
      try {
        if (filePromise) await filePromise
        else failure = failure || new HttpError(400, 'missing_file', 'Choose a file to upload.')
        if (failure) {
          if (result?.tempPath) await unlink(result.tempPath).catch(() => {})
          settle(failure)
          return
        }
        settle(null, result)
      } catch {
        settle(new HttpError(500, 'upload_failed', 'The file could not be stored.'))
      }
    })

    req.on('aborted', () => {
      settle(new HttpError(400, 'upload_aborted', 'The upload was interrupted.'))
    })
    req.pipe(busboy)
  })
}

export async function storeUpload(db, { user, dataDir, received, workspaceId = null }) {
  const limits = uploadLimits()
  const usage = uploadUsage(db, user.id)
  if (usage.count >= limits.maxFiles) {
    await unlink(received.tempPath).catch(() => {})
    throw new HttpError(413, 'file_count_limit', 'You have reached the file count limit. Delete a file and try again.', {
      maxFiles: limits.maxFiles,
    })
  }
  if (usage.bytes + received.size > limits.quotaBytes) {
    await unlink(received.tempPath).catch(() => {})
    throw new HttpError(413, 'quota_exceeded', 'This upload would exceed your storage quota.', {
      quotaBytes: limits.quotaBytes,
      usedBytes: usage.bytes,
    })
  }

  const id = randomUUID()
  const storedName = `${id}.${received.ext}`
  const userDir = path.join(dataDir, 'uploads', user.id)
  await mkdir(userDir, { recursive: true })
  const finalPath = uploadPath(dataDir, user.id, storedName)
  await rename(received.tempPath, finalPath)

  const createdAt = nowIso()
  db.prepare(
    `INSERT INTO uploads (id, user_id, workspace_id, original_name, stored_name, mime, size, sha256, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(id, user.id, workspaceId, received.filename, storedName, received.mime, received.size, received.sha256, createdAt)

  return {
    id,
    name: received.filename,
    mime: received.mime,
    size: received.size,
    workspaceId,
    createdAt,
  }
}

export async function removeUpload(db, dataDir, upload) {
  await unlink(uploadPath(dataDir, upload.user_id, upload.stored_name)).catch((error) => {
    if (error?.code !== 'ENOENT') throw error
  })
  db.prepare('DELETE FROM uploads WHERE id = ?').run(upload.id)
}

export async function removeUserFiles(db, dataDir, userId) {
  const rows = db.prepare('SELECT id, user_id, stored_name FROM uploads WHERE user_id = ?').all(userId)
  for (const row of rows) {
    await unlink(uploadPath(dataDir, row.user_id, row.stored_name)).catch(() => {})
  }
}

export async function fileExists(filePath) {
  try {
    const info = await stat(filePath)
    return info.isFile()
  } catch {
    return false
  }
}
