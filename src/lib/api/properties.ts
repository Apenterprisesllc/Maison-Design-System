import { supabase } from '../supabase';
import type { PropertyRow } from '../types/db';

export interface WeeklyBookingCount {
  property_id: string;
  day: string; // 'YYYY-MM-DD'
  count: number;
}

export async function getWeeklyBookingCounts(
  start: Date,
  end: Date,
): Promise<WeeklyBookingCount[]> {
  const { data, error } = await supabase.rpc('get_weekly_booking_counts', {
    p_start: start.toISOString(),
    p_end: end.toISOString(),
  });
  if (error) throw error;
  return (data ?? []) as WeeklyBookingCount[];
}

export async function getProperty(id: string): Promise<PropertyRow | null> {
  const { data, error } = await supabase.from('properties').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data ?? null;
}

export async function listProperties(): Promise<PropertyRow[]> {
  const { data, error } = await supabase.from('properties').select('*').order('name');
  if (error) throw error;
  return data ?? [];
}

export interface CreatePropertyInput {
  slug: string;
  name: string;
  city: string;
  address?: string | null;
  unit_count?: number;
}

export async function createProperty(input: CreatePropertyInput): Promise<PropertyRow> {
  const { data, error } = await supabase
    .from('properties')
    .insert({
      slug: input.slug,
      name: input.name,
      city: input.city,
      address: input.address ?? null,
      unit_count: input.unit_count ?? 0,
    })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export interface UpdatePropertyInput {
  name?: string;
  slug?: string;
  city?: string;
  address?: string | null;
  unit_count?: number;
}

export async function updateProperty(
  id: string,
  patch: UpdatePropertyInput,
): Promise<PropertyRow> {
  const { data, error } = await supabase
    .from('properties')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export interface DeletePropertyResult {
  units: number;
  bookings: number;
}

/**
 * Returns counts of dependent rows so the UI can warn before destructive
 * delete. Caller is expected to show the numbers and require confirmation.
 */
export async function describePropertyDependencies(id: string): Promise<DeletePropertyResult> {
  const [units, bookings] = await Promise.all([
    supabase.from('units').select('id', { count: 'exact', head: true }).eq('property_id', id),
    supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('property_id', id)
      .neq('status', 'cancelled'),
  ]);
  return {
    units: units.count ?? 0,
    bookings: bookings.count ?? 0,
  };
}

export async function deleteProperty(id: string): Promise<void> {
  // RLS only allows super_admin. ON DELETE CASCADE on units/bookings handles
  // the rest. The caller's confirmation modal is responsible for warning the
  // user about dependent data.
  const { error } = await supabase.from('properties').delete().eq('id', id);
  if (error) throw error;
}

export async function slugExists(slug: string, excludeId?: string): Promise<boolean> {
  let q = supabase.from('properties').select('id', { head: true, count: 'exact' }).eq('slug', slug);
  if (excludeId) q = q.neq('id', excludeId);
  const { count, error } = await q;
  if (error) return false;
  return (count ?? 0) > 0;
}

export interface PropertyStats {
  property: PropertyRow;
  units_total: number;
  units_active: number;
  bookings_total: number;
  bookings_active: number;
  residents_total: number;
  manager_email: string | null;
}

interface PropertyStatRow {
  property_id: string;
  units_total: number;
  units_active: number;
  bookings_total: number;
  bookings_active: number;
  residents_total: number;
  manager_email: string | null;
}

export async function listPropertiesWithStats(): Promise<PropertyStats[]> {
  // Stats are aggregated server-side (get_properties_with_stats) instead of
  // pulling every unit/booking/member row and joining in JS. We still fetch the
  // property rows for their full columns and merge by id.
  const [properties, stats] = await Promise.all([
    supabase.from('properties').select('*').order('name'),
    supabase.rpc('get_properties_with_stats'),
  ]);

  if (properties.error) throw properties.error;
  if (stats.error) throw stats.error;

  const byId = new Map<string, PropertyStatRow>(
    ((stats.data ?? []) as PropertyStatRow[]).map((s) => [s.property_id, s]),
  );

  return (properties.data ?? []).map((p) => {
    const s = byId.get(p.id);
    return {
      property: p,
      units_total: s?.units_total ?? 0,
      units_active: s?.units_active ?? 0,
      bookings_total: s?.bookings_total ?? 0,
      bookings_active: s?.bookings_active ?? 0,
      residents_total: s?.residents_total ?? 0,
      manager_email: s?.manager_email ?? null,
    };
  });
}
