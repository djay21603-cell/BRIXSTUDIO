import { getCategory } from '../data/categories'
import { getTemplate } from '../data/templates'
import { channelLabel, featureLabel, motionOptions, pageLabel } from '../data/options'
import { fontPairingName } from './brief'
import { getUploadDraftId } from './uploads'
import type { ProjectDraft } from '../types'

export interface ProjectRequestPayload {
  submissionId: string
  submittedAt: string
  draftId: string
  contact: {
    name: string
    email: string
    phone: string
    location: string
  }
  business: {
    name: string
    tagline: string
    category: string
    description: string
    existingUrl: string
  }
  design: {
    template: string
    style: string
  }
  brand: {
    primary: string
    accent: string
    typography: string
  }
  pages: string[]
  features: string[]
  channels: string[]
  motion: string
  assetLinks: string
  assets: { name: string; size: number }[]
}

export function buildProjectRequest(
  draft: ProjectDraft,
  submissionId: string,
  submittedAt: string,
): ProjectRequestPayload {
  const category = getCategory(draft.categoryId)
  const template = getTemplate(draft.templateId)
  const motion = motionOptions.find((option) => option.id === draft.motion)

  return {
    submissionId,
    submittedAt,
    draftId: getUploadDraftId(),
    contact: {
      name: draft.details.contactName.trim(),
      email: draft.details.email.trim(),
      phone: draft.details.phone.trim(),
      location: draft.details.location.trim(),
    },
    business: {
      name: draft.brand.businessName.trim(),
      tagline: draft.brand.tagline.trim(),
      category: category?.name ?? '',
      description: draft.details.about.trim(),
      existingUrl: draft.details.existingUrl.trim(),
    },
    design: {
      template: template?.name ?? '',
      style: template?.style ?? '',
    },
    brand: {
      primary: draft.brand.primary,
      accent: draft.brand.accent,
      typography: fontPairingName(draft.brand.fontKey),
    },
    pages: draft.pages.map(pageLabel),
    features: draft.features.map(featureLabel),
    channels: draft.channels.map(channelLabel),
    motion: motion ? `${motion.label} — ${motion.description}` : '',
    assetLinks: draft.details.assetLinks.trim(),
    assets: draft.details.attachments
      .filter((file) => file.status === 'uploaded' && file.remoteId)
      .map((file) => ({ name: file.name, size: file.size })),
  }
}

export function requestSignature(payload: ProjectRequestPayload) {
  return JSON.stringify({ ...payload, submissionId: '', submittedAt: '' })
}

export function newSubmissionId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `req-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`
}

export type ConfirmationState = 'sent' | 'failed' | 'not_configured' | 'skipped'

export type SubmitResult =
  | { ok: true; duplicate: boolean; confirmation: ConfirmationState }
  | { ok: false; code: string; message: string; fields?: Record<string, string> }

async function postSubmission(path: string, payload: unknown): Promise<SubmitResult> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 30000)

  try {
    const response = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })
    const body = await response.json().catch(() => null)

    if (response.ok && body?.ok) {
      const confirmation =
        body.confirmation === 'sent' || body.confirmation === 'failed'
          ? body.confirmation
          : body.duplicate
            ? 'skipped'
            : 'sent'
      return { ok: true, duplicate: Boolean(body.duplicate), confirmation }
    }

    return {
      ok: false,
      code: typeof body?.code === 'string' ? body.code : 'server_error',
      message:
        typeof body?.message === 'string'
          ? body.message
          : `The request could not be sent (HTTP ${response.status}).`,
      fields: body?.fields && typeof body.fields === 'object' ? body.fields : undefined,
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return {
        ok: false,
        code: 'timeout',
        message: 'The server took too long to respond.',
      }
    }
    return {
      ok: false,
      code: 'network_error',
      message: 'The server could not be reached.',
    }
  } finally {
    clearTimeout(timeout)
  }
}

export function submitProjectRequest(payload: ProjectRequestPayload) {
  return postSubmission('/api/project-request', payload)
}

export interface ContactPayload {
  submissionId: string
  submittedAt: string
  name: string
  business: string
  email: string
  message: string
}

export function submitContactMessage(payload: ContactPayload) {
  return postSubmission('/api/contact', payload)
}
