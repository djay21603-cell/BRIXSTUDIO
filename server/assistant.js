import { STUDIO_EMAIL } from './email.js'

/* Keep this catalog in step with src/data. Ids cross the wire; labels are for replies. */
export const catalog = {
  categories: [
    { id: 'hotel', name: 'Hotels & Resorts', shortName: 'Hotels', tagline: 'Atmosphere you can almost feel' },
    { id: 'restaurant', name: 'Restaurants & Cafés', shortName: 'Food & drink', tagline: 'A table people want to book' },
    { id: 'corporate', name: 'Corporate Businesses', shortName: 'Corporate', tagline: 'Credibility, made visible' },
    { id: 'clinic', name: 'Clinics & Healthcare', shortName: 'Healthcare', tagline: 'Calm, clear care' },
    { id: 'salon', name: 'Salons & Spas', shortName: 'Beauty & wellness', tagline: 'Rituals worth booking' },
    { id: 'realestate', name: 'Real Estate', shortName: 'Real estate', tagline: 'Places that sell themselves' },
    { id: 'ecommerce', name: 'E-commerce', shortName: 'E-commerce', tagline: 'Products, presented well' },
    { id: 'general', name: 'Other Small Businesses', shortName: 'Small business', tagline: 'A site that fits the work' },
  ],
  templates: [
    { id: 'grand-maison', name: 'Grand Maison', style: 'Luxury', tagline: 'Warm, editorial, quietly expensive', bestFor: ['hotel', 'salon', 'realestate'] },
    { id: 'monochrome', name: 'Monochrome', style: 'Minimalist', tagline: 'Less, but with intention', bestFor: ['corporate', 'general', 'ecommerce'] },
    { id: 'studio-bold', name: 'Studio Bold', style: 'Modern', tagline: 'Confident, structured, current', bestFor: ['general', 'corporate', 'ecommerce'] },
    { id: 'meridian', name: 'Meridian', style: 'Corporate', tagline: 'Credible, clear, composed', bestFor: ['corporate', 'clinic', 'realestate'] },
    { id: 'elan', name: 'Élan', style: 'Elegant', tagline: 'Soft, romantic, refined', bestFor: ['salon', 'hotel', 'restaurant'] },
    { id: 'kinetic', name: 'Kinetic', style: 'Creative', tagline: 'Playful, energetic, memorable', bestFor: ['ecommerce', 'restaurant', 'general'] },
    { id: 'terra', name: 'Terra', style: 'Nature Inspired', tagline: 'Grounded, tactile, organic', bestFor: ['hotel', 'realestate', 'salon'] },
    { id: 'nocturne', name: 'Nocturne', style: 'Dark Modern', tagline: 'Moody, sharp, high contrast', bestFor: ['restaurant', 'ecommerce', 'corporate'] },
  ],
  pages: [
    { id: 'home', label: 'Home', locked: true },
    { id: 'about', label: 'About' },
    { id: 'services', label: 'Services' },
    { id: 'portfolio', label: 'Portfolio' },
    { id: 'testimonials', label: 'Testimonials' },
    { id: 'blog', label: 'Journal' },
    { id: 'faq', label: 'FAQ' },
    { id: 'contact', label: 'Contact', locked: true },
  ],
  features: [
    { id: 'booking', label: 'Online booking' },
    { id: 'ecommerce', label: 'Online store' },
    { id: 'menu', label: 'Menu or price list' },
    { id: 'gallery', label: 'Portfolio gallery' },
    { id: 'blog', label: 'Journal / blog' },
    { id: 'reviews', label: 'Reviews & testimonials' },
    { id: 'map', label: 'Interactive map' },
    { id: 'members', label: 'Member accounts' },
    { id: 'help', label: 'Help centre' },
    { id: 'seo', label: 'SEO foundations' },
    { id: 'analytics', label: 'Analytics setup' },
    { id: 'newsletter', label: 'Newsletter capture' },
    { id: 'multilingual', label: 'Multilingual' },
    { id: 'mobile', label: 'Progressive web app' },
  ],
  channels: [
    { id: 'chatbot', label: 'AI Chatbot' },
    { id: 'live-chat', label: 'Live Chat' },
    { id: 'messenger', label: 'Facebook Messenger' },
    { id: 'whatsapp', label: 'WhatsApp' },
    { id: 'viber', label: 'Viber' },
    { id: 'call', label: 'Click to Call' },
    { id: 'sms', label: 'SMS' },
    { id: 'email', label: 'Email Inquiry' },
    { id: 'form', label: 'Contact Form' },
  ],
  motions: [
    { id: 'subtle', label: 'Subtle & smooth', description: 'Short fades and small lifts.' },
    { id: 'cinematic', label: 'Cinematic reveal', description: 'Slow image reveals and layered parallax.' },
    { id: 'playful', label: 'Playful motion', description: 'Bouncy hovers and quicker transitions.' },
    { id: 'none', label: 'No animation', description: 'Static layouts and instant transitions.' },
  ],
  fonts: [
    { id: 'serif', name: 'Editorial serif' },
    { id: 'grotesk', name: 'Modern grotesk' },
    { id: 'sans', name: 'Clean humanist' },
  ],
}

