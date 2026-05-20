import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { BookingStatus, OpsBooking, OpsUnit } from './data';
import { SEED_BOOKINGS, SEED_UNITS } from './data';

export interface NewBookingDraft {
  unit: string;
  serviceKey: string;
  date: string; // "14 May"
  time: string; // "10:30"
  note?: string;
}

export type NewUnitInput = Omit<OpsUnit, 'visits' | 'since'> &
  Partial<Pick<OpsUnit, 'visits' | 'since'>>;

export interface OpsContextValue {
  building: string;

  bookings: OpsBooking[];
  units: OpsUnit[];

  /** Property admin mutations — manage units / residents / commercial contacts. */
  createUnit: (input: NewUnitInput) => OpsUnit;
  updateUnit: (id: string, patch: Partial<OpsUnit>) => void;
  deleteUnit: (id: string) => void;
  toggleUnitStatus: (id: string) => void;

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

  /** Command palette (⌘K). */
  paletteOpen: boolean;
  openPalette: () => void;
  closePalette: () => void;
  togglePalette: () => void;

  /** Status mutation — used by drag-drop on Pipeline + Booking actions. */
  setBookingStatus: (id: string, status: BookingStatus) => void;
  cancelBooking: (id: string, reason?: string) => void;
  createBooking: (draft: NewBookingDraft) => OpsBooking;
}

const OpsContext = createContext<OpsContextValue | null>(null);

export function OpsProvider({ children }: { children: ReactNode }) {
  const [bookings, setBookings] = useState<OpsBooking[]>(SEED_BOOKINGS);
  const [units, setUnits] = useState<OpsUnit[]>(SEED_UNITS);
  const [search, setSearch] = useState('');
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [newBookingOpen, setNewBookingOpen] = useState(false);
  const [newBookingPrefill, setNewBookingPrefill] = useState<string | null>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const setBookingStatus = useCallback((id: string, status: BookingStatus) => {
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)));
  }, []);

  const cancelBooking = useCallback((id: string, _reason?: string) => {
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status: 'cancelled' } : b)));
  }, []);

  const createUnit = useCallback((input: NewUnitInput): OpsUnit => {
    const created: OpsUnit = {
      visits: 0,
      since: String(new Date().getFullYear()),
      ...input,
    };
    setUnits((prev) => {
      if (prev.some((u) => u.id === created.id)) {
        return prev.map((u) => (u.id === created.id ? created : u));
      }
      return [created, ...prev];
    });
    return created;
  }, []);

  const updateUnit = useCallback((id: string, patch: Partial<OpsUnit>) => {
    setUnits((prev) => prev.map((u) => (u.id === id ? { ...u, ...patch } : u)));
  }, []);

  const deleteUnit = useCallback((id: string) => {
    setUnits((prev) => prev.filter((u) => u.id !== id));
    setBookings((prev) => prev.filter((b) => b.unit !== id));
    setSelectedUnitId((curr) => (curr === id ? null : curr));
  }, []);

  const toggleUnitStatus = useCallback((id: string) => {
    setUnits((prev) =>
      prev.map((u) =>
        u.id === id ? { ...u, status: u.status === 'active' ? 'paused' : 'active' } : u,
      ),
    );
  }, []);

  const createBooking = useCallback((draft: NewBookingDraft): OpsBooking => {
    const id = 'B-' + Math.floor(Math.random() * 9000 + 1000).toString();
    const service = SERVICE_LOOKUP[draft.serviceKey] ?? SERVICE_LOOKUP.window;
    const created: OpsBooking = {
      id,
      date: draft.date,
      time: draft.time,
      unit: draft.unit,
      resident: lookupResidentSurname(draft.unit) ?? 'Resident',
      service: service.name,
      serviceKey: draft.serviceKey,
      attendant: service.attendant,
      status: 'scheduled',
      price: service.price,
      note: draft.note?.trim() || undefined,
    };
    setBookings((prev) => [created, ...prev]);
    return created;
  }, []);

  const value = useMemo<OpsContextValue>(
    () => ({
      building: 'The Arden · 240 units',
      bookings,
      units,
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
      cancelBooking,
      createBooking,
      createUnit,
      updateUnit,
      deleteUnit,
      toggleUnitStatus,
    }),
    [
      bookings,
      units,
      search,
      selectedBookingId,
      selectedUnitId,
      newBookingOpen,
      newBookingPrefill,
      paletteOpen,
      setBookingStatus,
      cancelBooking,
      createBooking,
      createUnit,
      updateUnit,
      deleteUnit,
      toggleUnitStatus,
    ],
  );

  return <OpsContext.Provider value={value}>{children}</OpsContext.Provider>;
}

export function useOps(): OpsContextValue {
  const ctx = useContext(OpsContext);
  if (!ctx) throw new Error('useOps must be used inside <OpsProvider>');
  return ctx;
}

// ── helpers ────────────────────────────────────────────────────────────────

import { SEED_UNITS as UNITS_LOOKUP, SERVICES } from './data';

const SERVICE_LOOKUP: Record<string, (typeof SERVICES)[number]> = Object.fromEntries(
  SERVICES.map((s) => [s.key, s]),
);

function lookupResidentSurname(unitId: string): string | undefined {
  const u = UNITS_LOOKUP.find((u) => u.id === unitId);
  if (!u) return undefined;
  const surname = u.resident.split(',')[0]?.trim();
  return surname;
}
