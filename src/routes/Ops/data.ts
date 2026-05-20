/**
 * Seed data for the Operations dashboard. In production this would come
 * from the API. Kept here so every view can read consistent state through
 * `OpsContext`.
 */

import type { OpsPillTone } from './OpsPrimitives';

export type BookingStatus = 'scheduled' | 'enroute' | 'active' | 'closed' | 'cancelled';

export interface OpsBooking {
  id: string;          // "B-4019"
  date: string;        // "14 May"
  time: string;        // "9:00"
  unit: string;        // "1402"
  resident: string;    // "Ashcombe"
  service: string;     // "Window Service"
  serviceKey: string;  // "window"
  attendant: string;   // "Hudson & Co."
  status: BookingStatus;
  note?: string;
  duration?: string;
  price: number;
}

export type UnitKind = 'residential' | 'commercial';
export type UnitRole = 'owner' | 'tenant' | 'manager' | 'contact';

export interface OpsUnit {
  id: string;
  floor: string;
  resident: string;
  residentFull: string;
  email?: string;
  phone?: string;
  status: 'active' | 'paused';
  visits: number;
  since: string;
  kind: UnitKind;
  role?: UnitRole;
  notes?: string;
}

export const STATUS_LABEL: Record<BookingStatus, string> = {
  scheduled: 'Scheduled',
  enroute: 'En Route',
  active: 'In Progress',
  closed: 'Closed',
  cancelled: 'Cancelled',
};

export const STATUS_TONE: Record<BookingStatus, OpsPillTone> = {
  scheduled: 'info',
  enroute: 'warning',
  active: 'success',
  closed: 'neutral',
  cancelled: 'danger',
};

export const SEED_BOOKINGS: OpsBooking[] = [
  { id: 'B-4019', date: '14 May', time: '9:00',  unit: '1402',  resident: 'Ashcombe',    service: 'Window Service',   serviceKey: 'window',   attendant: 'Hudson & Co.',     status: 'scheduled', price: 240 },
  { id: 'B-4018', date: '14 May', time: '9:30',  unit: '0708',  resident: 'Okafor',      service: 'Deep Cleaning',    serviceKey: 'deep',     attendant: 'Marble & Linen',   status: 'scheduled', price: 320 },
  { id: 'B-4017', date: '14 May', time: '10:30', unit: '2104',  resident: 'Vance',       service: 'Window Service',   serviceKey: 'window',   attendant: 'Hudson & Co.',     status: 'scheduled', price: 240 },
  { id: 'B-4020', date: '14 May', time: '11:00', unit: '1801',  resident: 'Albright',    service: 'Handyman',         serviceKey: 'handy',    attendant: 'Hudson & Co.',     status: 'scheduled', price: 140 },
  { id: 'B-4016', date: '14 May', time: '8:45',  unit: 'PH-02', resident: 'Devereaux',   service: 'Landscaping',      serviceKey: 'garden',   attendant: 'Hollis Grounds',   status: 'enroute',   price: 220, note: 'Awaiting freight elevator' },
  { id: 'B-4015', date: '14 May', time: '9:15',  unit: '0512',  resident: 'Park',        service: 'Pressure Washing', serviceKey: 'pressure', attendant: 'Hudson & Co.',     status: 'enroute',   price: 180 },
  { id: 'B-4014', date: '14 May', time: '7:30',  unit: '1204',  resident: 'Castellanos', service: 'Deep Cleaning',    serviceKey: 'deep',     attendant: 'Marble & Linen',   status: 'active',    price: 320, duration: '2h 15m' },
  { id: 'B-4013', date: '14 May', time: '8:00',  unit: '0903',  resident: 'Whitfield',   service: 'Window Service',   serviceKey: 'window',   attendant: 'Hudson & Co.',     status: 'active',    price: 240, duration: '1h 45m' },
  { id: 'B-4012', date: '14 May', time: '7:00',  unit: '0203',  resident: 'Bellweather', service: 'Valet',            serviceKey: 'valet',    attendant: 'Doorman Services', status: 'closed',    price: 60 },
  { id: 'B-4011', date: '14 May', time: '6:00',  unit: '1606',  resident: 'Sato',        service: 'Window Service',   serviceKey: 'window',   attendant: 'Hudson & Co.',     status: 'closed',    price: 240 },
  { id: 'B-4010', date: '13 May', time: '15:30', unit: '0809',  resident: 'Hartwell',    service: 'Handyman',         serviceKey: 'handy',    attendant: 'Hudson & Co.',     status: 'closed',    price: 140 },
  { id: 'B-4009', date: '13 May', time: '11:00', unit: 'PH-03', resident: 'Montague',    service: 'Deep Cleaning',    serviceKey: 'deep',     attendant: 'Marble & Linen',   status: 'closed',    price: 320 },
  { id: 'B-4008', date: '13 May', time: '10:00', unit: '1107',  resident: 'Greaves',     service: 'Pressure Washing', serviceKey: 'pressure', attendant: 'Hudson & Co.',     status: 'cancelled', price: 180 },
];

