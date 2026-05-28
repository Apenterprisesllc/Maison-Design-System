import { useState } from 'react';
import { Button, Field, useLucide, useToast } from '../../components';
import { useOps } from './context';
import {
  OpsCard,
  OpsEyebrow,
  OpsHairline,
  OpsIcon,
  OpsPill,
} from './OpsPrimitives';
import type { OpsPillTone } from './OpsPrimitives';
import type { CommissionStatus, ReferralRow, ReferralStatus } from '../../lib/types/db';

const STATUS_LABEL: Record<ReferralStatus, string> = {
  pending: 'Pending',
  contacted: 'Contacted',
  booked: 'Booked',
  completed: 'Completed',
  declined: 'Declined',
};

const STATUS_TONE: Record<ReferralStatus, OpsPillTone> = {
  pending: 'info',
  contacted: 'warning',
  booked: 'success',
  completed: 'success',
  declined: 'danger',
};

const COMMISSION_LABEL: Record<CommissionStatus, string> = {
  pending: 'Pending payment',
  paid: 'Paid',
};

const COMMISSION_TONE: Record<CommissionStatus, OpsPillTone> = {
  pending: 'warning',
  paid: 'success',
};

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 10);
  const a = digits.slice(0, 3);
  const b = digits.slice(3, 6);
  const c = digits.slice(6, 10);
  if (digits.length <= 3) return a;
  if (digits.length <= 6) return `(${a}) ${b}`;
  return `(${a}) ${b}-${c}`;
}

