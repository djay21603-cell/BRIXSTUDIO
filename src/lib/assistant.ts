import type { ProjectDraft } from '../types'

export type AssistantAction = {
  type:
    | 'category'
    | 'template'
    | 'togglePage'
    | 'toggleFeature'
    | 'toggleChannel'
    | 'motion'
    | 'brand'
    | 'details'
    | 'goToStep'
  value: string | number
  field?: string
}

export type AssistantReply = {
  reply: string
  actions: AssistantAction[]
  suggestions: string[]
  source: 'ai' | 'planner'
}

export type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  text: string
  applied?: string[]
  source?: 'ai' | 'planner'
  suggestions?: string[]
}

export class AssistantError extends Error {
  code: string

  constructor(code: string, message: string) {
    super(message)
    this.code = code
  }
}

function compactDraft(draft: ProjectDraft) {
  return {
    categoryId: draft.categoryId,
    templateId: draft.templateId,
    pages: draft.pages,
    features: draft.features,
    channels: draft.channels,
    motion: draft.motion,
    brand: {
      businessName: draft.brand.businessName,
      tagline: draft.brand.tagline,
      primary: draft.brand.primary,
      accent: draft.brand.accent,
      fontKey: draft.brand.fontKey,
    },
    details: {
      contactName: draft.details.contactName,
      email: draft.details.email,
      phone: draft.details.phone,
      location: draft.details.location,
      about: draft.details.about,
    },
  }
}

export async function askCocel(
  messages: Pick<ChatMessage, 'role' | 'text'>[],
  draft: ProjectDraft,
  signal?: AbortSignal,
): Promise<AssistantReply> {
  const response = await fetch('/api/assistant', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: messages.slice(-10).map((message) => ({ role: message.role, content: message.text })),
      draft: compactDraft(draft),
    }),
    signal,
  })

  const payload = await response.json().catch(() => null)
  if (!response.ok || !payload?.ok) {
    const code = payload?.code || (response.status === 429 ? 'rate_limited' : 'network_error')
    const message = payload?.message || 'The assistant is unavailable right now.'
    throw new AssistantError(code, message)
  }

  return {
    reply: String(payload.reply || '').trim(),
    actions: Array.isArray(payload.actions) ? payload.actions : [],
    suggestions: Array.isArray(payload.suggestions)
      ? payload.suggestions.filter((item: unknown) => typeof item === 'string').slice(0, 3)
      : [],
    source: payload.source === 'ai' ? 'ai' : 'planner',
  }
}

export function assistantErrorMessage(error: unknown) {
  if (error instanceof AssistantError) {
    if (error.code === 'rate_limited') {
      return 'Too many messages just now. Give it a minute, then try again — the builder keeps working as normal.'
    }
    if (error.code === 'invalid_request') {
      return "That message didn't go through. Try rephrasing it, or use the builder fields directly."
    }
    return "I couldn't reach the assistant service. Your selections are safe and every builder control still works."
  }
  if (error instanceof DOMException && error.name === 'AbortError') return ''
  return "I couldn't reach the assistant service. Your selections are safe and every builder control still works."
}
