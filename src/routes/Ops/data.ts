/**
 * Type definitions for the Operations dashboard. The actual rows come from
 * Supabase via `OpsContext` (see `src/lib/api/bookings.ts` / `units.ts`).
 */

import type { OpsPillTone } from './OpsPrimitives';

export type BookingStatus = 'scheduled' | 'enroute' | 'active' | 'closed' | 'cancelled';

export interface OpsBooking {
  id: string;          // uuid — stable key for drag-drop / drawer lookup
  reference: string;   // "B-4019" — human-readable
  date: string;        // "14 May"
  time: string;        // "9:00"
  unit: string;        // "1402" external_id
  resident: string;    // "Ashcombe"
  service: string;     // "Window Service"
  serviceKey: string;  // service slug
  attendant: string;   // "Hudson & Co."
  status: BookingStatus;
  note?: string;
  duration?: string;
  price: number;
  /** ISO datetime when the attendant arrived; null if not yet. */
  arrivedAt: string | null;
  /** ISO datetime the booking is scheduled for; needed for on-time math. */
  scheduledAt: string;
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

/* Bookings, units, attendants, and services now live in Supabase. See
 * `src/lib/api/*` for fetchers and `context.tsx` for the consumer wiring.
 * For seed values used to bootstrap the dev DB, see `supabase/seed.sql`. */
