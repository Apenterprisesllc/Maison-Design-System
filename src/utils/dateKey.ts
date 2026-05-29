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

/**
 * Offset, in ms, that the business timezone had at the given instant:
 * `wallClockAsUTC - instant` (negative west of UTC, e.g. -4h/-5h for ET).
 */
function tzOffsetMs(instant: Date): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: BUSINESS_TIMEZONE,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const map: Record<string, number> = {};
  for (const p of dtf.formatToParts(instant)) {
    if (p.type !== 'literal') map[p.type] = Number(p.value);
  }
  const asUTC = Date.UTC(map.year!, map.month! - 1, map.day!, map.hour!, map.minute!, map.second!);
  return asUTC - instant.getTime();
}

/**
 * Build the UTC instant for a wall-clock time in the business timezone (ET),
 * DST-aware. `month0` is 0-indexed (JS convention). Day/hour overflow is
 * normalised by Date.UTC. A "9:00 AM" slot must mean 9 AM Florida time
 * regardless of the booker's browser timezone.
 */
export function etDateTimeToUtc(
  year: number,
  month0: number,
  day: number,
  hour: number,
  minute: number,
): Date {
  // Treat the wall-clock as UTC, then subtract ET's offset at that instant.
  // One correction pass is exact outside the ~1h DST-fold window, which never
  // overlaps business booking hours.
  const guess = Date.UTC(year, month0, day, hour, minute, 0);
  return new Date(guess - tzOffsetMs(new Date(guess)));
}

/** The ET calendar date (year, 0-indexed month, day) that an instant falls on. */
function etDateParts(instant: Date): { year: number; month0: number; day: number } {
  const map: Record<string, number> = {};
  for (const p of formatter.formatToParts(instant)) {
    if (p.type !== 'literal') map[p.type] = Number(p.value);
  }
  return { year: map.year!, month0: map.month! - 1, day: map.day! };
}

/**
 * UTC [start, end) bounds of the ET calendar day that `instant` belongs to.
 * `end` is the start of the next ET day (DST-correct: not a naive +24h).
 */
export function etDayBounds(instant: Date): { start: Date; end: Date } {
  const { year, month0, day } = etDateParts(instant);
  return {
    start: etDateTimeToUtc(year, month0, day, 0, 0),
    end: etDateTimeToUtc(year, month0, day + 1, 0, 0),
  };
}

/**
 * Combine a picked calendar day (read from its displayed Y/M/D) with an
 * hour/minute, interpreting the result as ET wall-clock. Use this everywhere a
 * slot time is turned into a stored `scheduled_at`.
 */
export function etSlotToUtc(pickedDay: Date, hour: number, minute: number): Date {
  return etDateTimeToUtc(pickedDay.getFullYear(), pickedDay.getMonth(), pickedDay.getDate(), hour, minute);
}
