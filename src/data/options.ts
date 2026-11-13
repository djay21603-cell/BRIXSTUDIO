import {
  BarChart3,
  CalendarDays,
  Globe2,
  HelpCircle,
  Images,
  ListChecks,
  Mail,
  MapPin,
  Newspaper,
  Search,
  ShoppingCart,
  Smartphone,
  Star,
  Users,
} from 'lucide-react'
import type {
  ChannelOption,
  FeatureOption,
  FontKey,
  MotionId,
  PageOption,
  WizardStepMeta,
} from '../types'

export const wizardSteps: WizardStepMeta[] = [
  { id: 1, key: 'business', label: 'Business type', shortLabel: 'Business' },
  { id: 2, key: 'design', label: 'Website design', shortLabel: 'Design' },
  { id: 3, key: 'pages', label: 'Website pages', shortLabel: 'Pages' },
  { id: 4, key: 'branding', label: 'Colours & branding', shortLabel: 'Brand' },
  { id: 5, key: 'features', label: 'Features & functionality', shortLabel: 'Features' },
  { id: 6, key: 'communication', label: 'Communication & integrations', shortLabel: 'Channels' },
  { id: 7, key: 'motion', label: 'Animations & effects', shortLabel: 'Motion' },
  { id: 8, key: 'details', label: 'Business details & assets', shortLabel: 'Details' },
  { id: 9, key: 'review', label: 'Review & submit', shortLabel: 'Review' },
]

export const pageOptions: PageOption[] = [
  { id: 'home', label: 'Home', description: 'The landing page and first impression.', locked: true },
  { id: 'about', label: 'About', description: 'Your story, people and point of view.' },
  { id: 'services', label: 'Services', description: 'What you offer, structured clearly.' },
  { id: 'portfolio', label: 'Portfolio', description: 'Selected work, projects or spaces.' },
  { id: 'testimonials', label: 'Testimonials', description: 'Proof from the people you serve.' },
  { id: 'blog', label: 'Journal', description: 'Stories, news and search-friendly content.' },
  { id: 'faq', label: 'FAQ', description: 'Answers to the questions that come up often.' },
  { id: 'contact', label: 'Contact', description: 'Enquiries, location and opening hours.', locked: true },
]

export const featureOptions: FeatureOption[] = [
  {
    id: 'booking',
    label: 'Online booking',
    description: 'Reservations or appointments with a simple request flow.',
    group: 'Commerce',
    icon: CalendarDays,
  },
  {
    id: 'ecommerce',
    label: 'Online store',
    description: 'Product listings, collections and a checkout path.',
    group: 'Commerce',
    icon: ShoppingCart,
  },
  {
    id: 'menu',
    label: 'Menu or price list',
    description: 'A structured, easy-to-update list of what you offer.',
    group: 'Content',
    icon: ListChecks,
  },
  {
    id: 'gallery',
    label: 'Portfolio gallery',
    description: 'Full-bleed imagery with lightbox viewing.',
    group: 'Content',
    icon: Images,
  },
  {
    id: 'blog',
    label: 'Journal / blog',
    description: 'Long-form stories with categories and sharing.',
    group: 'Content',
    icon: Newspaper,
  },
  {
    id: 'reviews',
    label: 'Reviews & testimonials',
    description: 'Curated social proof placed where it helps.',
    group: 'Content',
    icon: Star,
  },
  {
    id: 'map',
    label: 'Interactive map',
    description: 'Location, directions and travel context.',
    group: 'Operations',
    icon: MapPin,
  },
  {
    id: 'members',
    label: 'Member accounts',
    description: 'Login areas for returning customers or clients.',
    group: 'Operations',
    icon: Users,
  },
  {
    id: 'help',
    label: 'Help centre',
    description: 'Searchable answers that reduce repetitive enquiries.',
    group: 'Operations',
    icon: HelpCircle,
  },
  {
    id: 'seo',
    label: 'SEO foundations',
    description: 'Clean structure, metadata and fast pages.',
    group: 'Growth',
    icon: Search,
  },
  {
    id: 'analytics',
    label: 'Analytics setup',
    description: 'Understand visits, sources and conversions.',
    group: 'Growth',
    icon: BarChart3,
  },
  {
    id: 'newsletter',
    label: 'Newsletter capture',
    description: 'A quiet email signup with consent built in.',
    group: 'Growth',
    icon: Mail,
  },
  {
    id: 'multilingual',
    label: 'Multilingual',
    description: 'A second language for your site structure.',
    group: 'Growth',
    icon: Globe2,
  },
  {
    id: 'mobile',
    label: 'Progressive web app',
    description: 'Installable on phones with an app-like feel.',
    group: 'Growth',
    icon: Smartphone,
  },
]