const ids = (list) => list.map((item) => item.id)
const CATEGORY_IDS = ids(catalog.categories)
const TEMPLATE_IDS = ids(catalog.templates)
const PAGE_IDS = ids(catalog.pages)
const FEATURE_IDS = ids(catalog.features)
const CHANNEL_IDS = ids(catalog.channels)
const MOTION_IDS = ids(catalog.motions)
const FONT_IDS = ids(catalog.fonts)

const TEXT_LIMITS = {
  businessName: 80,
  tagline: 140,
  contactName: 80,
  email: 120,
  phone: 40,
  location: 90,
  about: 1400,
  assetLinks: 700,
  existingUrl: 240,
}

export const SYSTEM_PROMPT = `You are the BRIX Studio project assistant, embedded in a website project builder.
You help a customer describe their business and shape a website brief through natural conversation.
Ask ONE question at a time. Keep replies to 2-4 sentences, warm, concrete and free of hype.
You may propose actions that fill the builder for the customer. Never claim an action happened; the app applies them and shows the result.
You cannot submit the brief, send email, or reset data. If asked, say the customer must review and press the buttons themselves.
Never invent prices, timelines, guarantees or client names. Pricing is scoped after the studio reads the brief.
Reply with JSON only, shaped as:
{"reply":"...","actions":[{"type":"category|template|togglePage|toggleFeature|toggleChannel|motion|brand|details|goToStep","value":"...","field":"..."}],"suggestions":["...","...","..."]}
Use only these ids:
categories ${CATEGORY_IDS.join(', ')}
templates ${TEMPLATE_IDS.join(', ')}
pages ${PAGE_IDS.join(', ')}
features ${FEATURE_IDS.join(', ')}
channels ${CHANNEL_IDS.join(', ')}
motions ${MOTION_IDS.join(', ')}
fonts ${FONT_IDS.join(', ')}
Action fields: brand -> businessName|tagline|primary|accent|fontKey; details -> contactName|email|phone|location|about|assetLinks|existingUrl.
Pages home and contact are always included and cannot be toggled.
At most 6 actions. Suggestions are three short next replies the customer could tap.`

export class AssistantConfigError extends Error {}

export function assistantMode() {
  return process.env.ASSISTANT_API_KEY ? 'ai' : 'planner'
}

function normalize(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function clampText(value, field) {
  const limit = TEXT_LIMITS[field]
  if (!limit) return null
  const text = String(value ?? '').replace(/\s+$/g, '').slice(0, limit)
  return text.length ? text : null
}

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i

export function sanitizeActions(raw) {
  if (!Array.isArray(raw)) return []
  const actions = []
  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') continue
    const type = String(entry.type || '')
    const value = entry.value
    let action = null

    if (type === 'category' && CATEGORY_IDS.includes(value)) action = { type, value }
    else if (type === 'template' && TEMPLATE_IDS.includes(value)) action = { type, value }
    else if (type === 'togglePage' && PAGE_IDS.includes(value) && value !== 'home' && value !== 'contact') {
      action = { type, value }
    } else if (type === 'toggleFeature' && FEATURE_IDS.includes(value)) action = { type, value }
    else if (type === 'toggleChannel' && CHANNEL_IDS.includes(value)) action = { type, value }
    else if (type === 'motion' && MOTION_IDS.includes(value)) action = { type, value }
    else if (type === 'goToStep') {
      const step = Number(value)
      if (Number.isInteger(step) && step >= 1 && step <= 9) action = { type, value: step }
    } else if (type === 'brand') {
      const field = String(entry.field || '')
      if (field === 'primary' || field === 'accent') {
        if (HEX.test(String(value || ''))) action = { type, field, value: String(value) }
      } else if (field === 'fontKey' && FONT_IDS.includes(value)) {
        action = { type, field, value }
      } else if (field === 'businessName' || field === 'tagline') {
        const text = clampText(value, field)
        if (text) action = { type, field, value: text }
      }
    } else if (type === 'details') {
      const field = String(entry.field || '')
      if (Object.prototype.hasOwnProperty.call(TEXT_LIMITS, field)) {
        const text = clampText(value, field)
        if (text) {
          if (field === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(text)) continue
          action = { type, field, value: text }
        }
      }
    }

    if (action) actions.push(action)
    if (actions.length >= 6) break
  }
  return actions
}

