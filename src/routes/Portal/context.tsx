import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { getGreeting } from '../../utils/greeting';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { listServicesForTrack } from '../../lib/api/services';
import {
  cancelBooking as apiCancelBooking,
  createBooking,
  listBookingsForUnits,
} from '../../lib/api/bookings';
import { getProperty } from '../../lib/api/properties';
import { listBookingsForUnitDate } from '../../lib/api/bookings';
import { subscribeToUnitBookings } from '../../lib/realtime/bookings';
import type {
  AttendantRow,
  BookingRow,
  ClientTrack,
  PropertyRow,
  ServiceRow,
  UnitRow,
} from '../../lib/types/db';
import { buildServiceLookup, toService } from '../../lib/mappers/service';
import { toBookingRecord } from '../../lib/mappers/booking';
import type { BookingDraft, BookingRecord, Resident, Service } from './types';

export interface PortalContextValue {
  resident: Resident;
  bookings: BookingRecord[];
  catalogue: Service[];
  greeting: string;
  loading: boolean;
  hasUnit: boolean;
  addBooking: (draft: BookingDraft) => Promise<BookingRecord>;
  cancelBooking: (id: string, reason?: string) => Promise<void>;
  rescheduleBooking: (id: string) => Promise<Service | null>;
  getServiceById: (id: string) => Service | undefined;
  getBookingById: (id: string) => BookingRecord | undefined;
  /** Set of HHMM (24h) slot keys already taken on `date` for the resident's unit. */
  loadBookedSlotsForDate: (date: Date) => Promise<Set<string>>;
  /** Set of yyyy-mm-dd dates with active bookings (any service) for the unit. */
  busyDates: Set<string>;
  refresh: () => Promise<void>;
}

const PortalContext = createContext<PortalContextValue | null>(null);

function combineDateTime(date: Date, timeLabel: string): Date {
  const result = new Date(date);
  const m = /^(\d+):(\d+)\s*(AM|PM)?$/i.exec(timeLabel.trim());
  if (!m) {
    result.setHours(9, 0, 0, 0);
    return result;
  }
  let hour = parseInt(m[1]!, 10);
  const minute = parseInt(m[2]!, 10);
  const meridian = m[3]?.toUpperCase();
  if (meridian === 'PM' && hour < 12) hour += 12;
  if (meridian === 'AM' && hour === 12) hour = 0;
  result.setHours(hour, minute, 0, 0);
  return result;
}

function residentFor(profile: { full_name: string }, property: PropertyRow | null, unit: UnitRow | null): Resident {
  const track: ClientTrack = unit?.kind ?? 'residential';
  return {
    building: property?.name ?? '—',
    residence: unit?.external_id ?? '—',
    name: profile.full_name,
    track,
  };
}

interface ProviderState {
  property: PropertyRow | null;
  unit: UnitRow | null;
  attendantPool: AttendantRow[];
  catalogueRows: ServiceRow[];
  bookings: BookingRow[];
  loading: boolean;
}

const INITIAL_STATE: ProviderState = {
  property: null,
  unit: null,
  attendantPool: [],
  catalogueRows: [],
  bookings: [],
  loading: true,
};

