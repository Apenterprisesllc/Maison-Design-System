/**
 * Fictional buildings under Maison stewardship. Used in the landing
 * "Properties under stewardship" marquee. Replace with real partners
 * before launch.
 */

export interface Building {
  id: string;
  name: string;
  city: string;
}

export const BUILDINGS: Building[] = [
  { id: 'arden',     name: 'The Arden',         city: 'New York' },
  { id: 'beacon',    name: 'One Beacon Tower',  city: 'Boston' },
  { id: 'ashford',   name: 'The Ashford',       city: 'Chicago' },
  { id: 'meridian',  name: 'Meridian House',    city: 'Miami' },
  { id: 'kingsbury', name: 'Kingsbury Place',   city: 'San Francisco' },
  { id: 'devereaux', name: 'Devereaux & Co.',   city: 'Los Angeles' },
  { id: 'hartwell',  name: 'Hartwell Park',     city: 'Washington' },
  { id: 'crescent',  name: 'The Crescent',      city: 'Dallas' },
  { id: 'montague',  name: 'Montague Hall',     city: 'Seattle' },
  { id: 'whitfield', name: 'Whitfield Reserve', city: 'Atlanta' },
];
