-- ============================================================================
-- AP Enterprises Members — Storage buckets and policies
-- ============================================================================

insert into storage.buckets (id, name, public) values
  ('service-photos',      'service-photos',      true),
  ('booking-attachments', 'booking-attachments', false),
  ('avatars',             'avatars',             true)
on conflict (id) do nothing;

-- ─── service-photos (public read, manager/super_admin write) ───────────────

create policy "service_photos_read" on storage.objects for select using (
  bucket_id = 'service-photos'
);

create policy "service_photos_insert" on storage.objects for insert with check (
  bucket_id = 'service-photos' and (
    is_super_admin()
    or exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'property_manager'
    )
  )
);
create policy "service_photos_update" on storage.objects for update using (
  bucket_id = 'service-photos' and (
    is_super_admin()
    or exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'property_manager'
    )
  )
);
create policy "service_photos_delete" on storage.objects for delete using (
  bucket_id = 'service-photos' and (
    is_super_admin()
    or exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'property_manager'
    )
  )
);

-- ─── avatars (public read, user writes only inside their own folder) ───────

create policy "avatars_read" on storage.objects for select using (
  bucket_id = 'avatars'
);
create policy "avatars_insert" on storage.objects for insert with check (
  bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
);
create policy "avatars_update" on storage.objects for update using (
  bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
);
create policy "avatars_delete" on storage.objects for delete using (
  bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
);

-- ─── booking-attachments (path: bookings/<booking_id>/<filename>) ──────────

create policy "ba_storage_read" on storage.objects for select using (
  bucket_id = 'booking-attachments'
  and exists (
    select 1 from bookings b
    where b.id::text = (storage.foldername(name))[2]
      and (
        is_super_admin()
        or is_manager_of(b.property_id)
        or b.created_by = auth.uid()
        or is_unit_member(b.unit_id)
      )
  )
);

create policy "ba_storage_insert" on storage.objects for insert with check (
  bucket_id = 'booking-attachments'
  and exists (
    select 1 from bookings b
    where b.id::text = (storage.foldername(name))[2]
      and (is_super_admin() or is_manager_of(b.property_id))
  )
);

create policy "ba_storage_delete" on storage.objects for delete using (
  bucket_id = 'booking-attachments'
  and exists (
    select 1 from bookings b
    where b.id::text = (storage.foldername(name))[2]
      and (is_super_admin() or is_manager_of(b.property_id))
  )
);
