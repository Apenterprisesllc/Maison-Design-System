-- ─── Align weekly booking counts with the business timezone ────────────────
--
-- Previously `get_weekly_booking_counts` bucketed bookings by their UTC date.
-- That meant a booking scheduled for, say, 9 pm Eastern on May 26 (which is
-- 01:00 UTC on May 27) was counted under May 27 by the RPC but the BookingsTable
-- filter — which uses the browser's local time — looked for it under May 26.
-- The /admin calendar would show "1" on Wed May 27 and the drill-in page would
-- return zero rows. AP Enterprises operates exclusively in South Florida, so
-- America/New_York is the canonical day for every grouping.

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
    (b.scheduled_at at time zone 'America/New_York')::date as day,
    count(*)::int as count
  from bookings b
  where b.scheduled_at >= p_start
    and b.scheduled_at <  p_end
    and b.status <> 'cancelled'
    and (is_super_admin() or is_manager_of(b.property_id))
  group by b.property_id, (b.scheduled_at at time zone 'America/New_York')::date;
$$;
