import { supabase } from '../supabase';
import type {
  CommissionStatus,
  ReferralRow,
  ReferralStatus,
} from '../types/db';

export interface CreateReferralInput {
  property_id: string;
  referrer_id: string;
  referred_name: string;
  referred_phone: string;
  unit_id?: string | null;
  suggested_service_id?: string | null;
  note?: string | null;
}

export async function createReferral(input: CreateReferralInput): Promise<ReferralRow> {
  const { data, error } = await supabase
    .from('referrals')
    .insert({
      property_id: input.property_id,
      referrer_id: input.referrer_id,
      referred_name: input.referred_name.trim(),
      referred_phone: input.referred_phone.trim(),
      unit_id: input.unit_id ?? null,
      suggested_service_id: input.suggested_service_id ?? null,
      note: input.note?.trim() || null,
    })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function listMyReferrals(userId: string): Promise<ReferralRow[]> {
  const { data, error } = await supabase
    .from('referrals')
    .select('*')
    .eq('referrer_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function listAllReferrals(): Promise<ReferralRow[]> {
  const { data, error } = await supabase
    .from('referrals')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function updateReferralStatus(
  id: string,
  status: ReferralStatus,
): Promise<ReferralRow> {
  const { data, error } = await supabase
    .from('referrals')
    .update({ status })
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function linkReferralToBooking(
  id: string,
  bookingId: string,
): Promise<ReferralRow> {
  const { data, error } = await supabase
    .from('referrals')
    .update({ status: 'booked', booking_id: bookingId })
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function setCommissionStatus(
  id: string,
  commission_status: CommissionStatus,
): Promise<ReferralRow> {
  const { data, error } = await supabase
    .from('referrals')
    .update({ commission_status })
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}
