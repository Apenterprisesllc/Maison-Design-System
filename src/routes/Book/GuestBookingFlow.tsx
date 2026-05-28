import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  BrandMark,
  Button,
  Eyebrow,
  Hairline,
  Icon,
  Spinner,
  StepIndicator,
  useLucide,
  useToast,
} from '../../components';
import { Calendar, TimeSlots } from '../Portal/Calendar';
import type { TimeSlot } from '../Portal/types';
import {
  getPropertyBySlug,
  getServiceBySlugForProperty,
  type PublicProperty,
  type PublicService,
} from '../../lib/api/guestBookings';

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
export const DRAFT_KEY = 'ap.guest_booking_draft';

export interface GuestBookingDraft {
  propertyId: string;
  propertySlug: string;
  serviceId: string;
  serviceSlug: string;
  serviceName: string;
  serviceKicker: string;
  servicePriceCents: number;
  scheduledAt: string;
  dateLabel: string;
  timeLabel: string;
  note: string;
}

export function GuestBookingFlow() {
  const { propertySlug, serviceSlug } = useParams<{ propertySlug: string; serviceSlug: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  useLucide();

  const [property, setProperty] = useState<PublicProperty | null>(null);
  const [service, setService] = useState<PublicService | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!propertySlug || !serviceSlug) {
      navigate('/book', { replace: true });
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const prop = await getPropertyBySlug(propertySlug);
        if (cancelled) return;
        if (!prop) {
          navigate('/book', { replace: true });
          return;
        }
        const svc = await getServiceBySlugForProperty(serviceSlug, prop.id);
        if (cancelled) return;
        if (!svc) {
          navigate(`/book/${propertySlug}`, { replace: true });
          return;
        }
        setProperty(prop);
        setService(svc);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load service.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [propertySlug, serviceSlug, navigate]);

  const slots = useMemo<TimeSlot[]>(() => SLOT_DEFINITIONS, []);

  const canContinue = !!(date && time) && note.length <= NOTE_MAX;
  const currentStep = !date ? 1 : !time ? 2 : 3;
  const noteRemaining = NOTE_MAX - note.length;

  function onContinue() {
    if (!service || !property || !date || !time) return;
    const slot = SLOT_DEFINITIONS.find((s) => s.id === time);
    if (!slot) return;

    const scheduled = combineDateAndSlot(date, time);
    const dateLabel = date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });

    const draft: GuestBookingDraft = {
      propertyId: property.id,
      propertySlug: property.slug,
      serviceId: service.id,
      serviceSlug: service.slug,
      serviceName: service.name,
      serviceKicker: service.kicker,
      servicePriceCents: service.price_cents,
      scheduledAt: scheduled.toISOString(),
      dateLabel,
      timeLabel: slot.label,
      note: note.trim(),
    };

    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {
      toast.error('Your browser blocked session storage — try a regular window.');
      return;
    }
    navigate(`/book/${property.slug}/services/${service.slug}/contact`);
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <Spinner />
      </div>
    );
  }
  if (error || !service || !property) {
    return (
      <main style={{ padding: 48, textAlign: 'center' }}>
        <p style={{ fontFamily: 'var(--font-sans)', color: 'var(--color-status-danger)' }}>
          {error ?? 'Service not available.'}
        </p>
      </main>
    );
  }

  const price = Math.round(service.price_cents / 100);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '20px clamp(20px, 4vw, 56px)',
          borderBottom: '1px solid var(--color-taupe)',
          position: 'sticky',
          top: 0,
          background: 'rgba(244, 247, 250, 0.92)',
          backdropFilter: 'blur(12px)',
          zIndex: 20,
        }}
      >
        <Link
          to={`/book/${property.slug}`}
          aria-label="Back to property"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            textDecoration: 'none',
            border: 0,
            color: 'var(--color-charcoal)',
          }}
        >
          <BrandMark size={40} />
        </Link>
        <div style={{ flex: 1 }} />
        <span
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 11,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--color-mist)',
          }}
        >
          {property.name}
        </span>
      </header>

      <main
        style={{
          flex: 1,
          maxWidth: 1240,
          margin: '0 auto',
          width: '100%',
          padding: 'clamp(32px, 5vw, 48px) clamp(20px, 4vw, 56px) 160px',
        }}
      >
        <button
          type="button"
          onClick={() => navigate(`/book/${property.slug}`)}
          aria-label="Back to services"
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
              <Calendar selectedDate={date} onSelect={setDate} />
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
                {!date ? 'Pick a date first.' : 'Available windows for the selected date.'}
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
                placeholder="e.g. The front desk has a key. Please ring on arrival."
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
              <Row label="Community" value={property.name} />
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
            </div>

            <div
              style={{
                marginTop: 24,
                paddingTop: 18,
                borderTop: '1px solid var(--color-taupe)',
              }}
            >
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}
              >
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
                  ${price}
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
                Billed after the visit. We'll collect your contact details next.
              </p>
            </div>

            <Button
              variant="primary"
              disabled={!canContinue}
              onClick={onContinue}
              style={{ width: '100%', marginTop: 24, justifyContent: 'center' }}
              iconAfter="arrow-right"
            >
              Schedule This Visit
            </Button>
            {!canContinue && (
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
                {!date
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
    </div>
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

function combineDateAndSlot(date: Date, slotId: string): Date {
  const h = Number(slotId.slice(0, 2));
  const m = Number(slotId.slice(2));
  const out = new Date(date);
  out.setHours(h, m, 0, 0);
  return out;
}
