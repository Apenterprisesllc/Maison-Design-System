import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Eyebrow,
  Hairline,
  Icon,
  Modal,
  Pill,
  useLucide,
  useReveal,
  useToast,
} from '../../components';
import { usePortal } from './context';
import type { BookingRecord, BookingStatus } from './types';

type StatusFilter = 'all' | BookingStatus;
type SortOrder = 'newest' | 'oldest';

const FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'confirmed', label: 'Upcoming' },
  { key: 'closed', label: 'Closed' },
  { key: 'cancelled', label: 'Cancelled' },
];

export function Account() {
  const navigate = useNavigate();
  const toast = useToast();
  const { resident, bookings, cancelBooking, rescheduleBooking } = usePortal();
  const ref = useReveal<HTMLElement>({ y: 16, stagger: 0.06, rootMargin: '0px 0px -2% 0px' });
  useLucide();

  const [filter, setFilter] = useState<StatusFilter>('all');
  const [sort, setSort] = useState<SortOrder>('newest');
  const [cancelTarget, setCancelTarget] = useState<BookingRecord | null>(null);
  const [rescheduleTarget, setRescheduleTarget] = useState<BookingRecord | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const upcoming = useMemo(
    () =>
      bookings.filter((b) => b.kind === 'upcoming' && b.statusKey === 'confirmed'),
    [bookings],
  );
  const history = useMemo(() => {
    const filtered = bookings.filter((b) => {
      if (b.kind !== 'past') return false;
      if (filter === 'all') return true;
      return b.statusKey === filter;
    });
    filtered.sort((a, b) =>
      sort === 'newest' ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date),
    );
    return filtered;
  }, [bookings, filter, sort]);

  function confirmCancel() {
    if (!cancelTarget) return;
    const id = cancelTarget.id;
    cancelBooking(id, cancelReason);
    setCancelTarget(null);
    setCancelReason('');
    toast.success('Visit cancelled.');
  }

  function confirmReschedule() {
    if (!rescheduleTarget) return;
    const service = rescheduleBooking(rescheduleTarget.id);
    setRescheduleTarget(null);
    if (service) {
      navigate(`/portal/services/${service.id}/book`);
      toast.info('Pick a new date for this visit.');
    } else {
      toast.error('Service no longer available.');
    }
  }

  return (
    <main
      ref={ref}
      style={{
        maxWidth: 1080,
        margin: '0 auto',
        padding: 'clamp(32px, 5vw, 56px) clamp(20px, 4vw, 56px) 120px',
      }}
    >
      <button
        type="button"
        onClick={() => navigate('/portal')}
        aria-label="Back to catalogue"
        style={{
          background: 'transparent',
          border: 0,
          padding: 0,
          cursor: 'pointer',
          color: 'var(--color-mist)',
          fontFamily: 'var(--font-sans)',
          fontSize: 13,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          marginBottom: 28,
        }}
      >
        <Icon name="chevron-left" size={16} /> Catalogue
      </button>

      <Eyebrow>Your Account</Eyebrow>
      <h1
        style={{
          fontFamily: 'var(--font-serif)',
          fontWeight: 300,
          fontSize: 'clamp(36px, 5vw, 48px)',
          letterSpacing: '-0.02em',
          lineHeight: 1.08,
          color: 'var(--color-charcoal)',
          margin: '10px 0 0',
        }}
      >
        {resident.name}
      </h1>
      <p
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 14,
          color: 'var(--color-mist)',
          margin: '8px 0 0',
        }}
      >
        {resident.building} · Residence {resident.residence}
      </p>
      <Hairline width={48} margin="24px 0 48px" />

      {/* ── Upcoming ───────────────────────────────────────────── */}
      <section>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <h2
            style={{
              fontFamily: 'var(--font-serif)',
              fontWeight: 400,
              fontSize: 24,
              color: 'var(--color-charcoal)',
              margin: 0,
            }}
          >
            Upcoming
          </h2>
          <span
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 11,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--color-mist)',
            }}
          >
            {upcoming.length} on calendar
          </span>
        </div>
        <Hairline color="var(--color-taupe)" width="100%" margin="14px 0 20px" />

        {upcoming.length === 0 && <EmptyUpcoming onCatalogue={() => navigate('/portal')} />}
        {upcoming.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {upcoming.map((b) => (
              <VisitRow
                key={b.id}
                booking={b}
                onCancel={() => setCancelTarget(b)}
                onReschedule={() => setRescheduleTarget(b)}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── History ────────────────────────────────────────────── */}
      <section style={{ marginTop: 64 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <h2
            style={{
              fontFamily: 'var(--font-serif)',
              fontWeight: 400,
              fontSize: 24,
              color: 'var(--color-charcoal)',
              margin: 0,
            }}
          >
            History
          </h2>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOrder)}
            aria-label="Sort history"
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 12,
              letterSpacing: '0.06em',
              border: '1px solid var(--color-taupe)',
              background: 'transparent',
              borderRadius: 4,
              padding: '6px 10px',
              color: 'var(--color-charcoal)',
              cursor: 'pointer',
            }}
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </div>

        {/* Filter chips */}
        <div
          style={{
            display: 'flex',
            gap: 8,
            margin: '16px 0 20px',
            flexWrap: 'wrap',
          }}
          role="tablist"
          aria-label="Filter history"
        >
          {FILTERS.map((f) => {
            const active = f.key === filter;
            return (
              <button
                key={f.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setFilter(f.key)}
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: 11,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  padding: '7px 14px',
                  borderRadius: 9999,
                  border: `1px solid ${active ? 'var(--color-ink)' : 'var(--color-taupe)'}`,
                  background: active ? 'var(--color-ink)' : 'transparent',
                  color: active ? 'var(--color-cream)' : 'var(--color-mist)',
                  cursor: 'pointer',
                  transition:
                    'background-color var(--dur-state) var(--ease-out), color var(--dur-state) var(--ease-out), border-color var(--dur-state) var(--ease-out)',
                }}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {history.length === 0 && <EmptyHistory />}
        {history.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {history.map((b) => (
              <VisitRow key={b.id} booking={b} />
            ))}
          </div>
        )}
      </section>

      {/* ── Cancel modal ───────────────────────────────────────── */}
      <Modal
        open={!!cancelTarget}
        onClose={() => {
          setCancelTarget(null);
          setCancelReason('');
        }}
        eyebrow="Cancel a visit"
        title={cancelTarget ? `Cancel ${cancelTarget.serviceName}?` : ''}
        footer={
          <>
            <Button variant="quiet" onClick={() => setCancelTarget(null)}>
              Keep Visit
            </Button>
            <Button variant="destructive" icon="x" onClick={confirmCancel}>
              Cancel Visit
            </Button>
          </>
        }
      >
        {cancelTarget && (
          <>
            <p
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 14,
                color: 'var(--color-mist)',
                margin: '0 0 18px',
                lineHeight: 1.65,
              }}
            >
              You're cancelling {cancelTarget.serviceName} on {cancelTarget.dateLabel} at{' '}
              {cancelTarget.time}. The attendant will be notified.
            </p>
            <Eyebrow>Reason (optional)</Eyebrow>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g. Travelling that week."
              rows={3}
              style={{
                width: '100%',
                marginTop: 8,
                boxSizing: 'border-box',
                fontFamily: 'var(--font-sans)',
                fontSize: 14,
                color: 'var(--color-charcoal)',
                background: 'transparent',
                border: '1px solid var(--color-taupe)',
                borderRadius: 2,
                padding: '10px 12px',
                resize: 'vertical',
                outline: 'none',
              }}
            />
          </>
        )}
      </Modal>

      {/* ── Reschedule modal ───────────────────────────────────── */}
      <Modal
        open={!!rescheduleTarget}
        onClose={() => setRescheduleTarget(null)}
        eyebrow="Reschedule"
        title={rescheduleTarget ? `Reschedule ${rescheduleTarget.serviceName}?` : ''}
        footer={
          <>
            <Button variant="quiet" onClick={() => setRescheduleTarget(null)}>
              Keep Date
            </Button>
            <Button variant="primary" icon="calendar" onClick={confirmReschedule}>
              Pick a New Date
            </Button>
          </>
        }
      >
        {rescheduleTarget && (
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 14,
              color: 'var(--color-mist)',
              margin: 0,
              lineHeight: 1.65,
            }}
          >
            The current {rescheduleTarget.dateLabel} {rescheduleTarget.time} visit will be released
            and you'll choose a new date for {rescheduleTarget.serviceName}.
          </p>
        )}
      </Modal>
    </main>
  );
}

