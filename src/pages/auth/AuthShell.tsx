import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Check, ShieldCheck } from 'lucide-react'
import { Logo } from '../../components/layout/Logo'

export function safeNext(value: string | null) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/app'
  return value
}

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
  footer,
}: {
  eyebrow: string
  title: string
  description: string
  children: ReactNode
  footer: ReactNode
}) {
  return (
    <div className="page-canvas min-h-screen">
      <div className="shell flex min-h-screen flex-col py-8">
        <div className="flex items-center justify-between gap-4">
          <Logo />
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-[11px] font-semibold text-ink/45 transition-colors hover:text-ink"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to site
          </Link>
        </div>

        <div className="grid flex-1 items-center gap-14 py-12 lg:grid-cols-[1fr_460px] lg:gap-20">
          <div className="hidden lg:block">
            <p className="eyebrow text-clay">
              <span className="h-px w-6 bg-clay" aria-hidden="true" />
              {eyebrow}
            </p>
            <h1 className="display mt-6 max-w-[620px] text-[clamp(2.8rem,4.4vw,4.6rem)] text-ink">
              {title}
            </h1>
            <p className="mt-6 max-w-md text-[14px] leading-relaxed text-ink/55">{description}</p>
            <ul className="mt-10 space-y-4 text-[13px] text-ink/55">
              {[
                'A private workspace for every project',
                'Validated image and PDF uploads with clear quotas',
                'The existing project builder, brief PDF and email handoff stay untouched',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border border-cyan/30 bg-cyan/10 text-cyan">
                    <Check className="h-3 w-3" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-10 inline-flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-ink/35">
              <ShieldCheck className="h-3.5 w-3.5 text-cyan" />
              Phase 0 · Secure accounts foundation
            </p>
          </div>

          <div className="w-full max-w-[460px] justify-self-center lg:justify-self-end">
            <div className="surface rounded-[26px] p-7 shadow-[0_40px_90px_-60px_rgba(0,0,0,0.95)] sm:p-9">
              <p className="eyebrow text-ink/40 lg:hidden">{eyebrow}</p>
              <h2 className="display mt-3 text-[2rem] leading-tight text-ink lg:mt-0">{title}</h2>
              <p className="mt-3 text-[12.5px] leading-relaxed text-ink/50 lg:hidden">{description}</p>
              <div className="mt-7">{children}</div>
            </div>
            <div className="mt-5 text-center text-[12px] text-ink/45">{footer}</div>
          </div>
        </div>

        <p className="text-center text-[10.5px] text-ink/30">
          Your password is hashed on the server. Sessions use an http-only cookie.
        </p>
      </div>
    </div>
  )
}
