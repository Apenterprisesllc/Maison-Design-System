import type { BookingRow, BookingStatus as DbBookingStatus } from '../types/db';
import type { BookingRecord, BookingStatus as PortalBookingStatus } from '../../routes/Portal/types';
import type { OpsBooking, BookingStatus as OpsStatus } from '../../routes/Ops/data';
import type { PillTone } from '../../components';

export interface BookingDisplay {
  reference: string;
  serviceName: string;
  serviceKicker: string;
  serviceSlug: string;
  residentDisplay: string;
  residentFull: string;
  unitExternalId: string;
  attendantName: string;
}

interface ServiceSnapshot {
  slug?: string;
  name?: string;
  kicker?: string;
}

interface ResidentSnapshot {
  full_name?: string;
  display_name?: string;
}

interface UnitSnapshot {
  external_id?: string;
}

function readServiceSnapshot(value: unknown): ServiceSnapshot {
  if (!value || typeof value !== 'object') return {};
  return value as ServiceSnapshot;
}

function readResidentSnapshot(value: unknown): ResidentSnapshot & { unit?: UnitSnapshot; attendant?: { name?: string } } {
  if (!value || typeof value !== 'object') return {};
  return value as ResidentSnapshot & { unit?: UnitSnapshot; attendant?: { name?: string } };
}

const PORTAL_STATUS_MAP: Record<DbBookingStatus, PortalBookingStatus> = {
  scheduled: 'confirmed',
  confirmed: 'confirmed',
  enroute: 'confirmed',
  active: 'confirmed',
  closed: 'closed',
  cancelled: 'cancelled',
};

const PORTAL_STATUS_LABEL: Record<DbBookingStatus, string> = {
  scheduled: 'Confirmed',
  confirmed: 'Confirmed',
  enroute: 'En Route',
  active: 'In Progress',
  closed: 'Closed',
  cancelled: 'Cancelled',
};

const PORTAL_STATUS_TONE: Record<DbBookingStatus, PillTone> = {
  scheduled: 'success',
  confirmed: 'success',
  enroute: 'warning',
  active: 'info',
  closed: 'neutral',
  cancelled: 'danger',
};

const PAST_STATUSES = new Set<DbBookingStatus>(['closed', 'cancelled']);

export function toBookingRecord(row: BookingRow): BookingRecord {
  const svcSnap = readServiceSnapshot(row.service_snapshot);
  const resSnap = readResidentSnapshot(row.resident_snapshot);
  const date = new Date(row.scheduled_at);
  const dateLabel = date.toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  });
  const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return {
    id: row.id,
    reference: row.reference,
    serviceId: svcSnap.slug ?? '',
    kind: PAST_STATUSES.has(row.status) ? 'past' : 'upcoming',
    date: row.scheduled_at,
    dateLabel,
    time,
    serviceKicker: svcSnap.kicker ?? '',
    serviceName: svcSnap.name ?? '',
    attendant: resSnap.attendant?.name ?? '—',
    price: Math.round(row.price_cents / 100),
    status: PORTAL_STATUS_LABEL[row.status],
    statusKey: PORTAL_STATUS_MAP[row.status],
    statusTone: PORTAL_STATUS_TONE[row.status],
    note: row.note ?? undefined,
  };
}

export function toOpsBooking(
  row: BookingRow,
  ctx: { unitExternalId: string; residentSurname: string; serviceName: string; serviceSlug: string; attendantName: string },
): OpsBooking {
  const date = new Date(row.scheduled_at);
  const result: OpsBooking = {
    id: row.id,
    reference: row.reference,
    date: date.toLocaleDateString('en-US', { day: '2-digit', month: 'short' }).replace(',', ''),
    time: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: false }),
    unit: ctx.unitExternalId,
    resident: ctx.residentSurname,
    service: ctx.serviceName,
    serviceKey: ctx.serviceSlug,
    attendant: ctx.attendantName,
    status: row.status as OpsStatus,
    price: Math.round(row.price_cents / 100),
    arrivedAt: row.arrived_at ?? null,
    scheduledAt: row.scheduled_at,
  };
  if (row.note) result.note = row.note;
  if (row.assignee_name) result.assignee = row.assignee_name;
  return result;
}
