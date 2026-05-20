import type { PillTone } from '../../components';

export type ClientTrack = 'residential' | 'commercial';

export interface Resident {
  building: string;
  residence: string;
  name: string;
  track: ClientTrack;
}

export type ServiceTone = 'ink' | 'stone' | 'wood';

export interface Service {
  id: string;
  name: string;
  kicker: string;
  icon: string;
  tone: ServiceTone;
  price: number;
  cadence: string;
  description: string;
}

export interface TimeSlot {
  id: string;
  label: string;
  disabled?: boolean;
}

export interface BookingDraft {
  service: Service;
  date: Date;
  time: string;
  note: string;
}

export type BookingStatus = 'confirmed' | 'closed' | 'cancelled';

export interface BookingRecord {
  id: string;
  serviceId: string;
  kind: 'upcoming' | 'past';
  date: string; // ISO date for sorting / ICS
  dateLabel: string;
  time: string;
  serviceKicker: string;
  serviceName: string;
  attendant: string;
  price: number;
  status: string;
  statusKey: BookingStatus;
  statusTone: PillTone;
  note?: string;
}
