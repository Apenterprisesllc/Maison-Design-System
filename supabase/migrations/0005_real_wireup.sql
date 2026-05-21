-- ============================================================================
-- AP Enterprises Members — wire-up pass
-- 1. Race-condition guard: no two non-cancelled bookings can share a slot.
-- 2. arrived_at on bookings (on-time tracking).
-- 3. attendant_messages table (per-booking thread).
-- 4. Auto-notification trigger on booking lifecycle events.
-- ============================================================================

-- ─── 1. Slot uniqueness ────────────────────────────────────────────────────
-- Cancel any pre-existing duplicates from test data so the unique index can
-- be created. Keeps the oldest booking, cancels the newer copies.
with ranked as (
  select id, row_number() over (
    partition by unit_id, scheduled_at
    order by created_at asc
  ) as rn
  from bookings
  where status <> 'cancelled'
)
update bookings set status = 'cancelled',
                    cancelled_reason = 'duplicate slot (cleaned by 0005 migration)',
                    cancelled_at = now()
 where id in (select id from ranked where rn > 1);

create unique index if not exists bookings_unit_slot_active_unique
  on bookings (unit_id, scheduled_at)
  where status <> 'cancelled';

-- ─── 2. arrived_at + on-time helpers ───────────────────────────────────────
alter table bookings
  add column if not exists arrived_at timestamptz;

create index if not exists bookings_arrived_idx on bookings(arrived_at);

-- ─── 3. attendant_messages ────────────────────────────────────────────────
create table if not exists attendant_messages (
  id          uuid        primary key default gen_random_uuid(),
  booking_id  uuid        not null references bookings(id) on delete cascade,
  sender_id   uuid        not null references auth.users(id),
  body        text        not null check (char_length(body) between 1 and 2000),
  created_at  timestamptz not null default now()
);
create index if not exists attendant_messages_booking_idx
  on attendant_messages(booking_id, created_at desc);

alter table attendant_messages enable row level security;

create policy am_select on attendant_messages for select to authenticated using (
  exists (
    select 1 from bookings b
    where b.id = booking_id and (
      is_super_admin()
      or is_manager_of(b.property_id)
      or b.created_by = auth.uid()
      or is_unit_member(b.unit_id)
    )
  )
);

create policy am_insert on attendant_messages for insert to authenticated with check (
  sender_id = auth.uid()
  and exists (
    select 1 from bookings b
    where b.id = booking_id and (
      is_super_admin()
      or is_manager_of(b.property_id)
      or b.created_by = auth.uid()
      or is_unit_member(b.unit_id)
    )
  )
);

alter publication supabase_realtime add table attendant_messages;

-- ─── 4. Auto-notifications on booking events ──────────────────────────────
create or replace function notify_booking_event() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  kind notification_kind;
  payload jsonb;
  manager_user uuid;
  unit_member record;
begin
  if tg_op = 'INSERT' then
    kind := 'booking_created';
  elsif tg_op = 'UPDATE' and old.status is distinct from new.status then
    if new.status = 'cancelled' then
      kind := 'booking_cancelled';
    else
      kind := 'booking_status_changed';
    end if;
  else
    return new;
  end if;

  payload := jsonb_build_object(
    'booking_id', new.id,
    'reference',  new.reference,
    'status',     new.status,
    'scheduled_at', new.scheduled_at,
    'service',    new.service_snapshot,
    'unit_id',    new.unit_id
  );

  -- Notify the property's manager(s).
  for manager_user in
    select p.id from profiles p
    where p.role = 'property_manager' and p.primary_property_id = new.property_id
  loop
    -- Don't ping the user who caused the event.
    if manager_user.id <> coalesce(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid) then
      insert into notifications (user_id, kind, payload)
      values (manager_user.id, kind, payload);
    end if;
  end loop;

  -- Notify every unit member (residents) except the actor.
  for unit_member in
    select user_id from unit_members where unit_id = new.unit_id
  loop
    if unit_member.user_id <> coalesce(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid) then
      insert into notifications (user_id, kind, payload)
      values (unit_member.user_id, kind, payload);
    end if;
  end loop;

  return new;
end;
$$;

drop trigger if exists booking_notify_trg on bookings;
create trigger booking_notify_trg
  after insert or update of status on bookings
  for each row execute function notify_booking_event();

-- ─── notifications: insert + update policies for the bell --------------------
-- Users mark their own notifications as read.
create policy notifications_update_self on notifications for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Inserts come only via the security-definer trigger; no public insert policy.

alter publication supabase_realtime add table notifications;

-- ─── notifications: convenience read_at column ─────────────────────────────
alter table notifications
  add column if not exists read_at timestamptz;
create index if not exists notifications_unread_user_idx
  on notifications(user_id, created_at desc) where read_at is null;
