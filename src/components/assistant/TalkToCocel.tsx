import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  Check,
  Keyboard,
  Loader2,
  Mic,
  MicOff,
  RotateCcw,
  Send,
  Sparkles,
  Square,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react'
import { useProject } from '../../context/ProjectContext'
import { getCategory } from '../../data/categories'
import { getTemplate } from '../../data/templates'
import {
  channels,
  channelLabel,
  featureLabel,
  featureOptions,
  fontPairings,
  isHex,
  motionOptions,
  pageLabel,
  pageOptions,
} from '../../data/options'
import { askCocel, assistantErrorMessage, type AssistantAction, type ChatMessage } from '../../lib/assistant'
import { useSpeechRecognition, useSpeechSynthesis } from '../../hooks/useSpeech'
import type { BrandDraft, FontKey, MotionId, ProjectDetails } from '../../types'
import { cx } from '../../lib/cx'

const GREETING =
  "Hi, I'm BRIX Studio's project assistant. Tell me what kind of business you're building for and I'll help shape the brief. I never submit or send anything — you review and do that yourself."

const detailLabels: Record<keyof Omit<ProjectDetails, 'attachments'>, string> = {
  contactName: 'Contact name',
  email: 'Email',
  phone: 'Phone',
  location: 'Location',
  existingUrl: 'Existing website',
  about: 'Business description',
  assetLinks: 'Asset links',
}

