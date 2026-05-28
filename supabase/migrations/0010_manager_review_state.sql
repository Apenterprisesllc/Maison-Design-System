-- ============================================================================
-- Super-admin notification badges on the /admin/managers list.
--
-- For each (super admin × property manager) pair we store the timestamp of
-- the super admin's last review. The Outlook-style count on a row is then:
--
--     count of bookings on that manager's property
--     where created_at > coalesce(last_reviewed_at, epoch).
--
-- An RPC exposes the count in a single round-trip to avoid N+1 fetches.
-- ============================================================================

create table if not exists manager_review_state (
  super_admin_id      uuid        not null references profiles(id) on delete cascade,
  property_manager_id uuid        not null references profiles(id) on delete cascade,
  last_reviewed_at    timestamptz not null default '1970-01-01T00:00:00Z'::timestamptz,
  updated_at          timestamptz not null default now(),
  primary key (super_admin_id, property_manager_id)
);

create index if not exists mrs_super_admin_idx on manager_review_state(super_admin_id);

create trigger mrs_touch
  before update on manager_review_state
  for each row execute function touch_updated_at();

alter table manager_review_state enable row level security;

drop policy if exists mrs_select on manager_review_state;
create policy mrs_select on manager_review_state for select to authenticated
  using (super_admin_id = auth.uid() and is_super_admin());

drop policy if exists mrs_insert on manager_review_state;
create policy mrs_insert on manager_review_state for insert to authenticated
  with check (super_admin_id = auth.uid() and is_super_admin());

drop policy if exists mrs_update on manager_review_state;
create policy mrs_update on manager_review_state for update to authenticated
  using (super_admin_id = auth.uid() and is_super_admin())
  with check (super_admin_id = auth.uid() and is_super_admin());

-- ─── RPC: counts of new bookings per manager ────────────────────────────────
-- One row per property_manager (whether they have new bookings or not).
-- Callable by any authenticated user; the function enforces super_admin
-- internally so it's a no-op for other roles.

create or replace function get_manager_new_counts()
  returns table (manager_id uuid, new_count integer)
  language sql
  stable
  security definer
  set search_path = public
as $$
  select
    p.id as manager_id,
    coalesce((
      select count(*)::int
        from bookings b
       where b.property_id = p.primary_property_id
         and b.created_at > coalesce(m.last_reviewed_at, '1970-01-01T00:00:00Z'::timestamptz)
    ), 0) as new_count
    from profiles p
    left join manager_review_state m
      on m.property_manager_id = p.id
     and m.super_admin_id      = auth.uid()
   where p.role = 'property_manager'
     and is_super_admin();
$$;

grant execute on function get_manager_new_counts() to authenticated;

-- ─── RPC: mark a manager row as reviewed ────────────────────────────────────
-- Upserts to "now" so the next call to get_manager_new_counts() returns 0
-- for this manager.

create or replace function mark_manager_reviewed(p_manager_id uuid)
  returns void
  language plpgsql
  security definer
  set search_path = public
as $$
begin
  if not is_super_admin() then
    raise exception 'mark_manager_reviewed: only super admins may call this';
  end if;

  insert into manager_review_state (super_admin_id, property_manager_id, last_reviewed_at)
    values (auth.uid(), p_manager_id, now())
  on conflict (super_admin_id, property_manager_id)
    do update set last_reviewed_at = excluded.last_reviewed_at,
                  updated_at       = now();
end;
$$;

grant execute on function mark_manager_reviewed(uuid) to authenticated;
