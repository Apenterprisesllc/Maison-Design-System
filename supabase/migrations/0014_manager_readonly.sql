-- ============================================================================
-- Tighten property_manager RLS: managers become read-only on operational
-- tables. Their only write action is creating referrals (see 0013).
--
-- Effect of this migration:
--   bookings     — manager loses INSERT / UPDATE (still SELECT for own property)
--   units        — manager loses ALL write (still SELECT)
--   services     — manager loses ALL write
--   attendants   — manager loses ALL write
--   unit_members — manager loses ALL write
--
-- Super admin retains full control on everything. Guest insert on bookings
-- (anon role) is untouched.
-- ============================================================================

-- ─── bookings ───────────────────────────────────────────────────────────────

drop policy if exists bookings_insert on bookings;
create policy bookings_insert on bookings for insert to authenticated with check (
  is_super_admin()
  or (is_unit_member(unit_id) and created_by = auth.uid())
);

drop policy if exists bookings_update on bookings;
create policy bookings_update on bookings for update to authenticated
  using (is_super_admin())
  with check (is_super_admin());

-- bookings_delete and bookings_guest_insert remain unchanged.

-- ─── units ──────────────────────────────────────────────────────────────────

drop policy if exists units_write on units;
create policy units_write on units for all to authenticated
  using (is_super_admin())
  with check (is_super_admin());

-- ─── services ───────────────────────────────────────────────────────────────

drop policy if exists services_write on services;
create policy services_write on services for all to authenticated
  using (is_super_admin())
  with check (is_super_admin());

-- ─── attendants ─────────────────────────────────────────────────────────────

drop policy if exists attendants_write on attendants;
create policy attendants_write on attendants for all to authenticated
  using (is_super_admin())
  with check (is_super_admin());

-- ─── unit_members ───────────────────────────────────────────────────────────

drop policy if exists unit_members_write on unit_members;
create policy unit_members_write on unit_members for all to authenticated
  using (is_super_admin())
  with check (is_super_admin());