export const SEED_UNITS: OpsUnit[] = [
  { id: 'PH-02', floor: 'Penthouse', resident: 'Devereaux, S.',  residentFull: 'Sarah Devereaux',    email: 'sdevereaux@example.com', phone: '+1 (212) 555 0142', status: 'active', visits: 42, since: '2021', kind: 'residential', role: 'owner' },
  { id: 'PH-03', floor: 'Penthouse', resident: 'Montague, R.',   residentFull: 'Rita Montague',      status: 'active', visits: 38, since: '2022', kind: 'residential', role: 'owner' },
  { id: '2104',  floor: '21',        resident: 'Vance, M. & C.', residentFull: 'Marcus & Clara Vance', status: 'active', visits: 24, since: '2024', kind: 'residential', role: 'owner' },
  { id: '1801',  floor: '18',        resident: 'Albright, J.',   residentFull: 'Julian Albright',    status: 'active', visits: 18, since: '2024', kind: 'residential', role: 'tenant' },
  { id: '1606',  floor: '16',        resident: 'Sato, K.',       residentFull: 'Kenji Sato',          status: 'active', visits: 31, since: '2022', kind: 'residential', role: 'owner' },
  { id: '1402',  floor: '14',        resident: 'Ashcombe, E.',   residentFull: 'Eleanor Ashcombe',    status: 'active', visits: 11, since: '2025', kind: 'residential', role: 'owner' },
  { id: '1204',  floor: '12',        resident: 'Castellanos, P.',residentFull: 'Paula Castellanos',   status: 'active', visits: 27, since: '2023', kind: 'residential', role: 'tenant' },
  { id: '1107',  floor: '11',        resident: 'Greaves, T.',    residentFull: 'Theodore Greaves',    status: 'paused', visits: 4,  since: '2026', kind: 'residential', role: 'owner' },
  { id: '0903',  floor: '9',         resident: 'Whitfield, A.',  residentFull: 'Anita Whitfield',     status: 'active', visits: 19, since: '2024', kind: 'residential', role: 'owner' },
  { id: '0809',  floor: '8',         resident: 'Hartwell, L.',   residentFull: 'Lewis Hartwell',      status: 'active', visits: 22, since: '2023', kind: 'residential', role: 'tenant' },
  { id: '0708',  floor: '7',         resident: 'Okafor, N.',     residentFull: 'Nia Okafor',          status: 'active', visits: 14, since: '2024', kind: 'residential', role: 'owner' },
  { id: '0512',  floor: '5',         resident: 'Park, H.',       residentFull: 'Hyun Park',           status: 'active', visits: 9,  since: '2025', kind: 'residential', role: 'tenant' },
  { id: 'C-01',  floor: 'Lobby',     resident: 'Arden Concierge', residentFull: 'Arden Concierge Desk', email: 'frontdesk@thearden.example', phone: '+1 (305) 555 0188', status: 'active', visits: 12, since: '2023', kind: 'commercial', role: 'manager' },
  { id: 'C-02',  floor: 'Ground',    resident: 'Arden Café',      residentFull: 'Arden Café & Bar',     email: 'cafe@thearden.example',     phone: '+1 (305) 555 0177', status: 'active', visits: 6,  since: '2024', kind: 'commercial', role: 'contact' },
];

export const ATTENDANTS = [
  'Hudson & Co.',
  'Marble & Linen',
  'Hollis Grounds',
  'Doorman Services',
  'Atelier Restoration',
];

export const SERVICES = [
  { key: 'window',   name: 'Window Service',   attendant: 'Hudson & Co.',     price: 240, cadence: 'Quarterly' },
  { key: 'deep',     name: 'Deep Cleaning',    attendant: 'Marble & Linen',   price: 320, cadence: 'Monthly' },
  { key: 'pressure', name: 'Pressure Washing', attendant: 'Hudson & Co.',     price: 180, cadence: 'Seasonal' },
  { key: 'handy',    name: 'Handyman',         attendant: 'Hudson & Co.',     price: 140, cadence: 'On request' },
  { key: 'valet',    name: 'Valet',            attendant: 'Doorman Services', price: 60,  cadence: 'Per visit' },
  { key: 'garden',   name: 'Landscaping',      attendant: 'Hollis Grounds',   price: 220, cadence: 'Monthly' },
];
