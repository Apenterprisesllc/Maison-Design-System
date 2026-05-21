-- ============================================================================
-- Fix notify_booking_event(): manager_user was declared as `uuid` scalar but
-- the FOR loop accessed it as a record (`manager_user.id`). Postgres
-- interpreted `manager_user.id` as "column id of table manager_user" and
-- failed with 42P01 (undefined_table) the moment the trigger fired on any
-- booking insert or status update. Re-declare it as a record to match its
-- usage. Behaviour unchanged otherwise.
-- ============================================================================

create or replace function notify_booking_event() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  kind notification_kind;
  payload jsonb;
  manager_user record;
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
