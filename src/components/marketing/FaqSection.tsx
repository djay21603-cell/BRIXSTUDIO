import { useState } from 'react'
import { ArrowUpRight, ChevronDown, Mail } from 'lucide-react'
import { site } from '../../data/site'
import { ButtonLink } from '../ui/Button'
import { Reveal } from '../ui/Reveal'
import { cx } from '../../lib/cx'

const faqs = [
  {
    question: 'How does the quotation process work?',
    answer:
      'Build your brief in the project builder or send a short inquiry. We review the scope, reply with any questions, then send a written quotation that lists the pages, features, timeline and payment terms. Nothing is payable on this website, and you are not committed until you approve the quotation in writing.',
  },
  {
    question: 'How much does a website cost?',
    answer:
      'Every project is quoted from its actual scope, so there is no fixed price list. A single-page launch site and a multi-page hotel site involve very different work. The written quotation states the total cost, what is included and what is not, before any work begins.',
  },
  {
    question: 'How long does a project take?',
    answer:
      'Timing depends on the number of pages, how ready your content is and how quickly feedback rounds move. Your quotation includes a proposed schedule, and we only commit to dates we can hold. If your launch date is fixed, tell us early so we can plan around it.',
  },
  {
    question: 'Do I need to have content and photos ready?',
    answer:
      'No. Many projects start with a logo, an existing site and some rough notes. We can structure the messaging and direct the photography as part of the scope. If you already have copy and images, we work with them and refine what is needed.',
  },
  {
    question: 'Can I keep my existing domain and branding?',
    answer:
      'Yes. Your domain stays in your name and we connect it when the site is ready. If you have brand assets, upload your logo in the builder or share a link. If the branding needs work, that can be included in the quotation as a separate scope.',
  },
  {
    question: 'What happens after I submit a brief?',
    answer:
      'Your inquiry is saved in the studio system and emailed to us, and you receive an automatic confirmation at the address you provide. We then reply by email with questions or a written quotation. You can ask for changes to the brief at any point before approving.',
  },
  {
    question: 'How many revisions are included?',
    answer:
      'Each quotation includes defined design and build review rounds, listed clearly. If the direction changes beyond those rounds, we quote the additional work before starting it, so there are no surprise invoices.',
  },
  {
    question: 'Can you look after the site after launch?',
    answer:
      'Yes, as an optional care arrangement. You always keep ownership of your domain, content and accounts. Ongoing updates, monitoring or content changes can be agreed after launch — there is no lock-in and no requirement to continue with us.',
  },
]

export function FaqSection() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <section id="faq" className="relative scroll-mt-24 overflow-hidden py-20 sm:py-28">
      <div className="pointer-events-none absolute inset-0 blueprint opacity-30" />
      <div className="shell relative grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
        <Reveal>
          <p className="eyebrow text-clay">
            <span className="h-px w-6 bg-clay" aria-hidden="true" />
            Questions
          </p>
          <h2 className="display mt-6 max-w-[460px] text-[clamp(2.4rem,4.4vw,4rem)] text-ink">
            Clear answers before you commit.
          </h2>
          <p className="mt-5 max-w-md text-[13.5px] leading-relaxed text-ink/55">
            How quotations work, what we need from you, and what happens after launch. If your
            question is not here, ask us directly — you will get a real reply from the studio.
          </p>

          <div className="mt-9 rounded-[22px] border border-ink/10 bg-card/70 p-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-ink/35">
              Quotation request
            </p>
            <p className="display mt-3 text-[24px] leading-tight text-ink">
              Get a written scope and fixed quote.
            </p>
            <ol className="mt-5 space-y-3">
              {[
                'Build your brief — design, pages, features and contact details.',
                'We review it and reply with questions if anything is unclear.',
                'You receive a written quotation with scope, timeline and price.',
              ].map((step, index) => (
                <li key={step} className="flex gap-3 text-[12px] leading-relaxed text-ink/55">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-ink/12 text-[10px] font-bold text-ink/45">
                    {index + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <ButtonLink to="/start" size="sm">
                Build your brief
                <ArrowUpRight className="h-3.5 w-3.5" />
              </ButtonLink>
              <a
                href={`mailto:${site.email}`}
                className="inline-flex items-center gap-2 text-[12px] font-semibold text-ink/60 underline decoration-ink/20 underline-offset-4 transition-colors hover:text-ink"
              >
                <Mail className="h-3.5 w-3.5" />
                {site.email}
              </a>
            </div>
            <p className="mt-4 text-[10.5px] leading-relaxed text-ink/35">
              No payment is taken on this website. You approve the quotation before any work starts.
            </p>
          </div>
        </Reveal>

        <Reveal delay={80}>
          <div className="divide-y divide-ink/10 rounded-[22px] border border-ink/10 bg-ink/[0.03]">
            {faqs.map((faq, index) => {
              const isOpen = open === index
              return (
                <div key={faq.question}>
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : index)}
                    aria-expanded={isOpen}
                    aria-controls={`faq-panel-${index}`}
                    className="flex w-full items-center justify-between gap-6 px-5 py-5 text-left transition-colors hover:bg-ink/[0.03] sm:px-6"
                  >
                    <span className="text-[13.5px] font-semibold text-ink">{faq.question}</span>
                    <ChevronDown
                      className={cx(
                        'h-4 w-4 shrink-0 text-ink/40 transition-transform duration-300',
                        isOpen && 'rotate-180 text-clay',
                      )}
                      aria-hidden="true"
                    />
                  </button>
                  {isOpen ? (
                    <div id={`faq-panel-${index}`} className="px-5 pb-5 sm:px-6">
                      <p className="max-w-[62ch] text-[12.5px] leading-relaxed text-ink/55">
                        {faq.answer}
                      </p>
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>
        </Reveal>
      </div>
    </section>
  )
}
