import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { getGreeting } from '../../utils/greeting';
import { CATALOGUE, getCatalogueFor } from './data';
import type { BookingDraft, BookingRecord, ClientTrack, Resident, Service } from './types';

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

const RESIDENTIAL_RESIDENT: Resident = {
  building: 'The Arden',
  residence: '2104',
  name: 'Eleanor Ashcombe',
  track: 'residential',
};

const COMMERCIAL_CLIENT: Resident = {
  building: 'The Arden',
  residence: 'Ground Floor',
  name: 'Arden Café & Bar',
  track: 'commercial',
};

const RESIDENTIAL_HISTORY: BookingRecord[] = [
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
    serviceId: 'marble',
    kind: 'past',
    date: '2026-02-02T15:00:00',
    dateLabel: 'Feb 02, 2026',
    time: '3:00 PM',
    serviceKicker: 'Stone Care',
    serviceName: 'Marble Polishing',
    attendant: 'Atelier Restoration',
    price: 420,
    status: 'Closed',
    statusKey: 'closed',
    statusTone: 'neutral',
  },
];

const COMMERCIAL_HISTORY: BookingRecord[] = [
  {
    id: 'c1',
    serviceId: 'office-night',
    kind: 'past',
    date: '2026-05-10T22:00:00',
    dateLabel: 'May 10, 2026',
    time: '10:00 PM',
    serviceKicker: 'Nightly',
    serviceName: 'After-Hours Office',
    attendant: 'Hudson & Co.',
    price: 290,
    status: 'Closed',
    statusKey: 'closed',
    statusTone: 'neutral',
  },
  {
    id: 'c2',
    serviceId: 'commercial',
    kind: 'past',
    date: '2026-04-29T18:00:00',
    dateLabel: 'Apr 29, 2026',
    time: '6:00 PM',
    serviceKicker: 'Standing',
    serviceName: 'Commercial Cleaning',
    attendant: 'Hudson & Co.',
    price: 240,
    status: 'Closed',
    statusKey: 'closed',
    statusTone: 'neutral',
  },
];

// Attendant by service id — in real life this would come from the building's
// vendor roster. Hard-coded here for the demo.
const ATTENDANT_BY_SERVICE: Record<string, string> = {
  // residential
  window: 'Hudson & Co.',
  deep: 'Marble & Linen',
  housekeeping: 'Marble & Linen',
  marble: 'Atelier Restoration',
  disinfecting: 'Marble & Linen',
  moveinout: 'Hudson & Co.',
  // commercial
  'post-construction': 'Hudson & Co.',
  'office-night': 'Hudson & Co.',
  'restaurant-night': 'Marble & Linen',
  commercial: 'Hudson & Co.',
  epoxy: 'Atelier Restoration',
  events: 'Hollis Grounds',
  'real-estate': 'Marble & Linen',
};

export interface PortalProviderProps {
  children: ReactNode;
  initialTrack?: ClientTrack;
}

export function PortalProvider({ children, initialTrack = 'residential' }: PortalProviderProps) {
  const [resident] = useState<Resident>(
    initialTrack === 'commercial' ? COMMERCIAL_CLIENT : RESIDENTIAL_RESIDENT,
  );
  const [bookings, setBookings] = useState<BookingRecord[]>(
    initialTrack === 'commercial' ? COMMERCIAL_HISTORY : RESIDENTIAL_HISTORY,
  );

  const catalogue = useMemo(() => getCatalogueFor(resident.track), [resident.track]);

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
      catalogue,
      greeting,
      addBooking,
      cancelBooking,
      rescheduleBooking,
      getServiceById,
      getBookingById,
    }),
    [resident, bookings, catalogue, greeting, addBooking, cancelBooking, rescheduleBooking, getServiceById, getBookingById],
  );

  return <PortalContext.Provider value={value}>{children}</PortalContext.Provider>;
}

export function usePortal(): PortalContextValue {
  const ctx = useContext(PortalContext);
  if (!ctx) throw new Error('usePortal must be used inside <PortalProvider>');
  return ctx;
}
