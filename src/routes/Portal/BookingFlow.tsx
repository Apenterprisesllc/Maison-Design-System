import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Eyebrow, Hairline, Icon, StepIndicator, useLucide, useToast } from '../../components';
import { usePortal } from './context';
import { Calendar, TimeSlots } from './Calendar';
import type { TimeSlot } from './types';

const SLOT_DEFINITIONS: TimeSlot[] = [
  { id: '0900', label: '9:00 AM' },
  { id: '1030', label: '10:30 AM' },
  { id: '1200', label: '12:00 PM' },
  { id: '1330', label: '1:30 PM' },
  { id: '1500', label: '3:00 PM' },
  { id: '1630', label: '4:30 PM' },
  { id: '1800', label: '6:00 PM' },
  { id: '1930', label: '7:30 PM' },
];

const NOTE_MAX = 240;

export function BookingFlow() {
  const { serviceId } = useParams<{ serviceId: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { getServiceById, addBooking, hasUnit, loading, loadBookedSlotsForDate, busyDates } = usePortal();
  const service = serviceId ? getServiceById(serviceId) : undefined;
  useLucide();

  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [bookedSlotIds, setBookedSlotIds] = useState<Set<string>>(new Set());
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  // Re-query availability whenever the user changes the selected date.
  useEffect(() => {
    let cancelled = false;
    if (!date || !hasUnit) {
      setBookedSlotIds(new Set());
      return;
    }
    setCheckingAvailability(true);
    setTime(null);
    loadBookedSlotsForDate(date)
      .then((set) => {
        if (!cancelled) setBookedSlotIds(set);
      })
      .catch(() => {
        if (!cancelled) setBookedSlotIds(new Set());
      })
      .finally(() => {
        if (!cancelled) setCheckingAvailability(false);
      });
    return () => {
      cancelled = true;
    };
  }, [date, hasUnit, loadBookedSlotsForDate]);

  const slots = useMemo<TimeSlot[]>(
    () =>
      SLOT_DEFINITIONS.map((s) => ({
        ...s,
        disabled: bookedSlotIds.has(s.id),
      })),
    [bookedSlotIds],
  );

  if (!service && !loading) {
    // Bad URL — bounce back to catalogue
    navigate('/portal', { replace: true });
    return null;
  }
  if (!service) return null;

  const canContinue = !!(date && time) && note.length <= NOTE_MAX && !submitting && hasUnit;
  const currentStep = !date ? 1 : !time ? 2 : 3;
  const noteRemaining = NOTE_MAX - note.length;

  async function confirm() {
    if (!service || !date || !time || !hasUnit) return;
    const timeLabel = slots.find((s) => s.id === time)?.label ?? '';
    setSubmitting(true);
    try {
      const created = await addBooking({ service: service!, date: date!, time: timeLabel, note });
      navigate(`/portal/services/${service!.id}/confirm?bookingId=${created.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not schedule. Try again.';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main
      style={{
        maxWidth: 1240,
        margin: '0 auto',
        padding: 'clamp(32px, 5vw, 48px) clamp(20px, 4vw, 56px) 160px',
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

      <div
        className="booking-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0,1fr) 380px',
          gap: 'clamp(32px, 5vw, 64px)',
          alignItems: 'start',
        }}
      >
        <div>
          <Eyebrow>{service.kicker}</Eyebrow>
          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontWeight: 300,
              fontSize: 'clamp(36px, 5vw, 52px)',
              letterSpacing: '-0.02em',
              lineHeight: 1.08,
              color: 'var(--color-charcoal)',
              margin: '10px 0 0',
            }}
          >
            {service.name}
          </h1>
          <Hairline width={48} margin="20px 0 24px" />
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 16,
              color: 'var(--color-mist)',
              lineHeight: 1.7,
              margin: 0,
              maxWidth: 560,
            }}
          >
            {service.description}
          </p>

          <div style={{ marginTop: 44, paddingBlock: 6 }}>
            <StepIndicator
              current={currentStep}
              steps={[
                { id: 'date', label: 'Date' },
                { id: 'time', label: 'Time' },
                { id: 'note', label: 'Note' },
              ]}
            />
          </div>

          <section style={{ marginTop: 40 }}>
            <Eyebrow>Date · Pick a window</Eyebrow>
            <div style={{ height: 16 }} />
            <Calendar selectedDate={date} onSelect={setDate} busyDates={busyDates} />
          </section>

          <section style={{ marginTop: 48 }}>
            <Eyebrow>Time</Eyebrow>
            <div style={{ height: 10 }} />
            <p
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 13,
                color: 'var(--color-mist-soft)',
                margin: '0 0 10px',
              }}
            >
              {!date
                ? 'Pick a date to see availability.'
                : checkingAvailability
                  ? 'Checking availability…'
                  : 'Available windows for the selected date.'}
            </p>
            <TimeSlots slots={slots} selected={time} onSelect={setTime} />
          </section>

          <section style={{ marginTop: 48 }}>
            <Eyebrow>Note for Attendant</Eyebrow>
            <p
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 12,
                color: 'var(--color-mist-soft)',
                margin: '6px 0 12px',
              }}
            >
              Optional. Shared with the attendant before the visit.
            </p>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. The front desk has a key. Please ring at 2104 on arrival."
              rows={4}
              maxLength={NOTE_MAX + 40}
              aria-describedby="note-counter"
              style={{
                width: '100%',
                boxSizing: 'border-box',
                fontFamily: 'var(--font-sans)',
                fontSize: 15,
                color: 'var(--color-charcoal)',
                background: 'transparent',
                border: `1px solid ${
                  note.length > NOTE_MAX ? 'var(--color-status-danger)' : 'var(--color-taupe)'
                }`,
                borderRadius: 2,
                padding: '12px 14px',
                outline: 'none',
                resize: 'vertical',
                lineHeight: 1.6,
                transition: 'border-color var(--dur-state) var(--ease-out)',
              }}
            />
            <div
              id="note-counter"
              style={{
                marginTop: 8,
                fontFamily: 'var(--font-sans)',
                fontSize: 11,
                letterSpacing: '0.06em',
                color:
                  note.length > NOTE_MAX
                    ? 'var(--color-status-danger)'
                    : noteRemaining < 40
                      ? 'var(--color-champagne-deep)'
                      : 'var(--color-mist-soft)',
                textAlign: 'right',
              }}
              aria-live="polite"
            >
              {note.length > NOTE_MAX
                ? `${note.length - NOTE_MAX} over the limit`
                : `${note.length} / ${NOTE_MAX}`}
            </div>
          </section>
        </div>

        <aside
          className="booking-summary"
          style={{
            position: 'sticky',
            top: 100,
            background: 'var(--bg-surface)',
            border: '1px solid var(--color-taupe)',
            borderRadius: 8,
            padding: '28px 28px 24px',
            boxShadow: 'var(--shadow-1)',
          }}
        >
          <Eyebrow>Summary</Eyebrow>
          <Hairline width={32} margin="14px 0 18px" />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Row label="Service" value={service.name} />
            <Row
              label="Date"
              value={
                date
                  ? date.toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                    })
                  : '—'
              }
            />
            <Row label="Time" value={time ? slots.find((s) => s.id === time)?.label ?? '—' : '—'} />
            <Row label="Cadence" value={service.cadence} />
          </div>

          <div
            style={{
              marginTop: 24,
              paddingTop: 18,
              borderTop: '1px solid var(--color-taupe)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: 11,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: 'var(--color-mist)',
                }}
              >
                Total
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: 28,
                  color: 'var(--color-charcoal)',
                }}
              >
                ${service.price}
              </span>
            </div>
            <p
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 12,
                color: 'var(--color-mist-soft)',
                margin: '10px 0 0',
                lineHeight: 1.5,
              }}
            >
              Charged to the account on file after the visit.
            </p>
          </div>

          <Button
            variant="primary"
            disabled={!canContinue}
            loading={submitting}
            onClick={confirm}
            style={{ width: '100%', marginTop: 24, justifyContent: 'center' }}
            iconAfter={submitting ? undefined : 'arrow-right'}
          >
            {submitting ? 'Scheduling' : 'Schedule This Visit'}
          </Button>
          {!canContinue && !submitting && (
            <p
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 11,
                color: 'var(--color-mist-soft)',
                margin: '12px 0 0',
                lineHeight: 1.5,
                textAlign: 'center',
              }}
            >
              {!hasUnit
                ? 'A residence must be on file. Contact the front desk.'
                : !date
                  ? 'Pick a date to continue.'
                  : !time
                    ? 'Pick a time to continue.'
                    : 'Shorten the note to continue.'}
            </p>
          )}
        </aside>
      </div>

      <style>{`
        @media (max-width: 1023px) {
          .booking-grid { grid-template-columns: 1fr !important; }
          .booking-summary {
            position: sticky !important;
            top: auto !important;
            bottom: 0 !important;
            margin-top: 32px !important;
            border-radius: 0 !important;
            margin-inline: calc(-1 * clamp(20px, 4vw, 56px));
            border-left: 0 !important;
            border-right: 0 !important;
            border-bottom: 0 !important;
          }
        }
      `}</style>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
      <span
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 11,
          letterSpacing: '0.14em',
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
          textAlign: 'right',
        }}
      >
        {value}
      </span>
    </div>
  );
}