export const featureGroups = ['Commerce', 'Content', 'Operations', 'Growth'] as const

export const channels: ChannelOption[] = [
  {
    id: 'chatbot',
    label: 'AI Chatbot',
    description: 'Answers common questions and captures enquiries around the clock.',
    note: 'Add-on',
  },
  {
    id: 'live-chat',
    label: 'Live Chat',
    description: 'A real conversation with your team during opening hours.',
    note: 'Add-on',
  },
  {
    id: 'messenger',
    label: 'Facebook Messenger',
    description: 'Meet customers where they already message you.',
    note: 'Free',
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    description: 'A direct line for quick questions and booking confirmations.',
    note: 'Free',
  },
  {
    id: 'viber',
    label: 'Viber',
    description: 'Popular with local customers for calls and messages.',
    note: 'Free',
  },
  {
    id: 'call',
    label: 'Click to Call',
    description: 'One tap to reach your front desk from any phone.',
    note: 'Free',
  },
  {
    id: 'sms',
    label: 'SMS',
    description: 'Text follow-ups for bookings and reminders.',
    note: 'Add-on',
  },
  {
    id: 'email',
    label: 'Email Inquiry',
    description: 'A direct email link for considered, longer enquiries.',
    note: 'Free',
  },
  {
    id: 'form',
    label: 'Contact Form',
    description: 'A structured enquiry form delivered to your inbox.',
    note: 'Included',
  },
]

export const motionOptions: {
  id: MotionId
  label: string
  description: string
  tempo: string
}[] = [
  {
    id: 'subtle',
    label: 'Subtle & smooth',
    description: 'Short fades and small lifts. Calm, modern and never distracting.',
    tempo: '0.6s',
  },
  {
    id: 'cinematic',
    label: 'Cinematic reveal',
    description: 'Slow image reveals, layered parallax and generous pacing.',
    tempo: '1.2s',
  },
  {
    id: 'playful',
    label: 'Playful motion',
    description: 'Bouncy hovers, rotating accents and quicker transitions.',
    tempo: '0.35s',
  },
  {
    id: 'none',
    label: 'No animation',
    description: 'Static by design — fastest and easiest on the eye.',
    tempo: '0s',
  },
]

export const brandPresets: {
  id: string
  name: string
  primary: string
  accent: string
  fontKey: FontKey
}[] = [
  { id: 'copper-bone', name: 'Copper & bone', primary: '#a9552c', accent: '#c9a55c', fontKey: 'serif' },
  { id: 'forest-sand', name: 'Forest & sand', primary: '#3e5c43', accent: '#b08455', fontKey: 'serif' },
  { id: 'midnight-lime', name: 'Midnight & lime', primary: '#161a16', accent: '#c9f45c', fontKey: 'grotesk' },
  { id: 'burgundy-blush', name: 'Burgundy & blush', primary: '#7c2e42', accent: '#c99a7a', fontKey: 'serif' },
  { id: 'cobalt-paper', name: 'Cobalt & paper', primary: '#2b45e8', accent: '#ff6a3d', fontKey: 'grotesk' },
  { id: 'graphite-white', name: 'Graphite & white', primary: '#0e0e0d', accent: '#8b8b83', fontKey: 'sans' },
]

export const fontPairings: { id: FontKey; name: string; sample: string; description: string }[] = [
  {
    id: 'serif',
    name: 'Editorial serif',
    sample: 'Instrument Serif',
    description: 'Warm, characterful display type with a clean sans body.',
  },
  {
    id: 'grotesk',
    name: 'Modern grotesk',
    sample: 'Space Grotesk',
    description: 'Confident, contemporary headlines with technical poise.',
  },
  {
    id: 'sans',
    name: 'Clean humanist',
    sample: 'Manrope',
    description: 'A single, highly legible family across the whole site.',
  },
]

export function isHex(value: string) {
  return /^#[0-9a-fA-F]{6}$/.test(value.trim())
}

export function readableOn(hex: string) {
  if (!isHex(hex)) return '#ffffff'
  const value = hex.replace('#', '')
  const channels = [0, 2, 4].map((offset) => parseInt(value.slice(offset, offset + 2), 16) / 255)
  const linear = channels.map((channel) =>
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
  )
  const luminance = 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2]
  return luminance > 0.48 ? '#141511' : '#ffffff'
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function pageLabel(id: string) {
  return pageOptions.find((page) => page.id === id)?.label ?? id
}

export function featureLabel(id: string) {
  return featureOptions.find((feature) => feature.id === id)?.label ?? id
}

export function channelLabel(id: string) {
  return channels.find((channel) => channel.id === id)?.label ?? id
}
