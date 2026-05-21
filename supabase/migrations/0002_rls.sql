-- ============================================================================
-- AP Enterprises Members — Row Level Security policies
-- ============================================================================

alter table properties            enable row level security;
alter table profiles              enable row level security;
alter table units                 enable row level security;
alter table unit_members          enable row level security;
alter table services              enable row level security;
alter table attendants            enable row level security;
alter table bookings              enable row level security;
alter table booking_status_events enable row level security;
alter table booking_attachments   enable row level security;
alter table notifications         enable row level security;

-- ─── properties ─────────────────────────────────────────────────────────────

create policy properties_select on properties for select to authenticated using (
  is_super_admin()
  or is_manager_of(id)
  or exists (
    select 1 from units u
    join unit_members m on m.unit_id = u.id
    where u.property_id = properties.id and m.user_id = auth.uid()
  )
);
create policy properties_write on properties for all to authenticated
  using (is_super_admin())
  with check (is_super_admin());

-- ─── profiles ───────────────────────────────────────────────────────────────

create policy profiles_select on profiles for select to authenticated using (
  id = auth.uid()
  or is_super_admin()
  or (primary_property_id is not null and is_manager_of(primary_property_id))
);
create policy profiles_update on profiles for update to authenticated
  using (id = auth.uid() or is_super_admin())
  with check (id = auth.uid() or is_super_admin());
-- Inserts handled by the on_auth_user_created trigger (security definer).

-- ─── units ──────────────────────────────────────────────────────────────────

create policy units_select on units for select to authenticated using (
  is_super_admin() or is_manager_of(property_id) or is_unit_member(id)
);
create policy units_write on units for all to authenticated
  using (is_super_admin() or is_manager_of(property_id))
  with check (is_super_admin() or is_manager_of(property_id));

-- ─── unit_members ───────────────────────────────────────────────────────────

create policy unit_members_select on unit_members for select to authenticated using (
  user_id = auth.uid()
  or is_super_admin()
  or exists (select 1 from units u where u.id = unit_id and is_manager_of(u.property_id))
);
create policy unit_members_write on unit_members for all to authenticated
  using (
    is_super_admin()
    or exists (select 1 from units u where u.id = unit_id and is_manager_of(u.property_id))
  )
  with check (
    is_super_admin()
    or exists (select 1 from units u where u.id = unit_id and is_manager_of(u.property_id))
  );

-- ─── services ──────────────────────────────────────────────────────────────

create policy services_select on services for select to authenticated using (active);
create policy services_write on services for all to authenticated
  using (
    is_super_admin()
    or (property_id is not null and is_manager_of(property_id))
  )
  with check (
    is_super_admin()
    or (property_id is not null and is_manager_of(property_id))
  );

-- ─── attendants ─────────────────────────────────────────────────────────────

create policy attendants_select on attendants for select to authenticated using (
  active and (
    property_id is null
    or is_super_admin()
    or is_manager_of(property_id)
    or exists (
      select 1 from units u join unit_members m on m.unit_id = u.id
      where u.property_id = attendants.property_id and m.user_id = auth.uid()
    )
  )
);
create policy attendants_write on attendants for all to authenticated
  using (
    is_super_admin()
    or (property_id is not null and is_manager_of(property_id))
  )
  with check (
    is_super_admin()
    or (property_id is not null and is_manager_of(property_id))
  );

-- ─── bookings ──────────────────────────────────────────────────────────────

create policy bookings_select on bookings for select to authenticated using (
  is_super_admin()
  or is_manager_of(property_id)
  or created_by = auth.uid()
  or is_unit_member(unit_id)
);
create policy bookings_insert on bookings for insert to authenticated with check (
  is_super_admin()
  or is_manager_of(property_id)
  or (is_unit_member(unit_id) and created_by = auth.uid())
);
create policy bookings_update on bookings for update to authenticated
  using (is_super_admin() or is_manager_of(property_id))
  with check (is_super_admin() or is_manager_of(property_id));
create policy bookings_delete on bookings for delete to authenticated
  using (is_super_admin());

-- ─── booking_status_events ──────────────────────────────────────────────────

create policy bse_select on booking_status_events for select to authenticated using (
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
-- Inserts only via trigger (security definer), no client policy.

-- ─── booking_attachments ────────────────────────────────────────────────────

create policy ba_select on booking_attachments for select to authenticated using (
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
create policy ba_write on booking_attachments for all to authenticated
  using (
    exists (
      select 1 from bookings b
      where b.id = booking_id and (is_super_admin() or is_manager_of(b.property_id))
    )
  )
  with check (
    uploaded_by = auth.uid()
    and exists (
      select 1 from bookings b
      where b.id = booking_id and (is_super_admin() or is_manager_of(b.property_id))
    )
  );

-- ─── notifications ──────────────────────────────────────────────────────────

create policy notifications_select on notifications for select to authenticated using (
  user_id = auth.uid() or is_super_admin()
);
-- Inserts only via service role from Edge Functions (no client policy).
