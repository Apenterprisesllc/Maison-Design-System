import { supabase } from '../supabase';

export interface PropertyNewCountRow {
  property_id: string;
  new_count: number;
}

export async function getPropertyNewCounts(): Promise<PropertyNewCountRow[]> {
  const { data, error } = await supabase.rpc('get_property_new_counts');
  if (error) throw error;
  return (data ?? []) as PropertyNewCountRow[];
}

export async function markPropertyReviewed(propertyId: string): Promise<void> {
  const { error } = await supabase.rpc('mark_property_reviewed', { p_property_id: propertyId });
  if (error) throw error;
}
