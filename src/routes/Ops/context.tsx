import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { listAttendantsForProperty } from '../../lib/api/attendants';
import { listAllServices } from '../../lib/api/services';
import {
  listBookingsForProperty,
  createBooking as apiCreateBooking,
  updateBookingStatus as apiUpdateBookingStatus,
  updateBooking as apiUpdateBooking,
  confirmBookingWithAssignee as apiConfirmBookingWithAssignee,
  listBookingsForUnitDate,
  markArrived as apiMarkArrived,
} from '../../lib/api/bookings';
import {
  createUnit as apiCreateUnit,
  deleteUnit as apiDeleteUnit,
  listUnitsForProperty,
  toggleUnitStatus as apiToggleUnitStatus,
  updateUnit as apiUpdateUnit,
} from '../../lib/api/units';
import { getProperty } from '../../lib/api/properties';
import { etSlotToUtc } from '../../utils/dateKey';
import { subscribeToPropertyBookings } from '../../lib/realtime/bookings';
import { residentFullForUnit, residentSurnameForUnit, toOpsUnit } from '../../lib/mappers/unit';
import type { UnitWithMembers } from '../../lib/mappers/unit';
import { toOpsBooking } from '../../lib/mappers/booking';
import { buildServiceLookup } from '../../lib/mappers/service';
import {
  createReferral as apiCreateReferral,
  listAllReferrals,
  listMyReferrals,
} from '../../lib/api/referrals';
import type {
  AttendantRow,
  BookingRow,
  PropertyRow,
  ReferralRow,
  ServiceRow,
} from '../../lib/types/db';
import type { BookingStatus, OpsBooking, OpsUnit, UnitKind, UnitRole } from './data';

export interface NewBookingDraft {
  unit: string; // unit external_id
  serviceKey: string; // service slug
  date: string;
  time: string;
  note?: string;
}

export type NewUnitInput = Omit<OpsUnit, 'visits' | 'since'> &
  Partial<Pick<OpsUnit, 'visits' | 'since'>>;

export interface OpsContextValue {
  building: string;
  propertyName: string;
  propertyId: string | null;
  loading: boolean;
  /** True when a super_admin is viewing a property via ?property=uuid override. */
  viewingAsSuperAdmin: boolean;

  bookings: OpsBooking[];
  units: OpsUnit[];
  services: ServiceRow[];
  attendants: AttendantRow[];

  /** Property admin mutations — manage units / residents / commercial contacts. */
  createUnit: (input: NewUnitInput) => Promise<OpsUnit>;
  updateUnit: (id: string, patch: Partial<OpsUnit>) => Promise<void>;
  deleteUnit: (id: string) => Promise<void>;
  toggleUnitStatus: (id: string) => Promise<void>;

  /** Global search query — drives Bookings table, Residences, Command Palette. */
  search: string;
  setSearch: (q: string) => void;

  /** Selected booking opens BookingDetail drawer. */
  selectedBookingId: string | null;
  openBooking: (id: string) => void;
  closeBooking: () => void;
  selectedBooking: OpsBooking | undefined;

  /** Selected unit opens UnitDetail drawer. */
  selectedUnitId: string | null;
  openUnit: (id: string) => void;
  closeUnit: () => void;
  selectedUnit: OpsUnit | undefined;

  /** New-booking modal. */
  newBookingOpen: boolean;
  openNewBooking: (prefillUnit?: string) => void;
  closeNewBooking: () => void;
  newBookingPrefill: string | null;

  /** Command palette. */
  paletteOpen: boolean;
  openPalette: () => void;
  closePalette: () => void;
  togglePalette: () => void;

  /** Booking lifecycle. */
  setBookingStatus: (id: string, status: BookingStatus) => Promise<void>;
  confirmBookingWithAssignee: (id: string, assigneeName: string) => Promise<void>;
  cancelBooking: (id: string, reason?: string) => Promise<void>;
  createBooking: (draft: NewBookingDraft) => Promise<OpsBooking>;
  markArrived: (id: string) => Promise<void>;

