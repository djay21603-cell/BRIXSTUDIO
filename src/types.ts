import type { ComponentType } from 'react'

export type CategoryId =
  | 'hotel'
  | 'restaurant'
  | 'corporate'
  | 'clinic'
  | 'salon'
  | 'realestate'
  | 'ecommerce'
  | 'general'

export type TemplateId =
  | 'grand-maison'
  | 'monochrome'
  | 'studio-bold'
  | 'meridian'
  | 'elan'
  | 'kinetic'
  | 'terra'
  | 'nocturne'

export type FontKey = 'serif' | 'sans' | 'grotesk'

export type LayoutVariant =
  | 'editorial'
  | 'minimal'
  | 'split'
  | 'banded'
  | 'centered'
  | 'creative'
  | 'organic'
  | 'dark'

export type MotionId = 'subtle' | 'cinematic' | 'playful' | 'none'

export interface Palette {
  bg: string
  surface: string
  ink: string
  muted: string
  line: string
  accent: string
  accentInk: string
  accentAlt: string
}

export interface SampleSite {
  brand: string
  eyebrow: string
  headline: string
  subline: string
  cta: string
  nav: string[]
  offerings: { title: string; blurb: string }[]
  stats: { value: string; label: string }[]
  quote: { text: string; name: string }
  heroImage: string
  secondaryImage: string
  ctaTitle: string
}

export interface BusinessCategory {
  id: CategoryId
  name: string
  shortName: string
  tagline: string
  description: string
  image: string
  icon: ComponentType<{ className?: string; strokeWidth?: number }>
  sample: SampleSite
}

export interface WebsiteTemplate {
  id: TemplateId
  name: string
  style: string
  tagline: string
  description: string
  layout: LayoutVariant
  fontKey: FontKey
  palette: Palette
  defaultImage: string
  bestFor: CategoryId[]
  suites: string[]
}

export interface FeatureOption {
  id: string
  label: string
  description: string
  group: 'Commerce' | 'Content' | 'Operations' | 'Growth'
  icon: ComponentType<{ className?: string; strokeWidth?: number }>
}

export interface ChannelOption {
  id: string
  label: string
  description: string
  note: string
}

export interface PageOption {
  id: string
  label: string
  description: string
  locked?: boolean
}

export type AttachmentKind = 'logo' | 'reference'

export interface Attachment {
  id: string
  remoteId?: string
  kind: AttachmentKind
  name: string
  size: number
  mime?: string
  status: 'uploading' | 'uploaded' | 'error'
  error?: string
}

export interface BrandDraft {
  businessName: string
  tagline: string
  primary: string
  accent: string
  fontKey: FontKey
}

export interface ProjectDetails {
  contactName: string
  email: string
  phone: string
  location: string
  existingUrl: string
  about: string
  assetLinks: string
  attachments: Attachment[]
}

export interface ProjectDraft {
  categoryId: CategoryId | null
  templateId: TemplateId | null
  pages: string[]
  brand: BrandDraft
  features: string[]
  channels: string[]
  motion: MotionId
  details: ProjectDetails
}

export interface WizardStepMeta {
  id: number
  key: string
  label: string
  shortLabel: string
}
