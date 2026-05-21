import { supabase } from '../supabase';
import type { AttachmentKind, BookingAttachmentRow } from '../types/db';

const BUCKET = 'booking-attachments';

export interface UploadAttachmentParams {
  bookingId: string;
  file: File;
  kind: AttachmentKind;
  uploadedBy: string;
  caption?: string;
}

export async function uploadAttachment(params: UploadAttachmentParams): Promise<BookingAttachmentRow> {
  const safeName = params.file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `bookings/${params.bookingId}/${Date.now()}-${safeName}`;
  const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, params.file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (upErr) throw upErr;

  const { data, error } = await supabase
    .from('booking_attachments')
    .insert({
      booking_id: params.bookingId,
      kind: params.kind,
      storage_path: path,
      caption: params.caption ?? null,
      uploaded_by: params.uploadedBy,
    })
    .select('*')
    .single();
  if (error) {
    await supabase.storage.from(BUCKET).remove([path]);
    throw error;
  }
  return data;
}

export async function listAttachmentsForBooking(bookingId: string): Promise<BookingAttachmentRow[]> {
  const { data, error } = await supabase
    .from('booking_attachments')
    .select('*')
    .eq('booking_id', bookingId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function signedUrlFor(path: string, expiresInSeconds = 3600): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, expiresInSeconds);
  if (error) throw error;
  return data.signedUrl;
}

export function publicUrlFor(bucket: 'service-photos' | 'avatars', path: string): string {
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}