export function PortalProvider({ children }: { children: ReactNode }) {
  const { profile, user } = useAuth();
  const [state, setState] = useState<ProviderState>(INITIAL_STATE);

  const load = useCallback(async () => {
    if (!profile || !user) return;
    setState((prev) => ({ ...prev, loading: true }));

    // Find the user's primary unit (if any), then derive property + track.
    const { data: memberships, error: memErr } = await supabase
      .from('unit_members')
      .select('unit:units(*)')
      .eq('user_id', user.id)
      .order('is_primary', { ascending: false });
    if (memErr) {
      console.error('[portal] unit lookup failed', memErr.message);
    }
    const unitRows = ((memberships ?? []) as unknown as { unit: UnitRow | null }[])
      .map((m) => m.unit)
      .filter((u): u is UnitRow => !!u);
    const primaryUnit = unitRows[0] ?? null;
    const propertyId = primaryUnit?.property_id ?? profile.primary_property_id;
    const track: ClientTrack = primaryUnit?.kind ?? profile.primary_track ?? 'residential';

    const [property, catalogueRows, attendantsResp] = await Promise.all([
      propertyId ? getProperty(propertyId) : Promise.resolve(null),
      listServicesForTrack(track, propertyId ?? null),
      propertyId
        ? supabase.from('attendants').select('*').eq('active', true).or(`property_id.eq.${propertyId},property_id.is.null`)
        : Promise.resolve({ data: [] as AttendantRow[], error: null }),
    ]);

    const attendantPool = (attendantsResp.data as AttendantRow[] | null) ?? [];

    let bookings: BookingRow[] = [];
    if (unitRows.length > 0) {
      bookings = await listBookingsForUnits(unitRows.map((u) => u.id));
    } else {
      // Fallback: bookings the user created (e.g. resident before unit attached).
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('created_by', user.id)
        .order('scheduled_at', { ascending: false });
      if (!error) bookings = data ?? [];
    }

    setState({
      property,
      unit: primaryUnit,
      attendantPool,
      catalogueRows,
      bookings,
      loading: false,
    });
  }, [profile, user]);

  useEffect(() => {
    if (!profile || !user) return;
    load();
  }, [profile, user, load]);

  // Realtime: when a manager changes booking status, the resident sees it live.
  useEffect(() => {
    if (!state.unit) return;
    const unsub = subscribeToUnitBookings(state.unit.id, (payload) => {
      setState((prev) => {
        const next = [...prev.bookings];
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
          if (removedId) return { ...prev, bookings: next.filter((b) => b.id !== removedId) };
        }
        return { ...prev, bookings: next };
      });
    });
    return unsub;
  }, [state.unit]);

  const serviceLookup = useMemo(() => buildServiceLookup(state.catalogueRows), [state.catalogueRows]);
  const catalogue = useMemo(() => state.catalogueRows.map(toService), [state.catalogueRows]);
  const bookingRecords = useMemo(() => state.bookings.map(toBookingRecord), [state.bookings]);

  const resident = useMemo<Resident>(
    () => residentFor(profile ?? { full_name: '' }, state.property, state.unit),
    [profile, state.property, state.unit],
  );
  const greeting = useMemo(() => getGreeting(), []);

  const getServiceById = useCallback(
    (id: string) => catalogue.find((s) => s.id === id),
    [catalogue],
  );

  const getBookingById = useCallback(
    (id: string) => bookingRecords.find((b) => b.id === id),
    [bookingRecords],
  );

  const addBooking = useCallback(
    async (draft: BookingDraft): Promise<BookingRecord> => {
      if (!profile || !user) throw new Error('Not signed in.');
      if (!state.property || !state.unit) throw new Error('No residence on record.');
      const serviceRow = serviceLookup.bySlug.get(draft.service.id);
      if (!serviceRow) throw new Error(`Service ${draft.service.id} not in catalogue.`);
      const scheduledAt = combineDateTime(draft.date, draft.time);
      const attendant = state.attendantPool[0] ?? null;

      let inserted;
      try {
        inserted = await createBooking({
          property_id: state.property.id,
          unit_id: state.unit.id,
          service_id: serviceRow.id,
          attendant_id: attendant?.id ?? null,
          created_by: user.id,
          scheduled_at: scheduledAt.toISOString(),
          price_cents: serviceRow.price_cents,
          note: draft.note?.trim() || null,
          service_snapshot: {
            slug: serviceRow.slug,
            name: serviceRow.name,
            kicker: serviceRow.kicker,
          },
          resident_snapshot: {
            full_name: profile.full_name,
            display_name: profile.display_name ?? profile.full_name,
            unit: { external_id: state.unit.external_id },
            ...(attendant ? { attendant: { name: attendant.name } } : {}),
          },
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        // Postgres unique_violation (23505) bubbles up from the unique
        // partial index on (unit_id, scheduled_at) — surface it as a UX-level
        // message so the form can prompt the user to pick a different slot.
        if (/23505|duplicate key|unique constraint/i.test(msg)) {
          throw new Error('That slot was just taken — pick another time.');
        }
        throw err;
      }

      setState((prev) => ({ ...prev, bookings: [inserted, ...prev.bookings] }));
      return toBookingRecord(inserted);
    },
    [profile, user, state.property, state.unit, state.attendantPool, serviceLookup],
  );

  const cancelBooking = useCallback(
    async (id: string, reason?: string) => {
      await apiCancelBooking(id, reason);
      setState((prev) => ({
        ...prev,
        bookings: prev.bookings.map((b) =>
          b.id === id
            ? { ...b, status: 'cancelled', cancelled_reason: reason ?? null, cancelled_at: new Date().toISOString() }
            : b,
        ),
      }));
    },
    [],
  );

  const loadBookedSlotsForDate = useCallback(
    async (date: Date): Promise<Set<string>> => {
      if (!state.unit) return new Set();
      const rows = await listBookingsForUnitDate(state.unit.id, date);
      const set = new Set<string>();
      for (const row of rows) {
        const d = new Date(row.scheduled_at);
        const hh = String(d.getHours()).padStart(2, '0');
        const mm = String(d.getMinutes()).padStart(2, '0');
        set.add(`${hh}${mm}`);
      }
      return set;
    },
    [state.unit],
  );

  const busyDates = useMemo<Set<string>>(() => {
    const set = new Set<string>();
    for (const b of state.bookings) {
      if (b.status === 'cancelled') continue;
      const d = new Date(b.scheduled_at);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      set.add(`${yyyy}-${mm}-${dd}`);
    }
    return set;
  }, [state.bookings]);

  const rescheduleBooking = useCallback(
    async (id: string): Promise<Service | null> => {
      const booking = state.bookings.find((b) => b.id === id);
      if (!booking) return null;
      const snap = booking.service_snapshot as { slug?: string } | null;
      const slug = snap?.slug;
      if (!slug) return null;
      const service = catalogue.find((s) => s.id === slug);
      if (!service) return null;
      await apiCancelBooking(id, 'Rescheduled');
      setState((prev) => ({
        ...prev,
        bookings: prev.bookings.map((b) =>
          b.id === id ? { ...b, status: 'cancelled', cancelled_at: new Date().toISOString() } : b,
        ),
      }));
      return service;
    },
    [state.bookings, catalogue],
  );

  const value = useMemo<PortalContextValue>(
    () => ({
      resident,
      bookings: bookingRecords,
      catalogue,
      greeting,
      loading: state.loading,
      hasUnit: !!state.unit,
      addBooking,
      cancelBooking,
      rescheduleBooking,
      getServiceById,
      getBookingById,
      loadBookedSlotsForDate,
      busyDates,
      refresh: load,
    }),
    [
      resident,
      bookingRecords,
      catalogue,
      greeting,
      state.loading,
      state.unit,
      addBooking,
      cancelBooking,
      rescheduleBooking,
      getServiceById,
      getBookingById,
      loadBookedSlotsForDate,
      busyDates,
      load,
    ],
  );

  return <PortalContext.Provider value={value}>{children}</PortalContext.Provider>;
}

export function usePortal(): PortalContextValue {
  const ctx = useContext(PortalContext);
  if (!ctx) throw new Error('usePortal must be used inside <PortalProvider>');
  return ctx;
}
