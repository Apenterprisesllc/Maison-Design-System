import { describe, expect, it } from 'vitest';
import { businessDateKey, etDateTimeToUtc, etDayBounds, etSlotToUtc } from './dateKey';

// These assertions are independent of the machine's local timezone: every
// helper anchors on America/New_York via Intl, which is exactly the property
// that makes booking times correct for non-ET browsers.

describe('etDateTimeToUtc', () => {
  it('treats the wall-clock as EDT (UTC-4) in summer', () => {
    // 9:00 AM ET on Jun 15 2026 → 13:00 UTC.
    expect(etDateTimeToUtc(2026, 5, 15, 9, 0).toISOString()).toBe('2026-06-15T13:00:00.000Z');
  });

  it('treats the wall-clock as EST (UTC-5) in winter', () => {
    // 9:00 AM ET on Jan 15 2026 → 14:00 UTC.
    expect(etDateTimeToUtc(2026, 0, 15, 9, 0).toISOString()).toBe('2026-01-15T14:00:00.000Z');
  });
});

describe('etSlotToUtc', () => {
  it('reads the picked day and anchors the time to ET', () => {
    // A browser-local midnight Date for Jun 15 still books 10:30 AM Florida time.
    const pickedDay = new Date(2026, 5, 15);
    expect(etSlotToUtc(pickedDay, 10, 30).toISOString()).toBe('2026-06-15T14:30:00.000Z');
  });
});

describe('etDayBounds', () => {
  it('returns the ET-midnight window for the ET day an instant falls on', () => {
    // 02:00 UTC Jun 16 is still 22:00 EDT Jun 15, so the day is Jun 15 ET.
    const { start, end } = etDayBounds(new Date('2026-06-16T02:00:00.000Z'));
    expect(start.toISOString()).toBe('2026-06-15T04:00:00.000Z');
    expect(end.toISOString()).toBe('2026-06-16T04:00:00.000Z');
  });
});

describe('businessDateKey', () => {
  it('buckets a late-evening ET booking under its ET date, not the UTC date', () => {
    // 01:00 UTC May 27 is 21:00 EDT May 26.
    expect(businessDateKey('2026-05-27T01:00:00.000Z')).toBe('2026-05-26');
  });
});
