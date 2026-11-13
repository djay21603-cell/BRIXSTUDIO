import type { CSSProperties } from 'react'
import { ArrowUpRight, Menu } from 'lucide-react'
import type { BusinessCategory, FontKey, MotionId, WebsiteTemplate } from '../../types'
import { getCategory } from '../../data/categories'
import { channelLabel, featureLabel, isHex, pageLabel, readableOn } from '../../data/options'
import { ChannelIcon } from '../ui/ChannelIcon'
import { cx } from '../../lib/cx'

interface MiniSiteProps {
  template: WebsiteTemplate
  category?: BusinessCategory | null
  brand?: {
    businessName?: string
    tagline?: string
    primary?: string
    accent?: string
    fontKey?: FontKey
  }
  pages?: string[]
  features?: string[]
  channels?: string[]
  motion?: MotionId
  showSuites?: boolean
  showSampleBadge?: boolean
}

const offeringHeadings: Record<string, string> = {
  hotel: 'Stay, dine, explore',
  restaurant: 'At the table',
  corporate: 'How we help',
  clinic: 'How we care',
  salon: 'Rituals & services',
  realestate: 'Places to live',
  ecommerce: 'Shop the edit',
  general: 'What we offer',
}

export function MiniSite({
  template,
  category,
  brand,
  pages,
  features = [],
  channels = [],
  motion = 'subtle',
  showSuites = false,
  showSampleBadge = false,
}: MiniSiteProps) {
  const resolvedCategory = category ?? getCategory(template.bestFor[0]) ?? null
  const sample = resolvedCategory?.sample

  if (!sample) return null

  const base = template.palette
  const accent = brand?.primary && isHex(brand.primary) ? brand.primary : base.accent
  const accentAlt = brand?.accent && isHex(brand.accent) ? brand.accent : base.accentAlt
  const accentInk = readableOn(accent)
  const palette = { ...base, accent, accentInk, accentAlt }
  const fontKey = brand?.fontKey ?? template.fontKey
  const fontClass = fontKey === 'serif' ? 'ms-serif' : fontKey === 'grotesk' ? 'ms-grotesk' : ''
  const businessName = brand?.businessName?.trim() || sample.brand
  const subline = brand?.tagline?.trim() || sample.subline
  const navItems = pages
    ? pages
        .filter((page) => page !== 'contact')
        .map((page) => pageLabel(page))
        .slice(0, 5)
    : sample.nav
  const capabilityItems = showSuites
    ? template.suites
    : features.slice(0, 6).map((feature) => featureLabel(feature))
  const capabilityHeading = showSuites ? 'Signature layouts' : 'Included in your build'
  const motionClass = motion === 'none' ? '' : 'ms-anim'
  const galleryImages = [sample.heroImage, sample.secondaryImage, '/images/interior.jpg'].filter(
    (image, index, all) => all.indexOf(image) === index,
  )

  const rootStyle = {
    '--ms-bg': palette.bg,
    '--ms-surface': palette.surface,
    '--ms-ink': palette.ink,
    '--ms-muted': palette.muted,
    '--ms-line': palette.line,
    '--ms-accent': palette.accent,
    '--ms-accent-ink': palette.accentInk,
    '--ms-accent-alt': palette.accentAlt,
  } as CSSProperties

  const buttonStyle = { background: palette.accent, color: palette.accentInk }
  const eyebrowStyle = { color: palette.accent }
  const mutedStyle = { color: palette.muted }

  const Nav = (
    <header
      className="ms-nav flex items-center justify-between border-b"
      style={{ borderColor: palette.line }}
    >
      <div className="flex items-baseline gap-2">
        <span className={cx('ms-serif text-[clamp(1rem,1.9cqw,1.55rem)] font-medium tracking-tight')}>
          {businessName}
        </span>
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: accent }} />
      </div>
      <nav className="ms-nav-links flex items-center gap-[clamp(14px,2.4cqw,34px)]" aria-label="Sample site navigation">
        {navItems.map((item) => (
          <span key={item} className="ms-nav-link" style={{ color: palette.muted }}>
            {item}
          </span>
        ))}
      </nav>
      <div className="flex items-center gap-3">
        {showSampleBadge ? (
          <span
            className="ms-small rounded-full border px-2.5 py-1 font-semibold uppercase tracking-[0.14em]"
            style={{ borderColor: palette.line, color: palette.muted }}
          >
            Sample
          </span>
        ) : null}
        <span
          className="ms-button ms-nav-cta"
          style={{ background: palette.accent, color: palette.accentInk }}
        >
          {sample.cta}
          <ArrowUpRight className="h-[1.05em] w-[1.05em]" />
        </span>
        <span
          className="ms-nav-menu hidden h-9 w-9 place-items-center rounded-full border"
          style={{ borderColor: palette.line, color: palette.ink }}
        >
          <Menu className="h-4 w-4" />
        </span>
      </div>
    </header>
  )

  const OfferingsHeading = (
    <div className="ms-pad flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="ms-eyebrow" style={eyebrowStyle}>
          What you will find
        </p>
        <h2 className={cx('ms-section-title mt-3', fontClass)}>
          {offeringHeadings[resolvedCategory?.id ?? 'general']}
        </h2>
      </div>
      <span className="ms-small" style={mutedStyle}>
        {String(resolvedCategory?.name ?? '').toUpperCase()}
      </span>
    </div>
  )

  const Stats = (
    <div className="ms-grid-3">
      {sample.stats.map((stat) => (
        <div key={stat.label} className="border-t pt-4" style={{ borderColor: palette.line }}>
          <p className={cx('ms-stat-value', fontClass)} style={eyebrowStyle}>
            {stat.value}
          </p>
          <p className="ms-small mt-2" style={mutedStyle}>
            {stat.label}
          </p>
        </div>
      ))}
    </div>
  )

  return (
    <div
      className={cx('ms-root relative w-full', fontClass)}
      data-motion={motion}
      style={rootStyle}
    >
      {template.layout === 'banded' ? (
        <div
          className="ms-small py-2 text-center font-semibold uppercase tracking-[0.18em]"
          style={{ background: accent, color: accentInk }}
        >
          Now welcoming {resolvedCategory?.shortName.toLowerCase()} enquiries
        </div>
      ) : null}
      {Nav}

      {template.layout === 'editorial' ? (
        <section className="ms-pad" style={{ paddingTop: 'clamp(28px, 4.4cqw, 62px)' }}>
          <p className={cx('ms-eyebrow', motionClass)} style={eyebrowStyle}>
            {sample.eyebrow}
          </p>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-x-10 gap-y-6">
            <h1 className={cx('ms-title ms-serif max-w-[790px]', motionClass)}>
              {sample.headline}
            </h1>
            <div className={cx('max-w-[290px] pb-2', motionClass)} style={{ animationDelay: '120ms' }}>
              <p className="ms-body" style={mutedStyle}>
                {subline}
              </p>
              <span className="ms-button mt-5" style={buttonStyle}>
                {sample.cta}
                <ArrowUpRight className="h-[1.05em] w-[1.05em]" />
              </span>
            </div>
          </div>
          <div className={cx('relative mt-9 overflow-hidden', motionClass)} style={{ animationDelay: '180ms' }}>
            <img
              src={sample.heroImage}
              alt={`${businessName} sample hero`}
              className="ms-hero-image ms-hero-image-anim"
              loading="lazy"
            />
            <div
              className="ms-hide-sm absolute bottom-5 left-5 max-w-[300px] p-5"
              style={{ background: palette.surface, color: palette.ink }}
            >
              <p className={cx('ms-serif text-[clamp(1rem,1.5cqw,1.35rem)] leading-snug')}>
                “{sample.quote.text}”
              </p>
              <p className="ms-small mt-3 uppercase tracking-[0.16em]" style={mutedStyle}>
                {sample.eyebrow}
              </p>
            </div>
          </div>
        </section>
      ) : null}

      {template.layout === 'minimal' ? (
        <section className="ms-pad" style={{ paddingTop: 'clamp(36px, 5.4cqw, 82px)' }}>
          <div className="flex items-center gap-3">
            <span className="h-px w-8" style={{ background: accent }} />
            <p className="ms-eyebrow" style={eyebrowStyle}>
              {sample.eyebrow}
            </p>
          </div>
          <h1 className={cx('ms-title mt-6 max-w-[1060px]', motionClass)}>{sample.headline}</h1>
          <div
            className="ms-grid-hero mt-10 items-end"
            style={{ gap: 'clamp(24px, 5cqw, 76px)' }}
          >
            <div>
              <p className="ms-body max-w-[360px]" style={mutedStyle}>
                {subline}
              </p>
              <span className="ms-button mt-6" style={buttonStyle}>
                {sample.cta}
                <ArrowUpRight className="h-[1.05em] w-[1.05em]" />
              </span>
              <div className="mt-8 flex gap-6">
                {sample.stats.slice(0, 2).map((stat) => (
                  <div key={stat.label}>
                    <p className={cx('text-[clamp(1rem,1.8cqw,1.5rem)]', fontClass)}>{stat.value}</p>
                    <p className="ms-small mt-1" style={mutedStyle}>
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <img
              src={sample.heroImage}
              alt={`${businessName} sample hero`}
              className="w-full object-cover"
              style={{ height: 'clamp(240px, 34cqw, 470px)' }}
              loading="lazy"
            />
          </div>
        </section>
      ) : null}

      {template.layout === 'split' ? (
        <section className="ms-grid-hero">
          <div
            className="ms-pad flex flex-col justify-center"
            style={{
              background: accent,
              color: accentInk,
              paddingBlock: 'clamp(44px, 5.6cqw, 88px)',
            }}
          >
            <p className="ms-eyebrow" style={{ opacity: 0.72 }}>
              {sample.eyebrow}
            </p>
            <h1 className={cx('ms-title ms-grotesk mt-5 max-w-[560px]', motionClass)}>
              {sample.headline}
            </h1>
            <p className="ms-body mt-6 max-w-[380px]" style={{ opacity: 0.8 }}>
              {subline}
            </p>
            <span
              className="ms-button mt-7 self-start"
              style={{ background: palette.accentInk, color: accent }}
            >
              {sample.cta}
              <ArrowUpRight className="h-[1.05em] w-[1.05em]" />
            </span>
          </div>
          <img
            src={sample.heroImage}
            alt={`${businessName} sample hero`}
            className="h-full w-full object-cover"
            style={{ minHeight: 'clamp(330px, 44cqw, 640px)' }}
            loading="lazy"
          />
        </section>
      ) : null}

      {template.layout === 'banded' ? (
        <section className="relative overflow-hidden">
          <img
            src={sample.heroImage}
            alt={`${businessName} sample hero`}
            className="h-[clamp(380px,46cqw,650px)] w-full object-cover"
            loading="lazy"
          />
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(80deg, rgba(8,26,26,0.88) 8%, rgba(8,26,26,0.42) 55%, rgba(8,26,26,0.08))' }}
          />
          <div
            className="ms-pad absolute inset-0 flex flex-col justify-end pb-[clamp(32px,4.6cqw,64px)]"
            style={{ color: '#f7fbfa' }}
          >
            <p className="ms-eyebrow" style={{ color: palette.accentAlt }}>
              {sample.eyebrow}
            </p>
            <h1 className={cx('ms-title mt-5 max-w-[720px]', fontClass, motionClass)}>
              {sample.headline}
            </h1>
            <div className="mt-7 flex flex-wrap items-end justify-between gap-6">
              <p className="ms-body max-w-[420px]" style={{ opacity: 0.78 }}>
                {subline}
              </p>
              <span className="ms-button" style={buttonStyle}>
                {sample.cta}
                <ArrowUpRight className="h-[1.05em] w-[1.05em]" />
              </span>
            </div>
          </div>
        </section>
      ) : null}

      {template.layout === 'centered' ? (
        <section className="ms-pad text-center" style={{ paddingTop: 'clamp(40px, 5.6cqw, 86px)' }}>
          <p className="ms-eyebrow" style={eyebrowStyle}>
            {sample.eyebrow}
          </p>
          <h1 className={cx('ms-title mx-auto mt-5 max-w-[860px]', fontClass, motionClass)}>
            {sample.headline}
          </h1>
          <p className="ms-body mx-auto mt-6 max-w-[520px]" style={mutedStyle}>
            {subline}
          </p>
          <span className="ms-button mt-7" style={buttonStyle}>
            {sample.cta}
            <ArrowUpRight className="h-[1.05em] w-[1.05em]" />
          </span>
          <div
            className="mt-10 overflow-hidden"
            style={{
              borderTopLeftRadius: 'clamp(70px, 20cqw, 280px)',
              borderTopRightRadius: 'clamp(70px, 20cqw, 280px)',
            }}
          >
            <img
              src={sample.heroImage}
              alt={`${businessName} sample hero`}
              className="ms-hero-image"
              loading="lazy"
            />
          </div>
        </section>
      ) : null}

      {template.layout === 'creative' ? (
        <section className="ms-pad" style={{ paddingBlock: 'clamp(40px, 5.6cqw, 84px)' }}>
          <div
            className="ms-grid-hero items-center"
            style={{ gap: 'clamp(28px, 5cqw, 72px)' }}
          >
            <div>
              <p className="ms-eyebrow" style={eyebrowStyle}>
                {sample.eyebrow}
              </p>
              <h1 className={cx('ms-title ms-grotesk mt-5', motionClass)}>{sample.headline}</h1>
              <p className="ms-body mt-6 max-w-[400px]" style={mutedStyle}>
                {subline}
              </p>
              <span className="ms-button mt-7" style={buttonStyle}>
                {sample.cta}
                <ArrowUpRight className="h-[1.05em] w-[1.05em]" />
              </span>
            </div>
            <div className="relative">
              <div
                className="absolute inset-0 rotate-3"
                style={{ background: palette.accentAlt, borderRadius: 22, opacity: 0.9 }}
              />
              <img
                src={sample.heroImage}
                alt={`${businessName} sample hero`}
                className="ms-hero-image relative w-full object-cover"
                style={{ borderRadius: 22 }}
                loading="lazy"
              />
              <div
                className="absolute -bottom-5 -left-4 -rotate-3 px-4 py-3"
                style={{ background: palette.accent, color: palette.accentInk }}
              >
                <p className="ms-small font-semibold uppercase tracking-[0.16em]">
                  {resolvedCategory?.tagline}
                </p>
              </div>
            </div>
          </div>
          <div className="mt-12 overflow-hidden border-y py-3" style={{ borderColor: palette.line }}>
            <div className={motion === 'none' ? 'flex gap-6' : 'ms-marquee-track gap-6'}>
              {[0, 1].map((group) => (
                <div key={group} className="flex shrink-0 gap-6">
                  {[...sample.nav, ...template.suites].map((word) => (
                    <span
                      key={`${group}-${word}`}
                      className="flex items-center gap-6 whitespace-nowrap text-[clamp(0.9rem,1.8cqw,1.6rem)] uppercase tracking-[0.04em]"
                      style={{ color: palette.muted }}
                    >
                      {word}
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: accent }} />
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {template.layout === 'organic' ? (
        <section className="ms-pad" style={{ paddingTop: 'clamp(36px, 5.4cqw, 78px)' }}>
          <div className="ms-grid-hero items-center" style={{ gap: 'clamp(26px, 4.6cqw, 66px)' }}>
            <div>
              <p className="ms-eyebrow" style={eyebrowStyle}>
                {sample.eyebrow}
              </p>
              <h1 className={cx('ms-title ms-serif mt-5', motionClass)}>{sample.headline}</h1>
              <p className="ms-body mt-6 max-w-[380px]" style={mutedStyle}>
                {subline}
              </p>
              <span className="ms-button mt-7" style={buttonStyle}>
                {sample.cta}
                <ArrowUpRight className="h-[1.05em] w-[1.05em]" />
              </span>
            </div>
            <img
              src={sample.heroImage}
              alt={`${businessName} sample hero`}
              className="w-full object-cover"
              style={{
                height: 'clamp(280px, 38cqw, 540px)',
                borderTopLeftRadius: 'clamp(90px, 18cqw, 260px)',
                borderTopRightRadius: 'clamp(90px, 18cqw, 260px)',
              }}
              loading="lazy"
            />
          </div>
        </section>
      ) : null}

      {template.layout === 'dark' ? (
        <section className="relative overflow-hidden">
          <img
            src={sample.heroImage}
            alt={`${businessName} sample hero`}
            className="h-[clamp(400px,48cqw,680px)] w-full object-cover"
            loading="lazy"
          />
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(180deg, rgba(14,15,14,0.45) 0%, rgba(14,15,14,0.92) 78%)' }}
          />
          <div className="ms-pad absolute inset-0 flex flex-col justify-end pb-[clamp(34px,4.8cqw,70px)]">
            <p className="ms-eyebrow" style={{ color: accent }}>
              {sample.eyebrow}
            </p>
            <h1 className={cx('ms-title mt-5 max-w-[820px]', fontClass, motionClass)} style={{ color: '#f4f3ec' }}>
              {sample.headline}
            </h1>
            <div className="mt-7 flex flex-wrap items-end justify-between gap-6">
              <p className="ms-body max-w-[400px]" style={{ color: 'rgba(244,243,236,0.68)' }}>
                {subline}
              </p>
              <span className="ms-button" style={buttonStyle}>
                {sample.cta}
                <ArrowUpRight className="h-[1.05em] w-[1.05em]" />
              </span>
            </div>
          </div>
        </section>
      ) : null}

      <section className="ms-section" style={{ borderTop: `1px solid ${palette.line}` }}>
        {OfferingsHeading}
        <div className="ms-pad mt-9">
          <div className="ms-grid-3">
            {sample.offerings.map((offering, index) => (
              <article key={offering.title} className="border-t pt-5" style={{ borderColor: palette.line }}>
                <p className="ms-small font-semibold uppercase tracking-[0.18em]" style={eyebrowStyle}>
                  0{index + 1}
                </p>
                <h3 className={cx('mt-4 text-[clamp(1.05rem,1.85cqw,1.6rem)]', fontClass)}>
                  {offering.title}
                </h3>
                <p className="ms-body mt-3" style={mutedStyle}>
                  {offering.blurb}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="ms-section" style={{ background: palette.surface }}>
        <div className="ms-pad">
          <div className="ms-feature-split">
            <img
              src={sample.secondaryImage}
              alt={`${businessName} detail`}
              className="w-full object-cover"
              style={{ height: 'clamp(250px, 26cqw, 390px)' }}
              loading="lazy"
            />
            <div>
              <p className="ms-eyebrow" style={eyebrowStyle}>
                The details
              </p>
              <h2 className={cx('ms-section-title mt-4', fontClass)}>Made to feel effortless.</h2>
              <p className="ms-body mt-5 max-w-[440px]" style={mutedStyle}>
                From the first impression to the final enquiry, every part of the experience is shaped
                to feel clear, calm and unmistakably yours.
              </p>
              <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2">
                {(capabilityItems.length ? capabilityItems : template.suites).map((item) => (
                  <span
                    key={item}
                    className="flex items-center gap-2 text-[clamp(0.68rem,0.92cqw,0.8rem)]"
                    style={mutedStyle}
                  >
                    <span className="h-1 w-1 rounded-full" style={{ background: accent }} />
                    {item}
                  </span>
                ))}
              </div>
              <span className="ms-button mt-7" style={buttonStyle}>
                {sample.cta}
                <ArrowUpRight className="h-[1.05em] w-[1.05em]" />
              </span>
            </div>
          </div>
        </div>
      </section>

      {capabilityItems.length && !showSuites ? (
        <section className="ms-section" style={{ borderTop: `1px solid ${palette.line}` }}>
          <div className="ms-pad flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="ms-eyebrow" style={eyebrowStyle}>
                Your configuration
              </p>
              <h2 className={cx('ms-section-title mt-3', fontClass)}>{capabilityHeading}</h2>
            </div>
            <p className="ms-small max-w-[280px]" style={mutedStyle}>
              Selected functionality appears as part of the final build.
            </p>
          </div>
          <div className="ms-pad mt-7">
            <div className="flex flex-wrap gap-2">
              {capabilityItems.map((item) => (
                <span
                  key={item}
                  className="rounded-full border px-3.5 py-2 text-[clamp(0.62rem,0.88cqw,0.78rem)]"
                  style={{ borderColor: palette.line, color: palette.ink }}
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="ms-section" style={{ borderTop: `1px solid ${palette.line}` }}>
        <div className="ms-pad">{Stats}</div>
      </section>

      <section className="ms-section ms-pad text-center" style={{ background: palette.surface }}>
        <p className={cx('ms-quote mx-auto max-w-[900px]', fontClass)}>“{sample.quote.text}”</p>
        <p className="ms-small mt-6 uppercase tracking-[0.18em]" style={mutedStyle}>
          {sample.quote.name}
        </p>
      </section>

      <section className="ms-pad" style={{ paddingBottom: 'clamp(36px, 5cqw, 76px)' }}>
        <div className="ms-gallery">
          {galleryImages.slice(0, 3).map((image, index) => (
            <img
              key={`${image}-${index}`}
              src={image}
              alt={`${businessName} gallery ${index + 1}`}
              className={cx(
                'w-full object-cover',
                index === 2 && 'ms-hide-sm',
              )}
              style={{ height: 'clamp(150px, 20cqw, 300px)' }}
              loading="lazy"
            />
          ))}
        </div>
      </section>

      <section
        className="ms-section ms-pad text-center"
        style={{ background: palette.accent, color: palette.accentInk }}
      >
        <p className="ms-eyebrow" style={{ opacity: 0.7 }}>
          {sample.eyebrow}
        </p>
        <h2 className={cx('ms-title-sm mx-auto mt-4 max-w-[700px]', fontClass)}>
          {sample.ctaTitle}
        </h2>
        <span
          className="ms-button mt-7"
          style={{ background: palette.accentInk, color: palette.accent }}
        >
          {sample.cta}
          <ArrowUpRight className="h-[1.05em] w-[1.05em]" />
        </span>
        {channels.length ? (
          <div className="mt-7 flex flex-wrap justify-center gap-2">
            {channels.slice(0, 5).map((channel) => (
              <span
                key={channel}
                className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.12em]"
                style={{ borderColor: 'currentColor', opacity: 0.75 }}
              >
                <ChannelIcon id={channel} className="h-3 w-3" />
                {channelLabel(channel)}
              </span>
            ))}
          </div>
        ) : null}
      </section>

      <footer style={{ background: palette.ink, color: palette.bg }}>
        <div className="ms-pad py-[clamp(28px,4cqw,58px)]">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className={cx('text-[clamp(1.2rem,2.4cqw,2rem)]', fontClass)}>{businessName}</p>
              <p className="ms-small mt-2" style={{ opacity: 0.55 }}>
                {sample.eyebrow}
              </p>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              {navItems.map((item) => (
                <span key={item} className="ms-nav-link" style={{ opacity: 0.65 }}>
                  {item}
                </span>
              ))}
              <span className="ms-nav-link" style={{ opacity: 0.65 }}>
                Contact
              </span>
            </div>
          </div>
          <div
            className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t pt-5"
            style={{ borderColor: 'rgba(255,255,255,0.14)' }}
          >
            <p className="ms-small" style={{ opacity: 0.45 }}>
              © 2026 {businessName}. Sample preview.
            </p>
            <p className="ms-small" style={{ opacity: 0.35 }}>
              Preview only · Imagery via Unsplash
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
