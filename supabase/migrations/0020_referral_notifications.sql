-- ============================================================================
-- Notify AP (super admins) when a manager sends a referral, and expose the
-- referrals table on the realtime publication so the /admin/referrals queue
-- and the nav badge update live.
--
-- Mirrors the security-definer pattern of notify_booking_event()
-- (0006_fix_notify_function.sql): the notifications table has no client insert
-- policy, so the insert relies on this function running as definer.
-- ============================================================================

create or replace function notify_referral_created() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  admin_user record;
begin
  for admin_user in
    select id from profiles where role = 'super_admin'
  loop
    insert into notifications (user_id, kind, payload)
    values (
      admin_user.id,
      'referral_created',
      jsonb_build_object(
        'referral_id',    new.id,
        'reference',      new.reference,
        'referred_name',  new.referred_name,
        'referred_phone', new.referred_phone,
        'property_id',    new.property_id
      )
    );
  end loop;
  return new;
end;
$$;

drop trigger if exists referrals_notify_created on referrals;
create trigger referrals_notify_created
  after insert on referrals
  for each row execute function notify_referral_created();

-- ─── Realtime ───────────────────────────────────────────────────────────────
-- Add referrals to the realtime publication so admin clients receive INSERT /
-- UPDATE events. RLS still applies on the stream, so only super admins (and the
-- referring manager) receive a given row's events.

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'referrals'
  ) then
    alter publication supabase_realtime add table referrals;
  end if;
end$$;
