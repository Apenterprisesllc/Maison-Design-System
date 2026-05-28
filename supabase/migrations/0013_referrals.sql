-- ============================================================================
-- Referrals: managers refer prospective clients to AP and earn a commission.
--
-- Managers are external to AP (they run buildings, not AP operations). The
-- only write action they have is "send a referral" — a lead they hand off
-- to AP for follow-up. AP then either books it, declines it, or marks the
-- prospect contacted. If the booking ends up performed, the referral closes
-- and a commission flag flips between Pending payment / Paid.
--
-- This migration only introduces the new entity. The RLS tightening for
-- bookings/units/services/attendants lives in 0014.
-- ============================================================================

-- ─── Enums ──────────────────────────────────────────────────────────────────

do $$
begin
  if not exists (select 1 from pg_type where typname = 'referral_status') then
    create type referral_status as enum (
      'pending',
      'contacted',
      'booked',
      'completed',
      'declined'
    );
  end if;
  if not exists (select 1 from pg_type where typname = 'commission_status') then
    create type commission_status as enum ('pending', 'paid');
  end if;
end$$;

-- ─── Table ──────────────────────────────────────────────────────────────────

create sequence if not exists referral_reference_seq start 1000;

create table if not exists referrals (
  id                    uuid              primary key default gen_random_uuid(),
  reference             text              not null unique,
  property_id           uuid              not null references properties(id) on delete restrict,
  referrer_id           uuid              not null references auth.users(id) on delete restrict,
  referred_name         text              not null,
  referred_phone        text              not null,
  unit_id               uuid              references units(id) on delete set null,
  suggested_service_id  uuid              references services(id) on delete set null,
  note                  text,
  status                referral_status   not null default 'pending',
  booking_id            uuid              references bookings(id) on delete set null,
  commission_status     commission_status not null default 'pending',
  created_at            timestamptz       not null default now(),
  updated_at            timestamptz       not null default now()
);

create index if not exists referrals_property_idx on referrals(property_id, created_at desc);
create index if not exists referrals_referrer_idx on referrals(referrer_id, created_at desc);
create index if not exists referrals_status_idx   on referrals(status);

create trigger referrals_touch
  before update on referrals
  for each row execute function touch_updated_at();

-- Auto-generate the reference like bookings does.
create or replace function set_referral_reference() returns trigger
language plpgsql as $$
begin
  if new.reference is null or new.reference = '' then
    new.reference := 'R-' || nextval('referral_reference_seq')::text;
  end if;
  return new;
end;
$$;

drop trigger if exists referral_reference_trg on referrals;
create trigger referral_reference_trg
  before insert on referrals
  for each row execute function set_referral_reference();

-- ─── RLS ────────────────────────────────────────────────────────────────────

alter table referrals enable row level security;

drop policy if exists referrals_select on referrals;
create policy referrals_select on referrals for select to authenticated using (
  referrer_id = auth.uid() or is_super_admin()
);

drop policy if exists referrals_insert on referrals;
create policy referrals_insert on referrals for insert to authenticated with check (
  is_super_admin()
  or (referrer_id = auth.uid() and is_manager_of(property_id))
);

-- Managers cannot update — only super admins move state through the pipeline
-- and toggle the commission flag.
drop policy if exists referrals_update on referrals;
create policy referrals_update on referrals for update to authenticated
  using (is_super_admin())
  with check (is_super_admin());

drop policy if exists referrals_delete on referrals;
create policy referrals_delete on referrals for delete to authenticated
  using (is_super_admin());

-- ─── Auto-close referrals when their booking closes ─────────────────────────
-- When a booking linked to a referral transitions to status='closed', the
-- referral moves to 'completed'. Stops at 'declined' / already 'completed'
-- so a manual override is not overwritten.

create or replace function sync_referral_on_booking_close()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'closed' and old.status is distinct from 'closed' then
    update referrals
       set status     = 'completed',
           updated_at = now()
     where booking_id = new.id
       and status not in ('completed', 'declined');
  end if;
  return new;
end;
$$;

drop trigger if exists referrals_sync_close on bookings;
create trigger referrals_sync_close
  after update of status on bookings
  for each row execute function sync_referral_on_booking_close();

-- ─── RPC: weekly booking counts per property (used by /admin Console) ───────
-- One row per (property_id, day) for any property with bookings inside the
-- requested window. The client fills in zeros for empty cells.

create or replace function get_weekly_booking_counts(
  p_start timestamptz,
  p_end   timestamptz
)
returns table (property_id uuid, day date, count integer)
language sql
stable
security definer
set search_path = public
as $$
  select
    b.property_id,
    (b.scheduled_at at time zone 'UTC')::date as day,
    count(*)::int as count
  from bookings b
  where b.scheduled_at >= p_start
    and b.scheduled_at <  p_end
    and b.status <> 'cancelled'
    and (is_super_admin() or is_manager_of(b.property_id))
  group by b.property_id, (b.scheduled_at at time zone 'UTC')::date;
$$;

grant execute on function get_weekly_booking_counts(timestamptz, timestamptz) to authenticated;