  /** Referrals — managers create them, super admins manage the queue. */
  referrals: ReferralRow[];
  createReferral: (input: {
    referred_name: string;
    referred_phone: string;
    unit_id?: string | null;
    suggested_service_id?: string | null;
    note?: string | null;
  }) => Promise<ReferralRow>;
  refreshReferrals: () => Promise<void>;

  refresh: () => Promise<void>;
}

const OpsContext = createContext<OpsContextValue | null>(null);

function combineDateTime(dateLabel: string, time: string): Date {
  // dateLabel like "15 May" or "15 May 2026" — assume current year if missing.
  const labelWithYear = /\d{4}/.test(dateLabel) ? dateLabel : `${dateLabel} ${new Date().getFullYear()}`;
  const parsed = new Date(labelWithYear);
  const base = isNaN(parsed.getTime()) ? new Date() : parsed;
  const m = /^(\d+):(\d+)\s*(AM|PM)?$/i.exec(time.trim());
  if (!m) return base;
  let hour = parseInt(m[1]!, 10);
  const minute = parseInt(m[2]!, 10);
  const meridian = m[3]?.toUpperCase();
  if (meridian === 'PM' && hour < 12) hour += 12;
  if (meridian === 'AM' && hour === 12) hour = 0;
  // Anchor to Florida time (ET) so the stored instant matches the resident/guest
  // booking flow and the ET availability window, independent of browser timezone.
  return etSlotToUtc(base, hour, minute);
}

interface RawState {
  property: PropertyRow | null;
  rawUnits: UnitWithMembers[];
  rawBookings: BookingRow[];
  services: ServiceRow[];
  attendants: AttendantRow[];
  loading: boolean;
}

const INITIAL: RawState = {
  property: null,
  rawUnits: [],
  rawBookings: [],
  services: [],
  attendants: [],
  loading: true,
};

