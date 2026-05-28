// AP Enterprises operates exclusively in South Florida. Every "what day is
// this booking on?" comparison — calendar buckets, BookingsTable date chip,
// the `get_weekly_booking_counts` RPC — must agree on the same wall-clock
// day. We anchor on America/New_York to avoid UTC drift counting late-evening
// visits on the next day.
const BUSINESS_TIMEZONE = 'America/New_York';

const formatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: BUSINESS_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/**
 * Returns YYYY-MM-DD in the business timezone. Accepts a Date or an ISO string.
 * The output matches what `get_weekly_booking_counts` produces server-side,
 * so calendar cells and BookingsTable filters can compare keys directly.
 */
export function businessDateKey(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  return formatter.format(date);
}
