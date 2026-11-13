const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const HEX_RE = /^#[0-9a-f]{6}$/i
const ID_RE = /^[a-zA-Z0-9._:-]{8,120}$/

function text(value, max) {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

function list(value, maxItems = 30, maxLength = 80) {
  if (!Array.isArray(value)) return []
  return value
    .filter((item) => typeof item === 'string')
    .map((item) => item.trim().slice(0, maxLength))
    .filter(Boolean)
    .slice(0, maxItems)
}

function color(value, fallback) {
  const candidate = text(value, 7)
  return HEX_RE.test(candidate) ? candidate : fallback
}

export function validateSubmission(body) {
  const source = body && typeof body === 'object' ? body : {}
  const contact = source.contact && typeof source.contact === 'object' ? source.contact : {}
  const business = source.business && typeof source.business === 'object' ? source.business : {}
  const design = source.design && typeof source.design === 'object' ? source.design : {}
  const brand = source.brand && typeof source.brand === 'object' ? source.brand : {}
  const fields = {}

  const submissionId = text(source.submissionId, 120)
  if (!ID_RE.test(submissionId)) {
    fields.submissionId = 'A valid submission id is required.'
  }

  const name = text(contact.name, 120)
  if (!name) fields['contact.name'] = 'Your name is required.'

  const email = text(contact.email, 200)
  if (!EMAIL_RE.test(email)) fields['contact.email'] = 'A valid email address is required.'

  const submittedAtRaw = text(source.submittedAt, 40)
  const submittedAt = Number.isNaN(Date.parse(submittedAtRaw)) ? new Date().toISOString() : submittedAtRaw

  const data = {
    submissionId,
    submittedAt,
    contact: {
      name,
      email,
      phone: text(contact.phone, 60),
      location: text(contact.location, 160),
    },
    business: {
      name: text(business.name, 160) || 'Not provided',
      tagline: text(business.tagline, 200),
      category: text(business.category, 120) || 'Not selected',
      description: text(business.description, 4000),
      existingUrl: text(business.existingUrl, 300),
    },
    design: {
      template: text(design.template, 120) || 'Not selected',
      style: text(design.style, 80),
    },
    brand: {
      primary: color(brand.primary, '#386bff'),
      accent: color(brand.accent, '#8157f5'),
      typography: text(brand.typography, 120) || 'Not specified',
    },
    pages: list(source.pages),
    features: list(source.features),
    channels: list(source.channels),
    motion: text(source.motion, 200) || 'Not specified',
    assetLinks: text(source.assetLinks, 2000),
    assets: Array.isArray(source.assets)
      ? source.assets
          .filter((asset) => asset && typeof asset === 'object')
          .map((asset) => ({
            name: text(asset.name, 200),
            size: Number.isFinite(Number(asset.size)) ? Math.max(0, Math.trunc(Number(asset.size))) : 0,
          }))
          .filter((asset) => asset.name)
          .slice(0, 20)
      : [],
  }

  return { fields, data }
}
