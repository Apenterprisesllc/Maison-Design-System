import { supabase } from '../supabase';
import type { UnitMemberRole } from '../types/db';

export interface CreateResidentUserParams {
  property_id: string;
  unit_id: string;
  email: string;
  full_name: string;
  phone?: string | null;
  temp_password: string;
  role: Extract<UnitMemberRole, 'owner' | 'tenant' | 'manager' | 'contact'>;
}

export interface CreateResidentUserResult {
  user_id: string;
}

/**
 * Invokes the `create-resident-user` Edge Function which uses the
 * SERVICE_ROLE_KEY to create an auth.user, patch the profile, and attach
 * a unit_members row. Returns the new user's id.
 */
export async function createResidentUser(
  params: CreateResidentUserParams,
): Promise<CreateResidentUserResult> {
  const { data, error } = await supabase.functions.invoke<CreateResidentUserResult>(
    'create-resident-user',
    { body: params },
  );
  if (error) throw error;
  if (!data) throw new Error('Create user returned empty payload.');
  return data;
}

export function generateTempPassword(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  const bytes = new Uint8Array(14);
  crypto.getRandomValues(bytes);
  let out = '';
  for (let i = 0; i < bytes.length; i++) {
    out += alphabet[bytes[i]! % alphabet.length];
  }
  return out;
}

export interface CreateStaffUserParams {
  email: string;
  full_name: string;
  phone?: string | null;
  temp_password: string;
  role: 'super_admin' | 'property_manager';
  property_id?: string | null;
}

export interface CreateStaffUserResult {
  user_id: string;
  already_existed: boolean;
}

/**
 * Invokes the `create-staff-user` Edge Function. Only super_admins can call.
 */
export async function createStaffUser(
  params: CreateStaffUserParams,
): Promise<CreateStaffUserResult> {
  const { data, error } = await supabase.functions.invoke<CreateStaffUserResult>(
    'create-staff-user',
    { body: params },
  );
  if (error) throw error;
  if (!data) throw new Error('Create staff user returned empty payload.');
  return data;
}

export interface UpdateStaffUserParams {
  user_id: string;
  full_name?: string;
  property_id?: string | null;
  phone?: string | null;
}

export async function updateStaffUser(params: UpdateStaffUserParams): Promise<void> {
  const { error } = await supabase.functions.invoke('manage-staff-user', {
    body: { action: 'update', ...params },
  });
  if (error) throw error;
}

export interface ResetStaffPasswordResult {
  temp_password: string;
}

export async function resetStaffPassword(userId: string): Promise<ResetStaffPasswordResult> {
  const tempPassword = generateTempPassword();
  const { error } = await supabase.functions.invoke('manage-staff-user', {
    body: { action: 'reset_password', user_id: userId, temp_password: tempPassword },
  });
  if (error) throw error;
  return { temp_password: tempPassword };
}

export async function deleteStaffUser(userId: string): Promise<void> {
  const { error } = await supabase.functions.invoke('manage-staff-user', {
    body: { action: 'delete', user_id: userId },
  });
  if (error) throw error;
}
