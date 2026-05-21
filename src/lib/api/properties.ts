import { supabase } from '../supabase';
import type { PropertyRow } from '../types/db';

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

export async function listPropertiesWithStats(): Promise<PropertyStats[]> {
  const [properties, units, bookings, members, managers] = await Promise.all([
    supabase.from('properties').select('*').order('name'),
    supabase.from('units').select('property_id, status'),
    supabase.from('bookings').select('property_id, status'),
    supabase.from('unit_members').select('user_id, unit_id, units!inner(property_id)'),
    supabase
      .from('profiles')
      .select('email, primary_property_id')
      .eq('role', 'property_manager'),
  ]);

  if (properties.error) throw properties.error;
  if (units.error) throw units.error;
  if (bookings.error) throw bookings.error;
  if (members.error) throw members.error;
  if (managers.error) throw managers.error;

  type UnitJoined = { units: { property_id: string } | null };

  return (properties.data ?? []).map((p) => {
    const pUnits = (units.data ?? []).filter((u) => u.property_id === p.id);
    const pBookings = (bookings.data ?? []).filter((b) => b.property_id === p.id);
    const pMembers = ((members.data ?? []) as unknown as UnitJoined[]).filter(
      (m) => m.units?.property_id === p.id,
    );
    const pManager = (managers.data ?? []).find((m) => m.primary_property_id === p.id);
    return {
      property: p,
      units_total: pUnits.length,
      units_active: pUnits.filter((u) => u.status === 'active').length,
      bookings_total: pBookings.length,
      bookings_active: pBookings.filter((b) =>
        ['scheduled', 'enroute', 'active'].includes(b.status),
      ).length,
      residents_total: pMembers.length,
      manager_email: pManager?.email ?? null,
    };
  });
}
