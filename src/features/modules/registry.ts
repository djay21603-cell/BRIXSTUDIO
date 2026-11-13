import {
  BarChart3,
  Briefcase,
  Calendar,
  FileText,
  Film,
  Fingerprint,
  FolderOpen,
  Image,
  LayoutTemplate,
  Mail,
  Megaphone,
  Palette,
  PenLine,
  Search,
  Share2,
  ShoppingBag,
  Users,
  type LucideIcon,
} from 'lucide-react'

export type ModuleStatus = 'live' | 'beta' | 'planned'
export type ModuleGroup = 'Build' | 'Content' | 'Marketing' | 'Commerce' | 'Insights' | 'Workspace'

export interface StudioModule {
  slug: string
  name: string
  group: ModuleGroup
  status: ModuleStatus
  phase: string
  summary: string
  icon: LucideIcon
  href?: string
}

export const moduleGroups: ModuleGroup[] = [
  'Build',
  'Content',
  'Marketing',
  'Commerce',
  'Insights',
  'Workspace',
]

export const modules: StudioModule[] = [
  {
    slug: 'website-builder',
    name: 'Website Builder',
    group: 'Build',
    status: 'live',
    phase: 'Available now',
    summary: 'The existing nine-step project builder with live preview, PDF brief and Gmail handoff.',
    icon: LayoutTemplate,
    href: '/start',
  },
  {
    slug: 'creative-studio',
    name: 'Creative Studio',
    group: 'Build',
    status: 'planned',
    phase: 'Phase 1',
    summary: 'Compose layouts, campaign visuals and presentation-ready artboards in one workspace.',
    icon: Palette,
  },
  {
    slug: 'ai-image-generator',
    name: 'AI Image Generator',
    group: 'Build',
    status: 'planned',
    phase: 'Phase 1',
    summary: 'Generate on-brand imagery with modular providers, usage limits and cost safeguards.',
    icon: Image,
  },
  {
    slug: 'brand-kit',
    name: 'Brand Kit',
    group: 'Build',
    status: 'planned',
    phase: 'Phase 1',
    summary: 'Store palettes, type pairings, logo files and tone of voice for every project.',
    icon: Fingerprint,
  },
  {
    slug: 'video-editor',
    name: 'Video Editor',
    group: 'Content',
    status: 'planned',
    phase: 'Phase 2',
    summary: 'Trim, caption and export short-form video without leaving the studio.',
    icon: Film,
  },
  {
    slug: 'copy-studio',
    name: 'Copy Studio',
    group: 'Content',
    status: 'planned',
    phase: 'Phase 1',
    summary: 'Draft website copy and campaign messaging with a structured brand voice.',
    icon: PenLine,
  },
  {
    slug: 'social-kit',
    name: 'Social Kit',
    group: 'Content',
    status: 'planned',
    phase: 'Phase 2',
    summary: 'Resize and schedule social variations from one approved creative source.',
    icon: Share2,
  },
  {
    slug: 'marketing-hub',
    name: 'Marketing Hub',
    group: 'Marketing',
    status: 'planned',
    phase: 'Phase 3',
    summary: 'Plan launches, track channels and keep campaign work in one calendar.',
    icon: Megaphone,
  },
  {
    slug: 'email-campaigns',
    name: 'Email Campaigns',
    group: 'Marketing',
    status: 'planned',
    phase: 'Phase 3',
    summary: 'Build permission-based email campaigns with clear delivery and consent controls.',
    icon: Mail,
  },
  {
    slug: 'seo-toolkit',
    name: 'SEO Toolkit',
    group: 'Marketing',
    status: 'planned',
    phase: 'Phase 3',
    summary: 'Review metadata, structure and content opportunities before launch.',
    icon: Search,
  },
  {
    slug: 'storefront',
    name: 'Storefront',
    group: 'Commerce',
    status: 'planned',
    phase: 'Phase 4',
    summary: 'Present products and take orders. Payments stay disabled until explicitly approved.',
    icon: ShoppingBag,
  },
  {
    slug: 'bookings',
    name: 'Bookings',
    group: 'Commerce',
    status: 'planned',
    phase: 'Phase 4',
    summary: 'Share availability and collect appointment requests for service businesses.',
    icon: Calendar,
  },
  {
    slug: 'analytics',
    name: 'Analytics',
    group: 'Insights',
    status: 'planned',
    phase: 'Phase 5',
    summary: 'A privacy-conscious view of visits, enquiries and content performance.',
    icon: BarChart3,
  },
  {
    slug: 'reports',
    name: 'Reports',
    group: 'Insights',
    status: 'planned',
    phase: 'Phase 5',
    summary: 'Turn project activity into clear monthly summaries for clients.',
    icon: FileText,
  },
  {
    slug: 'files',
    name: 'Files & Assets',
    group: 'Workspace',
    status: 'live',
    phase: 'Available now',
    summary: 'Private, validated uploads with per-account quotas and download controls.',
    icon: FolderOpen,
    href: '/app/files',
  },
  {
    slug: 'team',
    name: 'Team & Permissions',
    group: 'Workspace',
    status: 'beta',
    phase: 'Phase 0',
    summary: 'Workspaces, invitations and owner, editor and viewer roles.',
    icon: Users,
    href: '/app/account#workspaces',
  },
  {
    slug: 'client-projects',
    name: 'Client Projects',
    group: 'Workspace',
    status: 'planned',
    phase: 'Phase 1',
    summary: 'Dedicated workspaces where studio clients follow their project from brief to launch.',
    icon: Briefcase,
  },
]

export function getModule(slug: string | undefined) {
  return modules.find((module) => module.slug === slug)
}

export function modulesByGroup(group: ModuleGroup) {
  return modules.filter((module) => module.group === group)
}
