import { useState, type FormEvent } from 'react'
import { ArrowUpRight, Check, Copy, Mail } from 'lucide-react'
import { site } from '../../data/site'
import { Reveal } from '../ui/Reveal'
import { Button, ButtonLink } from '../ui/Button'
import { cx } from '../../lib/cx'

interface FormState {
  name: string
  business: string
  email: string
  message: string
}

const emptyForm: FormState = { name: '', business: '', email: '', message: '' }

export function ContactSection() {
  const [form, setForm] = useState<FormState>(emptyForm)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [mailOpened, setMailOpened] = useState(false)
  const [copied, setCopied] = useState<'idle' | 'done' | 'failed'>('idle')

  const update = (key: keyof FormState, value: string) => {
    setForm((previous) => ({ ...previous, [key]: value }))
    setErrors((previous) => ({ ...previous, [key]: undefined }))
    setMailOpened(false)
  }

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(site.email)
      setCopied('done')
      window.setTimeout(() => setCopied('idle'), 2200)
    } catch {
      setCopied('failed')
    }
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors: Partial<Record<keyof FormState, string>> = {}
    if (!form.name.trim()) nextErrors.name = 'Please add your name.'
    if (!form.email.trim()) nextErrors.email = 'Please add an email address.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      nextErrors.email = 'Please check the email address.'
    if (!form.message.trim()) nextErrors.message = 'Tell us a little about the project.'

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    const subject = `Project inquiry — ${form.business.trim() || form.name.trim()}`
    const body = [
      `Name: ${form.name.trim()}`,
      `Business: ${form.business.trim() || '—'}`,
      `Email: ${form.email.trim()}`,
      '',
      form.message.trim(),
    ].join('\n')
    window.location.href = `mailto:${site.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    setMailOpened(true)
  }

  const inputClass = (hasError?: string) =>
    cx(
      'w-full rounded-xl border bg-ink-soft/70 px-4 py-3 text-[13.5px] text-ink outline-none transition-colors placeholder:text-ink/30',
      hasError ? 'border-danger/70' : 'border-ink/12 focus:border-clay/60',
    )

  return (
    <section id="contact" className="relative scroll-mt-24 overflow-hidden border-y border-ink/10 bg-sand/25 py-20 sm:py-28">
      <div className="pointer-events-none absolute inset-0 blueprint opacity-40" />
      <div className="pointer-events-none absolute -right-40 top-10 h-[420px] w-[420px] rounded-full bg-clay/10 blur-3xl" />
      <div className="shell relative">
        <div className="grid gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:gap-20">
          <Reveal>
            <p className="eyebrow text-clay">
              <span className="h-px w-6 bg-clay" aria-hidden="true" />
              Contact
            </p>
            <h2 className="display mt-6 max-w-[540px] text-[clamp(2.6rem,4.8vw,4.4rem)] text-ink">
              Tell us what you’re building.
            </h2>
            <p className="mt-6 max-w-md text-[14px] leading-relaxed text-ink/60">
              A short note is enough. Tell us the business, what needs to change and any timing you
              have in mind. We will reply with questions and a clear next step.
            </p>

            <div className="mt-9 space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <a
                  href={`mailto:${site.email}`}
                  className="inline-flex items-center gap-2 text-[15px] font-semibold text-ink underline decoration-ink/20 underline-offset-4 transition-colors hover:text-clay"
                >
                  <Mail className="h-4 w-4" />
                  {site.email}
                </a>
                <button
                  type="button"
                  onClick={copyEmail}
                  className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 px-3 py-1.5 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink/55 transition-colors hover:border-ink/35 hover:text-ink"
                >
                  {copied === 'done' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copied === 'done' ? 'Copied' : 'Copy'}
                </button>
                {copied === 'failed' ? (
                  <span className="text-[11px] text-danger">Could not copy — select the address above.</span>
                ) : null}
              </div>
              <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/45">
                <span className="h-1.5 w-1.5 rounded-full bg-moss" aria-hidden="true" />
                {site.availability}
              </p>
            </div>

            <div className="mt-10 border-t border-ink/15 pt-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink/35">
                Prefer a guided brief?
              </p>
              <ButtonLink to="/start" variant="secondary" size="sm" className="mt-3">
                Build your project brief
                <ArrowUpRight className="h-3.5 w-3.5" />
              </ButtonLink>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <form
              onSubmit={submit}
              noValidate
              className="rounded-[22px] border border-ink/10 bg-card/70 p-6 shadow-[0_40px_100px_-60px_rgba(0,0,0,0.95)] backdrop-blur sm:p-8"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="contact-name" className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-ink/45">
                    Your name
                  </label>
                  <input
                    id="contact-name"
                    value={form.name}
                    onChange={(event) => update('name', event.target.value)}
                    className={inputClass(errors.name)}
                    placeholder="Alex Reyes"
                    autoComplete="name"
                    aria-invalid={Boolean(errors.name)}
                  />
                  {errors.name ? <p className="mt-1 text-[11px] text-danger">{errors.name}</p> : null}
                </div>
                <div>
                  <label htmlFor="contact-business" className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-ink/45">
                    Business
                  </label>
                  <input
                    id="contact-business"
                    value={form.business}
                    onChange={(event) => update('business', event.target.value)}
                    className={inputClass()}
                    placeholder="Aurelia Bay Resort"
                    autoComplete="organization"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label htmlFor="contact-email" className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-ink/45">
                  Email
                </label>
                <input
                  id="contact-email"
                  type="email"
                  value={form.email}
                  onChange={(event) => update('email', event.target.value)}
                  className={inputClass(errors.email)}
                  placeholder="you@business.com"
                  autoComplete="email"
                  aria-invalid={Boolean(errors.email)}
                />
                {errors.email ? <p className="mt-1 text-[11px] text-danger">{errors.email}</p> : null}
              </div>

              <div className="mt-4">
                <label htmlFor="contact-message" className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-ink/45">
                  What are you building?
                </label>
                <textarea
                  id="contact-message"
                  value={form.message}
                  onChange={(event) => update('message', event.target.value)}
                  rows={5}
                  className={cx(inputClass(errors.message), 'resize-none')}
                  placeholder="A new site for our 12-room boutique hotel. We need rooms, dining, experiences and direct booking."
                  aria-invalid={Boolean(errors.message)}
                />
                {errors.message ? <p className="mt-1 text-[11px] text-danger">{errors.message}</p> : null}
              </div>

              <Button type="submit" size="lg" className="mt-5 w-full">
                Prepare email inquiry
                <ArrowUpRight className="h-4 w-4" />
              </Button>
              <p className="mt-3 text-center text-[10.5px] leading-relaxed text-ink/40">
                This opens your email app with the message ready. Nothing is sent until you send it
                there.
              </p>
              {mailOpened ? (
                <p role="status" className="mt-3 rounded-lg bg-moss/10 px-3 py-2 text-center text-[11px] text-moss">
                  Your email app should be open. Send the message from there and we will take it from
                  here.
                </p>
              ) : null}
            </form>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
