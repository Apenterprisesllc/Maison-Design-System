import { supabase } from '../supabase';
import type { ProfileRow, UnitMemberRole, UnitRow } from '../types/db';
import type { UnitWithMembers } from '../mappers/unit';

interface UnitJoinedRow extends UnitRow {
  members: Array<{
    role: UnitMemberRole;
    is_primary: boolean;
    profile: ProfileRow;
  }>;
}

export async function listUnitsForProperty(propertyId: string): Promise<UnitWithMembers[]> {
  const { data, error } = await supabase
    .from('units')
    .select(`
      *,
      members:unit_members(
        role,
        is_primary,
        profile:profiles(*)
      )
    `)
    .eq('property_id', propertyId)
    .order('external_id');
  if (error) throw error;

  return ((data ?? []) as unknown as UnitJoinedRow[]).map((row) => {
    const { members, ...unitRow } = row;
    return {
      row: unitRow as UnitRow,
      members: (members ?? []).filter((m) => m.profile).map((m) => ({
        profile: m.profile,
        role: m.role,
        is_primary: m.is_primary,
      })),
    };
  });
}

export async function findUnitByExternalId(propertyId: string, externalId: string): Promise<UnitRow | null> {
  const { data, error } = await supabase
    .from('units')
    .select('*')
    .eq('property_id', propertyId)
    .eq('external_id', externalId)
    .maybeSingle();
  if (error) throw error;
  return data ?? null;
}

export interface CreateUnitInput {
  property_id: string;
  external_id: string;
  floor: string;
  kind: UnitRow['kind'];
  status?: UnitRow['status'];
  notes?: string | null;
}

export async function createUnit(input: CreateUnitInput): Promise<UnitRow> {
  const { data, error } = await supabase
    .from('units')
    .insert({
      property_id: input.property_id,
      external_id: input.external_id,
      floor: input.floor,
      kind: input.kind,
      status: input.status ?? 'active',
      notes: input.notes ?? null,
    })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function updateUnit(id: string, patch: Partial<UnitRow>): Promise<UnitRow> {
  const { data, error } = await supabase
    .from('units')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function deleteUnit(id: string): Promise<void> {
  const { error } = await supabase.from('units').delete().eq('id', id);
  if (error) throw error;
}

export async function toggleUnitStatus(id: string, current: UnitRow['status']): Promise<void> {
  const next = current === 'active' ? 'paused' : 'active';
  const { error } = await supabase.from('units').update({ status: next }).eq('id', id);
  if (error) throw error;
}

export async function attachMember(params: {
  unit_id: string;
  user_id: string;
  role: UnitMemberRole;
  is_primary?: boolean;
}): Promise<void> {
  const { error } = await supabase.from('unit_members').insert({
    unit_id: params.unit_id,
    user_id: params.user_id,
    role: params.role,
    is_primary: params.is_primary ?? true,
  });
  if (error) throw error;
}

export async function detachMember(unitId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('unit_members')
    .delete()
    .eq('unit_id', unitId)
    .eq('user_id', userId);
  if (error) throw error;
}
