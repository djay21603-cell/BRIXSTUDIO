import {
  Building2,
  Hotel,
  House,
  Scissors,
  ShoppingBag,
  Stethoscope,
  Store,
  Utensils,
} from 'lucide-react'
import type { BusinessCategory } from '../types'

export const categories: BusinessCategory[] = [
  {
    id: 'hotel',
    name: 'Hotels & Resorts',
    shortName: 'Hotels',
    tagline: 'Atmosphere you can almost feel',
    description:
      'Immersive resort and boutique hotel sites that sell the feeling of being there, then make booking effortless.',
    image: '/images/hotel.jpg',
    icon: Hotel,
    sample: {
      brand: 'Aurelia Bay',
      eyebrow: 'Boutique resort · Northern coast',
      headline: 'Where the shoreline slows time.',
      subline:
        'A barefoot-luxury retreat built for long lunches, late swims and nowhere else to be.',
      cta: 'Reserve your stay',
      nav: ['Suites', 'Dining', 'Experiences', 'Journal'],
      offerings: [
        { title: 'Suites & villas', blurb: 'Textural rooms that open straight onto the water.' },
        { title: 'Sea-to-table dining', blurb: 'A daily menu shaped by the morning’s catch.' },
        { title: 'Island days', blurb: 'Private boat trips, reef swims and sunset suppers.' },
      ],
      stats: [
        { value: '24', label: 'Suites & villas' },
        { value: '2', label: 'Restaurants' },
        { value: '14', label: 'Curated experiences' },
      ],
      quote: {
        text: 'The kind of place where you stop checking the time by the second afternoon.',
        name: 'Sample guest note',
      },
      heroImage: '/images/hotel.jpg',
      secondaryImage: '/images/room.jpg',
      ctaTitle: 'Stay a little longer.',
    },
  },
  {
    id: 'restaurant',
    name: 'Restaurants & Cafés',
    shortName: 'Food & drink',
    tagline: 'Appetite, atmosphere, reservations',
    description:
      'Menus, stories and reservation flows that feel as considered as the room you are inviting people into.',
    image: '/images/restaurant.jpg',
    icon: Utensils,
    sample: {
      brand: 'Casa Verde',
      eyebrow: 'Neighbourhood kitchen · Open evenings',
      headline: 'Seasonal plates, unhurried evenings.',
      subline:
        'Local produce, quiet confidence and a table that is yours for the night.',
      cta: 'Book a table',
      nav: ['Menu', 'Our story', 'Events', 'Reservations'],
      offerings: [
        { title: 'The evening menu', blurb: 'Six courses that follow the market, not a calendar.' },
        { title: 'Natural wine', blurb: 'Small growers, low intervention, poured with care.' },
        { title: 'Private dining', blurb: 'A long table for the occasions that matter.' },
      ],
      stats: [
        { value: '6', label: 'Course tasting' },
        { value: '40', label: 'Seats' },
        { value: '5', label: 'Nights a week' },
      ],
      quote: {
        text: 'A room that hums quietly — and food worth putting your phone away for.',
        name: 'Sample review',
      },
      heroImage: '/images/restaurant.jpg',
      secondaryImage: '/images/food.jpg',
      ctaTitle: 'Your table is waiting.',
    },
  },
  {
    id: 'corporate',
    name: 'Corporate Businesses',
    shortName: 'Corporate',
    tagline: 'Clarity that earns confidence',
    description:
      'Structured, credible sites for advisory firms, agencies and companies that need to communicate with precision.',
    image: '/images/corporate.jpg',
    icon: Building2,
    sample: {
      brand: 'Northbridge',
      eyebrow: 'Advisory · Strategy & operations',
      headline: 'Clarity for complex decisions.',
      subline:
        'We help growing companies find focus, structure and momentum — without adding noise.',
      cta: 'Book a consultation',
      nav: ['Services', 'Insights', 'About', 'Contact'],
      offerings: [
        { title: 'Strategy & advisory', blurb: 'A sharper view of where to play and how to win.' },
        { title: 'Operating models', blurb: 'Structures that make good intentions actually work.' },
        { title: 'Market entry', blurb: 'A measured path into new categories and regions.' },
      ],
      stats: [
        { value: '18', label: 'Years advising' },
        { value: '120+', label: 'Engagements' },
        { value: '6', label: 'Markets' },
      ],
      quote: {
        text: 'Rigorous thinking, delivered without theatre — and with a clear next step.',
        name: 'Sample client note',
      },
      heroImage: '/images/corporate.jpg',
      secondaryImage: '/images/general.jpg',
      ctaTitle: 'Start with a conversation.',
    },
  },
  {
    id: 'clinic',
    name: 'Clinics & Healthcare',
    shortName: 'Healthcare',
    tagline: 'Calm, credible care',
    description:
      'Trust-building healthcare sites with clear services, gentle tone and appointment booking that respects people’s time.',
    image: '/images/clinic.jpg',
    icon: Stethoscope,
    sample: {
      brand: 'Luma Health',
      eyebrow: 'Primary care · Family practice',
      headline: 'Care that begins with listening.',
      subline:
        'Unhurried appointments and a plan that fits your life — from a team that remembers your name.',
      cta: 'Book an appointment',
      nav: ['Services', 'Our team', 'Patients', 'Book'],
      offerings: [
        { title: 'Primary care', blurb: 'A steady home base for everyday health.' },
        { title: 'Preventive screening', blurb: 'Thoughtful checks before problems start.' },
        { title: 'Family health', blurb: 'Care for every stage, under one roof.' },
      ],
      stats: [
        { value: '30min', label: 'Standard visit' },
        { value: '7', label: 'Practitioners' },
        { value: '6', label: 'Days a week' },
      ],
      quote: {
        text: 'The first clinic where I did not feel like a number in a queue.',
        name: 'Sample patient note',
      },
      heroImage: '/images/clinic.jpg',
      secondaryImage: '/images/spa.jpg',
      ctaTitle: 'Make time for your health.',
    },
  },
  {
    id: 'salon',
    name: 'Salons & Spas',
    shortName: 'Beauty & wellness',
    tagline: 'Ritual, not routine',
    description:
      'Serene, sensory sites for salons and spas with service menus, team profiles and simple online booking.',
    image: '/images/salon.jpg',
    icon: Scissors,
    sample: {
      brand: 'Maison Aurelle',
      eyebrow: 'Hair · Skin · Nails',
      headline: 'A quieter kind of luxury.',
      subline:
        'Considered hair, skin and nail rituals in a calm, light-filled studio.',
      cta: 'Book a ritual',
      nav: ['Services', 'Team', 'Gallery', 'Book'],
      offerings: [
        { title: 'Hair studio', blurb: 'Precision cutting and colour with a soft finish.' },
        { title: 'Skin rituals', blurb: 'Results-led facials in a low-stimulation room.' },
        { title: 'Nail bar', blurb: 'Immaculate detail, without the rush.' },
      ],
      stats: [
        { value: '9', label: 'Specialists' },
        { value: '4', label: 'Treatment rooms' },
        { value: '90min', label: 'Signature ritual' },
      ],
      quote: {
        text: 'I leave feeling like the best version of myself, every single time.',
        name: 'Sample client note',
      },
      heroImage: '/images/salon.jpg',
      secondaryImage: '/images/spa.jpg',
      ctaTitle: 'Take an hour for yourself.',
    },
  },
  {
    id: 'realestate',
    name: 'Real Estate',
    shortName: 'Real estate',
    tagline: 'Property, presented properly',
    description:
      'Listing-led sites that let architecture breathe, with strong search, enquiry flows and agent credibility.',
    image: '/images/realestate.jpg',
    icon: House,
    sample: {
      brand: 'Haven & Stone',
      eyebrow: 'Architect-led homes · City & coast',
      headline: 'Spaces that feel like yours.',
      subline:
        'Thoughtful homes and attentive representation, from the first viewing to the final key.',
      cta: 'Browse listings',
      nav: ['Listings', 'Buy', 'Sell', 'About'],
      offerings: [
        { title: 'Featured residences', blurb: 'A tightly edited collection, never a wall of noise.' },
        { title: 'Buyer advisory', blurb: 'Independent guidance through every decision.' },
        { title: 'Seller strategy', blurb: 'Positioning, presentation and a calm process.' },
      ],
      stats: [
        { value: '32', label: 'Active listings' },
        { value: '11', label: 'Years in market' },
        { value: '96%', label: 'Asking achieved' },
      ],
      quote: {
        text: 'They understood the house before they tried to sell it to us.',
        name: 'Sample buyer note',
      },
      heroImage: '/images/realestate.jpg',
      secondaryImage: '/images/interior.jpg',
      ctaTitle: 'Find your next address.',
    },
  },
  {
    id: 'ecommerce',
    name: 'E-commerce',
    shortName: 'E-commerce',
    tagline: 'Browsing that becomes buying',
    description:
      'Product-first storefronts with confident photography, clear collections and a checkout path without friction.',
    image: '/images/ecommerce.jpg',
    icon: ShoppingBag,
    sample: {
      brand: 'Field & Form',
      eyebrow: 'Homeware · Small batch',
      headline: 'Objects made to be kept.',
      subline:
        'Small-batch homeware and everyday essentials from makers who care about the details.',
      cta: 'Shop the collection',
      nav: ['Shop', 'Collections', 'Journal', 'Cart'],
      offerings: [
        { title: 'New arrivals', blurb: 'A short list of pieces worth making room for.' },
        { title: 'Everyday essentials', blurb: 'Quiet design for daily rituals.' },
        { title: 'The gift edit', blurb: 'Considered things, wrapped and ready.' },
      ],
      stats: [
        { value: '180', label: 'Pieces' },
        { value: '24', label: 'Makers' },
        { value: '2yr', label: 'Repair promise' },
      ],
      quote: {
        text: 'Everything arrives feeling like it was chosen, not shipped.',
        name: 'Sample customer note',
      },
      heroImage: '/images/ecommerce.jpg',
      secondaryImage: '/images/interior.jpg',
      ctaTitle: 'A few good things.',
    },
  },
  {
    id: 'general',
    name: 'Other Small Businesses',
    shortName: 'Small business',
    tagline: 'A home for your best work',
    description:
      'Flexible, characterful sites for studios, consultants, local services and businesses still writing their own category.',
    image: '/images/general.jpg',
    icon: Store,
    sample: {
      brand: 'Meridian Works',
      eyebrow: 'Studio & workspace',
      headline: 'Built for the way you work.',
      subline:
        'A flexible studio for teams who want a better place to think, make and meet.',
      cta: 'Plan a visit',
      nav: ['Studio', 'Services', 'Work', 'Contact'],
      offerings: [
        { title: 'Private studios', blurb: 'Daylight, quiet and a door that closes.' },
        { title: 'Meeting rooms', blurb: 'Spaces that make a good conversation easier.' },
        { title: 'Memberships', blurb: 'Flexible access without the corporate gloss.' },
      ],
      stats: [
        { value: '1200', label: 'Square metres' },
        { value: '38', label: 'Studios' },
        { value: '6', label: 'Meeting rooms' },
      ],
      quote: {
        text: 'The space quietly changes the quality of the work we do.',
        name: 'Sample member note',
      },
      heroImage: '/images/general.jpg',
      secondaryImage: '/images/corporate.jpg',
      ctaTitle: 'Come see the space.',
    },
  },
]

export function getCategory(id: string | null) {
  return categories.find((category) => category.id === id) ?? null
}
