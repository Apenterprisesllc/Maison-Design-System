import { supabase } from '../supabase';
import type { AttendantRow } from '../types/db';

export async function listAttendantsForProperty(propertyId: string | null): Promise<AttendantRow[]> {
  if (!propertyId) {
    const { data, error } = await supabase
      .from('attendants')
      .select('*')
      .eq('active', true)
      .is('property_id', null)
      .order('name');
    if (error) throw error;
    return data ?? [];
  }
  const { data, error } = await supabase
    .from('attendants')
    .select('*')
    .eq('active', true)
    .or(`property_id.eq.${propertyId},property_id.is.null`)
    .order('name');
  if (error) throw error;
  return data ?? [];
}
