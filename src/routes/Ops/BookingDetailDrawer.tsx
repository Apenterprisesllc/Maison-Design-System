import { useEffect, useState } from 'react';
import { Button, Drawer, Hairline, useRetained, useToast } from '../../components';
import { useOps } from './context';
import { STATUS_LABEL, STATUS_TONE, type BookingStatus } from './data';
import { OpsPill } from './OpsPrimitives';
import { BookingAttachments } from './BookingAttachments';
import { BookingMessages } from './BookingMessages';
import { listStatusEventsForBooking } from '../../lib/api/bookings';
import type { BookingStatusEventRow } from '../../lib/types/db';

const NEXT_STATUS: Record<BookingStatus, BookingStatus | null> = {
  scheduled: 'enroute',
  enroute: 'active',
  active: 'closed',
  closed: null,
  cancelled: null,
};

const NEXT_LABEL: Record<BookingStatus, string> = {
  scheduled: 'Mark En Route',
  enroute: 'Mark In Progress',
  active: 'Mark Closed',
  closed: 'Closed',
  cancelled: 'Cancelled',
};

export function BookingDetailDrawer() {
  const toast = useToast();
  const { selectedBooking, closeBooking, setBookingStatus, cancelBooking, markArrived } = useOps();
  const open = !!selectedBooking;
  const renderBooking = useRetained(selectedBooking, 320);

  const [events, setEvents] = useState<BookingStatusEventRow[]>([]);
  useEffect(() => {
    if (!selectedBooking) return;
    let cancelled = false;
    listStatusEventsForBooking(selectedBooking.id)
      .then((rows) => {
        if (!cancelled) setEvents(rows);
      })
      .catch(() => {
        if (!cancelled) setEvents([]);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedBooking]);

  async function advance() {
    if (!selectedBooking) return;
    const next = NEXT_STATUS[selectedBooking.status];
    if (!next) return;
    const ref = selectedBooking.reference;
    try {
      await setBookingStatus(selectedBooking.id, next);
      toast.success(`${ref} → ${STATUS_LABEL[next]}.`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not update. Reverted.';
      toast.error(message);
    }
  }

  async function onCancel() {
    if (!selectedBooking) return;
    const ref = selectedBooking.reference;
    try {
      await cancelBooking(selectedBooking.id);
      toast.success(`${ref} cancelled.`);
      closeBooking();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not cancel. Try again.';
      toast.error(message);
    }
  }

  async function onMarkArrived() {
    if (!selectedBooking) return;
    try {
      await markArrived(selectedBooking.id);
      toast.success(`${selectedBooking.reference} arrival recorded.`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not record arrival.';
      toast.error(message);
    }
  }

  const showMarkArrived =
    renderBooking &&
    !renderBooking.arrivedAt &&
    (renderBooking.status === 'enroute' || renderBooking.status === 'active');

  return (
    <Drawer
      open={open}
      onClose={closeBooking}
      eyebrow={renderBooking?.reference ?? 'Booking'}
      title={renderBooking?.service ?? ''}
      subtitle={
        renderBooking
          ? `${renderBooking.date} · ${renderBooking.time} · Residence ${renderBooking.unit}`
          : undefined
      }
      footer={
        renderBooking && (
          <>
            {showMarkArrived && (
              <Button variant="quiet" onClick={onMarkArrived} icon="map-pin-check">
                Mark Arrived
              </Button>
            )}
            {renderBooking.status !== 'closed' && renderBooking.status !== 'cancelled' && (
              <Button variant="destructive" onClick={onCancel} icon="x">
                Cancel Visit
              </Button>
            )}
            {NEXT_STATUS[renderBooking.status] && (
              <Button variant="primary" onClick={advance} iconAfter="arrow-right">
                {NEXT_LABEL[renderBooking.status]}
              </Button>
            )}
          </>
        )
      }
    >
      {renderBooking && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <OpsPill tone={STATUS_TONE[renderBooking.status]}>
              {STATUS_LABEL[renderBooking.status]}
            </OpsPill>
            {renderBooking.arrivedAt && (
              <OpsPill tone="success">
                Arrived {new Date(renderBooking.arrivedAt).toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </OpsPill>
            )}
          </div>

          <FieldRow label="Resident" value={renderBooking.resident} />
          <FieldRow label="Attendant" value={renderBooking.attendant} />
          <FieldRow label="Service" value={renderBooking.service} />
          <FieldRow label="Date" value={renderBooking.date} />
          <FieldRow label="Time" value={renderBooking.time} />
          <FieldRow label="Residence" value={renderBooking.unit} />
          <FieldRow label="Charge" value={`$${renderBooking.price}`} />

          {renderBooking.note && (
            <>
              <Hairline color="var(--color-taupe-soft)" width="100%" margin="20px 0 18px" />
              <div
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: 11,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: 'var(--color-mist)',
                }}
              >
                Note from resident
              </div>
              <p
                style={{
                  marginTop: 8,
                  fontFamily: 'var(--font-sans)',
                  fontSize: 14,
                  lineHeight: 1.65,
                  color: 'var(--color-charcoal)',
                  background: 'var(--color-cream-deep)',
                  border: '1px solid var(--color-taupe-soft)',
                  borderRadius: 4,
                  padding: '12px 14px',
                }}
              >
                {renderBooking.note}
              </p>
            </>
          )}

          <Hairline color="var(--color-taupe-soft)" width="100%" margin="24px 0 18px" />
          <div
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 11,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'var(--color-mist)',
            }}
          >
            Status timeline
          </div>
          <Timeline status={renderBooking.status} events={events} arrivedAt={renderBooking.arrivedAt} />

          <Hairline color="var(--color-taupe-soft)" width="100%" margin="24px 0 0" />
          <BookingMessages bookingId={renderBooking.id} attendantName={renderBooking.attendant} />

          <Hairline color="var(--color-taupe-soft)" width="100%" margin="24px 0 0" />
          <BookingAttachments bookingId={renderBooking.id} canUpload />
        </div>
      )}
    </Drawer>
  );
}

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '110px 1fr',
        gap: 16,
        alignItems: 'baseline',
        padding: '10px 0',
        borderBottom: '1px solid var(--color-taupe-soft)',
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 10,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: 'var(--color-mist)',
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 15,
          color: 'var(--color-charcoal)',
        }}
      >
        {value}
      </span>
    </div>
  );
}