function newId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `m-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function TalkToCocel() {
  const { draft, setCategory, setTemplate, togglePage, toggleFeature, toggleChannel, setMotion, updateBrand, updateDetails } =
    useProject()
  const navigate = useNavigate()
  const location = useLocation()

  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<'voice' | 'type'>('voice')
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'greeting', role: 'assistant', text: GREETING, source: 'planner' },
  ])

  const draftRef = useRef(draft)
  useEffect(() => {
    draftRef.current = draft
  }, [draft])

  const controllerRef = useRef<AbortController | null>(null)
  const requestRef = useRef(0)
  const messageListRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const synthesis = useSpeechSynthesis()
  const voice = useSpeechRecognition((text) => {
    void send(text)
  })

  useEffect(() => {
    if (!voice.supported) setMode('type')
  }, [voice.supported])

  const applyActions = useCallback(
    (actions: AssistantAction[]) => {
      const applied: string[] = []
      const current = draftRef.current
      const toggledPages = new Set(current.pages)
      const toggledFeatures = new Set(current.features)
      const toggledChannels = new Set(current.channels)
      let targetStep: number | null = null

      for (const action of actions) {
        const value = String(action.value ?? '')
        switch (action.type) {
          case 'category': {
            const category = getCategory(value)
            if (!category) break
            setCategory(category.id)
            applied.push(`Business type → ${category.name}`)
            break
          }
          case 'template': {
            const template = getTemplate(value)
            if (!template) break
            setTemplate(template.id)
            applied.push(`Design → ${template.name}`)
            break
          }
          case 'togglePage': {
            const option = pageOptions.find((page) => page.id === value)
            if (!option || option.locked || toggledPages.has(value)) break
            togglePage(value)
            toggledPages.add(value)
            applied.push(`Page added → ${pageLabel(value)}`)
            break
          }
          case 'toggleFeature': {
            if (!featureOptions.some((feature) => feature.id === value) || toggledFeatures.has(value)) break
            toggleFeature(value)
            toggledFeatures.add(value)
            applied.push(`Feature added → ${featureLabel(value)}`)
            break
          }
          case 'toggleChannel': {
            if (!channels.some((channel) => channel.id === value) || toggledChannels.has(value)) break
            toggleChannel(value)
            toggledChannels.add(value)
            applied.push(`Channel added → ${channelLabel(value)}`)
            break
          }
          case 'motion': {
            if (!motionOptions.some((option) => option.id === value)) break
            setMotion(value as MotionId)
            applied.push(`Animation → ${motionOptions.find((option) => option.id === value)?.label}`)
            break
          }
          case 'brand': {
            const field = action.field
            if (field === 'businessName' || field === 'tagline') {
              updateBrand({ [field]: value } as Partial<BrandDraft>)
              applied.push(field === 'businessName' ? `Brand name → ${value}` : 'Tagline updated')
            } else if (field === 'primary' || field === 'accent') {
              if (!isHex(value)) break
              updateBrand({ [field]: value } as Partial<BrandDraft>)
              applied.push(`${field === 'primary' ? 'Primary' : 'Accent'} colour → ${value}`)
            } else if (field === 'fontKey' && fontPairings.some((pairing) => pairing.id === value)) {
              updateBrand({ fontKey: value as FontKey })
              applied.push(`Typography → ${fontPairings.find((pairing) => pairing.id === value)?.name}`)
            }
            break
          }
          case 'details': {
            const field = action.field as keyof typeof detailLabels | undefined
            if (!field || !(field in detailLabels)) break
            updateDetails({ [field]: value } as Partial<ProjectDetails>)
            applied.push(`${detailLabels[field]} → ${value.length > 42 ? `${value.slice(0, 42)}…` : value}`)
            break
          }
          case 'goToStep': {
            const step = Number(action.value)
            if (Number.isInteger(step) && step >= 1 && step <= 9) targetStep = step
            break
          }
        }
      }

      if (applied.length || targetStep) {
        navigate(`/start?step=${targetStep ?? 1}`)
      }

      return applied
    },
    [location.pathname, navigate, setCategory, setTemplate, togglePage, toggleFeature, toggleChannel, setMotion, updateBrand, updateDetails],
  )

  const send = async (raw: string) => {
    const text = raw.trim().slice(0, 1200)
    if (!text || busy) return

    voice.stop()
    synthesis.stop()
    controllerRef.current?.abort()
    const controller = new AbortController()
    controllerRef.current = controller
    const token = ++requestRef.current

    const userMessage: ChatMessage = { id: newId(), role: 'user', text }
    const history = [...messages, userMessage]
    setMessages(history)
    setInput('')
    setBusy(true)

    try {
      const reply = await askCocel(
        history.map((message) => ({ role: message.role, text: message.text })),
        draftRef.current,
        controller.signal,
      )
      if (token !== requestRef.current) return
      const applied = applyActions(reply.actions)
      setMessages((previous) => [
        ...previous,
        {
          id: newId(),
          role: 'assistant',
          text: reply.reply || 'Tell me a little more about the business.',
          applied,
          source: reply.source,
          suggestions: reply.suggestions,
        },
      ])
      if (reply.reply) synthesis.speak(reply.reply)
    } catch (error) {
      if (token !== requestRef.current) return
      const message = assistantErrorMessage(error)
      if (message) {
        setMessages((previous) => [
          ...previous,
          { id: newId(), role: 'assistant', text: message, source: 'planner' },
        ])
      }
    } finally {
      if (token === requestRef.current) setBusy(false)
    }
  }

  const startListening = () => {
    if (!voice.supported) {
      setMode('type')
      return
    }
    synthesis.stop()
    setOpen(true)
    voice.start()
  }

  const stopEverything = () => {
    requestRef.current += 1
    controllerRef.current?.abort()
    voice.stop()
    synthesis.stop()
    setBusy(false)
  }

  const restart = () => {
    stopEverything()
    setInput('')
    setMessages([{ id: newId(), role: 'assistant', text: GREETING, source: 'planner' }])
    voice.clearError()
  }

  useEffect(() => {
    if (open) return
    requestRef.current += 1
    controllerRef.current?.abort()
    voice.stop()
    synthesis.stop()
    setBusy(false)
  }, [open, voice.stop, synthesis.stop])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

  useEffect(() => {
    const list = messageListRef.current
    if (list) list.scrollTop = list.scrollHeight
  }, [messages, open, busy])

  useEffect(() => {
    return () => controllerRef.current?.abort()
  }, [])

  const lastAssistant = [...messages].reverse().find((message) => message.role === 'assistant')
  const assistantMode = lastAssistant?.source === 'ai' ? 'AI assistant' : 'Guided assistant'
  const status = voice.listening
    ? 'Listening'
    : busy
      ? 'Thinking'
      : synthesis.speaking
        ? 'Speaking'
        : voice.interim
          ? 'Listening'
          : 'Ready'

  const waveformActive = voice.listening || synthesis.speaking || busy
  const secure = typeof window !== 'undefined' ? window.isSecureContext : true

  return (
    <div className="fixed bottom-4 right-4 z-[70] flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      <section
        id="cocel-assistant-panel"
        role="dialog"
        aria-label="TALK TO BRIX project assistant"
        aria-hidden={!open}
        inert={!open}
        className={cx(
          'flex w-[min(400px,calc(100vw-2rem))] flex-col overflow-hidden rounded-[24px] border border-ink/12 bg-[#0a1220]/95 shadow-[0_40px_120px_-30px_rgba(0,0,0,0.9)] backdrop-blur-xl transition-all duration-300',
          open
            ? 'pointer-events-auto h-[min(660px,calc(100dvh-12rem))] translate-y-0 opacity-100'
            : 'pointer-events-none h-0 translate-y-3 opacity-0',
        )}
      >
        <header className="flex items-center justify-between gap-3 border-b border-ink/10 bg-white/[0.03] px-4 py-3.5">
          <div className="flex items-center gap-3">
            <span className="gradient-brand relative grid h-9 w-9 place-items-center rounded-[10px]">
              <span className="font-grotesk text-[10px] font-bold leading-none tracking-[-0.03em] text-white">BS</span>
              <span className={cx('absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-cyan', waveformActive && 'animate-soft-pulse')} />
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink/45">Talk to BRIX</p>
              <p className="mt-0.5 flex items-center gap-1.5 text-[11px] font-semibold text-ink/80">
                <span
                  className={cx(
                    'h-1.5 w-1.5 rounded-full',
                    voice.listening ? 'bg-cyan' : busy ? 'bg-clay' : synthesis.speaking ? 'bg-violet' : 'bg-moss',
                  )}
                />
                {status}
                <span className="text-[9.5px] font-medium uppercase tracking-[0.12em] text-ink/35">{assistantMode}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close assistant"
            className="grid h-8 w-8 place-items-center rounded-full text-ink/45 transition-colors hover:bg-white/5 hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div ref={messageListRef} aria-live="polite" className="no-scrollbar flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {messages.map((message) => (
            <div key={message.id} className={cx('flex flex-col', message.role === 'user' ? 'items-end' : 'items-start')}>
              <div
                className={cx(
                  'max-w-[88%] rounded-2xl px-3.5 py-2.5 text-[12px] leading-relaxed',
                  message.role === 'user'
                    ? 'gradient-brand rounded-br-md text-white'
                    : 'rounded-bl-md border border-ink/10 bg-white/[0.05] text-ink/80',
                )}
              >
                {message.text}
              </div>
              {message.applied?.length ? (
                <ul className="mt-1.5 flex max-w-[92%] flex-wrap gap-1.5">
                  {message.applied.map((label) => (
                    <li
                      key={label}
                      className="inline-flex items-center gap-1 rounded-full border border-cyan/25 bg-cyan/10 px-2 py-1 text-[9.5px] font-semibold text-cyan"
                    >
                      <Check className="h-2.5 w-2.5" strokeWidth={3} />
                      {label}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}

          {busy ? (
            <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-ink/10 bg-white/[0.05] px-3.5 py-3 w-fit">
              {[0, 1, 2].map((index) => (
                <span
                  key={index}
                  className="cocel-wave-bar h-1.5 w-1.5 rounded-full bg-ink/45"
                  style={{ animationDelay: `${index * 0.14}s` }}
                />
              ))}
            </div>
          ) : null}

          {voice.interim ? (
            <p className="ml-auto w-fit max-w-[88%] rounded-2xl rounded-br-md border border-cyan/25 bg-cyan/10 px-3.5 py-2 text-[11.5px] italic text-cyan/90">
              {voice.interim}…
            </p>
          ) : null}

          {lastAssistant?.suggestions?.length && !busy ? (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {lastAssistant.suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => void send(suggestion)}
                  className="rounded-full border border-ink/15 bg-white/[0.03] px-2.5 py-1 text-[10px] font-medium text-ink/60 transition-colors hover:border-ink/30 hover:text-ink"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="border-t border-ink/10 bg-white/[0.02] px-4 pb-4 pt-3">
          <div className="mb-2.5 flex items-center justify-between gap-2">
            <div role="tablist" aria-label="Input mode" className="inline-flex rounded-full border border-ink/12 bg-white/[0.03] p-0.5">
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'voice'}
                onClick={() => setMode('voice')}
                className={cx(
                  'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold transition-colors',
                  mode === 'voice' ? 'bg-white/10 text-ink' : 'text-ink/45 hover:text-ink/70',
                )}
              >
                <Mic className="h-3 w-3" />
                Voice
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'type'}
                onClick={() => setMode('type')}
                className={cx(
                  'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold transition-colors',
                  mode === 'type' ? 'bg-white/10 text-ink' : 'text-ink/45 hover:text-ink/70',
                )}
              >
                <Keyboard className="h-3 w-3" />
                Type
              </button>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={stopEverything}
                disabled={!voice.listening && !busy && !synthesis.speaking}
                className="inline-flex items-center gap-1 rounded-full border border-ink/12 px-2.5 py-1 text-[10px] font-semibold text-ink/55 transition-colors hover:border-ink/30 hover:text-ink disabled:cursor-not-allowed disabled:opacity-35"
              >
                <Square className="h-2.5 w-2.5 fill-current" />
                Stop
              </button>
              <button
                type="button"
                onClick={() => synthesis.setMuted(!synthesis.muted)}
                aria-pressed={synthesis.muted}
                aria-label={synthesis.muted ? 'Unmute voice replies' : 'Mute voice replies'}
                className={cx(
                  'grid h-7 w-7 place-items-center rounded-full border transition-colors',
                  synthesis.muted
                    ? 'border-ink/12 text-ink/35 hover:text-ink/60'
                    : 'border-cyan/30 bg-cyan/10 text-cyan hover:bg-cyan/15',
                )}
              >
                {synthesis.muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
              </button>
              <button
                type="button"
                onClick={restart}
                aria-label="Restart conversation"
                className="grid h-7 w-7 place-items-center rounded-full border border-ink/12 text-ink/45 transition-colors hover:border-ink/30 hover:text-ink"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {mode === 'voice' ? (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={voice.listening ? voice.stop : startListening}
                disabled={!voice.supported || synthesis.speaking || busy}
                aria-label={voice.listening ? 'Stop listening' : 'Start voice input'}
                className={cx(
                  'relative grid h-12 w-12 shrink-0 place-items-center rounded-full transition-all disabled:cursor-not-allowed disabled:opacity-40',
                  voice.listening ? 'bg-cyan text-[#04121f]' : 'gradient-brand text-white hover:brightness-110',
                )}
              >
                {voice.listening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                {voice.listening ? (
                  <span className="cocel-ring absolute inset-0 rounded-full border border-cyan/50" aria-hidden="true" />
                ) : null}
              </button>
              <div className="min-w-0 flex-1">
                <Waveform active={waveformActive} listening={voice.listening} />
                <p className="mt-1 truncate text-[10.5px] text-ink/40">
                  {voice.listening
                    ? 'Speak naturally — I will stop when you finish.'
                    : synthesis.speaking
                      ? 'Reply is playing. Tap the mute icon to silence it.'
                      : voice.supported
                        ? 'Tap the mic to talk, or switch to Type.'
                        : 'Voice input is not available here. Use Type instead.'}
                </p>
              </div>
            </div>
          ) : (
            <form
              onSubmit={(event) => {
                event.preventDefault()
                void send(input)
              }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                maxLength={1200}
                placeholder="Tell me about the business…"
                aria-label="Message to the BRIX assistant"
                className="h-11 min-w-0 flex-1 rounded-full border border-ink/12 bg-white/[0.04] px-4 text-[12px] text-ink placeholder:text-ink/30 focus:border-cyan/50 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!input.trim() || busy}
                aria-label="Send message"
                className="gradient-brand grid h-11 w-11 shrink-0 place-items-center rounded-full text-white transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </form>
          )}

          {voice.error ? (
            <p role="alert" className="mt-2.5 flex items-start gap-1.5 text-[10.5px] leading-relaxed text-danger">
              <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
              <span>
                {voice.error}{' '}
                <button type="button" onClick={() => setMode('type')} className="font-semibold underline underline-offset-2">
                  Switch to typing
                </button>
              </span>
            </p>
          ) : null}

          {!secure && voice.supported ? (
            <p className="mt-2 text-[10px] leading-relaxed text-ink/35">
              Microphone access needs an https connection. Typing works everywhere.
            </p>
          ) : null}

          <p className="mt-2.5 flex items-start gap-1.5 text-[9.5px] leading-relaxed text-ink/30">
            <Sparkles className="mt-0.5 h-2.5 w-2.5 shrink-0" />
            The assistant fills the builder for you. It never submits the brief or sends email — you review and confirm.
          </p>
        </div>
      </section>

      <button
        type="button"
        onClick={() => {
          if (open) {
            setOpen(false)
          } else {
            setOpen(true)
            if (mode === 'type') window.setTimeout(() => inputRef.current?.focus(), 320)
          }
        }}
        aria-expanded={open}
        aria-controls="cocel-assistant-panel"
        className={cx(
          'group inline-flex items-center gap-2.5 rounded-full border px-4 py-3 shadow-[0_20px_50px_-18px_rgba(0,0,0,0.9)] backdrop-blur-xl transition-all',
          open
            ? 'border-cyan/30 bg-[#0a1220]/95 text-ink'
            : 'border-ink/15 bg-[#0a1220]/90 text-ink hover:border-cyan/40 hover:bg-[#0d1728]',
        )}
      >
        <span className="gradient-brand relative grid h-7 w-7 place-items-center rounded-full">
          <Mic className="h-3.5 w-3.5 text-white" />
          {voice.listening ? (
            <span className="cocel-ring absolute inset-0 rounded-full border border-cyan/60" aria-hidden="true" />
          ) : null}
        </span>
        <span className="font-grotesk text-[10.5px] font-bold uppercase tracking-[0.2em]">Talk to BRIX</span>
        <span className={cx('h-1.5 w-1.5 rounded-full', voice.listening ? 'animate-soft-pulse bg-cyan' : open ? 'bg-cyan/80' : 'bg-moss')} />
      </button>
    </div>
  )
}

function Waveform({ active, listening }: { active: boolean; listening: boolean }) {
  return (
    <div className="flex h-6 items-center gap-1" aria-hidden="true">
      {[0, 1, 2, 3, 4, 5, 6, 7].map((index) => (
        <span
          key={index}
          className={cx(
            'w-[3px] rounded-full transition-all duration-300',
            active ? 'cocel-wave-bar' : 'opacity-40',
            listening ? 'bg-cyan' : active ? 'bg-violet' : 'bg-ink/25',
          )}
          style={{
            height: active ? `${8 + ((index * 5) % 15)}px` : '4px',
            animationDelay: `${(index % 4) * 0.12}s`,
            animationDuration: `${0.8 + (index % 3) * 0.18}s`,
          }}
        />
      ))}
    </div>
  )
}
