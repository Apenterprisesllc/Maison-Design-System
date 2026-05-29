-- ─── Expose referrals.referrer_id → profiles for PostgREST embeds ──────────
--
-- referrals.referrer_id only references auth.users(id), which PostgREST cannot
-- see (different schema). Any future embed like
--   from('referrals').select('*, referrer:profiles(*)')
-- would 404 against real Supabase even though MSW mocks accept it — the same
-- trap that bit the unit_members embed (see 0007). Add the explicit FK now so
-- the relationship resolves. profiles.id is itself a FK to auth.users(id), and
-- profiles are created by handle_new_user before any referral can reference the
-- user, so the constraint is always satisfiable.

alter table referrals
  drop constraint if exists referrals_referrer_profile_fkey;

alter table referrals
  add constraint referrals_referrer_profile_fkey
  foreign key (referrer_id) references profiles(id) on delete restrict;

-- Hint PostgREST to refresh its schema cache immediately.
notify pgrst, 'reload schema';