export function ManagerReferrals() {
  useLucide();
  const toast = useToast();
  const { referrals, units, services, createReferral, propertyName } = useOps();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [unitId, setUnitId] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const phoneDigits = phone.replace(/\D/g, '');
  const trimmedName = name.trim();

  function validate(): string | null {
    if (trimmedName.length < 2) return 'Full name is required.';
    if (phoneDigits.length !== 10) return 'Enter a ten-digit phone number.';
    if (!unitId) return 'Pick the unit or area inside your building.';
    if (!serviceId) return 'Pick the suggested service.';
    return null;
  }

  const error = validate();
  const canSubmit = error === null && !submitting;

  async function submit() {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await createReferral({
        referred_name: trimmedName,
        referred_phone: phone.trim(),
        unit_id: unitId || null,
        suggested_service_id: serviceId || null,
        note: note.trim() || null,
      });
      toast.success(`Referral sent — AP will follow up with ${trimmedName}.`);
      setName('');
      setPhone('');
      setUnitId('');
      setServiceId('');
      setNote('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not send referral.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ padding: 'clamp(20px, 4vw, 32px) clamp(20px, 4vw, 32px) 56px' }}>
      <div>
        <OpsEyebrow>{propertyName} · Referrals</OpsEyebrow>
        <h1
          style={{
            fontFamily: 'Fraunces, serif',
            fontWeight: 300,
            fontSize: 36,
            letterSpacing: '-0.02em',
            margin: '6px 0 0',
            color: '#1A1A1A',
          }}
        >
          Send a referral
        </h1>
        <p
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: 14,
            color: '#4A4A4A',
            margin: '10px 0 0',
            maxWidth: 580,
            lineHeight: 1.6,
          }}
        >
          Hand off prospective clients from your building to AP. We follow up,
          book the service, and credit you a commission when it lands.
        </p>
      </div>
      <OpsHairline width={48} margin="20px 0 28px" />

      <div
        className="referrals-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)',
          gap: 24,
          alignItems: 'start',
        }}
      >
        {/* ── Lista de referidos ────────────────────────── */}
        <OpsCard padding={0} style={{ overflow: 'hidden' }}>
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--color-taupe)',
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
            }}
          >
            <h2
              style={{
                fontFamily: 'Fraunces, serif',
                fontWeight: 400,
                fontSize: 20,
                margin: 0,
                color: '#1A1A1A',
              }}
            >
              Your referrals
            </h2>
            <span
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: 11,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--color-mist)',
              }}
            >
              {referrals.length} {referrals.length === 1 ? 'referral' : 'referrals'}
            </span>
          </div>

          {referrals.length === 0 ? (
            <div
              style={{
                padding: '48px 24px',
                textAlign: 'center',
                color: 'var(--color-mist)',
                fontFamily: 'var(--font-sans)',
                fontSize: 13,
                lineHeight: 1.6,
              }}
            >
              No referrals yet. Use the form on the right to hand off your
              first prospect.
            </div>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {referrals.map((r) => (
                <ReferralRowView key={r.id} row={r} services={services} units={units} />
              ))}
            </ul>
          )}
        </OpsCard>

        {/* ── Form ─────────────────────────────────────── */}
        <OpsCard style={{ padding: 24 }}>
          <h2
            style={{
              fontFamily: 'Fraunces, serif',
              fontWeight: 400,
              fontSize: 20,
              margin: 0,
              color: '#1A1A1A',
            }}
          >
            New referral
          </h2>
          <OpsHairline width={32} margin="14px 0 20px" />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <Field
              label="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Carlos López"
              autoComplete="off"
              required
            />
            <Field
              label="Phone"
              value={phone}
              onChange={(e) => setPhone(formatPhone(e.target.value))}
              placeholder="(305) 555-0123"
              type="tel"
              autoComplete="off"
              required
              status={
                phone.length === 0 || phoneDigits.length === 10 ? 'default' : 'error'
              }
              hint={phone.length > 0 && phoneDigits.length < 10 ? 'Ten digits.' : undefined}
            />

            <FormSelect
              label="Unit / area"
              value={unitId}
              onChange={setUnitId}
              placeholder="Pick a unit in your building…"
            >
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.id} · {u.kind === 'commercial' ? 'Commercial' : 'Residential'}
                </option>
              ))}
            </FormSelect>

            <FormSelect
              label="Suggested service"
              value={serviceId}
              onChange={setServiceId}
              placeholder="Which service would they want?"
            >
              {services
                .filter((s) => s.active)
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
            </FormSelect>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label
                htmlFor="referral-note"
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: 11,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: 'var(--color-mist)',
                }}
              >
                Note
              </label>
              <textarea
                id="referral-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Context for AP (e.g. best time to call, neighbour, language)."
                rows={3}
                maxLength={240}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  fontFamily: 'var(--font-sans)',
                  fontSize: 14,
                  color: 'var(--color-charcoal)',
                  background: 'transparent',
                  border: '1px solid var(--color-taupe)',
                  borderRadius: 2,
                  padding: '10px 12px',
                  outline: 'none',
                  resize: 'vertical',
                  lineHeight: 1.55,
                }}
              />
              <span
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: 11,
                  color: 'var(--color-mist-soft)',
                  textAlign: 'right',
                }}
              >
                {note.length} / 240
              </span>
            </div>

            {error && !submitting && (
              <p
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: 12,
                  color: 'var(--color-mist)',
                  margin: 0,
                  textAlign: 'right',
                }}
              >
                {error}
              </p>
            )}

            <Button
              variant="primary"
              disabled={!canSubmit}
              loading={submitting}
              onClick={submit}
              iconAfter={submitting ? undefined : 'send'}
              style={{ alignSelf: 'flex-end' }}
            >
              {submitting ? 'Sending' : 'Send Referral'}
            </Button>
          </div>
        </OpsCard>
      </div>

      <style>{`
        @media (max-width: 1023px) {
          .referrals-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

function ReferralRowView({
  row,
  services,
  units,
}: {
  row: ReferralRow;
  services: { id: string; name: string }[];
  units: { id: string }[];
}) {
  const svc = services.find((s) => s.id === row.suggested_service_id);
  const unit = units.find((u) => u.id === row.unit_id);
  const created = new Date(row.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
  });
  return (
    <li
      style={{
        padding: '14px 20px',
        borderTop: '1px solid var(--color-taupe-soft)',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
        <span
          style={{
            fontFamily: 'Fraunces, serif',
            fontSize: 16,
            color: '#1A1A1A',
          }}
        >
          {row.referred_name}
        </span>
        <span
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: 11,
            color: '#8A8378',
            letterSpacing: '0.04em',
          }}
        >
          {row.reference} · {created}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <OpsPill tone={STATUS_TONE[row.status]}>{STATUS_LABEL[row.status]}</OpsPill>
        {(row.status === 'booked' || row.status === 'completed') && (
          <OpsPill tone={COMMISSION_TONE[row.commission_status]}>
            {COMMISSION_LABEL[row.commission_status]}
          </OpsPill>
        )}
        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#4A4A4A' }}>
          {svc?.name ?? '—'}
        </span>
        {unit && (
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#8A8378' }}>
            <OpsIcon name="map-pin" size={11} /> {row.unit_id}
          </span>
        )}
      </div>
      {row.note && (
        <p
          style={{
            margin: '4px 0 0',
            fontFamily: 'Inter, sans-serif',
            fontSize: 12,
            color: '#4A4A4A',
            lineHeight: 1.55,
          }}
        >
          {row.note}
        </p>
      )}
    </li>
  );
}

function FormSelect({
  label,
  value,
  onChange,
  placeholder,
  children,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 11,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: 'var(--color-mist)',
        }}
      >
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            appearance: 'none',
            WebkitAppearance: 'none',
            width: '100%',
            boxSizing: 'border-box',
            fontFamily: 'var(--font-serif)',
            fontSize: 16,
            color: value ? 'var(--color-charcoal)' : 'var(--color-mist)',
            background: 'transparent',
            border: 'none',
            borderBottom: '1px solid var(--color-taupe)',
            padding: '8px 28px 8px 0',
            outline: 'none',
            cursor: 'pointer',
          }}
        >
          <option value="">{placeholder}</option>
          {children}
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
          <OpsIcon name="chevron-down" size={14} />
        </span>
      </div>
    </div>
  );
}
