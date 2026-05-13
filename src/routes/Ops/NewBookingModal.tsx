import { useEffect, useMemo, useState } from 'react';
import { Button, Eyebrow, Hairline, Modal, StepIndicator, useToast } from '../../components';
import { useOps } from './context';
import { SERVICES } from './data';

const TIMES = ['8:00', '9:00', '10:30', '12:00', '14:00', '15:30', '17:00'];

export function NewBookingModal() {
  const toast = useToast();
  const {
    newBookingOpen,
    closeNewBooking,
    newBookingPrefill,
    units,
    createBooking,
    openBooking,
  } = useOps();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [unit, setUnit] = useState('');
  const [serviceKey, setServiceKey] = useState('');
  const [date, setDate] = useState('15 May');
  const [time, setTime] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (newBookingOpen) {
      setStep(1);
      setUnit(newBookingPrefill ?? '');
      setServiceKey('');
      setDate('15 May');
      setTime('');
      setNote('');
    }
  }, [newBookingOpen, newBookingPrefill]);

  const sortedUnits = useMemo(
    () => [...units].sort((a, b) => a.id.localeCompare(b.id)),
    [units],
  );

  const canAdvance =
    (step === 1 && !!unit && !!serviceKey) || (step === 2 && !!date && !!time) || step === 3;

  function advance() {
    if (step === 1) setStep(2);
    else if (step === 2) setStep(3);
  }

  function submit() {
    const created = createBooking({ unit, serviceKey, date, time, note });
    toast.success(`${created.id} scheduled for ${created.date} at ${created.time}.`);
    closeNewBooking();
    // Open the new booking's drawer after a beat so the user can review
    setTimeout(() => openBooking(created.id), 220);
  }

  return (
    <Modal
      open={newBookingOpen}
      onClose={closeNewBooking}
      eyebrow="New visit"
      title="Schedule a service"
      width={580}
      footer={
        <>
          {step > 1 && (
            <Button variant="quiet" onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}>
              Back
            </Button>
          )}
          {step < 3 && (
            <Button
              variant="primary"
              disabled={!canAdvance}
              iconAfter="arrow-right"
              onClick={advance}
            >
              Continue
            </Button>
          )}
          {step === 3 && (
            <Button variant="primary" onClick={submit} iconAfter="arrow-right">
              Schedule Visit
            </Button>
          )}
        </>
      }
    >
      <div style={{ marginBottom: 24 }}>
        <StepIndicator
          current={step}
          steps={[
            { id: 'who', label: 'Who · What' },
            { id: 'when', label: 'When' },
            { id: 'note', label: 'Review' },
          ]}
        />
      </div>

      {step === 1 && (
        <>
          <Eyebrow>Residence</Eyebrow>
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            style={selectStyle}
            aria-label="Pick residence"
          >
            <option value="">Pick a residence…</option>
            {sortedUnits.map((u) => (
              <option key={u.id} value={u.id}>
                Residence {u.id} · {u.resident}
              </option>
            ))}
          </select>

          <Hairline color="var(--color-taupe-soft)" width="100%" margin="20px 0" />

          <Eyebrow>Service</Eyebrow>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 8,
              marginTop: 10,
            }}
          >
            {SERVICES.map((s) => {
              const sel = s.key === serviceKey;
              return (
                <button
                  type="button"
                  key={s.key}
                  onClick={() => setServiceKey(s.key)}
                  style={{
                    padding: '12px 14px',
                    background: sel ? 'var(--color-ink)' : 'transparent',
                    color: sel ? 'var(--color-cream)' : 'var(--color-charcoal)',
                    border: `1px solid ${sel ? 'var(--color-ink)' : 'var(--color-taupe)'}`,
                    borderRadius: 4,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition:
                      'background-color var(--dur-state) var(--ease-out), color var(--dur-state) var(--ease-out)',
                  }}
                >
                  <div
                    style={{
                      fontFamily: 'var(--font-serif)',
                      fontSize: 15,
                    }}
                  >
                    {s.name}
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: 11,
                      letterSpacing: '0.06em',
                      color: sel ? 'rgba(248,245,239,0.7)' : 'var(--color-mist)',
                      marginTop: 4,
                    }}
                  >
                    ${s.price} · {s.cadence}
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <Eyebrow>Date</Eyebrow>
          <input
            type="text"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            placeholder="e.g. 15 May"
            style={textInputStyle}
          />
          <p
            style={{
              marginTop: 8,
              fontFamily: 'var(--font-sans)',
              fontSize: 12,
              color: 'var(--color-mist-soft)',
            }}
          >
            Calendar picker available in the resident portal — type the day here.
          </p>

          <Hairline color="var(--color-taupe-soft)" width="100%" margin="22px 0 16px" />

          <Eyebrow>Time</Eyebrow>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 8,
              marginTop: 10,
            }}
          >
            {TIMES.map((t) => {
              const sel = time === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTime(t)}
                  style={{
                    padding: '10px 8px',
                    background: sel ? 'var(--color-ink)' : 'transparent',
                    color: sel ? 'var(--color-cream)' : 'var(--color-charcoal)',
                    border: `1px solid ${sel ? 'var(--color-ink)' : 'var(--color-taupe)'}`,
                    borderRadius: 4,
                    cursor: 'pointer',
                    fontFamily: 'var(--font-sans)',
                    fontSize: 13,
                    transition:
                      'background-color var(--dur-state) var(--ease-out), color var(--dur-state) var(--ease-out)',
                  }}
                >
                  {t}
                </button>
              );
            })}
          </div>

          <Hairline color="var(--color-taupe-soft)" width="100%" margin="22px 0 16px" />

          <Eyebrow>Note to attendant (optional)</Eyebrow>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="e.g. Door key with front desk."
            style={{
              ...textInputStyle,
              marginTop: 10,
              resize: 'vertical',
              minHeight: 80,
            }}
          />
        </>
      )}

      {step === 3 && (
        <ReviewCard
          unit={unit}
          serviceKey={serviceKey}
          date={date}
          time={time}
          note={note}
        />
      )}
    </Modal>
  );
}

