import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from 'react'
import { templates } from '../data/templates'
import type { Attachment, BrandDraft, FontKey, MotionId, ProjectDetails, ProjectDraft } from '../types'

/* Kept from the original build so existing saved drafts still load. */
const STORAGE_KEY = 'kalayo.project.v1'

const initialDraft: ProjectDraft = {
  categoryId: null,
  templateId: null,
  pages: ['home', 'contact'],
  brand: {
    businessName: '',
    tagline: '',
    primary: '#386bff',
    accent: '#8157f5',
    fontKey: 'serif',
  },
  features: [],
  channels: ['form', 'email'],
  motion: 'subtle',
  details: {
    contactName: '',
    email: '',
    phone: '',
    location: '',
    existingUrl: '',
    about: '',
    assetLinks: '',
    attachments: [],
  },
}

type Action =
  | { type: 'category'; id: ProjectDraft['categoryId'] }
  | { type: 'template'; id: ProjectDraft['templateId'] }
  | { type: 'toggle-page'; id: string }
  | { type: 'brand'; patch: Partial<BrandDraft> }
  | { type: 'font'; fontKey: FontKey }
  | { type: 'toggle-feature'; id: string }
  | { type: 'toggle-channel'; id: string }
  | { type: 'motion'; id: MotionId }
  | { type: 'details'; patch: Partial<ProjectDetails> }
  | { type: 'add-attachments'; files: Attachment[] }
  | { type: 'remove-attachment'; id: string }
  | { type: 'reset' }

const lockedPages = ['home', 'contact']

function reducer(state: ProjectDraft, action: Action): ProjectDraft {
  switch (action.type) {
    case 'category':
      return { ...state, categoryId: action.id }
    case 'template': {
      const template = templates.find((item) => item.id === action.id)
      if (!template) return state
      return {
        ...state,
        templateId: template.id,
        brand: {
          ...state.brand,
          primary: template.palette.accent,
          accent: template.palette.accentAlt,
          fontKey: template.fontKey,
        },
      }
    }
    case 'toggle-page': {
      if (lockedPages.includes(action.id)) return state
      const exists = state.pages.includes(action.id)
      return {
        ...state,
        pages: exists
          ? state.pages.filter((page) => page !== action.id)
          : [...state.pages, action.id],
      }
    }
    case 'brand':
      return { ...state, brand: { ...state.brand, ...action.patch } }
    case 'font':
      return { ...state, brand: { ...state.brand, fontKey: action.fontKey } }
    case 'toggle-feature': {
      const exists = state.features.includes(action.id)
      return {
        ...state,
        features: exists
          ? state.features.filter((feature) => feature !== action.id)
          : [...state.features, action.id],
      }
    }
    case 'toggle-channel': {
      const exists = state.channels.includes(action.id)
      return {
        ...state,
        channels: exists
          ? state.channels.filter((channel) => channel !== action.id)
          : [...state.channels, action.id],
      }
    }
    case 'motion':
      return { ...state, motion: action.id }
    case 'details':
      return { ...state, details: { ...state.details, ...action.patch } }
    case 'add-attachments':
      return {
        ...state,
        details: {
          ...state.details,
          attachments: [...state.details.attachments, ...action.files],
        },
      }
    case 'remove-attachment':
      return {
        ...state,
        details: {
          ...state.details,
          attachments: state.details.attachments.filter((file) => file.id !== action.id),
        },
      }
    case 'reset':
      return initialDraft
    default:
      return state
  }
}

function normalizeDraft(value: unknown): ProjectDraft {
  if (!value || typeof value !== 'object') return initialDraft
  const raw = value as Partial<ProjectDraft>
  return {
    ...initialDraft,
    ...raw,
    brand: { ...initialDraft.brand, ...(raw.brand ?? {}) },
    details: { ...initialDraft.details, ...(raw.details ?? {}) },
    pages: Array.isArray(raw.pages)
      ? Array.from(new Set(['home', 'contact', ...raw.pages]))
      : initialDraft.pages,
    features: Array.isArray(raw.features) ? raw.features : [],
    channels: Array.isArray(raw.channels) ? raw.channels : initialDraft.channels,
  }
}

function loadDraft(): ProjectDraft {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (!stored) return initialDraft
    return normalizeDraft(JSON.parse(stored))
  } catch {
    return initialDraft
  }
}

interface ProjectContextValue {
  draft: ProjectDraft
  categoryName: string
  templateName: string
  setCategory: (id: ProjectDraft['categoryId']) => void
  setTemplate: (id: ProjectDraft['templateId']) => void
  togglePage: (id: string) => void
  updateBrand: (patch: Partial<BrandDraft>) => void
  toggleFeature: (id: string) => void
  toggleChannel: (id: string) => void
  setMotion: (id: MotionId) => void
  updateDetails: (patch: Partial<ProjectDetails>) => void
  addAttachments: (files: Attachment[]) => void
  removeAttachment: (id: string) => void
  reset: () => void
  saveState: 'idle' | 'saved'
}

const ProjectContext = createContext<ProjectContextValue | null>(null)

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [draft, dispatch] = useReducer(reducer, undefined, loadDraft)
  const [saveState, setSaveState] = useState<'idle' | 'saved'>('idle')

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft))
        setSaveState('saved')
      } catch {
        setSaveState('idle')
      }
    }, 350)
    return () => window.clearTimeout(timeout)
  }, [draft])

  const setCategory = useCallback((id: ProjectDraft['categoryId']) => dispatch({ type: 'category', id }), [])
  const setTemplate = useCallback((id: ProjectDraft['templateId']) => dispatch({ type: 'template', id }), [])
  const togglePage = useCallback((id: string) => dispatch({ type: 'toggle-page', id }), [])
  const updateBrand = useCallback((patch: Partial<BrandDraft>) => dispatch({ type: 'brand', patch }), [])
  const toggleFeature = useCallback((id: string) => dispatch({ type: 'toggle-feature', id }), [])
  const toggleChannel = useCallback((id: string) => dispatch({ type: 'toggle-channel', id }), [])
  const setMotion = useCallback((id: MotionId) => dispatch({ type: 'motion', id }), [])
  const updateDetails = useCallback((patch: Partial<ProjectDetails>) => dispatch({ type: 'details', patch }), [])
  const addAttachments = useCallback((files: Attachment[]) => dispatch({ type: 'add-attachments', files }), [])
  const removeAttachment = useCallback((id: string) => dispatch({ type: 'remove-attachment', id }), [])
  const reset = useCallback(() => dispatch({ type: 'reset' }), [])

  const value = useMemo<ProjectContextValue>(() => {
    const template = templates.find((item) => item.id === draft.templateId)
    return {
      draft,
      categoryName: draft.categoryId ?? '',
      templateName: template?.name ?? '',
      setCategory,
      setTemplate,
      togglePage,
      updateBrand,
      toggleFeature,
      toggleChannel,
      setMotion,
      updateDetails,
      addAttachments,
      removeAttachment,
      reset,
      saveState,
    }
  }, [
    draft,
    saveState,
    setCategory,
    setTemplate,
    togglePage,
    updateBrand,
    toggleFeature,
    toggleChannel,
    setMotion,
    updateDetails,
    addAttachments,
    removeAttachment,
    reset,
  ])

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
}

export function useProject() {
  const context = useContext(ProjectContext)
  if (!context) throw new Error('useProject must be used inside ProjectProvider')
  return context
}
