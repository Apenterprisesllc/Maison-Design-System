import { supabase } from '../supabase';
import type { ProfileRow } from '../types/db';

export async function getProfile(userId: string): Promise<ProfileRow | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data ?? null;
}

export async function updateProfile(
  userId: string,
  patch: Partial<Pick<ProfileRow, 'full_name' | 'display_name' | 'phone' | 'avatar_path' | 'primary_track' | 'primary_property_id'>>,
): Promise<ProfileRow> {
  const { data, error } = await supabase
    .from('profiles')
    .update(patch)
    .eq('id', userId)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}