const STEPS: { key: BookingStatus; label: string }[] = [
  { key: 'scheduled', label: 'Scheduled' },
  { key: 'enroute', label: 'En Route' },
  { key: 'active', label: 'In Progress' },
  { key: 'closed', label: 'Closed' },
];

function Timeline({
  status,
  events,
  arrivedAt,
}: {
  status: BookingStatus;
  events: BookingStatusEventRow[];
  arrivedAt: string | null;
}) {
  if (status === 'cancelled') {
    const cancelEvent = events.find((e) => e.to_status === 'cancelled');
    return (
      <div
        style={{
          marginTop: 14,
          fontFamily: 'var(--font-sans)',
          fontSize: 13,
          color: 'var(--color-status-danger)',
        }}
      >
        Cancelled
        {cancelEvent ? ` · ${formatStamp(cancelEvent.created_at)}` : ''}.
        {cancelEvent?.reason ? ` — ${cancelEvent.reason}` : ''}
      </div>
    );
  }
  const currentIdx = STEPS.findIndex((s) => s.key === status);
  // Pick the most recent event per step.
  function eventFor(step: BookingStatus): BookingStatusEventRow | undefined {
    const matches = events.filter((e) => e.to_status === step);
    return matches[matches.length - 1];
  }
  return (
    <ol style={{ listStyle: 'none', padding: 0, margin: '14px 0 0' }}>
      {STEPS.map((step, i) => {
        const done = i < currentIdx;
        const active = i === currentIdx;
        const ev = eventFor(step.key);
        return (
          <li
            key={step.key}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '8px 0',
              opacity: done || active ? 1 : 0.4,
            }}
          >
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: done
                  ? 'var(--color-champagne-deep)'
                  : active
                    ? 'var(--color-champagne)'
                    : 'var(--color-taupe)',
                border: active ? '2px solid rgba(196,151,62,0.2)' : 0,
                boxSizing: 'content-box',
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 13,
                color: active ? 'var(--color-charcoal)' : 'var(--color-mist)',
                fontWeight: active ? 500 : 400,
                flex: 1,
              }}
            >
              {step.label}
            </span>
            {ev && (
              <span
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: 11,
                  color: 'var(--color-mist)',
                  letterSpacing: '0.04em',
                }}
              >
                {formatStamp(ev.created_at)}
              </span>
            )}
            {step.key === 'active' && arrivedAt && (
              <span
                title="Arrival recorded"
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: 10,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: 'var(--color-champagne-deep)',
                  marginLeft: 6,
                }}
              >
                Arrived
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

function formatStamp(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