/* ---- Language understanding (deterministic planner) ---- */

const categoryPatterns = [
  { id: 'hotel', words: ['hotel', 'resort', 'villa', 'inn', 'hostel', 'guesthouse', 'guest house', 'boutique stay', 'airbnb', 'lodging'] },
  { id: 'restaurant', words: ['restaurant', 'cafe', 'café', 'bistro', 'coffee shop', 'coffee', 'bar', 'eatery', 'diner', 'bakery', 'food'] },
  { id: 'clinic', words: ['clinic', 'doctor', 'dental', 'dentist', 'medical', 'hospital', 'healthcare', 'therapy', 'therapist', 'wellness center'] },
  { id: 'salon', words: ['salon', 'spa', 'beauty', 'hairdresser', 'hair studio', 'nails', 'barber', 'aesthetic'] },
  { id: 'realestate', words: ['real estate', 'realty', 'property', 'properties', 'broker', 'realtor', 'homes for sale', 'developer'] },
  { id: 'ecommerce', words: ['ecommerce', 'e-commerce', 'online store', 'shop', 'store', 'products', 'brand shop', 'boutique brand'] },
  { id: 'corporate', words: ['corporate', 'company', 'consulting', 'consultancy', 'agency', 'firm', 'b2b', 'law office', 'accounting'] },
  { id: 'general', words: ['small business', 'freelancer', 'portfolio site', 'personal site', 'other business'] },
]

const templateStyleWords = {
  'grand-maison': ['luxury', 'editorial', 'classic', 'elegant', 'warm', 'expensive', 'timeless'],
  monochrome: ['minimal', 'minimalist', 'clean', 'simple', 'quiet', 'understated'],
  'studio-bold': ['bold', 'modern', 'structured', 'confident', 'current'],
  meridian: ['corporate', 'credible', 'professional', 'composed', 'clear'],
  elan: ['romantic', 'soft', 'refined', 'feminine', 'delicate'],
  kinetic: ['playful', 'energetic', 'creative', 'fun', 'memorable'],
  terra: ['nature', 'natural', 'organic', 'earthy', 'grounded', 'tactile'],
  nocturne: ['dark', 'moody', 'high contrast', 'sharp', 'dramatic'],
}

const pagePatterns = {
  about: ['about', 'story', 'our story', 'who we are'],
  services: ['services', 'offerings', 'what we offer', 'treatments'],
  portfolio: ['portfolio', 'our work', 'projects', 'gallery page', 'case studies'],
  testimonials: ['testimonials', 'reviews page', 'social proof'],
  blog: ['blog', 'journal', 'news', 'articles'],
  faq: ['faq', 'questions', 'faqs'],
}

const featurePatterns = {
  booking: ['booking', 'reservation', 'reserve', 'appointment', 'book a table', 'schedule'],
  ecommerce: ['online store', 'sell online', 'ecommerce', 'shop online', 'checkout', 'products online'],
  menu: ['menu', 'price list', 'prices', 'rates'],
  gallery: ['gallery', 'lightbox', 'photo gallery', 'image gallery'],
  blog: ['blog', 'journal', 'articles'],
  reviews: ['reviews', 'testimonials'],
  map: ['map', 'directions', 'location map', 'google maps'],
  members: ['member', 'login', 'accounts', 'client portal'],
  help: ['help centre', 'help center', 'knowledge base', 'support page'],
  seo: ['seo', 'search rankings', 'google ranking', 'search visibility'],
  analytics: ['analytics', 'tracking', 'conversion tracking'],
  newsletter: ['newsletter', 'email signup', 'mailing list'],
  multilingual: ['multilingual', 'second language', 'translation', 'bilingual'],
  mobile: ['progressive web app', 'pwa', 'installable', 'app-like'],
}

