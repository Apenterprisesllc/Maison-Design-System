import type { ServiceCadence, ServiceRow, ServiceTone } from '../types/db';
import type { Service, ServiceTone as FrontendTone } from '../../routes/Portal/types';

const CADENCE_LABEL: Record<ServiceCadence, string> = {
  once: 'Once',
  on_request: 'On request',
  weekly: 'Weekly',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  seasonal: 'Seasonal',
  nightly: 'Nightly',
  per_event: 'Per event',
  per_visit: 'Per visit',
  per_listing: 'Per listing',
  project_based: 'Project-based',
};

export function cadenceLabel(cadence: ServiceCadence): string {
  return CADENCE_LABEL[cadence] ?? cadence;
}

export function toService(row: ServiceRow): Service {
  return {
    id: row.slug,
    name: row.name,
    kicker: row.kicker,
    icon: row.icon,
    tone: row.tone as FrontendTone,
    price: Math.round(row.price_cents / 100),
    cadence: cadenceLabel(row.cadence),
    description: row.description,
    photoPath: row.photo_path ?? null,
  };
}

export interface ServiceLookup {
  byUuid: Map<string, ServiceRow>;
  bySlug: Map<string, ServiceRow>;
}

export function buildServiceLookup(rows: ServiceRow[]): ServiceLookup {
  const byUuid = new Map<string, ServiceRow>();
  const bySlug = new Map<string, ServiceRow>();
  for (const r of rows) {
    byUuid.set(r.id, r);
    bySlug.set(r.slug, r);
  }
  return { byUuid, bySlug };
}

export const SERVICE_TONE_FALLBACK: ServiceTone = 'ink';
