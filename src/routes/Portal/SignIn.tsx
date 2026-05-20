import { FormEvent, useRef, useState } from 'react';
import { Button, Eyebrow, Field, Hairline, HelpPopover } from '../../components';
import type { FieldStatus } from '../../components';
import type { Resident } from './types';

export interface SignInProps {
  onSignIn: (resident: Resident) => void;
}

type FieldKey = 'building' | 'residence' | 'name';

export function SignIn({ onSignIn }: SignInProps) {
  const [building, setBuilding] = useState('The Arden');
  const [residence, setResidence] = useState('2104');
  const [name, setName] = useState('Eleanor Ashcombe');
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const helpAnchor = useRef<HTMLDivElement | null>(null);

  function validate(): boolean {
    const next: Partial<Record<FieldKey, string>> = {};
    if (!building.trim()) next.building = 'Required.';
    if (!residence.trim()) next.residence = 'Required.';
    if (!name.trim()) next.name = 'Required.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handle(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    // Mock backend latency for premium feel
    window.setTimeout(() => {
      onSignIn({
        building: building.trim(),
        residence: residence.trim(),
        name: name.trim(),
        track: 'residential',
      });
    }, 800);
  }

  const status = (key: FieldKey): FieldStatus => (errors[key] ? 'error' : 'default');

  return (
    <main
      style={{
        minHeight: 'calc(100vh - 67px)',
        display: 'grid',
        placeItems: 'center',
        padding: 'clamp(40px, 6vw, 80px) 24px',
      }}
    >
      <form
        onSubmit={handle}
        noValidate
        style={{
          width: 460,
          maxWidth: '100%',
          background: 'var(--bg-surface)',
          border: '1px solid var(--color-taupe)',
          borderRadius: 8,
          boxShadow: 'var(--shadow-1)',
          padding: 'clamp(32px, 5vw, 56px)',
        }}
      >
        <Eyebrow>AP Enterprises · Memberships</Eyebrow>
        <h1
          style={{
            fontFamily: 'var(--font-serif)',
            fontWeight: 300,
            fontSize: 40,
            letterSpacing: '-0.02em',
            lineHeight: 1.08,
            color: 'var(--color-charcoal)',
            margin: '10px 0 0',
          }}
        >
          Welcome back.
        </h1>
        <Hairline width={48} margin="20px 0 32px" />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          <Field
            label="Building"
            value={building}
            onChange={(e) => {
              setBuilding(e.target.value);
              if (errors.building) setErrors((p) => ({ ...p, building: undefined }));
            }}
            status={status('building')}
            hint={errors.building}
            autoComplete="organization"
            required
          />
          <Field
            label="Residence"
            value={residence}
            onChange={(e) => {
              setResidence(e.target.value);
              if (errors.residence) setErrors((p) => ({ ...p, residence: undefined }));
            }}
            status={status('residence')}
            hint={errors.residence}
            autoComplete="address-line2"
            required
          />
          <Field
            label="Resident Name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (errors.name) setErrors((p) => ({ ...p, name: undefined }));
            }}
            status={status('name')}
            hint={errors.name}
            autoComplete="name"
            required
          />
        </div>

        <div
          style={{
            marginTop: 40,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          <div ref={helpAnchor} style={{ position: 'relative' }}>
            <Button variant="quiet" onClick={() => setHelpOpen((v) => !v)}>
              Need Help
            </Button>
            <HelpPopover open={helpOpen} onClose={() => setHelpOpen(false)} anchorRef={helpAnchor} />
          </div>
          <Button
            variant="primary"
            type="submit"
            loading={submitting}
            iconAfter={submitting ? undefined : 'arrow-right'}
          >
            {submitting ? 'Signing In' : 'Sign In'}
          </Button>
        </div>

        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 12,
            color: 'var(--color-mist-soft)',
            marginTop: 32,
            lineHeight: 1.6,
          }}
        >
          Memberships is available only to residents of buildings under AP Enterprises stewardship.
        </p>
      </form>
    </main>
  );
}
