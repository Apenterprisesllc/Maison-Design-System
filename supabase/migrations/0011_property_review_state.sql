-- ============================================================================
-- Super-admin notification badges on /admin (Properties listing).
--
-- Replaces 0010's manager-keyed review state with property-keyed state. The
-- property is the durable target — a manager may be reassigned or unassigned,
-- but the property still receives bookings. The badge lives on the property
-- row in /admin.
--
-- Behaviour:
--   - For each (super admin × property) pair, track the timestamp of the last
--     review.
--   - The Outlook-style count on a row = bookings on that property created
--     after that timestamp.
--   - Clicking the row marks it as reviewed (the API helper calls
--     mark_property_reviewed).
-- ============================================================================

-- ─── Drop the old manager-keyed schema ──────────────────────────────────────
-- Safe: 0010 was just added, no business data depends on it.

drop function if exists mark_manager_reviewed(uuid);
drop function if exists get_manager_new_counts();
drop table if exists manager_review_state;

-- ─── New property-keyed table ───────────────────────────────────────────────

create table if not exists property_review_state (
  super_admin_id   uuid        not null references profiles(id) on delete cascade,
  property_id      uuid        not null references properties(id) on delete cascade,
  last_reviewed_at timestamptz not null default '1970-01-01T00:00:00Z'::timestamptz,
  updated_at       timestamptz not null default now(),
  primary key (super_admin_id, property_id)
);

create index if not exists prs_super_admin_idx on property_review_state(super_admin_id);

create trigger prs_touch
  before update on property_review_state
  for each row execute function touch_updated_at();

alter table property_review_state enable row level security;

drop policy if exists prs_select on property_review_state;
create policy prs_select on property_review_state for select to authenticated
  using (super_admin_id = auth.uid() and is_super_admin());

drop policy if exists prs_insert on property_review_state;
create policy prs_insert on property_review_state for insert to authenticated
  with check (super_admin_id = auth.uid() and is_super_admin());

drop policy if exists prs_update on property_review_state;
create policy prs_update on property_review_state for update to authenticated
  using (super_admin_id = auth.uid() and is_super_admin())
  with check (super_admin_id = auth.uid() and is_super_admin());

-- ─── RPC: counts of new bookings per property ───────────────────────────────
-- One row per active property (even if count = 0, so the client can render
-- the full table without separate fetches). Restricted to super admins.

create or replace function get_property_new_counts()
  returns table (property_id uuid, new_count integer)
  language sql
  stable
  security definer
  set search_path = public
as $$
  select
    pr.id as property_id,
    coalesce((
      select count(*)::int
        from bookings b
       where b.property_id = pr.id
         and b.created_at > coalesce(s.last_reviewed_at, '1970-01-01T00:00:00Z'::timestamptz)
    ), 0) as new_count
    from properties pr
    left join property_review_state s
      on s.property_id    = pr.id
     and s.super_admin_id = auth.uid()
   where pr.active
     and is_super_admin();
$$;

grant execute on function get_property_new_counts() to authenticated;

-- ─── RPC: mark a property row as reviewed ───────────────────────────────────

create or replace function mark_property_reviewed(p_property_id uuid)
  returns void
  language plpgsql
  security definer
  set search_path = public
as $$
begin
  if not is_super_admin() then
    raise exception 'mark_property_reviewed: only super admins may call this';
  end if;

  insert into property_review_state (super_admin_id, property_id, last_reviewed_at)
    values (auth.uid(), p_property_id, now())
  on conflict (super_admin_id, property_id)
    do update set last_reviewed_at = excluded.last_reviewed_at,
                  updated_at       = now();
end;
$$;

grant execute on function mark_property_reviewed(uuid) to authenticated;
