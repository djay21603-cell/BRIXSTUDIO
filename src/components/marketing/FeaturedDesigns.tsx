import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { getTemplate, templates } from '../../data/templates'
import { SectionHeading } from '../ui/SectionHeading'
import { Reveal } from '../ui/Reveal'
import { ButtonLink } from '../ui/Button'
import { TemplateCard, TemplateDemoModal } from '../templates/TemplateCard'
import type { WebsiteTemplate } from '../../types'

const featured = ['grand-maison', 'studio-bold', 'nocturne']
  .map((id) => getTemplate(id))
  .filter((template): template is WebsiteTemplate => Boolean(template))

export function FeaturedDesigns() {
  const [preview, setPreview] = useState<WebsiteTemplate | null>(null)

  return (
    <section id="designs" className="relative scroll-mt-24 overflow-hidden border-y border-ink/10 bg-cream/40 py-20 sm:py-28">
      <div className="pointer-events-none absolute -right-40 top-0 h-[460px] w-[460px] rounded-full bg-violet/10 blur-3xl" />
      <div className="shell relative">
        <Reveal>
          <SectionHeading
            eyebrow="Website design portfolio"
            title="A direction for every kind of business."
            description="Eight fully realised design directions — from editorial luxury to dark modern. Preview each one, then make it yours."
            action={
              <ButtonLink to="/designs" variant="secondary" size="md">
                View all {templates.length} designs
                <ArrowRight className="h-4 w-4" />
              </ButtonLink>
            }
          />
        </Reveal>

        <div className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {featured.map((template, index) => (
            <Reveal key={template.id} delay={index * 80}>
              <TemplateCard template={template} onPreview={setPreview} />
            </Reveal>
          ))}
        </div>

        <p className="mt-8 text-[11.5px] text-ink/40">
          Sample directions shown with placeholder brands and photography. Your site is built around
          your content.
        </p>
      </div>
      <TemplateDemoModal template={preview} open={Boolean(preview)} onClose={() => setPreview(null)} />
    </section>
  )
}
