import { ApiError, api } from './api'
import type { AttachmentKind } from '../types'

const DRAFT_KEY = 'brix.upload-draft.v1'
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const uploadLimits = {
  maxFiles: 8,
  maxFileBytes: 10 * 1024 * 1024,
  totalBytes: 20 * 1024 * 1024,
}

export const logoAccept = 'image/png,image/jpeg,image/gif,image/webp'
export const referenceAccept = `${logoAccept},application/pdf`

const logoMimes = new Set(logoAccept.split(','))
const referenceMimes = new Set(referenceAccept.split(','))

export function getUploadDraftId(): string {
  try {
    const stored = window.localStorage.getItem(DRAFT_KEY)
    if (stored && UUID_RE.test(stored)) return stored
    const created = crypto.randomUUID()
    window.localStorage.setItem(DRAFT_KEY, created)
    return created
  } catch {
    return crypto.randomUUID()
  }
}

export function validateDraftFile(file: File, kind: AttachmentKind): string | null {
  const allowed = kind === 'logo' ? logoMimes : referenceMimes
  if (!allowed.has(file.type)) {
    return kind === 'logo'
      ? 'Logos must be a PNG, JPEG, GIF or WebP image.'
      : 'Use a PNG, JPEG, GIF, WebP image or a PDF.'
  }
  if (file.size > uploadLimits.maxFileBytes) {
    return 'That file is larger than 10 MB.'
  }
  if (!file.size) return 'That file is empty.'
  return null
}

export interface DraftUpload {
  id: string
  kind: AttachmentKind
  name: string
  mime: string
  size: number
  createdAt: string
}

export async function uploadDraftFile(
  draftId: string,
  file: File,
  kind: AttachmentKind,
): Promise<DraftUpload> {
  const form = new FormData()
  form.append('file', file)
  const result = await api.upload<{ ok: true; upload: DraftUpload }>(
    `/api/v1/inquiry-uploads?draftId=${encodeURIComponent(draftId)}&kind=${kind}`,
    form,
  )
  return result.upload
}

export async function deleteDraftUpload(draftId: string, id: string): Promise<void> {
  await api.del(`/api/v1/inquiry-uploads/${encodeURIComponent(id)}?draftId=${encodeURIComponent(draftId)}`)
}

export async function listDraftUploads(draftId: string): Promise<DraftUpload[]> {
  const result = await api.get<{ ok: true; uploads: DraftUpload[] }>(
    `/api/v1/inquiry-uploads?draftId=${encodeURIComponent(draftId)}`,
  )
  return result.uploads
}

export function uploadErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message
  return 'The upload did not finish. Try again.'
}
