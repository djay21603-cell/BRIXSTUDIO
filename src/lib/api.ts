export type UserRole = 'user' | 'client' | 'admin'
export type WorkspaceRole = 'owner' | 'editor' | 'viewer' | 'admin'

export interface WorkspaceSummary {
  id: string
  name: string
  kind: 'personal' | 'project' | 'studio'
  role: WorkspaceRole
  createdAt: string
}

export interface SessionUser {
  id: string
  name: string
  email: string
  role: UserRole
  status: 'active' | 'suspended'
  createdAt: string
  lastLoginAt: string | null
  workspaces: WorkspaceSummary[]
}

export interface UploadItem {
  id: string
  name: string
  mime: string
  size: number
  workspaceId: string | null
  createdAt: string
}

export interface UploadUsage {
  count: number
  bytes: number
  maxFiles: number
  quotaBytes: number
  maxFileBytes: number
}

export interface WorkspaceMember {
  id: string
  name: string
  email: string
  role: 'owner' | 'editor' | 'viewer'
  joinedAt: string
}

export interface AdminUser {
  id: string
  name: string
  email: string
  role: UserRole
  status: 'active' | 'suspended'
  createdAt: string
  lastLoginAt: string | null
  files: number
  storageBytes: number
}

export interface AdminStats {
  users: number
  activeUsers: number
  admins: number
  workspaces: number
  uploads: number
  uploadBytes: number
  activeSessions: number
  inquiries: number
  newInquiries: number
  limits: { maxFileBytes: number; quotaBytes: number; maxFiles: number }
}

export interface AdminWorkspace {
  id: string
  name: string
  kind: 'personal' | 'project' | 'studio'
  ownerEmail: string
  ownerName: string
  members: number
  files: number
  createdAt: string
}

export interface AuditEvent {
  id: number
  action: string
  targetType: string | null
  targetId: string | null
  meta: Record<string, unknown> | null
  ip: string | null
  actorEmail: string | null
  createdAt: string
}

export type InquiryStatus = 'new' | 'reviewing' | 'quotation_sent' | 'approved' | 'completed'
export type InquiryKind = 'brief' | 'contact'
export type EmailStatus = 'pending' | 'sent' | 'failed' | 'not_configured'

export interface InquiryPayload {
  contact?: { name?: string; email?: string; phone?: string; location?: string }
  business?: {
    name?: string
    tagline?: string
    category?: string
    description?: string
    existingUrl?: string
  }
  design?: { template?: string; style?: string }
  brand?: { primary?: string; accent?: string; typography?: string }
  pages?: string[]
  features?: string[]
  channels?: string[]
  motion?: string
  assetLinks?: string
  assets?: { name: string; size: number }[]
  message?: string
  source?: string
}

export interface InquiryFile {
  id: string
  kind: 'logo' | 'reference'
  name: string
  mime: string
  size: number
  createdAt: string
}

export interface InquirySummary {
  id: string
  submissionId: string
  kind: InquiryKind
  status: InquiryStatus
  name: string
  email: string
  phone: string | null
  location: string | null
  businessName: string | null
  category: string | null
  template: string | null
  message: string | null
  emails: { studio: EmailStatus; customer: EmailStatus }
  files: number
  createdAt: string
  updatedAt: string
  payload?: InquiryPayload | null
}

export interface InquiryDetail extends Omit<InquirySummary, 'files'> {
  payload: InquiryPayload | null
  files: InquiryFile[]
}

export type InquiryCounts = Record<InquiryStatus, number> & { all: number }

export class ApiError extends Error {
  status: number
  code: string
  fields?: Record<string, string>

  constructor(status: number, code: string, message: string, fields?: Record<string, string>) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.fields = fields
  }
}

interface RequestOptions {
  method?: string
  body?: unknown
  signal?: AbortSignal
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {}
  let body: BodyInit | undefined

  if (options.body instanceof FormData) {
    body = options.body
  } else if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json'
    body = JSON.stringify(options.body)
  }

  let response: Response
  try {
    response = await fetch(path, {
      method: options.method ?? 'GET',
      headers,
      body,
      credentials: 'same-origin',
      signal: options.signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError(0, 'timeout', 'The server took too long to respond.')
    }
    throw new ApiError(0, 'network_error', 'The server could not be reached.')
  }

  const payload = await response.json().catch(() => null)
  if (!response.ok || (payload && payload.ok === false)) {
    throw new ApiError(
      response.status,
      typeof payload?.code === 'string' ? payload.code : 'server_error',
      typeof payload?.message === 'string' ? payload.message : `Request failed (HTTP ${response.status}).`,
      payload?.fields && typeof payload.fields === 'object' ? payload.fields : undefined,
    )
  }
  return payload as T
}

export const api = {
  get<T>(path: string) {
    return request<T>(path)
  },
  post<T>(path: string, body?: unknown) {
    return request<T>(path, { method: 'POST', body })
  },
  patch<T>(path: string, body?: unknown) {
    return request<T>(path, { method: 'PATCH', body })
  },
  del<T>(path: string, body?: unknown) {
    return request<T>(path, { method: 'DELETE', body })
  },
  upload<T>(path: string, form: FormData) {
    return request<T>(path, { method: 'POST', body: form })
  },
}

export async function downloadFile(path: string, filename: string) {
  const response = await fetch(path, { credentials: 'same-origin' })
  if (!response.ok) {
    const payload = await response.json().catch(() => null)
    throw new ApiError(
      response.status,
      typeof payload?.code === 'string' ? payload.code : 'download_failed',
      typeof payload?.message === 'string' ? payload.message : 'The file could not be downloaded.',
    )
  }
  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

export function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const index = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)))
  const value = bytes / 1024 ** index
  return `${value >= 10 || index === 0 ? Math.round(value) : value.toFixed(1)} ${units[index]}`
}

export function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

export function formatDateTime(value: string) {
  return new Date(value).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
