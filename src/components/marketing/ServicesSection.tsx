import { ArrowUpRight } from 'lucide-react'
import { services } from '../../data/site'
import { SectionHeading } from '../ui/SectionHeading'
import { Reveal } from '../ui/Reveal'

export function ServicesSection() {
  return (
    <section id="services" className="scroll-mt-24 py-20 sm:py-28">
      <div className="shell">
        <Reveal>
          <SectionHeading
            eyebrow="Our services"
            title={
              <>
                Everything your site needs.
                <br />
                Nothing it doesn’t.
              </>
            }
            description="A focused studio practice covering strategy, design, build and the handover after launch. No bloated retainers, no mystery process."
          />
        </Reveal>

        <div className="mt-14 grid gap-px overflow-hidden rounded-[20px] border border-ink/10 bg-ink/10 md:grid-cols-2">
          {services.map((service, index) => (
            <Reveal key={service.title} delay={index * 70} className="bg-bone">
              <article className="group relative h-full bg-card/50 p-7 transition-colors duration-500 hover:bg-card sm:p-9">
                <div className="flex items-start justify-between">
                  <span className="display text-[38px] leading-none text-ink/20 transition-colors duration-500 group-hover:text-clay">
                    0{index + 1}
                  </span>
                  <ArrowUpRight className="h-5 w-5 text-ink/20 transition-all duration-500 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-clay" />
                </div>
                <h3 className="mt-10 text-[22px] font-semibold tracking-tight text-ink">{service.title}</h3>
                <p className="mt-3 max-w-sm text-[13.5px] leading-relaxed text-ink/55">
                  {service.description}
                </p>
                <div className="mt-7 flex flex-wrap gap-2">
                  {service.items.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-ink/12 px-3 py-1.5 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink/45"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
