import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { getGreeting } from '../../utils/greeting';
import { CATALOGUE } from './data';
import type { BookingDraft, BookingRecord, Resident, Service } from './types';

export interface PortalContextValue {
  resident: Resident;
  bookings: BookingRecord[];
  catalogue: Service[];
  greeting: string;

  /** Add a booking to the upcoming list and return the created record. */
  addBooking: (draft: BookingDraft) => BookingRecord;

  /** Mark a booking as cancelled. Stays in history for transparency. */
  cancelBooking: (id: string, reason?: string) => void;

  /** Cancel the booking and return its source Service so the caller can re-book. */
  rescheduleBooking: (id: string) => Service | null;

  getServiceById: (id: string) => Service | undefined;
  getBookingById: (id: string) => BookingRecord | undefined;
}

const PortalContext = createContext<PortalContextValue | null>(null);

const DEFAULT_RESIDENT: Resident = {
  building: 'The Arden',
  residence: '2104',
  name: 'Eleanor Ashcombe',
};

const SEED_HISTORY: BookingRecord[] = [
  {
    id: 'b1',
    serviceId: 'window',
    kind: 'past',
    date: '2026-04-18T10:30:00',
    dateLabel: 'Apr 18, 2026',
    time: '10:30 AM',
    serviceKicker: 'Glazing',
    serviceName: 'Window Service',
    attendant: 'Hudson & Co.',
    price: 240,
    status: 'Closed',
    statusKey: 'closed',
    statusTone: 'neutral',
  },
  {
    id: 'b2',
    serviceId: 'deep',
    kind: 'past',
    date: '2026-03-09T09:00:00',
    dateLabel: 'Mar 09, 2026',
    time: '9:00 AM',
    serviceKicker: 'Housekeeping',
    serviceName: 'Deep Cleaning',
    attendant: 'Marble & Linen',
    price: 320,
    status: 'Closed',
    statusKey: 'closed',
    statusTone: 'neutral',
  },
  {
    id: 'b3',
    serviceId: 'handy',
    kind: 'past',
    date: '2026-02-02T15:00:00',
    dateLabel: 'Feb 02, 2026',
    time: '3:00 PM',
    serviceKicker: 'Carpentry',
    serviceName: 'Handyman',
    attendant: 'Hudson & Co.',
    price: 140,
    status: 'Closed',
    statusKey: 'closed',
    statusTone: 'neutral',
  },
];

// Attendant by service id — in real life this would come from the building's
// vendor roster. Hard-coded here for the demo.
const ATTENDANT_BY_SERVICE: Record<string, string> = {
  window: 'Hudson & Co.',
  deep: 'Marble & Linen',
  pressure: 'Hudson & Co.',
  handy: 'Hudson & Co.',
  valet: 'Doorman Services',
  garden: 'Hollis Grounds',
};

export function PortalProvider({ children }: { children: ReactNode }) {
  const [resident] = useState<Resident>(DEFAULT_RESIDENT);
  const [bookings, setBookings] = useState<BookingRecord[]>(SEED_HISTORY);

  const greeting = useMemo(() => getGreeting(), []);

  const getServiceById = useCallback((id: string) => CATALOGUE.find((s) => s.id === id), []);

  const getBookingById = useCallback(
    (id: string) => bookings.find((b) => b.id === id),
    [bookings],
  );

  const addBooking = useCallback((draft: BookingDraft): BookingRecord => {
    const id = 'u' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
    const date = new Date(draft.date);
    const record: BookingRecord = {
      id,
      serviceId: draft.service.id,
      kind: 'upcoming',
      date: date.toISOString(),
      dateLabel: date.toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
      }),
      time: draft.time,
      serviceKicker: draft.service.kicker,
      serviceName: draft.service.name,
      attendant: ATTENDANT_BY_SERVICE[draft.service.id] ?? 'Hudson & Co.',
      price: draft.service.price,
      status: 'Confirmed',
      statusKey: 'confirmed',
      statusTone: 'success',
      note: draft.note?.trim() || undefined,
    };
    setBookings((prev) => [record, ...prev]);
    return record;
  }, []);

  const cancelBooking = useCallback((id: string, _reason?: string) => {
    setBookings((prev) =>
      prev.map((b) =>
        b.id === id
          ? {
              ...b,
              kind: 'past',
              status: 'Cancelled',
              statusKey: 'cancelled',
              statusTone: 'danger',
            }
          : b,
      ),
    );
  }, []);

  const rescheduleBooking = useCallback(
    (id: string): Service | null => {
      const booking = bookings.find((b) => b.id === id);
      if (!booking) return null;
      const service = CATALOGUE.find((s) => s.id === booking.serviceId);
      if (!service) return null;
      // Cancel the existing booking — caller will navigate to re-book
      setBookings((prev) =>
        prev.map((b) =>
          b.id === id
            ? {
                ...b,
                kind: 'past',
                status: 'Rescheduled',
                statusKey: 'cancelled',
                statusTone: 'warning',
              }
            : b,
        ),
      );
      return service;
    },
    [bookings],
  );

  const value = useMemo<PortalContextValue>(
    () => ({
      resident,
      bookings,
      catalogue: CATALOGUE,
      greeting,
      addBooking,
      cancelBooking,
      rescheduleBooking,
      getServiceById,
      getBookingById,
    }),
    [resident, bookings, greeting, addBooking, cancelBooking, rescheduleBooking, getServiceById, getBookingById],
  );

  return <PortalContext.Provider value={value}>{children}</PortalContext.Provider>;
}

export function usePortal(): PortalContextValue {
  const ctx = useContext(PortalContext);
  if (!ctx) throw new Error('usePortal must be used inside <PortalProvider>');
  return ctx;
}
