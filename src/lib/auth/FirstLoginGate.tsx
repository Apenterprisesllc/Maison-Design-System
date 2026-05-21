import { FormEvent, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Button, Eyebrow, Field, Hairline, BrandMark, useLucide } from '../../components';
import { useAuth } from './AuthContext';

export function FirstLoginGate() {
  const navigate = useNavigate();
  const { status, profile, changePassword } = useAuth();
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useLucide();

  if (status === 'loading') return null;
  if (status === 'anonymous' || !profile) return <Navigate to="/sign-in/resident" replace />;
  if (!profile.must_change_password) {
    const home =
      profile.role === 'super_admin'
        ? '/admin'
        : profile.role === 'property_manager'
          ? '/ops'
          : '/portal';
    return <Navigate to={home} replace />;
  }

  async function handle(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (next.length < 10) {
      setError('Use at least 10 characters.');
      return;
    }
    if (next !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setSubmitting(true);
    const { error: err } = await changePassword(next);
    setSubmitting(false);
    if (err) {
      setError(err);
      return;
    }
    const role = profile?.role;
    const home =
      role === 'super_admin'
        ? '/admin'
        : role === 'property_manager'
          ? '/ops'
          : '/portal';
    navigate(home, { replace: true });
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-page)',
      }}
    >
      <header
        style={{
          padding: '24px clamp(20px, 4vw, 56px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Link
          to="/"
          aria-label="Back to landing"
          style={{ display: 'inline-flex', textDecoration: 'none' }}
        >
          <BrandMark size={40} />
        </Link>
        <span
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 11,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--color-champagne-deep)',
            border: '1px solid var(--color-champagne)',
            padding: '5px 10px',
            borderRadius: 999,
          }}
        >
          First Sign In
        </span>
      </header>

      <section
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
            width: 480,
            maxWidth: '100%',
            background: 'var(--bg-surface)',
            border: '1px solid var(--color-taupe)',
            borderRadius: 8,
            boxShadow: 'var(--shadow-1)',
            padding: 'clamp(32px, 5vw, 56px)',
          }}
        >
          <Eyebrow>Set Your Password</Eyebrow>
          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontWeight: 300,
              fontSize: 38,
              letterSpacing: '-0.02em',
              lineHeight: 1.08,
              color: 'var(--color-charcoal)',
              margin: '10px 0 0',
            }}
          >
            Choose a password.
          </h1>
          <Hairline width={48} margin="20px 0 22px" />
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 14,
              color: 'var(--color-mist)',
              margin: '0 0 28px',
              lineHeight: 1.65,
            }}
          >
            Your account was created with a temporary password. Set a new one before continuing.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
            <Field
              label="New Password"
              type="password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              autoComplete="new-password"
              required
            />
            <Field
              label="Confirm Password"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              required
              status={error ? 'error' : 'default'}
              hint={error ?? undefined}
            />
          </div>

          <div style={{ marginTop: 36, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="primary"
              type="submit"
              loading={submitting}
              iconAfter={submitting ? undefined : 'arrow-right'}
            >
              {submitting ? 'Saving' : 'Save and Continue'}
            </Button>
          </div>

          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 12,
              color: 'var(--color-mist-soft)',
              marginTop: 28,
              lineHeight: 1.6,
            }}
          >
            Keep your password private. The front desk will never ask for it.
          </p>
        </form>
      </section>
    </main>
  );
}
