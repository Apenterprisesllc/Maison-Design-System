-- ============================================================================
-- Add the 'referral_created' notification kind.
--
-- Postgres forbids using a newly added enum value in the same transaction that
-- added it (ADD VALUE is not transaction-safe for immediate use). The trigger
-- that actually inserts notifications with this kind therefore lives in the
-- next migration (0020), so this value is committed before it is referenced.
-- ============================================================================

alter type notification_kind add value if not exists 'referral_created';
