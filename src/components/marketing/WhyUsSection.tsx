import { ArrowUpRight } from 'lucide-react'
import { whyUs } from '../../data/site'
import { Reveal } from '../ui/Reveal'
import { ButtonLink } from '../ui/Button'

export function WhyUsSection() {
  return (
    <section id="why-us" className="relative scroll-mt-24 overflow-hidden border-y border-ink/10 bg-ink-soft py-20 text-ink sm:py-28">
      <div className="pointer-events-none absolute -left-32 top-10 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(56,107,255,0.26),transparent_68%)]" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-[380px] w-[380px] rounded-full bg-[radial-gradient(circle,rgba(129,87,245,0.18),transparent_70%)]" />
      <div className="pointer-events-none absolute right-0 top-0 h-full w-1/2 blueprint opacity-[0.18]" />
      <div className="shell relative">
        <div className="grid gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
          <div>
            <Reveal>
              <p className="eyebrow text-ink/45">
                <span className="h-px w-6 bg-ink/25" aria-hidden="true" />
                Why choose us
              </p>
              <h2 className="display mt-6 text-[clamp(2.5rem,4.6vw,4.3rem)] text-ink">
                Considered work,
                <br />
                without the drama.
              </h2>
              <p className="mt-6 max-w-sm text-[14px] leading-relaxed text-ink/55">
                You are not buying a template. You are buying a clear visual point of view, a
                dependable build and a studio that answers its email.
              </p>
              <div className="mt-9">
                <ButtonLink to="/start" variant="inverse" size="md">
                  Start with your brief
                  <ArrowUpRight className="h-4 w-4" />
                </ButtonLink>
              </div>
              <div className="mt-14 hidden border-t border-ink/10 pt-6 lg:block">
                <p className="display text-[58px] leading-none text-ink/10">BRIX</p>
                <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-ink/30">
                  Design · Build · Launch
                </p>
              </div>
            </Reveal>
          </div>

          <div>
            {whyUs.map((item, index) => (
              <Reveal key={item.title} delay={index * 50}>
                <div className="group grid gap-3 border-t border-ink/10 py-6 sm:grid-cols-[44px_1fr] sm:gap-6">
                  <span className="text-[10px] font-semibold tracking-[0.16em] text-ink/30">
                    0{index + 1}
                  </span>
                  <div>
                    <h3 className="text-[17px] font-semibold tracking-tight text-ink transition-colors duration-300 group-hover:text-cyan">
                      {item.title}
                    </h3>
                    <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-ink/50">
                      {item.description}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
