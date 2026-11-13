import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ArrowUpRight, Menu, X } from 'lucide-react'
import { navigation, site } from '../../data/site'
import { useAuth } from '../../features/auth/AuthContext'
import { Logo } from './Logo'
import { ButtonLink } from '../ui/Button'
import { cx } from '../../lib/cx'

export function Header() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()
  const { user, loading } = useAuth()

  useEffect(() => {
    setOpen(false)
  }, [location.pathname, location.hash])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <>
      <header
        className={cx(
          'sticky top-0 z-50 border-b transition-all duration-500',
          scrolled
            ? 'border-ink/10 bg-bone/80 shadow-[0_18px_50px_-40px_rgba(0,0,0,0.9)] backdrop-blur-xl'
            : 'border-transparent bg-bone/40 backdrop-blur-sm',
        )}
      >
        <div className="shell flex h-[72px] items-center justify-between gap-6">
          <Logo />

          <nav className="hidden items-center gap-8 lg:flex" aria-label="Main navigation">
            {navigation.map((item) => {
              const active =
                item.href.startsWith('/') &&
                !item.href.includes('#') &&
                location.pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cx(
                    'link-underline text-[13px] font-medium transition-colors',
                    active ? 'text-ink' : 'text-ink/60 hover:text-ink',
                  )}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="flex items-center gap-2.5">
            <a
              href={`mailto:${site.email}`}
              className="hidden text-[12.5px] font-medium text-ink/55 transition-colors hover:text-ink xl:block"
            >
              {site.email}
            </a>
            {!loading && user ? (
              <Link
                to="/app"
                className="hidden items-center gap-1 text-[12.5px] font-medium text-ink/60 transition-colors hover:text-ink sm:inline-flex"
              >
                Dashboard
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            ) : !loading ? (
              <Link
                to="/sign-in"
                className="hidden text-[12.5px] font-medium text-ink/55 transition-colors hover:text-ink sm:block"
              >
                Sign in
              </Link>
            ) : null}
            <ButtonLink to="/start" size="sm" className="hidden sm:inline-flex">
              Start a project
              <ArrowUpRight className="h-3.5 w-3.5" />
            </ButtonLink>
            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? 'Close menu' : 'Open menu'}
              className="grid h-10 w-10 place-items-center rounded-full border border-ink/15 text-ink transition-colors hover:bg-ink/10 hover:text-ink lg:hidden"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      <div
        id="mobile-menu"
        className={cx(
          'fixed inset-x-0 top-[72px] z-40 origin-top border-b border-ink/10 bg-ink-soft px-6 pb-8 pt-5 shadow-[0_40px_80px_-40px_rgba(0,0,0,0.9)] transition-all duration-300 lg:hidden',
          open ? 'visible translate-y-0 opacity-100' : 'invisible -translate-y-2 opacity-0',
        )}
      >
        <nav className="flex flex-col" aria-label="Mobile navigation">
          {navigation.map((item, index) => (
            <Link
              key={item.href}
              to={item.href}
              className="flex items-center justify-between border-b border-ink/8 py-4 text-[22px] tracking-tight text-ink"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {item.label}
              <span className="text-[11px] font-sans tracking-[0.15em] text-ink/35">0{index + 1}</span>
            </Link>
          ))}
        </nav>
        <div className="mt-6 flex flex-col gap-3">
          <ButtonLink to={user ? '/app' : '/sign-in'} variant="secondary" size="lg">
            {user ? 'Open dashboard' : 'Sign in'}
            <ArrowUpRight className="h-4 w-4" />
          </ButtonLink>
          <ButtonLink to="/start" size="lg">
            Start your project
            <ArrowUpRight className="h-4 w-4" />
          </ButtonLink>
          <a
            href={`mailto:${site.email}`}
            className="text-center text-[13px] font-medium text-ink/55 underline underline-offset-4"
          >
            {site.email}
          </a>
        </div>
      </div>
    </>
  )
}
