import { FormEvent, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Eyebrow, Field, Hairline, HelpPopover } from '../../components';
import type { FieldStatus } from '../../components';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import type { ClientTrack } from './types';

export interface SignInProps {
  /** Called after a successful sign-in. Navigation should happen here. */
  onSignIn: () => void;
  /**
   * If set, the form asserts that the signed-in profile's `primary_track`
   * matches. Pass `null` to accept any track (used when arriving without an
   * explicit `?track=` URL param).
   */
  expectedTrack?: ClientTrack | null;
}

type FieldKey = 'email' | 'password';

export function SignIn({ onSignIn, expectedTrack = null }: SignInProps) {
  const navigate = useNavigate();
  const { signIn, signOut, status: authStatus } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const helpAnchor = useRef<HTMLDivElement | null>(null);

  async function switchToManager() {
    if (authStatus === 'authenticated') await signOut();
    navigate('/sign-in/manager');
  }

  function validate(): boolean {
    const next: Partial<Record<FieldKey, string>> = {};
    if (!email.trim()) next.email = 'Required.';
    else if (!/^\S+@\S+\.\S+$/.test(email.trim())) next.email = 'Use a valid email.';
    if (!password) next.password = 'Required.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  const [wrongRoleHint, setWrongRoleHint] = useState<'manager' | null>(null);
  const [wrongTrackHint, setWrongTrackHint] = useState<ClientTrack | null>(null);

  async function handle(e: FormEvent) {
    e.preventDefault();
    setServerError(null);
    setWrongRoleHint(null);
    setWrongTrackHint(null);
    if (!validate()) return;
    setSubmitting(true);
    const { error } = await signIn(email.trim(), password);
    if (error) {
      setSubmitting(false);
      setServerError(translate(error));
      return;
    }

    // Validate the role server-side: only residents (or attendants) belong here.
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setSubmitting(false);
      setServerError('Sign-in failed. Try again.');
      return;
    }
    const { data: prof, error: profErr } = await supabase
      .from('profiles')
      .select('role, primary_track')
      .eq('id', user.id)
      .single();
    setSubmitting(false);
    if (profErr || !prof) {
      await signOut();
      setServerError('Your profile is not available. Contact AP Enterprises support.');
      return;
    }
    if (prof.role === 'property_manager' || prof.role === 'super_admin') {
      await signOut();
      setServerError('This sign-in is reserved for residents.');
      setWrongRoleHint('manager');
      return;
    }
    if (prof.role !== 'resident' && prof.role !== 'attendant') {
      await signOut();
      setServerError('This account does not have resident access.');
      return;
    }
    // Track validation only runs when the caller passed an expectation
    // (i.e. the URL had ?track=). Profiles without a track yet (no unit
    // attached) are allowed through.
    if (expectedTrack && prof.primary_track && prof.primary_track !== expectedTrack) {
      await signOut();
      const human = prof.primary_track === 'commercial' ? 'commercial' : 'residential';
      setServerError(`This account is registered for the ${human} portal.`);
      setWrongTrackHint(prof.primary_track);
      return;
    }
    onSignIn();
  }

  async function switchTrack(target: ClientTrack) {
    if (authStatus === 'authenticated') await signOut();
    navigate(`/sign-in/resident?track=${target}`);
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
            label="Email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) setErrors((p) => ({ ...p, email: undefined }));
              if (serverError) setServerError(null);
            }}
            status={status('email')}
            hint={errors.email}
            autoComplete="email"
            required
          />
          <Field
            label="Password"
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) setErrors((p) => ({ ...p, password: undefined }));
              if (serverError) setServerError(null);
            }}
            status={status('password')}
            hint={errors.password}
            autoComplete="current-password"
            required
          />
        </div>

        {serverError && (
          <div
            role="alert"
            style={{
              marginTop: 18,
              fontFamily: 'var(--font-sans)',
              fontSize: 13,
              color: 'var(--color-status-danger)',
              padding: '10px 12px',
              background: 'rgba(122,46,46,0.06)',
              border: '1px solid rgba(122,46,46,0.25)',
              borderRadius: 4,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <span>{serverError}</span>
            {wrongRoleHint === 'manager' && (
              <button
                type="button"
                onClick={switchToManager}
                style={errorActionStyle}
              >
                Go to manager sign-in →
              </button>
            )}
            {wrongTrackHint && (
              <button
                type="button"
                onClick={() => switchTrack(wrongTrackHint)}
                style={errorActionStyle}
              >
                Go to {wrongTrackHint} sign-in →
              </button>
            )}
          </div>
        )}

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
            <Button variant="quiet" onClick={() => setHelpOpen((v) => !v)} type="button">
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

        <div
          style={{
            marginTop: 24,
            paddingTop: 18,
            borderTop: '1px solid var(--color-taupe-soft)',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <button
            type="button"
            onClick={switchToManager}
            style={{
              background: 'transparent',
              border: 0,
              padding: 0,
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              fontSize: 13,
              color: 'var(--color-mist)',
            }}
          >
            Manager Instead
          </button>
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

const errorActionStyle: React.CSSProperties = {
  alignSelf: 'flex-start',
  background: 'transparent',
  border: '1px solid var(--color-status-danger)',
  borderRadius: 4,
  padding: '5px 10px',
  cursor: 'pointer',
  fontFamily: 'var(--font-sans)',
  fontSize: 12,
  color: 'var(--color-status-danger)',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
};

function translate(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('invalid login')) return 'Email and password do not match.';
  if (m.includes('email not confirmed')) return 'This account has not been confirmed.';
  if (m.includes('rate limit')) return 'Too many attempts. Wait a moment and try again.';
  return message;
}
