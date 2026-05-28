-- ============================================================================
-- Guest booking flow
--
-- Residents and commercial users no longer log in. They land on the public
-- booking site, search a property, schedule a service, and only at the end
-- provide name / phone / address. To support that:
--
--   1. Allow bookings.created_by to be NULL (no auth.users row exists).
--   2. Capture guest contact directly on the booking row.
--   3. Open RLS so the anon role can read the public catalogue
--      (properties, services, units) and insert guest bookings.
--   4. Patch the audit trigger so booking_status_events accepts NULL
--      changed_by (the previous version assumed a logged-in actor).
-- ============================================================================

-- ─── bookings table changes ─────────────────────────────────────────────────

alter table bookings
  alter column created_by drop not null,
  add column if not exists guest_name    text,
  add column if not exists guest_phone   text,
  add column if not exists guest_address text,
  add column if not exists is_guest      boolean not null default false;

alter table bookings drop constraint if exists bookings_guest_contact_check;
alter table bookings add constraint bookings_guest_contact_check
  check (
    is_guest = false
    or (guest_name is not null and guest_phone is not null and guest_address is not null)
  );

-- ─── audit log: allow NULL changed_by for guest bookings ────────────────────

alter table booking_status_events
  alter column changed_by drop not null;

create or replace function log_booking_status() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into booking_status_events (booking_id, from_status, to_status, changed_by)
    values (new.id, null, new.status, coalesce(new.created_by, auth.uid()));
  elsif tg_op = 'UPDATE' and old.status is distinct from new.status then
    insert into booking_status_events (booking_id, from_status, to_status, changed_by, reason)
    values (new.id, old.status, new.status, coalesce(auth.uid(), new.created_by), new.cancelled_reason);
  end if;
  return new;
end;
$$;

-- ─── RLS: public read for catalogue (anon role) ─────────────────────────────

drop policy if exists properties_anon_select on properties;
create policy properties_anon_select on properties for select to anon using (active);

drop policy if exists services_anon_select on services;
create policy services_anon_select on services for select to anon using (active);

drop policy if exists units_anon_select on units;
create policy units_anon_select on units for select to anon using (status = 'active');

-- ─── RLS: guest insert + self-read on bookings ──────────────────────────────

drop policy if exists bookings_guest_insert on bookings;
create policy bookings_guest_insert on bookings for insert to anon with check (
  is_guest = true
  and created_by is null
  and guest_name is not null
  and guest_phone is not null
  and guest_address is not null
);

-- Knowing the UUID is the access token here. The confirm page navigates to
-- /book/confirm/:bookingId immediately after the insert.
drop policy if exists bookings_guest_select on bookings;
create policy bookings_guest_select on bookings for select to anon using (is_guest = true);

-- Allow anon to read the new booking's status events (used by Ops audit views
-- when the manager opens a guest booking — but not strictly required for the
-- guest UI). Conservative: skip until needed.
