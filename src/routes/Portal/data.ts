import type { ClientTrack, Service } from './types';

export const RESIDENTIAL_CATALOGUE: Service[] = [
  { id: 'deep',          name: 'Deep Cleaning',       kicker: 'Housekeeping', icon: 'sparkles',     tone: 'stone', price: 320, cadence: 'Monthly',    description: 'A full residence clean by a two-person team. Linens included on request.' },
  { id: 'housekeeping',  name: 'Housekeeping',        kicker: 'Weekly Care',  icon: 'broom',        tone: 'ink',   price: 180, cadence: 'Weekly',     description: 'Standing weekly visit. Floors, baths, kitchen, and surface dressing — quiet, attentive, complete.' },
  { id: 'marble',        name: 'Marble Polishing',    kicker: 'Stone Care',   icon: 'gem',          tone: 'wood',  price: 420, cadence: 'On request', description: 'Diamond polishing for marble, travertine, and limestone. Restores the finish without aggressive grinding.' },
  { id: 'window',        name: 'Window Service',      kicker: 'Glazing',      icon: 'panel-top',    tone: 'ink',   price: 240, cadence: 'Quarterly',  description: 'Interior and exterior cleaning, including hardware polish on operable windows.' },
  { id: 'disinfecting',  name: 'Disinfecting',        kicker: 'Sanitation',   icon: 'shield-check', tone: 'stone', price: 220, cadence: 'On request', description: 'Hospital-grade disinfecting for high-touch surfaces, kitchens, and shared baths.' },
  { id: 'moveinout',     name: 'Move-In / Move-Out',  kicker: 'Turnover',     icon: 'key-round',    tone: 'wood',  price: 380, cadence: 'Once',       description: 'Full residence turnover — appliances, cabinetry interiors, and floor finishing. Ready for the next chapter.' },
];

export const COMMERCIAL_CATALOGUE: Service[] = [
  { id: 'post-construction', name: 'Post-Construction',     kicker: 'Punch List',      icon: 'construction', tone: 'wood',  price: 620, cadence: 'Project-based', description: 'Final clean after build-out — dust pull, debris haul, fixture polish. Ready for the certificate of occupancy.' },
  { id: 'office-night',      name: 'After-Hours Office',    kicker: 'Nightly',         icon: 'building-2',   tone: 'ink',   price: 290, cadence: 'Nightly',       description: 'Discreet overnight crews. Desks, glass, breakrooms, restrooms — the floor reset by 6 a.m.' },
  { id: 'restaurant-night',  name: 'After-Hours Restaurant',kicker: 'Hospitality',     icon: 'utensils',     tone: 'wood',  price: 340, cadence: 'Nightly',       description: 'Front-of-house, line, and back-of-house. Grease, glass, floors — sanitized before doors open.' },
  { id: 'commercial',        name: 'Commercial Cleaning',   kicker: 'Standing',        icon: 'briefcase',    tone: 'ink',   price: 240, cadence: 'Weekly',        description: 'Weekly standing service for offices, showrooms, and lobbies. One point of contact, one consistent crew.' },
  { id: 'epoxy',             name: 'Epoxy Floor Service',   kicker: 'Floor Coating',   icon: 'layers',       tone: 'stone', price: 980, cadence: 'On request',    description: 'Industrial epoxy installation and restoration for garages, warehouses, and back-of-house. Cured and ready in 48 hours.' },
  { id: 'events',            name: 'Events Cleaning',       kicker: 'Pre / Post',      icon: 'party-popper', tone: 'wood',  price: 460, cadence: 'Per event',     description: 'Pre-event setup polish and post-event reset. Banquet halls, galleries, rooftops — out by load-out.' },
  { id: 'real-estate',       name: 'Real Estate Turnover',  kicker: 'Listings',        icon: 'home',         tone: 'stone', price: 360, cadence: 'Per listing',   description: 'Listing prep and post-closing reset. Photo-ready in a single visit; Airbnb turns included.' },
];

export function getCatalogueFor(track: ClientTrack): Service[] {
  return track === 'commercial' ? COMMERCIAL_CATALOGUE : RESIDENTIAL_CATALOGUE;
}

/** Convenience union for legacy consumers — both lists flattened. */
export const CATALOGUE: Service[] = [...RESIDENTIAL_CATALOGUE, ...COMMERCIAL_CATALOGUE];