const channelPatterns = {
  chatbot: ['chatbot', 'ai chat', 'ai assistant'],
  'live-chat': ['live chat', 'livechat', 'chat with us'],
  messenger: ['messenger', 'facebook message', 'facebook chat'],
  whatsapp: ['whatsapp', 'whats app'],
  viber: ['viber'],
  call: ['click to call', 'phone calls', 'call button', 'call us'],
  sms: ['sms', 'text messages', 'texting'],
  email: ['email inquiries', 'email link', 'email us'],
  form: ['contact form', 'enquiry form', 'inquiry form'],
}

const colorWords = {
  '#386bff': ['blue', 'royal blue', 'cobalt'],
  '#0f766e': ['teal', 'emerald green', 'green'],
  '#1d4ed8': ['navy blue'],
  '#8157f5': ['violet', 'purple', 'lavender'],
  '#b08455': ['gold', 'brass', 'bronze', 'tan'],
  '#a98143': ['ochre', 'mustard', 'amber'],
  '#c2410c': ['terracotta', 'rust', 'burnt orange', 'orange'],
  '#9f1239': ['burgundy', 'maroon', 'wine'],
  '#111827': ['black', 'near black', 'charcoal'],
  '#f4eee3': ['cream', 'off white', 'ivory'],
  '#ec4899': ['pink', 'rose'],
  '#22d3ee': ['cyan', 'aqua', 'turquoise'],
}

const motionPatterns = {
  cinematic: ['cinematic', 'dramatic', 'slow reveal', 'parallax', 'film-like'],
  playful: ['playful', 'bouncy', 'fun motion', 'energetic animation'],
  subtle: ['subtle', 'gentle', 'minimal motion', 'smooth and calm'],
  none: ['no animation', 'no motion', 'static', 'reduce motion', 'turn off animation'],
}

function findMatches(text, map) {
  const found = []
  for (const [id, words] of Object.entries(map)) {
    if (words.some((word) => text.includes(word))) found.push(id)
  }
  return found
}

function findCategory(text) {
  let best = null
  for (const entry of categoryPatterns) {
    for (const word of entry.words) {
      if (text.includes(word)) {
        if (!best || word.length > best.word.length) best = { id: entry.id, word }
      }
    }
  }
  return best?.id ?? null
}

function findTemplate(text) {
  for (const template of catalog.templates) {
    if (text.includes(normalize(template.name))) return { id: template.id, explicit: true }
  }
  let best = null
  for (const [id, words] of Object.entries(templateStyleWords)) {
    for (const word of words) {
      if (text.includes(word) && (!best || word.length > best.word.length)) best = { id, word }
    }
  }
  return best ? { id: best.id, explicit: false, word: best.word } : null
}

