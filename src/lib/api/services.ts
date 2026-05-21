import { supabase } from '../supabase';
import type { ClientTrack, ServiceRow } from '../types/db';

export async function listServicesForTrack(
  track: ClientTrack,
  propertyId: string | null,
): Promise<ServiceRow[]> {
  // Pick property-specific services first; fall back to global (property_id null).
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('track', track)
    .eq('active', true)
    .or(propertyId ? `property_id.eq.${propertyId},property_id.is.null` : 'property_id.is.null')
    .order('sort_order', { ascending: true });
  if (error) throw error;
  // De-dupe by slug, preferring property-scoped over global.
  const map = new Map<string, ServiceRow>();
  for (const row of data ?? []) {
    const existing = map.get(row.slug);
    if (!existing) {
      map.set(row.slug, row);
    } else if (!existing.property_id && row.property_id) {
      map.set(row.slug, row);
    }
  }
  return Array.from(map.values());
}

export async function listAllServices(propertyId: string | null): Promise<ServiceRow[]> {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('active', true)
    .or(propertyId ? `property_id.eq.${propertyId},property_id.is.null` : 'property_id.is.null')
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return data ?? [];
}
