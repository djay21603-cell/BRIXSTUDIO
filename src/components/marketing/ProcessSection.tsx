import { ArrowRight } from 'lucide-react'
import { processSteps } from '../../data/site'
import { SectionHeading } from '../ui/SectionHeading'
import { Reveal } from '../ui/Reveal'
import { ButtonLink } from '../ui/Button'

export function ProcessSection() {
  return (
    <section id="process" className="scroll-mt-24 py-20 sm:py-28">
      <div className="shell">
        <Reveal>
          <SectionHeading
            eyebrow="Development process"
            title="From first direction to final handover."
            description="A short, visible process. You always know what is happening, what is next and what we need from you."
          />
        </Reveal>

        <div className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {processSteps.map((step, index) => (
            <Reveal key={step.number} delay={index * 70}>
              <div className="group relative h-full border-t border-ink/20 pt-6">
                <div className="flex items-center justify-between">
                  <span className="display text-[52px] leading-none text-ink/15 transition-colors duration-500 group-hover:text-clay/40">
                    {step.number}
                  </span>
                  {index < processSteps.length - 1 ? (
                    <ArrowRight className="h-4 w-4 text-ink/20 transition-transform duration-500 group-hover:translate-x-1" />
                  ) : null}
                </div>
                <h3 className="mt-8 text-[17px] font-semibold tracking-tight text-ink">{step.title}</h3>
                <p className="mt-3 text-[13px] leading-relaxed text-ink/55">{step.description}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={120}>
          <div className="mt-16 flex flex-col items-start justify-between gap-5 rounded-2xl border border-ink/10 bg-cream/60 px-6 py-6 sm:flex-row sm:items-center sm:px-8">
            <div>
              <p className="text-[15px] font-semibold text-ink">Ready to choose a direction?</p>
              <p className="mt-1 text-[12.5px] text-ink/50">
                The builder takes about ten minutes. Your progress saves on this device.
              </p>
            </div>
            <ButtonLink to="/start" size="md">
              Open the project builder
              <ArrowRight className="h-4 w-4" />
            </ButtonLink>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