function extractBusinessName(original) {
  const patterns = [
    /(?:business|company|studio|brand|hotel|resort|restaurant|cafe|clinic|salon|shop|store)\s+(?:is|are)\s+called\s+(.+)/i,
    /(?:we are|we're|i run|i own|i operate|i manage|my business is|our business is|the business is)\s+(?:called|named)\s+(.+)/i,
    /(?:called|named)\s+(.+)/i,
  ]
  for (const pattern of patterns) {
    const match = original.match(pattern)
    if (!match) continue
    let value = match[1]
      .split(/[.,!?;]|\s+(?:and|but|which|that|with|it's|its|in|located)\s+/i)[0]
      .replace(/^(a|an|the)\s+/i, '')
      .trim()
    value = value.replace(/^["'“”]+|["'“”]+$/g, '').trim()
    const wordCount = value.split(/\s+/).filter(Boolean).length
    if (/^(located|based|in|at|from|looking|planning|trying|not|still)\b/i.test(value)) continue
    if (value.length >= 2 && value.length <= 60 && wordCount <= 6) return value
  }
  return null
}

function extractContact(text) {
  const actions = []
  const email = text.match(/[\w.+-]+@[\w-]+\.[\w.]{2,}/)
  if (email) actions.push({ type: 'details', field: 'email', value: email[0] })
  const phone = text.match(/(?:\+?\d[\d\s().-]{6,}\d)/)
  if (phone && phone[0].replace(/\D/g, '').length >= 7) {
    actions.push({ type: 'details', field: 'phone', value: phone[0].trim() })
  }
  const name = text.match(/(?:my name is|i am|i'm|this is)\s+([A-Z][\w'’-]+(?:\s+[A-Z][\w'’-]+)?)/)
  if (name) actions.push({ type: 'details', field: 'contactName', value: name[1] })
  const location = text.match(/(?:located in|based in|we are in|i am in|i'm in|from)\s+([A-Z][\w'’-]+(?:\s+[A-Z][\w'’-]+){0,2})/)
  if (location) actions.push({ type: 'details', field: 'location', value: location[1] })
  return actions
}

function topTemplates(categoryId, limit = 3) {
  const matches = categoryId
    ? catalog.templates.filter((template) => template.bestFor.includes(categoryId))
    : []
  const filled = [...matches]
  const fillOrder = ['monochrome', 'studio-bold', 'meridian', 'grand-maison', 'elan', 'kinetic', 'terra', 'nocturne']
  for (const id of fillOrder) {
    if (filled.length >= limit) break
    const template = catalog.templates.find((item) => item.id === id)
    if (template && !filled.some((item) => item.id === template.id)) filled.push(template)
  }
  return filled.slice(0, limit)
}

function templateLine(template) {
  return `${template.name} (${template.style.toLowerCase()})`
}

function nextQuestion(draft) {
  const category = catalog.categories.find((item) => item.id === draft.categoryId)
  if (!category) {
    return {
      text: 'To start, which best describes the business: a hotel or resort, restaurant or café, clinic, salon or spa, real estate, online store, corporate business, or something else?',
      step: 1,
    }
  }
  const recommendations = topTemplates(category.id)
  if (!draft.templateId) {
    return {
      text: `Which direction feels right for ${category.shortName.toLowerCase()}: ${recommendations.map(templateLine).join(', ')}?`,
      step: 2,
    }
  }
  if (!draft.pages?.length) {
    return {
      text: 'Which pages should the site include beyond Home and Contact — About, Services, Portfolio, Testimonials, Journal or FAQ?',
      step: 3,
    }
  }
  if (!draft.features?.length) {
    return {
      text: 'Are there any features to plan for, such as online booking, a gallery, a journal or an online store?',
      step: 5,
    }
  }
  if (!draft.channels?.length) {
    return {
      text: 'How should customers reach you — a contact form, WhatsApp, Messenger, email, a click-to-call button, or something else?',
      step: 6,
    }
  }
  if (!draft.brand?.businessName) {
    return { text: 'What is the business called, and do you have a tagline or one-line description?', step: 4 }
  }
  if (!draft.details?.contactName || !draft.details?.email) {
    return { text: 'Last details: what name and email should the studio reply to?', step: 8 }
  }
  return {
    text: 'Everything essential is in place. Review the summary in step 9, download the PDF if you want it, and submit the request yourself when you are ready — I never send it for you.',
    step: 9,
  }
}

const serviceAnswer =
  'BRIX Studio designs and builds the site end to end: art direction and UI design, the responsive build, brand and content structure, then launch, analytics and ongoing care.'

function answerQuestion(text) {
  if (/(price|pricing|cost|budget|quote|how much|rate card)/.test(text)) {
    return 'Pricing is scoped after the studio reads your brief — there are no fixed packages. Finish the brief and the reply will include a clear scope and quote.'
  }
  if (/(how long|timeline|when can|delivery time|turnaround|weeks)/.test(text)) {
    return 'Timing depends on scope and content readiness, so the studio confirms it with the quote after reviewing your brief.'
  }
  if (/(what do you do|services|offer|help with|can you build|do you build|design and build)/.test(text)) {
    return serviceAnswer
  }
  if (/(who are you|about brix|about the studio|what is brix)/.test(text)) {
    return 'BRIX Studio is an independent web studio building considered websites for hotels, restaurants, clinics, studios and growing companies. One senior contact handles design and build.'
  }
  if (/(how (?:do|can) i contact|contact (?:you|the studio)|your email|studio email|email address|reach you)/.test(text)) {
    return `The studio inbox is ${STUDIO_EMAIL}. You can also use “Email the brief yourself in Gmail” on the review step, which drafts the message for you.`
  }
  if (/(submit|send it|send the brief|email it for me|send the email)/.test(text)) {
    return 'I can prepare the brief, but I will not submit or email it for you. Review step 9, then press “Send my project request” or open Gmail yourself — that keeps you in control.'
  }
  if (/(clear|reset|delete|start over|restart)/.test(text)) {
    return 'I will not clear your answers. If you really want to start over, use the reset control on the review step so you can confirm it yourself.'
  }
  if (/(thank|thanks|cheers)/.test(text)) {
    return 'Glad to help. Your selections stay saved on this device while you finish the brief.'
  }
  return null
}

function buildReply(parts, fallback) {
  const text = parts.filter(Boolean).join(' ')
  return text || fallback
}

export function plan({ text, draft }) {
  const original = String(text || '').trim()
  const lower = normalize(original)
  const actions = []
  const notes = []

  const requestVerb = /\b(add|include|need|want|would like|use|choose|select|set|set up|enable|turn on|apply|make|change|build|put)\b/.test(lower)
  const question = /^(what|how|do|does|can|could|is|are|who|why|where|when|which)\b/.test(lower) && !requestVerb
  const wordCount = lower.split(/\s+/).filter(Boolean).length
  const short = wordCount <= 8
  const designIntent = /\b(design|style|look|feel|direction|template|theme|vibe|aesthetic|choose|select|use|want|like|prefer|go with)\b/.test(lower)
  const pageIntent = /\b(add|include|need|want|would like|build|have|show|pages?|navigation)\b/.test(lower)
  const featureIntent = /\b(add|include|need|want|would like|set up|enable|turn on|use|take|accept)\b/.test(lower)
  const channelIntent = /\b(add|include|need|want|would like|use|using|set up|enable|turn on|contact|reach)\b/.test(lower)
  const brandColorIntent = /\b(colou?r|palette|brand)\b/.test(lower) || /#[0-9a-f]{6}/i.test(original)
  const recommendationIntent = /\b(recommend|suggest|which design|what design|best design|ideas?)\b/.test(lower)
  const businessContext = short || /\b(my|our|we|i|business|company|it's|its|run|own|operate)\b/.test(lower)

  const categoryId = !question && businessContext ? findCategory(lower) : null
  if (categoryId && categoryId !== draft.categoryId) {
    actions.push({ type: 'category', value: categoryId })
    const category = catalog.categories.find((item) => item.id === categoryId)
    notes.push(`Business type set to ${category.name}.`)
  }

  const template = !question && (designIntent || short) ? findTemplate(lower) : null
  if (template && template.id !== draft.templateId) {
    actions.push({ type: 'template', value: template.id })
    const details = catalog.templates.find((item) => item.id === template.id)
    notes.push(`${details.name} is now the selected direction.`)
  }

  if (!question && pageIntent) {
    const pages = findMatches(lower, pagePatterns)
    for (const pageId of pages) {
      if (draft.pages?.includes(pageId)) continue
      actions.push({ type: 'togglePage', value: pageId })
    }
    if (pages.length) {
      const labels = pages.map((id) => catalog.pages.find((page) => page.id === id)?.label).filter(Boolean)
      notes.push(`Added pages: ${labels.join(', ')}.`)
    }
  }

  if (!question && featureIntent) {
    const features = findMatches(lower, featurePatterns)
    for (const featureId of features) {
      if (draft.features?.includes(featureId)) continue
      actions.push({ type: 'toggleFeature', value: featureId })
    }
    if (features.length) {
      const labels = features.map((id) => catalog.features.find((feature) => feature.id === id)?.label).filter(Boolean)
      notes.push(`Added features: ${labels.join(', ')}.`)
    }
  }

  if (!question && channelIntent) {
    const channelsFound = findMatches(lower, channelPatterns)
    for (const channelId of channelsFound) {
      if (draft.channels?.includes(channelId)) continue
      actions.push({ type: 'toggleChannel', value: channelId })
    }
    if (channelsFound.length) {
      const labels = channelsFound.map((id) => catalog.channels.find((channel) => channel.id === id)?.label).filter(Boolean)
      notes.push(`Added contact channels: ${labels.join(', ')}.`)
    }
  }

  const motionId = !question ? findMatches(lower, motionPatterns)[0] : null
  if (motionId && motionId !== draft.motion) {
    actions.push({ type: 'motion', value: motionId })
    notes.push(`Animation set to ${catalog.motions.find((item) => item.id === motionId).label}.`)
  }

  const businessName = !question ? extractBusinessName(original) : null
  if (businessName && businessName !== draft.brand?.businessName) {
    actions.push({ type: 'brand', field: 'businessName', value: businessName })
    notes.push(`Brand name saved as “${businessName}”.`)
  }

  if (!question) {
    const tagline = original.match(/(?:tagline|one-liner|one line description|slogan)\s*(?:is|:)\s*(.+)/i)
    if (tagline) {
      const value = tagline[1].trim().replace(/^["'“”]|["'“”]$/g, '')
      if (value.length >= 3) {
        actions.push({ type: 'brand', field: 'tagline', value })
        notes.push('Tagline saved in the brand step.')
      }
    }

    const about = original.match(/(?:about(?: us| the business)?|description)\s*(?:is|:)\s*(.+)/i)
    if (about && about[1].trim().length > 30) {
      actions.push({ type: 'details', field: 'about', value: about[1].trim() })
      notes.push('Business description saved in step 8.')
    }
  }

  const colors = []
  const hexes = original.match(/#[0-9a-f]{6}/gi)
  if (hexes) {
    colors.push(...hexes.slice(0, 2))
  } else if (!question && brandColorIntent) {
    for (const [hex, words] of Object.entries(colorWords)) {
      if (words.some((word) => lower.includes(word))) colors.push(hex)
      if (colors.length === 2) break
    }
  }
  if (colors.length) {
    actions.push({ type: 'brand', field: 'primary', value: colors[0] })
    if (colors[1]) actions.push({ type: 'brand', field: 'accent', value: colors[1] })
    notes.push(`Brand palette updated to ${colors.join(' and ')}.`)
  }

  if (!question) {
    const contactActions = extractContact(original)
    if (contactActions.length) {
      actions.push(...contactActions)
      const savedLabels = contactActions.map((action) => {
        if (action.field === 'contactName') return 'name'
        if (action.field === 'email') return 'email'
        if (action.field === 'phone') return 'phone'
        return 'location'
      })
      notes.push(`Saved your ${savedLabels.join(' and ')} in step 8.`)
    }
  }

  let advice = null
  if (recommendationIntent) {
    const effectiveCategory = categoryId || draft.categoryId
    const recs = topTemplates(effectiveCategory)
    advice = `For that brief I would start with ${recs.map(templateLine).join(', ')}.`
  }

  const stepMatch = lower.match(/(?:step|section)\s*(\d)/)
  if (stepMatch) {
    const step = Number(stepMatch[1])
    if (step >= 1 && step <= 9) actions.push({ type: 'goToStep', value: step })
  } else if (/(review|summary|ready to send|finish)/.test(lower)) {
    actions.push({ type: 'goToStep', value: 9 })
  } else if (/(design|template|look and feel)/.test(lower)) {
    actions.push({ type: 'goToStep', value: 2 })
  } else if (/(brand|colou?r|font|typography)/.test(lower)) {
    actions.push({ type: 'goToStep', value: 4 })
  } else if (/(page|navigation)/.test(lower)) {
    actions.push({ type: 'goToStep', value: 3 })
  }

  const sectionFor = {
    category: 1,
    template: 2,
    togglePage: 3,
    toggleFeature: 5,
    toggleChannel: 6,
    motion: 7,
    brand: 4,
    details: 8,
  }
  const hasNavigate = actions.some((action) => action.type === 'goToStep')
  const primary = actions.find((action) => sectionFor[action.type])
  if (!hasNavigate && primary) actions.push({ type: 'goToStep', value: sectionFor[primary.type] })

  const sanitized = sanitizeActions(actions)
  const insight = answerQuestion(lower)

  const pendingDraft = {
    ...draft,
    categoryId: sanitized.find((a) => a.type === 'category')?.value ?? draft.categoryId,
    templateId: sanitized.find((a) => a.type === 'template')?.value ?? draft.templateId,
    pages: [...(draft.pages || []), ...sanitized.filter((a) => a.type === 'togglePage').map((a) => a.value)],
    features: [...(draft.features || []), ...sanitized.filter((a) => a.type === 'toggleFeature').map((a) => a.value)],
    channels: [...(draft.channels || []), ...sanitized.filter((a) => a.type === 'toggleChannel').map((a) => a.value)],
    brand: {
      ...(draft.brand || {}),
      businessName:
        sanitized.find((a) => a.type === 'brand' && a.field === 'businessName')?.value ?? draft.brand?.businessName,
    },
    details: { ...(draft.details || {}) },
  }

  const changed = sanitized.some((action) => action.type !== 'goToStep')
  const pendingNext = nextQuestion(pendingDraft)
  const nextText = advice && !pendingDraft.templateId ? 'Which one would you like me to apply?' : pendingNext.text
  let reply
  if (changed) {
    reply = buildReply([notes.join(' '), insight, advice, nextText], 'Updated the brief.')
  } else if (insight) {
    reply = advice ? `${insight} ${advice} ${nextText}` : insight
  } else if (advice) {
    reply = `${advice} ${nextText}`
  } else if (question) {
    reply = 'I can help with the design direction, pages, features or contact channels. Which part would you like to shape first?'
  } else {
    reply = pendingNext.text
  }

  const suggestions = []
  if (!pendingDraft.categoryId) {
    suggestions.push('Hotels & resorts', 'Restaurant or café', 'Clinic or salon')
  } else if (!pendingDraft.templateId) {
    for (const item of topTemplates(pendingDraft.categoryId, 3)) suggestions.push(item.name)
  } else if (!pendingDraft.details?.contactName || !pendingDraft.details?.email) {
    suggestions.push('What is included?', 'How does pricing work?', 'Go to review')
  } else {
    suggestions.push('What is included?', 'How does pricing work?', 'Go to review')
  }

  return { reply, actions: sanitized, suggestions, source: 'planner' }
}

/* ---- Optional AI provider ---- */

function compactDraft(draft) {
  return {
    categoryId: draft?.categoryId ?? null,
    templateId: draft?.templateId ?? null,
    pages: draft?.pages ?? [],
    features: draft?.features ?? [],
    channels: draft?.channels ?? [],
    motion: draft?.motion ?? null,
    brand: {
      businessName: draft?.brand?.businessName ?? '',
      tagline: draft?.brand?.tagline ?? '',
      primary: draft?.brand?.primary ?? '',
      accent: draft?.brand?.accent ?? '',
      fontKey: draft?.brand?.fontKey ?? null,
    },
    details: {
      contactName: draft?.details?.contactName ?? '',
      email: draft?.details?.email ?? '',
      phone: draft?.details?.phone ?? '',
      location: draft?.details?.location ?? '',
      about: draft?.details?.about ?? '',
    },
  }
}

function parseJsonReply(content) {
  const start = content.indexOf('{')
  const end = content.lastIndexOf('}')
  if (start === -1 || end <= start) throw new Error('Assistant returned no JSON object.')
  return JSON.parse(content.slice(start, end + 1))
}

export async function askAssistant({ messages, draft }) {
  const apiKey = process.env.ASSISTANT_API_KEY
  if (!apiKey) throw new AssistantConfigError('ASSISTANT_API_KEY is not set.')

  const base = (process.env.ASSISTANT_BASE_URL || 'https://api.openai.com/v1').replace(/\/+$/, '')
  const model = process.env.ASSISTANT_MODEL || 'gpt-4o-mini'

  const history = messages.map((message) => ({
    role: message.role === 'assistant' ? 'assistant' : 'user',
    content: String(message.content).slice(0, 1200),
  }))

  const response = await fetch(`${base}/chat/completions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      temperature: 0.4,
      max_tokens: 700,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'system', content: `Current saved draft: ${JSON.stringify(compactDraft(draft))}` },
        ...history,
      ],
    }),
    signal: AbortSignal.timeout(25_000),
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    throw new Error(`Assistant provider error ${response.status}: ${detail.slice(0, 200)}`)
  }

  const payload = await response.json()
  const content = payload?.choices?.[0]?.message?.content
  if (typeof content !== 'string') throw new Error('Assistant provider returned an empty message.')

  const parsed = parseJsonReply(content)
  const suggestions = Array.isArray(parsed.suggestions)
    ? parsed.suggestions
        .filter((item) => typeof item === 'string' && item.trim())
        .slice(0, 3)
        .map((item) => item.trim().slice(0, 60))
    : []

  return {
    reply: String(parsed.reply || '').slice(0, 900) || 'Could you say a little more about the business?',
    actions: sanitizeActions(parsed.actions),
    suggestions,
    source: 'ai',
  }
}
