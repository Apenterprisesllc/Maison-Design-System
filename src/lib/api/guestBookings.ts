import { supabase } from '../supabase';
import type { BookingRow, Json, PropertyRow, ServiceRow, UnitRow } from '../types/db';

export interface PublicService {
  id: string;
  slug: string;
  name: string;
  kicker: string;
  icon: string;
  tone: ServiceRow['tone'];
  price_cents: number;
  cadence: ServiceRow['cadence'];
  description: string;
  track: ServiceRow['track'];
  photo_path: string | null;
}

export interface PublicProperty {
  id: string;
  slug: string;
  name: string;
  city: string;
  address: string | null;
  cover_image: string | null;
}

export interface PublicUnit {
  id: string;
  external_id: string;
  floor: string;
  kind: UnitRow['kind'];
}

export interface CreateGuestBookingInput {
  property_id: string;
  unit_id: string;
  service: PublicService;
  scheduled_at: string;
  note?: string | null;
  guest_name: string;
  guest_phone: string;
  guest_address: string;
}

export async function searchProperties(query: string, limit = 12): Promise<PublicProperty[]> {
  const trimmed = query.trim();
  let q = supabase
    .from('properties')
    .select('id, slug, name, city, address, cover_image')
    .eq('active', true)
    .order('name')
    .limit(limit);
  if (trimmed) q = q.ilike('name', `%${trimmed}%`);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as PublicProperty[];
}

export async function getPropertyBySlug(slug: string): Promise<PublicProperty | null> {
  const { data, error } = await supabase
    .from('properties')
    .select('id, slug, name, city, address, cover_image')
    .eq('slug', slug)
    .eq('active', true)
    .maybeSingle();
  if (error) throw error;
  return (data as PublicProperty | null) ?? null;
}

export async function listServicesForProperty(propertyId: string): Promise<PublicService[]> {
  // Services are global today (property_id IS NULL) but the catalogue may be
  // extended per-property later. Either property-scoped or global services
  // apply.
  const { data, error } = await supabase
    .from('services')
    .select('id, slug, name, kicker, icon, tone, price_cents, cadence, description, track, photo_path')
    .eq('active', true)
    .or(`property_id.is.null,property_id.eq.${propertyId}`)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return (data ?? []) as PublicService[];
}

export async function getServiceBySlugForProperty(
  slug: string,
  propertyId: string,
): Promise<PublicService | null> {
  const { data, error } = await supabase
    .from('services')
    .select('id, slug, name, kicker, icon, tone, price_cents, cadence, description, track, photo_path')
    .eq('active', true)
    .eq('slug', slug)
    .or(`property_id.is.null,property_id.eq.${propertyId}`)
    .order('property_id', { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data as PublicService | null) ?? null;
}

export async function listUnitsForProperty(propertyId: string): Promise<PublicUnit[]> {
  const { data, error } = await supabase
    .from('units')
    .select('id, external_id, floor, kind')
    .eq('property_id', propertyId)
    .eq('status', 'active')
    .order('kind')
    .order('external_id');
  if (error) throw error;
  return (data ?? []) as PublicUnit[];
}

export async function createGuestBooking(input: CreateGuestBookingInput): Promise<BookingRow> {
  const service_snapshot = {
    slug: input.service.slug,
    name: input.service.name,
    kicker: input.service.kicker,
  } satisfies Record<string, string>;

  const resident_snapshot = {
    full_name: input.guest_name,
    display_name: input.guest_name,
    unit: { external_id: '' },
    guest: {
      phone: input.guest_phone,
      address: input.guest_address,
    },
  };

  const { data, error } = await supabase
    .from('bookings')
    .insert({
      property_id: input.property_id,
      unit_id: input.unit_id,
      service_id: input.service.id,
      attendant_id: null,
      created_by: null,
      is_guest: true,
      guest_name: input.guest_name,
      guest_phone: input.guest_phone,
      guest_address: input.guest_address,
      scheduled_at: input.scheduled_at,
      duration_min: 60,
      price_cents: input.service.price_cents,
      note: input.note?.trim() || null,
      service_snapshot: service_snapshot as unknown as Json,
      resident_snapshot: resident_snapshot as unknown as Json,
    })
    .select('*')
    .single();

  if (error) {
    const msg = error.message || '';
    if (/23505|duplicate key|unique constraint/i.test(msg)) {
      throw new Error('That slot was just taken — pick another time.');
    }
    throw error;
  }

  // Best-effort: stamp the unit external_id into the snapshot once the row is
  // back. Skipping this would leave `unit.external_id` empty in the receipt.
  const { data: unit } = await supabase
    .from('units')
    .select('external_id')
    .eq('id', input.unit_id)
    .maybeSingle();
  if (unit?.external_id) {
    const patched = {
      ...(data.resident_snapshot as Record<string, Json>),
      unit: { external_id: unit.external_id },
    };
    const { data: updated } = await supabase
      .from('bookings')
      .update({ resident_snapshot: patched as unknown as Json })
      .eq('id', data.id)
      .select('*')
      .single();
    if (updated) return updated;
  }
  return data;
}

export async function getGuestBookingById(id: string): Promise<BookingRow | null> {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', id)
    .eq('is_guest', true)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export type { BookingRow, PropertyRow };
