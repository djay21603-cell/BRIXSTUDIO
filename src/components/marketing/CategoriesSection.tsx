import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { categories } from '../../data/categories'
import { SectionHeading } from '../ui/SectionHeading'
import { Reveal } from '../ui/Reveal'
import { ButtonLink } from '../ui/Button'

export function CategoriesSection() {
  return (
    <section id="business-types" className="scroll-mt-24 py-20 sm:py-28">
      <div className="shell">
        <Reveal>
          <SectionHeading
            eyebrow="Business categories"
            title="Built for the business you actually run."
            description="A hotel is not a clinic. A café is not a consultancy. Start from the conventions your customers already understand, then make them unmistakably yours."
            action={
              <ButtonLink to="/business-types" variant="secondary" size="md">
                Explore all categories
                <ArrowUpRight className="h-4 w-4" />
              </ButtonLink>
            }
          />
        </Reveal>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category, index) => {
            const Icon = category.icon
            return (
              <Reveal key={category.id} delay={(index % 4) * 60}>
                <Link
                  to={`/business-types?category=${category.id}`}
                  className="group relative block overflow-hidden rounded-[18px] border border-ink/10 bg-card transition-colors duration-500 hover:border-clay/40"
                >
                  <div className="relative aspect-[4/5] overflow-hidden">
                    <img
                      src={category.image}
                      alt={category.name}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-bone/95 via-bone/35 to-transparent" />
                    <div className="absolute left-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-bone/80 text-ink backdrop-blur">
                      <Icon className="h-4 w-4" strokeWidth={1.7} />
                    </div>
                    <div className="absolute inset-x-4 bottom-4 text-ink">
                      <p className="text-[9.5px] font-bold uppercase tracking-[0.18em] text-ink/60">
                        {category.tagline}
                      </p>
                      <h3 className="mt-1.5 text-[19px] font-semibold leading-tight tracking-tight">
                        {category.name}
                      </h3>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3 px-4 py-4">
                    <p className="line-clamp-2 text-[11.5px] leading-relaxed text-ink/50">
                      {category.description}
                    </p>
                    <ArrowUpRight className="h-4 w-4 shrink-0 text-ink/30 transition-all duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-clay" />
                  </div>
                </Link>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