const selectStyle: React.CSSProperties = {
  width: '100%',
  marginTop: 10,
  padding: '10px 12px',
  border: '1px solid var(--color-taupe)',
  borderRadius: 4,
  background: 'var(--bg-surface)',
  fontFamily: 'var(--font-sans)',
  fontSize: 14,
  color: 'var(--color-charcoal)',
  outline: 'none',
};

const textInputStyle: React.CSSProperties = {
  width: '100%',
  marginTop: 10,
  padding: '10px 12px',
  border: '1px solid var(--color-taupe)',
  borderRadius: 4,
  background: 'transparent',
  fontFamily: 'var(--font-sans)',
  fontSize: 14,
  color: 'var(--color-charcoal)',
  outline: 'none',
  boxSizing: 'border-box',
};

function ReviewCard({
  unit,
  serviceKey,
  date,
  time,
  note,
}: {
  unit: string;
  serviceKey: string;
  date: string;
  time: string;
  note: string;
}) {
  const service = SERVICES.find((s) => s.key === serviceKey);
  return (
    <div>
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--color-taupe)',
          borderRadius: 6,
          padding: '20px 22px',
        }}
      >
        <ReviewRow label="Residence" value={unit || '—'} />
        <ReviewRow label="Service" value={service?.name ?? '—'} />
        <ReviewRow label="Date" value={date} />
        <ReviewRow label="Time" value={time || '—'} />
        <ReviewRow label="Attendant" value={service?.attendant ?? '—'} />
        <ReviewRow label="Charge" value={service ? `$${service.price}` : '—'} />
        {note && <ReviewRow label="Note" value={note} />}
      </div>
      <p
        style={{
          marginTop: 14,
          fontFamily: 'var(--font-sans)',
          fontSize: 12,
          color: 'var(--color-mist-soft)',
          lineHeight: 1.65,
        }}
      >
        The attendant and front desk will be notified upon scheduling. The resident will receive an
        in-app confirmation.
      </p>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '120px 1fr',
        gap: 12,
        alignItems: 'baseline',
        padding: '8px 0',
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
          fontSize: 14,
          color: 'var(--color-charcoal)',
        }}
      >
        {value}
      </span>
    </div>
  );
}
