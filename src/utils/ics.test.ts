import { describe, expect, it } from 'vitest';
import { bookingIcsFilename, buildIcs } from './ics';
import type { Resident } from '../routes/Portal/types';

const resident: Resident = {
  building: 'The Arden',
  residence: '1402',
  name: 'Eleanor Ashcombe',
  track: 'residential',
};

describe('buildIcs', () => {
  it('produces a well-formed VCALENDAR with UID, DTSTART, DTEND', () => {
    const ics = buildIcs(
      {
        id: 'B-4001',
        dateLabel: 'May 14, 2026',
        time: '10:30 AM',
        serviceName: 'Deep Cleaning',
        attendant: 'Hudson & Co.',
        price: 320,
        note: undefined,
      },
      resident,
    );

    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('END:VCALENDAR');
    expect(ics).toContain('BEGIN:VEVENT');
    expect(ics).toContain('END:VEVENT');
    expect(ics).toContain('UID:apenterprises-B-4001@example.apenterprises');
    expect(ics).toMatch(/DTSTART:\d{8}T\d{6}Z/);
    expect(ics).toMatch(/DTEND:\d{8}T\d{6}Z/);
    expect(ics).toContain('SUMMARY:Deep Cleaning · The Arden');
    expect(ics).toContain('LOCATION:The Arden\\, Residence 1402');
  });

  it('escapes commas, semicolons, and newlines per RFC 5545', () => {
    const ics = buildIcs(
      {
        id: 'B-4002',
        dateLabel: 'May 14, 2026',
        time: '9:00 AM',
        serviceName: 'Window, Service',
        attendant: 'Hudson; & Co.',
        price: 240,
        note: 'line a\nline b',
      },
      resident,
    );
    expect(ics).toContain('SUMMARY:Window\\, Service · The Arden');
    expect(ics).toContain('Note: line a\\nline b');
  });

  it('uses CRLF line endings as the spec requires', () => {
    const ics = buildIcs(
      {
        id: 'B-4003',
        dateLabel: 'May 14, 2026',
        time: '9:00 AM',
        serviceName: 'Deep Cleaning',
        attendant: 'Hudson & Co.',
        price: 320,
      },
      resident,
    );
    // CRLF between lines, no bare LF
    expect(ics).toContain('\r\n');
    expect(ics.split('\r\n').length).toBeGreaterThan(5);
  });
});

describe('bookingIcsFilename', () => {
  it('slugifies the service name and includes the reference', () => {
    expect(
      bookingIcsFilename({
        id: 'B-4001',
        dateLabel: 'May 14, 2026',
        time: '10:30 AM',
        serviceName: 'After-Hours Office',
        attendant: 'Hudson & Co.',
        price: 290,
      }),
    ).toBe('apenterprises-after-hours-office-B-4001.ics');
  });
});
