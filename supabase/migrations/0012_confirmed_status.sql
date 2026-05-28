-- ============================================================================
-- Booking lifecycle: add the "confirmed" stage.
--
-- The pipeline now has five columns: Scheduled → Confirmed → En Route →
-- In Progress → Closed. "Confirmed" is the moment the manager assigns a
-- specific person (the assignee) to perform the visit — captured in the new
-- bookings.assignee_name column.
--
-- The existing `attendant_id` FK to the attendants table (vendor companies)
-- stays untouched. assignee_name is a free-form per-booking name like "Jorge"
-- or "Maria L." that the manager types into the modal when dragging a card
-- to the Confirmed column.
-- ============================================================================

-- ─── 1. Extend the booking_status enum ──────────────────────────────────────
-- Postgres requires enum values be added one at a time; "if not exists"
-- guards against re-running the migration.

alter type booking_status add value if not exists 'confirmed' after 'scheduled';

-- ─── 2. Capture the assignee on the booking row ─────────────────────────────

alter table bookings
  add column if not exists assignee_name text;
