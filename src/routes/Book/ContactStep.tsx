import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  BrandMark,
  Button,
  Eyebrow,
  Field,
  Hairline,
  Icon,
  Spinner,
  useLucide,
  useToast,
} from '../../components';
import {
  createGuestBooking,
  listUnitsForProperty,
  type PublicUnit,
} from '../../lib/api/guestBookings';
import { DRAFT_KEY, type GuestBookingDraft } from './GuestBookingFlow';

function readDraft(): GuestBookingDraft | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as GuestBookingDraft;
  } catch {
    return null;
  }
}

function clearDraft() {
  try {
    sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    /* ignore */
  }
}

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 10);
  const a = digits.slice(0, 3);
  const b = digits.slice(3, 6);
  const c = digits.slice(6, 10);
  if (digits.length <= 3) return a;
  if (digits.length <= 6) return `(${a}) ${b}`;
  return `(${a}) ${b}-${c}`;
}

export function ContactStep() {
  const { propertySlug, serviceSlug } = useParams<{ propertySlug: string; serviceSlug: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  useLucide();

  const draft = useMemo(readDraft, []);
  const [units, setUnits] = useState<PublicUnit[]>([]);
  const [loadingUnits, setLoadingUnits] = useState(true);

  const [unitId, setUnitId] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitErr, setSubmitErr] = useState<string | null>(null);

  useEffect(() => {
    if (!draft || !propertySlug || !serviceSlug || draft.propertySlug !== propertySlug || draft.serviceSlug !== serviceSlug) {
      navigate(`/book/${propertySlug ?? ''}`, { replace: true });
    }
  }, [draft, propertySlug, serviceSlug, navigate]);

  useEffect(() => {
    if (!draft) return;
    let cancelled = false;
    (async () => {
      try {
        const rows = await listUnitsForProperty(draft.propertyId);
        if (!cancelled) setUnits(rows);
      } catch (err) {
        if (!cancelled) {
          toast.error(err instanceof Error ? err.message : 'Could not load units.');
        }
      } finally {
        if (!cancelled) setLoadingUnits(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [draft, toast]);

  if (!draft) return null;

  const phoneDigits = phone.replace(/\D/g, '');
  const trimmedName = name.trim();
  const trimmedAddress = address.trim();
  const validation = (() => {
    if (!unitId) return 'Pick your apartment or suite.';
    if (trimmedName.length < 2) return 'Full name is required.';
    if (phoneDigits.length !== 10) return 'Enter a ten-digit phone number.';
    if (trimmedAddress.length < 4) return 'Add your street address.';
    return null;
  })();
  const canSubmit = validation === null && !submitting;

  async function submit() {
    if (!draft || !canSubmit) return;
    setSubmitting(true);
    setSubmitErr(null);
    try {
      const booking = await createGuestBooking({
        property_id: draft.propertyId,
        unit_id: unitId,
        service: {
          id: draft.serviceId,
          slug: draft.serviceSlug,
          name: draft.serviceName,
          kicker: draft.serviceKicker,
          icon: '',
          tone: 'ink',
          price_cents: draft.servicePriceCents,
          cadence: 'on_request',
          description: '',
          track: 'residential',
          photo_path: null,
        },
        scheduled_at: draft.scheduledAt,
        note: draft.note,
        guest_name: name.trim(),
        guest_phone: phone.trim(),
        guest_address: address.trim(),
      });
      clearDraft();
      navigate(`/book/confirm/${booking.id}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not schedule. Try again.';
      setSubmitErr(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

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
          to={`/book/${draft.propertySlug}/services/${draft.serviceSlug}`}
          aria-label="Back to calendar"
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
          Final step
        </span>
      </header>

      <main
        style={{
          flex: 1,
          maxWidth: 880,
          width: '100%',
          margin: '0 auto',
          padding: 'clamp(32px, 5vw, 56px) clamp(20px, 4vw, 40px) 120px',
        }}
      >
        <button
          type="button"
          onClick={() => navigate(`/book/${draft.propertySlug}/services/${draft.serviceSlug}`)}
          aria-label="Back to calendar"
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
            marginBottom: 24,
          }}
        >
          <Icon name="chevron-left" size={16} /> Change date or time
        </button>

        <Eyebrow>Your details</Eyebrow>
        <h1
          style={{
            fontFamily: 'var(--font-serif)',
            fontWeight: 300,
            fontSize: 'clamp(30px, 4vw, 44px)',
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
            color: 'var(--color-charcoal)',
            margin: '10px 0 0',
          }}
        >
          Who should we attend to?
        </h1>
        <Hairline width={48} margin="20px 0 28px" />

        <section
          aria-label="Visit summary"
          style={{
            border: '1px solid var(--color-taupe)',
            borderRadius: 6,
            padding: '18px 20px',
            background: 'var(--bg-surface)',
            marginBottom: 28,
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 14,
          }}
          className="summary-grid"
        >
          <Stat label="Service" value={draft.serviceName} />
          <Stat label="Date" value={draft.dateLabel} />
          <Stat label="Time" value={draft.timeLabel} />
        </section>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label
              htmlFor="guest-unit"
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 11,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: 'var(--color-mist)',
              }}
            >
              Apartment / Suite
            </label>
            <div style={{ position: 'relative' }}>
              <select
                id="guest-unit"
                value={unitId}
                onChange={(e) => setUnitId(e.target.value)}
                disabled={loadingUnits}
                style={{
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  width: '100%',
                  boxSizing: 'border-box',
                  fontFamily: 'var(--font-serif)',
                  fontSize: 17,
                  color: unitId ? 'var(--color-charcoal)' : 'var(--color-mist)',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: '1px solid var(--color-taupe)',
                  padding: '10px 28px 10px 0',
                  outline: 'none',
                  cursor: loadingUnits ? 'wait' : 'pointer',
                }}
              >
                <option value="">{loadingUnits ? 'Loading units…' : 'Pick your home or suite…'}</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.external_id} · {u.kind === 'commercial' ? 'Commercial' : 'Residential'}
                  </option>
                ))}
              </select>
              <span
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  right: 4,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                  color: 'var(--color-mist)',
                  display: 'inline-flex',
                }}
              >
                <Icon name="chevron-down" size={16} />
              </span>
            </div>
            <span
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 11,
                color: 'var(--color-mist-soft)',
              }}
            >
              Don't see your unit? Pick the closest and add details in the address field.
            </span>
          </div>

          <Field
            label="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. María García"
            autoComplete="name"
            required
          />

          <Field
            label="Phone"
            value={phone}
            onChange={(e) => setPhone(formatPhone(e.target.value))}
            placeholder="(305) 555-0123"
            type="tel"
            autoComplete="tel-national"
            required
            status={phone.length === 0 || phoneDigits.length === 10 ? 'default' : 'error'}
            hint={phone.length > 0 && phoneDigits.length < 10 ? 'Ten digits, US format.' : undefined}
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label
              htmlFor="guest-address"
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 11,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: 'var(--color-mist)',
              }}
            >
              Address
            </label>
            <textarea
              id="guest-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Street, building name, and any access notes."
              rows={3}
              autoComplete="street-address"
              style={{
                width: '100%',
                boxSizing: 'border-box',
                fontFamily: 'var(--font-sans)',
                fontSize: 15,
                color: 'var(--color-charcoal)',
                background: 'transparent',
                border: '1px solid var(--color-taupe)',
                borderRadius: 2,
                padding: '12px 14px',
                outline: 'none',
                resize: 'vertical',
                lineHeight: 1.55,
              }}
            />
          </div>
        </div>

        {submitErr && (
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 13,
              color: 'var(--color-status-danger)',
              marginTop: 18,
            }}
          >
            {submitErr}
          </p>
        )}

        {!canSubmit && validation && !submitting && (
          <p
            aria-live="polite"
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 12,
              color: 'var(--color-mist)',
              marginTop: 24,
              marginBottom: 0,
              textAlign: 'right',
            }}
          >
            {validation}
          </p>
        )}

        <div
          style={{
            marginTop: 16,
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 12,
          }}
        >
          <Button
            variant="secondary"
            onClick={() => navigate(`/book/${draft.propertySlug}/services/${draft.serviceSlug}`)}
          >
            Back
          </Button>
          <Button
            variant="primary"
            disabled={!canSubmit}
            loading={submitting}
            onClick={submit}
            iconAfter={submitting ? undefined : 'check'}
          >
            {submitting ? 'Confirming' : 'Confirm Booking'}
          </Button>
        </div>

        {loadingUnits && (
          <div style={{ position: 'fixed', bottom: 24, right: 24 }}>
            <Spinner />
          </div>
        )}

        <style>{`
          @media (max-width: 720px) {
            .summary-grid { grid-template-columns: 1fr !important; }
          }
        `}</style>
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
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
