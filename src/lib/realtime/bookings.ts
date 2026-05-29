import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { supabase } from '../supabase';
import type { BookingRow, ReferralRow } from '../types/db';

export type BookingChangePayload = RealtimePostgresChangesPayload<BookingRow>;
export type ReferralChangePayload = RealtimePostgresChangesPayload<ReferralRow>;

/**
 * Subscribe to bookings changes for a given property. Returns an unsubscribe
 * function. The `bookings` table must be enabled on the `supabase_realtime`
 * publication (see migration 0001_init.sql).
 */
export function subscribeToPropertyBookings(
  propertyId: string,
  onChange: (payload: BookingChangePayload) => void,
): () => void {
  const channel: RealtimeChannel = supabase
    .channel(`bookings:property:${propertyId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'bookings',
        filter: `property_id=eq.${propertyId}`,
      },
      onChange,
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Subscribe to referrals changes (all rows). RLS still applies on the stream,
 * so a super admin receives every referral while a manager only receives their
 * own. Used by /admin/referrals and the AdminContext pending-count badge to
 * stay live. The `referrals` table is on the realtime publication (see
 * migration 0020).
 */
export function subscribeToReferrals(
  onChange: (payload: ReferralChangePayload) => void,
): () => void {
  const channel: RealtimeChannel = supabase
    .channel('referrals:all')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'referrals' },
      onChange,
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Subscribe to bookings changes for a specific unit. Used by the resident
 * Portal to keep status pills in sync with manager updates.
 */
export function subscribeToUnitBookings(
  unitId: string,
  onChange: (payload: BookingChangePayload) => void,
): () => void {
  const channel: RealtimeChannel = supabase
    .channel(`bookings:unit:${unitId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'bookings',
        filter: `unit_id=eq.${unitId}`,
      },
      onChange,
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
