import { categories } from '../../data/categories'

export function CategoryMarquee() {
  return (
    <div className="relative overflow-hidden border-y border-ink/10 bg-ink-soft py-4 text-ink">
      <p className="sr-only">
        We design for hotels, restaurants, corporate businesses, clinics, salons, real estate,
        e-commerce and other small businesses.
      </p>
      <div className="flex w-max animate-marquee items-center" aria-hidden="true">
        {[0, 1].map((group) => (
          <div key={group} className="flex shrink-0 items-center">
            {categories.map((category) => (
              <span
                key={`${group}-${category.id}`}
                className="flex items-center gap-6 px-8 text-[11px] font-semibold uppercase tracking-[0.24em] text-ink/50"
              >
                {category.name}
                <span className="h-1 w-1 rounded-full bg-clay" />
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
