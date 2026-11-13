import { ArrowUpRight, ArrowUp } from 'lucide-react'
import { Link } from 'react-router-dom'
import { footerLinks, legalLinks, site } from '../../data/site'
import { Logo } from './Logo'
import { ButtonLink } from '../ui/Button'

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-ink/10 bg-ink-soft text-ink">
      <div className="pointer-events-none absolute -right-32 -top-40 h-[440px] w-[440px] rounded-full bg-clay/20 blur-3xl" />
      <div className="pointer-events-none absolute -left-40 bottom-[-160px] h-[400px] w-[400px] rounded-full bg-violet/15 blur-3xl" />
      <div className="shell relative">
        <div className="grid gap-12 border-b border-ink/10 py-16 md:grid-cols-[1.2fr_0.8fr] md:py-20">
          <div>
            <p className="eyebrow text-ink/45">
              <span className="h-px w-6 bg-ink/25" aria-hidden="true" />
              Start a conversation
            </p>
            <h2 className="display mt-6 max-w-[620px] text-[clamp(2.6rem,5vw,4.6rem)] text-ink">
              Have something worth building?
            </h2>
            <p className="mt-6 max-w-md text-[14px] leading-relaxed text-ink/55">
              Tell us about the business, the people it serves and where you want to take it. We will
              help you shape the rest.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <ButtonLink to="/start" variant="inverse" size="lg">
                Start your project
                <ArrowUpRight className="h-4 w-4" />
              </ButtonLink>
              <a
                href={`mailto:${site.email}`}
                className="link-underline text-[13px] font-medium text-ink/65 transition-colors hover:text-ink"
              >
                {site.email}
              </a>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 self-start md:justify-self-end md:pl-10">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-ink/40">Studio</p>
              <ul className="mt-5 space-y-3">
                {footerLinks.studio.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className="text-[13px] text-ink/60 transition-colors hover:text-ink"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-ink/40">Begin</p>
              <ul className="mt-5 space-y-3">
                {footerLinks.start.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className="text-[13px] text-ink/60 transition-colors hover:text-ink"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-8 py-10 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-5">
            <Logo />
            <p className="max-w-xs text-[12px] leading-relaxed text-ink/40">{site.description}</p>
          </div>
          <div className="flex flex-col gap-4 md:items-end">
            <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/50">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan shadow-[0_0_12px_rgba(34,211,238,0.8)]" aria-hidden="true" />
              {site.availability}
            </p>
            <a
              href="#top"
              className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/40 transition-colors hover:text-ink"
            >
              Back to top
              <ArrowUp className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-ink/10 py-6 text-[11px] text-ink/35 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {site.name}. All rights reserved. · Independent web studio
          </p>
          <div className="flex flex-wrap items-center gap-5">
            {legalLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="transition-colors hover:text-ink"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
