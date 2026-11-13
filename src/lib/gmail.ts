import { site } from '../data/site'
import { buildEmailBody, buildEmailSubject, briefFileName } from './brief'
import type { ProjectDraft } from '../types'

export const GMAIL_COMPOSE_BASE = 'https://mail.google.com/mail/'

export function gmailComposeUrl(draft: ProjectDraft) {
  const params = new URLSearchParams({
    view: 'cm',
    fs: '1',
    to: site.email,
    su: buildEmailSubject(draft),
    body: `${buildEmailBody(draft)}\n\nAttach the downloaded PDF brief: ${briefFileName(draft, 'pdf')}`,
  })
  return `${GMAIL_COMPOSE_BASE}?${params.toString()}`
}

export function openGmailCompose(draft: ProjectDraft) {
  const url = gmailComposeUrl(draft)
  window.open(url, '_blank', 'noopener,noreferrer')
  return url
}
