import { supabase } from '../supabase';
import type { BookingRow, BookingStatus, Json } from '../types/db';

export interface ResidentSnapshot {
  full_name: string;
  display_name: string;
  unit: { external_id: string };
  attendant?: { name: string };
}

export interface ServiceSnapshot {
  slug: string;
  name: string;
  kicker: string;
}

export interface CreateBookingParams {
  property_id: string;
  unit_id: string;
  service_id: string;
  attendant_id: string | null;
  created_by: string;
  scheduled_at: string;
  duration_min?: number;
  price_cents: number;
  note?: string | null;
  service_snapshot: ServiceSnapshot;
  resident_snapshot: ResidentSnapshot;
}

export async function listBookingsForUser(userId: string): Promise<BookingRow[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .or(`created_by.eq.${userId},unit_id.in.(${await unitIdsForUser(userId)})`)
    .order('scheduled_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

async function unitIdsForUser(userId: string): Promise<string> {
  const { data, error } = await supabase
    .from('unit_members')
    .select('unit_id')
    .eq('user_id', userId);
  if (error) return '00000000-0000-0000-0000-000000000000';
  const ids = (data ?? []).map((r) => r.unit_id);
  if (ids.length === 0) return '00000000-0000-0000-0000-000000000000';
  return ids.join(',');
}

export async function listBookingsForUnits(unitIds: string[]): Promise<BookingRow[]> {
  if (unitIds.length === 0) return [];
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .in('unit_id', unitIds)
    .order('scheduled_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function listBookingsForProperty(propertyId: string): Promise<BookingRow[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('property_id', propertyId)
    .order('scheduled_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/**
 * Returns the non-cancelled bookings for a given unit on a specific day.
 * Used to compute time-slot availability for the resident BookingFlow and
 * the Ops NewBookingModal. `date` is interpreted in local time; we query
 * `[date 00:00, date+1 00:00)` in ISO.
 */
export async function listBookingsForUnitDate(
  unitId: string,
  date: Date,
): Promise<BookingRow[]> {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('unit_id', unitId)
    .neq('status', 'cancelled')
    .gte('scheduled_at', start.toISOString())
    .lt('scheduled_at', end.toISOString())
    .order('scheduled_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

/**
 * Mark a booking as arrived. Defaults to now(). Used by managers to compute
 * On-Time Arrivals KPI (arrived_at ≤ scheduled_at + grace).
 */
export async function markArrived(id: string, at: Date = new Date()): Promise<BookingRow> {
  const patch: { arrived_at: string; status?: BookingStatus } = {
    arrived_at: at.toISOString(),
  };
  // If still in scheduled/enroute, promote to active.
  const { data: existing } = await supabase
    .from('bookings')
    .select('status')
    .eq('id', id)
    .single();
  if (existing && (existing.status === 'scheduled' || existing.status === 'enroute')) {
    patch.status = 'active';
  }
  const { data, error } = await supabase
    .from('bookings')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function listStatusEventsForBooking(bookingId: string) {
  const { data, error } = await supabase
    .from('booking_status_events')
    .select('*')
    .eq('booking_id', bookingId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createBooking(params: CreateBookingParams): Promise<BookingRow> {
  const { data, error } = await supabase
    .from('bookings')
    .insert({
      property_id: params.property_id,
      unit_id: params.unit_id,
      service_id: params.service_id,
      attendant_id: params.attendant_id,
      created_by: params.created_by,
      scheduled_at: params.scheduled_at,
      duration_min: params.duration_min ?? 60,
      price_cents: params.price_cents,
      note: params.note ?? null,
      service_snapshot: params.service_snapshot as unknown as Json,
      resident_snapshot: params.resident_snapshot as unknown as Json,
      reference: '',
    })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function updateBookingStatus(id: string, status: BookingStatus): Promise<void> {
  const { error } = await supabase.from('bookings').update({ status }).eq('id', id);
  if (error) throw error;
}

export async function updateBooking(id: string, patch: Partial<BookingRow>): Promise<BookingRow> {
  const { data, error } = await supabase
    .from('bookings')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

/**
 * Cancellation goes through an Edge Function so residents (who have no RLS
 * UPDATE permission on bookings) can cancel within business-rule limits.
 * Managers can call it too — the function authorises based on caller JWT.
 */
export async function cancelBooking(id: string, reason?: string): Promise<void> {
  const { error } = await supabase.functions.invoke('cancel-booking', {
    body: { id, reason: reason ?? null },
  });
  if (error) throw error;
}
