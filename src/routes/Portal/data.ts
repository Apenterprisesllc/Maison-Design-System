import type { Service } from './types';

export const CATALOGUE: Service[] = [
  { id: 'window',   name: 'Window Service',   kicker: 'Glazing',      icon: 'panel-top',  tone: 'ink',   price: 240, cadence: 'Quarterly',  description: 'Interior and exterior cleaning, including hardware polish on operable windows.' },
  { id: 'deep',     name: 'Deep Cleaning',    kicker: 'Housekeeping', icon: 'sparkles',   tone: 'stone', price: 320, cadence: 'Monthly',    description: 'A full residence clean by a two-person team. Linens included on request.' },
  { id: 'pressure', name: 'Pressure Washing', kicker: 'Exterior',     icon: 'droplets',   tone: 'ink',   price: 180, cadence: 'Seasonal',   description: 'Balcony, terrace, and entryway. Restorative for stone and tile surfaces.' },
  { id: 'handy',    name: 'Handyman',         kicker: 'Carpentry',    icon: 'wrench',     tone: 'wood',  price: 140, cadence: 'On request', description: 'Small repairs, hanging, and adjustments. Materials billed at cost.' },
  { id: 'valet',    name: 'Valet',            kicker: 'Front Door',   icon: 'car-front',  tone: 'ink',   price: 60,  cadence: 'Per visit',  description: 'Drop-off and retrieval at the building\'s covered entry. Standard or extended hold.' },
  { id: 'garden',   name: 'Landscaping',      kicker: 'Grounds',      icon: 'flower-2',   tone: 'stone', price: 220, cadence: 'Monthly',    description: 'Pruning, trimming, and bed maintenance for private terraces and patios.' },
];