export function OpsProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  const [searchParams] = useSearchParams();
  const overrideProperty = searchParams.get('property');
  const isSuperAdmin = profile?.role === 'super_admin';
  // Super admins can scope to any property via ?property=uuid; managers stay
  // bound to their primary_property_id.
  const propertyId = isSuperAdmin && overrideProperty
    ? overrideProperty
    : profile?.primary_property_id ?? null;
  const viewingAsSuperAdmin = !!(isSuperAdmin && overrideProperty);

  const [raw, setRaw] = useState<RawState>(INITIAL);
  const [search, setSearch] = useState('');
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [newBookingOpen, setNewBookingOpen] = useState(false);
  const [newBookingPrefill, setNewBookingPrefill] = useState<string | null>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [referrals, setReferrals] = useState<ReferralRow[]>([]);

  const load = useCallback(async () => {
    if (!propertyId) {
      setRaw({ ...INITIAL, loading: false });
      return;
    }
    setRaw((prev) => ({ ...prev, loading: true }));
    try {
      const [property, rawUnits, rawBookings, services, attendants] = await Promise.all([
        getProperty(propertyId),
        listUnitsForProperty(propertyId),
        listBookingsForProperty(propertyId),
        listAllServices(propertyId),
        listAttendantsForProperty(propertyId),
      ]);
      setRaw({ property, rawUnits, rawBookings, services, attendants, loading: false });
    } catch (err) {
      console.error('[ops] load failed', err);
      setRaw((prev) => ({ ...prev, loading: false }));
    }
  }, [propertyId]);

  useEffect(() => {
    load();
  }, [load]);

  // Referrals: managers see their own; super admins see all (RLS handles it).
  const refreshReferrals = useCallback(async () => {
    if (!profile) {
      setReferrals([]);
      return;
    }
    try {
      const rows = isSuperAdmin
        ? await listAllReferrals()
        : await listMyReferrals(profile.id);
      setReferrals(rows);
    } catch (err) {
      console.error('[ops] referrals load failed', err);
      setReferrals([]);
    }
  }, [profile, isSuperAdmin]);

  useEffect(() => {
    refreshReferrals();
  }, [refreshReferrals]);

  const createReferral = useCallback(
    async (input: {
      referred_name: string;
      referred_phone: string;
      unit_id?: string | null;
      suggested_service_id?: string | null;
      note?: string | null;
    }) => {
      if (!profile) throw new Error('Not signed in.');
      if (!propertyId) throw new Error('No property in context.');
      const row = await apiCreateReferral({
        property_id: propertyId,
        referrer_id: profile.id,
        referred_name: input.referred_name,
        referred_phone: input.referred_phone,
        unit_id: input.unit_id ?? null,
        suggested_service_id: input.suggested_service_id ?? null,
        note: input.note ?? null,
      });
      setReferrals((prev) => [row, ...prev]);
      return row;
    },
    [profile, propertyId],
  );

  // Defense-in-depth: managers shouldn't reach the mutating code paths (the
  // UI doesn't expose them), but if they do, fail fast with a friendly error
  // instead of letting Supabase return an opaque RLS error.
  const onlyAdminError = (action: string) =>
    new Error(`Only AP can ${action}. Contact your account manager.`);

  // Realtime: keep bookings list in sync with other managers / resident actions.
  useEffect(() => {
    if (!propertyId) return;
    const unsub = subscribeToPropertyBookings(propertyId, (payload) => {
      setRaw((prev) => {
        const next = [...prev.rawBookings];
        if (payload.eventType === 'INSERT' && payload.new) {
          const row = payload.new as BookingRow;
          if (!next.some((b) => b.id === row.id)) next.unshift(row);
        } else if (payload.eventType === 'UPDATE' && payload.new) {
          const row = payload.new as BookingRow;
          const idx = next.findIndex((b) => b.id === row.id);
          if (idx >= 0) next[idx] = row;
          else next.unshift(row);
        } else if (payload.eventType === 'DELETE' && payload.old) {
          const removedId = (payload.old as { id?: string }).id;
          if (removedId) return { ...prev, rawBookings: next.filter((b) => b.id !== removedId) };
        }
        return { ...prev, rawBookings: next };
      });
    });
    return unsub;
  }, [propertyId]);

  const serviceLookup = useMemo(() => buildServiceLookup(raw.services), [raw.services]);
  const unitByExternalId = useMemo(() => {
    const map = new Map<string, UnitWithMembers>();
    for (const u of raw.rawUnits) map.set(u.row.external_id, u);
    return map;
  }, [raw.rawUnits]);
  const unitByUuid = useMemo(() => {
    const map = new Map<string, UnitWithMembers>();
    for (const u of raw.rawUnits) map.set(u.row.id, u);
    return map;
  }, [raw.rawUnits]);
  const attendantByUuid = useMemo(() => {
    const map = new Map<string, AttendantRow>();
    for (const a of raw.attendants) map.set(a.id, a);
    return map;
  }, [raw.attendants]);

  const units = useMemo<OpsUnit[]>(() => raw.rawUnits.map(toOpsUnit), [raw.rawUnits]);

  const bookings = useMemo<OpsBooking[]>(
    () =>
      raw.rawBookings.map((row) => {
        const unit = unitByUuid.get(row.unit_id);
        const service = serviceLookup.byUuid.get(row.service_id);
        const attendant = row.attendant_id ? attendantByUuid.get(row.attendant_id) : null;
        return toOpsBooking(row, {
          unitExternalId: unit?.row.external_id ?? '—',
          residentSurname: unit ? residentSurnameForUnit(unit) : 'Resident',
          serviceName: service?.name ?? '—',
          serviceSlug: service?.slug ?? '',
          attendantName: attendant?.name ?? '—',
        });
      }),
    [raw.rawBookings, unitByUuid, serviceLookup.byUuid, attendantByUuid],
  );

  const propertyName = useMemo(() => raw.property?.name ?? '—', [raw.property]);
  const building = useMemo(() => {
    if (!raw.property) return '—';
    return `${raw.property.name} · ${raw.property.unit_count} units`;
  }, [raw.property]);

  const createUnit = useCallback(
    async (input: NewUnitInput): Promise<OpsUnit> => {
      if (!isSuperAdmin) throw onlyAdminError('add units');
      if (!propertyId) throw new Error('No property assigned to this manager.');
      const created = await apiCreateUnit({
        property_id: propertyId,
        external_id: input.id,
        floor: input.floor,
        kind: input.kind,
        status: input.status,
        notes: input.notes ?? null,
      });
      // Re-fetch units to capture any members + denormalised fields.
      await load();
      return {
        id: created.external_id,
        floor: created.floor,
        resident: input.residentFull ?? 'Pending',
        residentFull: input.residentFull ?? 'Pending',
        status: created.status,
        visits: 0,
        since: created.since,
        kind: created.kind as UnitKind,
        ...(input.role ? { role: input.role as UnitRole } : {}),
        ...(input.email ? { email: input.email } : {}),
        ...(input.phone ? { phone: input.phone } : {}),
        ...(input.notes ? { notes: input.notes } : {}),
      };
    },
    [propertyId, load, isSuperAdmin],
  );

  const updateUnit = useCallback(
    async (id: string, patch: Partial<OpsUnit>) => {
      if (!isSuperAdmin) throw onlyAdminError('edit units');
      const target = unitByExternalId.get(id);
      if (!target) return;
      const dbPatch: Record<string, unknown> = {};
      if (patch.floor !== undefined) dbPatch.floor = patch.floor;
      if (patch.kind !== undefined) dbPatch.kind = patch.kind;
      if (patch.status !== undefined) dbPatch.status = patch.status;
      if (patch.notes !== undefined) dbPatch.notes = patch.notes ?? null;
      if (Object.keys(dbPatch).length === 0) return;
      await apiUpdateUnit(target.row.id, dbPatch);
      await load();
    },
    [unitByExternalId, load, isSuperAdmin],
  );

  const deleteUnit = useCallback(
    async (id: string) => {
      if (!isSuperAdmin) throw onlyAdminError('delete units');
      const target = unitByExternalId.get(id);
      if (!target) return;
      await apiDeleteUnit(target.row.id);
      setSelectedUnitId((curr) => (curr === id ? null : curr));
      await load();
    },
    [unitByExternalId, load, isSuperAdmin],
  );

  const toggleUnitStatus = useCallback(
    async (id: string) => {
      if (!isSuperAdmin) throw onlyAdminError('change unit status');
      const target = unitByExternalId.get(id);
      if (!target) return;
      await apiToggleUnitStatus(target.row.id, target.row.status);
      await load();
    },
    [unitByExternalId, load, isSuperAdmin],
  );

  const setBookingStatus = useCallback(
    async (id: string, status: BookingStatus) => {
      if (!isSuperAdmin) throw onlyAdminError('change booking status');
      const prev = raw.rawBookings.find((b) => b.id === id)?.status;
      // Optimistic
      setRaw((s) => ({
        ...s,
        rawBookings: s.rawBookings.map((b) => (b.id === id ? { ...b, status } : b)),
      }));
      try {
        await apiUpdateBookingStatus(id, status);
      } catch (err) {
        // Revert
        if (prev) {
          setRaw((s) => ({
            ...s,
            rawBookings: s.rawBookings.map((b) => (b.id === id ? { ...b, status: prev } : b)),
          }));
        }
        throw err;
      }
    },
    [raw.rawBookings, isSuperAdmin],
  );

  const confirmBookingWithAssignee = useCallback(
    async (id: string, assigneeName: string) => {
      if (!isSuperAdmin) throw onlyAdminError('confirm bookings');
      const before = raw.rawBookings.find((b) => b.id === id);
      const prevStatus = before?.status;
      const prevAssignee = before?.assignee_name ?? null;
      // Optimistic
      setRaw((s) => ({
        ...s,
        rawBookings: s.rawBookings.map((b) =>
          b.id === id ? { ...b, status: 'confirmed', assignee_name: assigneeName } : b,
        ),
      }));
      try {
        await apiConfirmBookingWithAssignee(id, assigneeName);
      } catch (err) {
        // Revert both fields together
        setRaw((s) => ({
          ...s,
          rawBookings: s.rawBookings.map((b) =>
            b.id === id && prevStatus
              ? { ...b, status: prevStatus, assignee_name: prevAssignee }
              : b,
          ),
        }));
        throw err;
      }
    },
    [raw.rawBookings, isSuperAdmin],
  );

  const markArrived = useCallback(
    async (id: string) => {
      if (!isSuperAdmin) throw onlyAdminError('mark arrivals');
      const updated = await apiMarkArrived(id);
      setRaw((s) => ({
        ...s,
        rawBookings: s.rawBookings.map((b) => (b.id === id ? updated : b)),
      }));
    },
    [isSuperAdmin],
  );

  const cancelBooking = useCallback(
    async (id: string, reason?: string) => {
      if (!isSuperAdmin) throw onlyAdminError('cancel bookings');
      const prev = raw.rawBookings.find((b) => b.id === id);
      setRaw((s) => ({
        ...s,
        rawBookings: s.rawBookings.map((b) =>
          b.id === id ? { ...b, status: 'cancelled', cancelled_reason: reason ?? null } : b,
        ),
      }));
      try {
        await apiUpdateBooking(id, {
          status: 'cancelled',
          cancelled_reason: reason ?? null,
          cancelled_at: new Date().toISOString(),
        });
      } catch (err) {
        if (prev) {
          setRaw((s) => ({
            ...s,
            rawBookings: s.rawBookings.map((b) => (b.id === id ? prev : b)),
          }));
        }
        throw err;
      }
    },
    [raw.rawBookings, isSuperAdmin],
  );

  const createBooking = useCallback(
    async (draft: NewBookingDraft): Promise<OpsBooking> => {
      if (!isSuperAdmin) throw onlyAdminError('create bookings');
      if (!profile || !propertyId || !raw.property) throw new Error('No property assigned.');
      const unit = unitByExternalId.get(draft.unit);
      if (!unit) throw new Error(`Residence ${draft.unit} not found.`);
      if (unit.row.status === 'paused') {
        throw new Error(`Residence ${draft.unit} is paused. Activate it before scheduling.`);
      }
      const service = serviceLookup.bySlug.get(draft.serviceKey);
      if (!service) throw new Error(`Service ${draft.serviceKey} not in catalogue.`);
      const attendant = raw.attendants[0] ?? null;
      const scheduledAt = combineDateTime(draft.date, draft.time);

      // Pre-flight availability check — friendly error before hitting the
      // Postgres unique index on (unit_id, scheduled_at).
      const sameDay = await listBookingsForUnitDate(unit.row.id, scheduledAt);
      const taken = sameDay.some((b) => {
        const t = new Date(b.scheduled_at);
        return (
          t.getHours() === scheduledAt.getHours() &&
          t.getMinutes() === scheduledAt.getMinutes()
        );
      });
      if (taken) {
        throw new Error(
          `Slot ${draft.time} on ${draft.date} is already booked for ${draft.unit}.`,
        );
      }

      let inserted;
      try {
        inserted = await apiCreateBooking({
          property_id: propertyId,
          unit_id: unit.row.id,
          service_id: service.id,
          attendant_id: attendant?.id ?? null,
          created_by: profile.id,
          scheduled_at: scheduledAt.toISOString(),
          price_cents: service.price_cents,
          note: draft.note?.trim() || null,
          service_snapshot: {
            slug: service.slug,
            name: service.name,
            kicker: service.kicker,
          },
          resident_snapshot: {
            full_name: residentFullForUnit(unit),
            display_name: residentSurnameForUnit(unit),
            unit: { external_id: unit.row.external_id },
            ...(attendant ? { attendant: { name: attendant.name } } : {}),
          },
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (/23505|duplicate key|unique constraint/i.test(msg)) {
          throw new Error('That slot was just taken — pick another time.');
        }
        throw err;
      }
      setRaw((s) => ({ ...s, rawBookings: [inserted, ...s.rawBookings] }));
      return toOpsBooking(inserted, {
        unitExternalId: unit.row.external_id,
        residentSurname: residentSurnameForUnit(unit),
        serviceName: service.name,
        serviceSlug: service.slug,
        attendantName: attendant?.name ?? '—',
      });
    },
    [profile, propertyId, raw.property, raw.attendants, unitByExternalId, serviceLookup.bySlug, isSuperAdmin],
  );

  const value = useMemo<OpsContextValue>(
    () => ({
      building,
      propertyName,
      propertyId,
      viewingAsSuperAdmin,
      loading: raw.loading,
      bookings,
      units,
      services: raw.services,
      attendants: raw.attendants,
      search,
      setSearch,
      selectedBookingId,
      openBooking: (id) => {
        setSelectedUnitId(null);
        setNewBookingOpen(false);
        setPaletteOpen(false);
        setSelectedBookingId(id);
      },
      closeBooking: () => setSelectedBookingId(null),
      selectedBooking: bookings.find((b) => b.id === selectedBookingId),
      selectedUnitId,
      openUnit: (id) => {
        setSelectedBookingId(null);
        setNewBookingOpen(false);
        setPaletteOpen(false);
        setSelectedUnitId(id);
      },
      closeUnit: () => setSelectedUnitId(null),
      selectedUnit: units.find((u) => u.id === selectedUnitId),
      newBookingOpen,
      openNewBooking: (prefill) => {
        setSelectedBookingId(null);
        setSelectedUnitId(null);
        setPaletteOpen(false);
        setNewBookingPrefill(prefill ?? null);
        setNewBookingOpen(true);
      },
      closeNewBooking: () => {
        setNewBookingOpen(false);
        setNewBookingPrefill(null);
      },
      newBookingPrefill,
      paletteOpen,
      openPalette: () => setPaletteOpen(true),
      closePalette: () => setPaletteOpen(false),
      togglePalette: () => setPaletteOpen((v) => !v),
      setBookingStatus,
      confirmBookingWithAssignee,
      cancelBooking,
      createBooking,
      markArrived,
      createUnit,
      updateUnit,
      deleteUnit,
      toggleUnitStatus,
      referrals,
      createReferral,
      refreshReferrals,
      refresh: load,
    }),
    [
      building,
      propertyName,
      propertyId,
      viewingAsSuperAdmin,
      raw.loading,
      raw.services,
      raw.attendants,
      bookings,
      units,
      search,
      selectedBookingId,
      selectedUnitId,
      newBookingOpen,
      newBookingPrefill,
      paletteOpen,
      setBookingStatus,
      confirmBookingWithAssignee,
      cancelBooking,
      createBooking,
      markArrived,
      createUnit,
      updateUnit,
      deleteUnit,
      toggleUnitStatus,
      referrals,
      createReferral,
      refreshReferrals,
      load,
    ],
  );

  return <OpsContext.Provider value={value}>{children}</OpsContext.Provider>;
}

export function useOps(): OpsContextValue {
  const ctx = useContext(OpsContext);
  if (!ctx) throw new Error('useOps must be used inside <OpsProvider>');
  return ctx;
}
