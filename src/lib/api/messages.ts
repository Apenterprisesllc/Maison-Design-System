import { supabase } from '../supabase';
import type { AttendantMessageRow } from '../types/db';

export async function listMessagesForBooking(bookingId: string): Promise<AttendantMessageRow[]> {
  const { data, error } = await supabase
    .from('attendant_messages')
    .select('*')
    .eq('booking_id', bookingId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function sendMessage(bookingId: string, body: string): Promise<AttendantMessageRow> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in.');
  const { data, error } = await supabase
    .from('attendant_messages')
    .insert({ booking_id: bookingId, sender_id: user.id, body })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

/**
 * Subscribe to realtime inserts on attendant_messages for a specific booking.
 * Returns an unsubscribe callback.
 */
export function subscribeToBookingMessages(
  bookingId: string,
  onChange: () => void,
): () => void {
  const channel = supabase
    .channel(`messages:booking:${bookingId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'attendant_messages',
        filter: `booking_id=eq.${bookingId}`,
      },
      onChange,
    )
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}
