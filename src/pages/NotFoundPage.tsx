import { ArrowLeft } from 'lucide-react'
import { usePageTitle } from '../hooks/usePageTitle'
import { ButtonLink } from '../components/ui/Button'

export function NotFoundPage() {
  usePageTitle('Page not found — BRIX Studio')

  return (
    <section className="shell flex min-h-[60vh] flex-col items-start justify-center py-24">
      <p className="eyebrow text-clay">
        <span className="h-px w-6 bg-clay" aria-hidden="true" />
        404
      </p>
      <h1 className="display mt-6 max-w-[700px] text-[clamp(3rem,6vw,5.5rem)] text-ink">
        This page is still being designed.
      </h1>
      <p className="mt-5 max-w-md text-[14px] leading-relaxed text-ink/55">
        The page you were looking for does not exist. Start from the studio homepage or go straight
        into the project builder.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <ButtonLink to="/" size="md">
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </ButtonLink>
        <ButtonLink to="/start" variant="secondary" size="md">
          Start a project
        </ButtonLink>
      </div>
    </section>
  )
}