interface VisitRowProps {
  booking: BookingRecord;
  onCancel?: () => void;
  onReschedule?: () => void;
}

function VisitRow({ booking, onCancel, onReschedule }: VisitRowProps) {
  const interactive = !!onCancel && !!onReschedule;
  return (
    <div
      data-reveal
      className="visit-row"
      style={{
        display: 'grid',
        gridTemplateColumns: interactive
          ? '170px 1fr 140px 120px 80px auto'
          : '170px 1fr 140px 120px 80px',
        gap: 16,
        alignItems: 'center',
        padding: '20px 22px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--color-taupe)',
        borderRadius: 8,
        boxShadow: 'var(--shadow-1)',
        transition: 'border-color 200ms ease, box-shadow 200ms ease, transform 200ms ease',
      }}
    >
      <div>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: 17, color: 'var(--color-charcoal)' }}>
          {booking.dateLabel}
        </div>
        <div
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 12,
            color: 'var(--color-mist)',
            marginTop: 2,
          }}
        >
          {booking.time}
        </div>
      </div>
      <div>
        <div
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 10,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--color-mist)',
          }}
        >
          {booking.serviceKicker}
        </div>
        <div
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 17,
            color: 'var(--color-charcoal)',
            marginTop: 2,
          }}
        >
          {booking.serviceName}
        </div>
      </div>
      <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--color-mist)' }}>
        {booking.attendant}
      </div>
      <div>
        <Pill tone={booking.statusTone}>{booking.status}</Pill>
      </div>
      <div
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 17,
          color: 'var(--color-charcoal)',
          textAlign: 'right',
        }}
      >
        ${booking.price}
      </div>
      {interactive && (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onReschedule}
            aria-label={`Reschedule ${booking.serviceName}`}
            title="Reschedule"
            style={iconBtnStyle}
          >
            <Icon name="calendar" size={15} />
          </button>
          <button
            type="button"
            onClick={onCancel}
            aria-label={`Cancel ${booking.serviceName}`}
            title="Cancel"
            style={iconBtnStyle}
          >
            <Icon name="x" size={15} />
          </button>
        </div>
      )}
      <style>{`
        @media (max-width: 767px) {
          .visit-row {
            grid-template-columns: 1fr auto !important;
            gap: 8px 16px !important;
          }
          .visit-row > *:nth-child(n+3) { grid-column: span 2; }
        }
      `}</style>
    </div>
  );
}

