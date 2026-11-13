import { getCategory } from '../data/categories'
import { getTemplate } from '../data/templates'
import {
  channelLabel,
  featureLabel,
  fontPairings,
  formatBytes,
  motionOptions,
  pageLabel,
} from '../data/options'
import type { ProjectDraft } from '../types'

export function fontPairingName(fontKey: ProjectDraft['brand']['fontKey']) {
  return fontPairings.find((pairing) => pairing.id === fontKey)?.name ?? fontKey
}

function lines(draft: ProjectDraft) {
  const category = getCategory(draft.categoryId)
  const template = getTemplate(draft.templateId)
  const motion = motionOptions.find((option) => option.id === draft.motion)
  const details = draft.details
  const business = draft.brand.businessName.trim() || 'Not provided yet'

  return {
    category,
    template,
    motion,
    details,
    business,
    contact: [
      `Name: ${details.contactName.trim() || '—'}`,
      `Email: ${details.email.trim() || '—'}`,
      `Phone: ${details.phone.trim() || '—'}`,
      `Location: ${details.location.trim() || '—'}`,
      `Existing website: ${details.existingUrl.trim() || '—'}`,
    ],
    project: [
      `Business type: ${category?.name ?? '—'}`,
      `Design direction: ${template ? `${template.name} (${template.style})` : '—'}`,
      `Business name: ${business}`,
      `Tagline: ${draft.brand.tagline.trim() || '—'}`,
      `Primary colour: ${draft.brand.primary}`,
      `Accent colour: ${draft.brand.accent}`,
      `Typography: ${fontPairingName(draft.brand.fontKey)}`,
      `Pages: ${draft.pages.map(pageLabel).join(', ') || '—'}`,
      `Features: ${draft.features.map(featureLabel).join(', ') || 'None selected'}`,
      `Communication: ${draft.channels.map(channelLabel).join(', ') || 'None selected'}`,
      `Motion: ${motion ? `${motion.label} — ${motion.description}` : '—'}`,
    ],
    assets: [
      ...(details.assetLinks.trim() ? [details.assetLinks.trim()] : []),
      ...details.attachments.map((file) => `${file.name} (${formatBytes(file.size)}, not uploaded)`),
    ],
  }
}

export function buildEmailBody(draft: ProjectDraft) {
  const data = lines(draft)
  return [
    'Hello BRIX Studio,',
    '',
    "I'd like to discuss a website project.",
    '',
    ...data.contact,
    '',
    ...data.project,
    '',
    'About the business:',
    data.details.about.trim() || '—',
    '',
    'Assets / links:',
    data.assets.length ? data.assets.join('\n') : '—',
    '',
    'I have downloaded the PDF project brief and will attach it to this email.',
    '',
    'This brief was prepared with the BRIX project builder.',
    'Please reply with next steps and any questions.',
  ].join('\n')
}

export function briefSlug(draft: ProjectDraft) {
  return (
    (draft.brand.businessName.trim() || 'website')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'website'
  )
}

export function briefFileName(draft: ProjectDraft, extension: 'pdf' | 'md') {
  return `${briefSlug(draft)}-project-brief.${extension}`
}

export function buildEmailSubject(draft: ProjectDraft) {
  const name = draft.brand.businessName.trim() || draft.details.contactName.trim() || 'New website'
  return `Website project inquiry — ${name}`
}

export function buildBrief(draft: ProjectDraft) {
  const data = lines(draft)
  const prepared = new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return [
    '# Website project brief',
    '',
    `Prepared with the BRIX Studio project builder on ${prepared}.`,
    '',
    '## Contact',
    '',
    ...data.contact.map((line) => `- ${line}`),
    '',
    '## Project',
    '',
    ...data.project.map((line) => `- ${line}`),
    '',
    '## About the business',
    '',
    data.details.about.trim() || '—',
    '',
    '## Assets',
    '',
    ...(data.assets.length ? data.assets.map((line) => `- ${line}`) : ['- None supplied yet.']),
    '',
    '## Notes',
    '',
    '- This brief was generated in the browser. Files are not uploaded automatically.',
    '- Send this brief and any assets to the studio by email to begin the project.',
    '',
  ].join('\n')
}

export function downloadBrief(draft: ProjectDraft) {
  const blob = new Blob([buildBrief(draft)], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = briefFileName(draft, 'md')
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}
