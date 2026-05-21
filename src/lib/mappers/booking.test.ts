import { describe, expect, it } from 'vitest';
import { toBookingRecord, toOpsBooking } from './booking';
import { TEST_BOOKING } from '../../test/fixtures';

describe('toBookingRecord (Portal)', () => {
  it('preserves the human reference and pulls snapshot fields', () => {
    const record = toBookingRecord(TEST_BOOKING);
    expect(record.reference).toBe('B-4001');
    expect(record.serviceId).toBe('deep');
    expect(record.serviceName).toBe('Deep Cleaning');
    expect(record.serviceKicker).toBe('Housekeeping');
    expect(record.attendant).toBe('Hudson & Co.');
    expect(record.price).toBe(320);
  });

  it('maps DB status to Portal kind + statusKey', () => {
    expect(toBookingRecord(TEST_BOOKING).kind).toBe('upcoming');
    expect(toBookingRecord({ ...TEST_BOOKING, status: 'scheduled' }).statusKey).toBe('confirmed');
    expect(toBookingRecord({ ...TEST_BOOKING, status: 'enroute' }).statusKey).toBe('confirmed');
    expect(toBookingRecord({ ...TEST_BOOKING, status: 'closed' })).toMatchObject({
      kind: 'past',
      statusKey: 'closed',
      statusTone: 'neutral',
    });
    expect(toBookingRecord({ ...TEST_BOOKING, status: 'cancelled' })).toMatchObject({
      kind: 'past',
      statusKey: 'cancelled',
      statusTone: 'danger',
    });
  });

  it('formats the dateLabel as "Mon DD, YYYY"', () => {
    const record = toBookingRecord(TEST_BOOKING);
    expect(record.dateLabel).toMatch(/^[A-Z][a-z]{2} \d{2}, \d{4}$/);
  });

  it('returns "—" for attendant when snapshot is missing it', () => {
    const record = toBookingRecord({
      ...TEST_BOOKING,
      resident_snapshot: { full_name: 'X', display_name: 'X', unit: { external_id: '1' } },
    });
    expect(record.attendant).toBe('—');
  });
});

describe('toOpsBooking (Ops)', () => {
  it('exposes reference as a separate field from the UUID id', () => {
    const ops = toOpsBooking(TEST_BOOKING, {
      unitExternalId: '1402',
      residentSurname: 'Ashcombe, E.',
      serviceName: 'Deep Cleaning',
      serviceSlug: 'deep',
      attendantName: 'Hudson & Co.',
    });
    expect(ops.id).toBe(TEST_BOOKING.id);
    expect(ops.reference).toBe('B-4001');
    expect(ops.unit).toBe('1402');
    expect(ops.resident).toBe('Ashcombe, E.');
    expect(ops.service).toBe('Deep Cleaning');
    expect(ops.serviceKey).toBe('deep');
    expect(ops.price).toBe(320);
    expect(ops.status).toBe('scheduled');
  });

  it('omits note when undefined and includes it when set', () => {
    const ctx = {
      unitExternalId: '1402',
      residentSurname: 'A',
      serviceName: 'Deep',
      serviceSlug: 'deep',
      attendantName: 'X',
    };
    expect(toOpsBooking({ ...TEST_BOOKING, note: null }, ctx).note).toBeUndefined();
    expect(toOpsBooking({ ...TEST_BOOKING, note: 'door code 4242' }, ctx).note).toBe(
      'door code 4242',
    );
  });
});
