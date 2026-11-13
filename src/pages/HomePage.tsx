import { Hero } from '../components/marketing/Hero'
import { CategoryMarquee } from '../components/marketing/CategoryMarquee'
import { ServicesSection } from '../components/marketing/ServicesSection'
import { FeaturedDesigns } from '../components/marketing/FeaturedDesigns'
import { CategoriesSection } from '../components/marketing/CategoriesSection'
import { WhyUsSection } from '../components/marketing/WhyUsSection'
import { ProcessSection } from '../components/marketing/ProcessSection'
import { FaqSection } from '../components/marketing/FaqSection'
import { ContactSection } from '../components/marketing/ContactSection'
import { usePageTitle } from '../hooks/usePageTitle'

export function HomePage() {
  usePageTitle('BRIX Studio — Premium websites for considered businesses')

  return (
    <>
      <Hero />
      <CategoryMarquee />
      <ServicesSection />
      <FeaturedDesigns />
      <CategoriesSection />
      <WhyUsSection />
      <ProcessSection />
      <FaqSection />
      <ContactSection />
    </>
  )
}
