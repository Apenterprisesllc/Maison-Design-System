-- ============================================================================
-- Add an explicit FK from unit_members.user_id → profiles(id) so PostgREST
-- can resolve the embedded select used by the Ops Residences loader:
--
--   from('units').select('*, members:unit_members(role, is_primary,
--                                                 profile:profiles(*))')
--
-- Without this FK, PostgREST cannot find a relationship between
-- `unit_members` and `profiles` (the existing FK on user_id points at
-- auth.users, which lives in a different schema and is not exposed to
-- PostgREST's relationship cache), so the embed returns 404 and the entire
-- Ops loader's Promise.all rejects — leaving the Pipeline + Bookings panels
-- empty even when rows exist.
--
-- profiles.id is itself a FK to auth.users(id), so the new constraint is
-- always satisfied (profiles are auto-created by the handle_new_user trigger
-- before any unit_members row referencing the same user can exist).
-- ============================================================================

alter table unit_members
  drop constraint if exists unit_members_user_profile_fkey;

alter table unit_members
  add constraint unit_members_user_profile_fkey
  foreign key (user_id) references profiles(id) on delete cascade;

-- Hint PostgREST to refresh its schema cache immediately.
notify pgrst, 'reload schema';