const iconBtnStyle: React.CSSProperties = {
  width: 32,
  height: 32,
  border: '1px solid var(--color-taupe)',
  borderRadius: 4,
  background: 'transparent',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'var(--color-mist)',
  transition: 'border-color 200ms ease, color 200ms ease',
};

function EmptyUpcoming({ onCatalogue }: { onCatalogue: () => void }) {
  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '1px dashed var(--color-taupe)',
        borderRadius: 8,
        padding: 'clamp(32px, 5vw, 48px) 32px',
        textAlign: 'center',
      }}
    >
      <p
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 20,
          color: 'var(--color-charcoal)',
          margin: 0,
          fontWeight: 400,
        }}
      >
        No services on your calendar.
      </p>
      <p
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 14,
          color: 'var(--color-mist)',
          margin: '8px auto 22px',
          maxWidth: 420,
        }}
      >
        Browse the catalogue to schedule your first visit.
      </p>
      <Button variant="secondary" onClick={onCatalogue} iconAfter="arrow-right">
        Open Catalogue
      </Button>
    </div>
  );
}

function EmptyHistory() {
  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '1px dashed var(--color-taupe)',
        borderRadius: 8,
        padding: 'clamp(28px, 4vw, 40px) 32px',
        textAlign: 'center',
      }}
    >
      <p
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 18,
          color: 'var(--color-charcoal)',
          margin: 0,
          fontWeight: 400,
        }}
      >
        Nothing here yet.
      </p>
      <p
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 13,
          color: 'var(--color-mist)',
          margin: '6px auto 0',
          maxWidth: 380,
          lineHeight: 1.65,
        }}
      >
        Your service history will appear here as visits complete.
      </p>
    </div>
  );
}
