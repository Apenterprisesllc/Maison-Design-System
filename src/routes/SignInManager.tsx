import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Eyebrow, Field, Hairline, BrandMark, useLucide } from '../components';
import type { FieldStatus } from '../components';
import { IMAGERY } from '../data/imagery';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';

type FieldKey = 'email' | 'password';

export function SignInManager() {
  const navigate = useNavigate();
  const { status, profile, signIn, signOut } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  useLucide();

  const [wrongRoleHint, setWrongRoleHint] = useState<'resident' | null>(null);

  // Switch to the resident sign-in. If currently signed in, end the session
  // first so the resident form actually renders instead of bouncing back.
  async function switchToResident() {
    if (status === 'authenticated') await signOut();
    navigate('/sign-in/resident');
  }

  // Only auto-forward when the signed-in user actually belongs here. If a
  // resident or attendant slips in, the form's handle() will sign them out
  // and surface the shortcut. Auto-redirecting them would unmount the form
  // mid-validation and the error would never paint.
  useEffect(() => {
    if (status !== 'authenticated' || !profile) return;
    if (profile.must_change_password) {
      navigate('/auth/reset', { replace: true });
      return;
    }
    if (profile.role === 'super_admin') {
      navigate('/admin', { replace: true });
    } else if (profile.role === 'property_manager') {
      navigate('/ops', { replace: true });
    }
  }, [status, profile, navigate]);

  function validate(): boolean {
    const next: Partial<Record<FieldKey, string>> = {};
    if (!email.trim()) next.email = 'Required.';
    else if (!/^\S+@\S+\.\S+$/.test(email.trim())) next.email = 'Use a valid email.';
    if (!password) next.password = 'Required.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handle(e: FormEvent) {
    e.preventDefault();
    setServerError(null);
    setWrongRoleHint(null);
    if (!validate()) return;
    setSubmitting(true);
    const { error } = await signIn(email.trim(), password);
    if (error) {
      setSubmitting(false);
      setServerError(translate(error));
      return;
    }
    // Verify the role server-side before letting them into Ops.
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setSubmitting(false);
      setServerError('Sign-in failed. Try again.');
      return;
    }
    const { data: prof, error: profErr } = await supabase
      .from('profiles')
      .select('role, must_change_password')
      .eq('id', user.id)
      .single();
    setSubmitting(false);
    if (profErr || !prof) {
      await signOut();
      setServerError('Your profile is not available. Contact AP Enterprises support.');
      return;
    }
    if (prof.role !== 'property_manager' && prof.role !== 'super_admin') {
      await signOut();
      setServerError('This sign-in is reserved for property managers.');
      setWrongRoleHint(prof.role === 'resident' || prof.role === 'attendant' ? 'resident' : null);
      return;
    }
    if (prof.must_change_password) {
      navigate('/auth/reset', { replace: true });
      return;
    }
    navigate(prof.role === 'super_admin' ? '/admin' : '/ops', { replace: true });
  }

  const fieldStatus = (key: FieldKey): FieldStatus => (errors[key] ? 'error' : 'default');

  return (
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 1fr' }} className="signin-grid">
      <aside
        aria-hidden="true"
        className="signin-aside"
        style={{
          position: 'relative',
          overflow: 'hidden',
          background: 'var(--color-ink)',
        }}
      >
        <img
          src={IMAGERY.signinManager}
          alt=""
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: 'brightness(0.5) saturate(0.85)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, rgba(10,10,10,0.4) 0%, rgba(10,10,10,0.8) 100%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 'clamp(24px, 4vw, 56px)',
            right: 'clamp(24px, 4vw, 56px)',
            bottom: 'clamp(40px, 6vw, 80px)',
            color: 'var(--color-cream)',
          }}
        >
          <Eyebrow color="rgba(244,247,250,0.7)">For Property Managers</Eyebrow>
          <h2
            className="display-md"
            style={{
              marginTop: 16,
              color: 'var(--color-cream)',
              maxWidth: 460,
            }}
          >
            One pipeline, one ledger, one quarter.
          </h2>
          <div
            style={{
              width: 48,
              height: 1,
              background: 'var(--color-champagne)',
              margin: '24px 0 16px',
            }}
          />
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 14,
              color: 'rgba(244,247,250,0.78)',
              lineHeight: 1.7,
              maxWidth: 420,
              margin: 0,
            }}
          >
            Replaces six vendor relationships, two clipboards, and a group chat.
          </p>
        </div>
      </aside>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          background: 'var(--bg-page)',
        }}
      >
        <header style={{ padding: '24px clamp(20px, 4vw, 56px)' }}>
          <Link
            to="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              textDecoration: 'none',
              border: 0,
              color: 'var(--color-charcoal)',
            }}
            aria-label="Back to landing"
          >
            <BrandMark size={40} />
          </Link>
        </header>

        <main
          style={{
            flex: 1,
            display: 'grid',
            placeItems: 'center',
            padding: 'clamp(24px, 5vw, 64px)',
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
            <Eyebrow>AP Enterprises · Operations</Eyebrow>
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
              Manager access.
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
                status={fieldStatus('email')}
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
                status={fieldStatus('password')}
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
                {wrongRoleHint === 'resident' && (
                  <button
                    type="button"
                    onClick={switchToResident}
                    style={{
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
                    }}
                  >
                    Go to resident sign-in →
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
                flexWrap: 'wrap',
                gap: 16,
              }}
            >
              <button
                type="button"
                onClick={switchToResident}
                style={{
                  background: 'transparent',
                  border: 0,
                  padding: 0,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                  fontSize: 13,
                  color: 'var(--color-mist)',
                  textDecoration: 'none',
                }}
              >
                Resident Instead
              </button>
              <Button
                variant="primary"
                type="submit"
                loading={submitting}
                iconAfter={submitting ? undefined : 'arrow-right'}
              >
                {submitting ? 'Signing In' : 'Enter Operations'}
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
              Operations access is granted to property managers under signed AP Enterprises stewardship.
            </p>
          </form>
        </main>

        <footer
          style={{
            padding: '24px clamp(20px, 4vw, 56px)',
            fontFamily: 'var(--font-sans)',
            fontSize: 12,
            color: 'var(--color-mist-soft)',
          }}
        >
          Operations · AP Enterprises stewardship
        </footer>
      </div>

      <style>{`
        @media (max-width: 1023px) {
          .signin-grid { grid-template-columns: 1fr !important; }
          .signin-aside { display: none !important; }
        }
      `}</style>
    </div>
  );
}

function translate(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('invalid login')) return 'Email and password do not match.';
  if (m.includes('rate limit')) return 'Too many attempts. Wait a moment and try again.';
  return message;
}
