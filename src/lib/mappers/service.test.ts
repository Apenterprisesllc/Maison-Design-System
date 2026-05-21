import { describe, expect, it } from 'vitest';
import { buildServiceLookup, cadenceLabel, toService } from './service';
import { TEST_SERVICE_DEEP, TEST_SERVICE_OFFICE_NIGHT } from '../../test/fixtures';

describe('cadenceLabel', () => {
  it('humanises every cadence enum value', () => {
    expect(cadenceLabel('monthly')).toBe('Monthly');
    expect(cadenceLabel('on_request')).toBe('On request');
    expect(cadenceLabel('per_listing')).toBe('Per listing');
    expect(cadenceLabel('project_based')).toBe('Project-based');
    expect(cadenceLabel('nightly')).toBe('Nightly');
  });
});

describe('toService', () => {
  it('maps a DB row to the frontend Service shape using slug as id', () => {
    const service = toService(TEST_SERVICE_DEEP);
    expect(service).toEqual({
      id: 'deep',
      name: 'Deep Cleaning',
      kicker: 'Housekeeping',
      icon: 'sparkles',
      tone: 'stone',
      price: 320,
      cadence: 'Monthly',
      description: 'A full residence clean by a two-person team.',
      photoPath: null,
    });
  });

  it('divides price_cents by 100 and rounds', () => {
    const service = toService({ ...TEST_SERVICE_DEEP, price_cents: 32099 });
    expect(service.price).toBe(321);
  });
});

describe('buildServiceLookup', () => {
  it('indexes services by uuid and by slug', () => {
    const lookup = buildServiceLookup([TEST_SERVICE_DEEP, TEST_SERVICE_OFFICE_NIGHT]);
    expect(lookup.byUuid.get(TEST_SERVICE_DEEP.id)?.slug).toBe('deep');
    expect(lookup.bySlug.get('office-night')?.id).toBe(TEST_SERVICE_OFFICE_NIGHT.id);
    expect(lookup.byUuid.size).toBe(2);
    expect(lookup.bySlug.size).toBe(2);
  });
});
