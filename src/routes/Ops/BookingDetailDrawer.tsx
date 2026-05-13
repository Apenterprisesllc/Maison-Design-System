import { Button, Drawer, Hairline, useRetained, useToast } from '../../components';
import { useOps } from './context';
import { STATUS_LABEL, STATUS_TONE, type BookingStatus } from './data';
import { OpsPill } from './OpsPrimitives';

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
  const { selectedBooking, closeBooking, setBookingStatus, cancelBooking } = useOps();
  const open = !!selectedBooking;
  const renderBooking = useRetained(selectedBooking, 320);

  function advance() {
    if (!selectedBooking) return;
    const next = NEXT_STATUS[selectedBooking.status];
    if (!next) return;
    setBookingStatus(selectedBooking.id, next);
    toast.success(`${selectedBooking.id} → ${STATUS_LABEL[next]}.`);
  }

  function onCancel() {
    if (!selectedBooking) return;
    cancelBooking(selectedBooking.id);
    toast.success(`${selectedBooking.id} cancelled.`);
    closeBooking();
  }

  function onMessage() {
    if (!selectedBooking) return;
    toast.info(`Message sent to ${selectedBooking.attendant}.`);
  }

  return (
    <Drawer
      open={open}
      onClose={closeBooking}
      eyebrow={renderBooking?.id ?? 'Booking'}
      title={renderBooking?.service ?? ''}
      subtitle={
        renderBooking
          ? `${renderBooking.date} · ${renderBooking.time} · Residence ${renderBooking.unit}`
          : undefined
      }
      footer={
        renderBooking && (
          <>
            <Button variant="quiet" onClick={onMessage} icon="message-circle">
              Message Attendant
            </Button>
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
            {renderBooking.duration && (
              <span
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: 11,
                  letterSpacing: '0.06em',
                  color: 'var(--color-mist)',
                }}
              >
                {renderBooking.duration} elapsed
              </span>
            )}
          </div>

          <FieldRow label="Resident" value={renderBooking.resident} />
          <FieldRow label="Attendant" value={renderBooking.attendant} />
          <FieldRow label="Service" value={renderBooking.service} />
          <FieldRow label="Date" value={`${renderBooking.date}, 2026`} />
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
          <Timeline status={renderBooking.status} />
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

function Timeline({ status }: { status: BookingStatus }) {
  if (status === 'cancelled') {
    return (
      <div
        style={{
          marginTop: 14,
          fontFamily: 'var(--font-sans)',
          fontSize: 13,
          color: 'var(--color-status-danger)',
        }}
      >
        Cancelled. No further status updates.
      </div>
    );
  }
  const currentIdx = STEPS.findIndex((s) => s.key === status);
  return (
    <ol style={{ listStyle: 'none', padding: 0, margin: '14px 0 0' }}>
      {STEPS.map((step, i) => {
        const done = i < currentIdx;
        const active = i === currentIdx;
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
                border: active ? '2px solid rgba(201,169,97,0.2)' : 0,
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
              }}
            >
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
