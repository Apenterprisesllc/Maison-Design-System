import type { BookingRecord } from '../routes/Portal/types';
import type { Resident } from '../routes/Portal/types';

/**
 * Generate an iCalendar (RFC 5545) event for an AP Enterprises booking.
 * The output is a complete VCALENDAR string suitable for download or email.
 */

const SERVICE_DURATION_MIN = 90; // Default visit length

function pad(n: number): string {
  return n < 10 ? '0' + n : String(n);
}

/** Convert a Date to an iCal UTC stamp: 20260513T143000Z */
function toIcsUtc(date: Date): string {
  return (
    date.getUTCFullYear().toString() +
    pad(date.getUTCMonth() + 1) +
    pad(date.getUTCDate()) +
    'T' +
    pad(date.getUTCHours()) +
    pad(date.getUTCMinutes()) +
    pad(date.getUTCSeconds()) +
    'Z'
  );
}

/** Parse a human time like "10:30 AM" → { h, m } in 24h */
function parseClock(label: string): { h: number; m: number } {
  const m = label.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!m) return { h: 9, m: 0 };
  let h = parseInt(m[1]!, 10);
  const min = parseInt(m[2]!, 10);
  const meridian = m[3]?.toUpperCase();
  if (meridian === 'PM' && h < 12) h += 12;
  if (meridian === 'AM' && h === 12) h = 0;
  return { h, m: min };
}

/** Build the start Date from a booking's dateLabel + time. Falls back to today. */
function buildStartDate(dateLabel: string, time: string): Date {
  // dateLabel like "May 14, 2026" or "Apr 18, 2026"
  const parsed = new Date(dateLabel);
  const start = isNaN(parsed.getTime()) ? new Date() : parsed;
  const { h, m } = parseClock(time);
  start.setHours(h, m, 0, 0);
  return start;
}

function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

export interface BookingForIcs {
  id: string;
  dateLabel: string;
  time: string;
  serviceName: string;
  attendant: string;
  note?: string;
  price: number;
}

export function buildIcs(booking: BookingForIcs, resident: Resident): string {
  const start = buildStartDate(booking.dateLabel, booking.time);
  const end = new Date(start.getTime() + SERVICE_DURATION_MIN * 60_000);
  const stamp = toIcsUtc(new Date());

  const summary = `${booking.serviceName} · ${resident.building}`;
  const description = [
    `Attendant: ${booking.attendant}`,
    `Residence: ${resident.building}, ${resident.residence}`,
    booking.note ? `Note: ${booking.note}` : '',
    `Charged after visit: $${booking.price}`,
  ]
    .filter(Boolean)
    .join('\\n');
  const location = `${resident.building}, Residence ${resident.residence}`;

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//AP Enterprises//Members//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:apenterprises-${booking.id}@example.apenterprises`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${toIcsUtc(start)}`,
    `DTEND:${toIcsUtc(end)}`,
    `SUMMARY:${escapeIcsText(summary)}`,
    `DESCRIPTION:${escapeIcsText(description)}`,
    `LOCATION:${escapeIcsText(location)}`,
    'STATUS:CONFIRMED',
    'TRANSP:OPAQUE',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

/** Trigger a download of a string as a named file. */
export function downloadIcs(filename: string, contents: string): void {
  const blob = new Blob([contents], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Defer revoke so Safari completes the download
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

export function bookingIcsFilename(booking: BookingForIcs): string {
  const slug = booking.serviceName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `apenterprises-${slug}-${booking.id}.ics`;
}
