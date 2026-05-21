import { useEffect, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eyebrow, BrandMark, useLucide } from '../components';
import { IMAGERY } from '../data/imagery';
import { useAuth } from '../lib/auth';
import { SignIn as SignInForm } from './Portal/SignIn';
import type { ClientTrack } from './Portal/types';

const TRACK_COPY: Record<
  ClientTrack,
  {
    header: string;
    aside: { eyebrow: string; headline: string; body: string };
    image: string;
    footer: string;
  }
> = {
  residential: {
    header: 'Resident Sign In',
    aside: {
      eyebrow: 'For Members',
      headline: 'Your residence is held to a single line.',
      body: 'The directory, the calendar, and the front desk — all in your account.',
    },
    image: IMAGERY.signinResident,
    footer: 'By invitation only · AP Enterprises stewardship',
  },
  commercial: {
    header: 'Client Sign In',
    aside: {
      eyebrow: 'For Properties',
      headline: 'Your property is held to a single line.',
      body: 'Standing crews, after-hours service, and a single point of contact. From lobby to back of house.',
    },
    image: IMAGERY.signinCommercial,
    footer: 'Stewarded by AP Enterprises · South Florida',
  },
};

function readTrackParam(param: string | null): ClientTrack | null {
  if (param === 'commercial' || param === 'residential') return param;
  return null;
}

export function SignInResident() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { status, profile } = useAuth();
  useLucide();

  // Two distinct concerns:
  //   - expectedTrack: only set when ?track= is explicit. Drives validation.
  //   - displayTrack:  always residential|commercial. Drives the aside copy.
  const expectedTrack = useMemo<ClientTrack | null>(
    () => readTrackParam(params.get('track')),
    [params],
  );
  const displayTrack: ClientTrack = expectedTrack ?? 'residential';
  const copy = TRACK_COPY[displayTrack];

  // If the user is already signed in AND belongs on the resident portal for
  // this track, send them through. Wrong-role / wrong-track sessions are
  // left to the form's handle() to reject + display the shortcut, so the
  // useEffect must not navigate away mid-validation.
  useEffect(() => {
    if (status !== 'authenticated' || !profile) return;
    if (profile.must_change_password) {
      navigate('/auth/reset', { replace: true });
      return;
    }
    const isResident = profile.role === 'resident' || profile.role === 'attendant';
    if (!isResident) return;
    if (expectedTrack && profile.primary_track && profile.primary_track !== expectedTrack) {
      return;
    }
    navigate('/portal', { replace: true });
  }, [status, profile, navigate, expectedTrack]);

  return (
    <div
      style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 1fr' }}
      className="signin-grid"
    >
      {/* Form side */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          background: 'var(--bg-page)',
        }}
      >
        <header
          style={{
            padding: '24px clamp(20px, 4vw, 56px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
          }}
        >
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
            {copy.header}
          </span>
        </header>

        <main
          style={{
            flex: 1,
            display: 'grid',
            placeItems: 'center',
            padding: 'clamp(24px, 5vw, 64px)',
          }}
        >
          <SignInForm
            onSignIn={() => navigate('/portal', { replace: true })}
            expectedTrack={expectedTrack}
          />
        </main>

        <footer
          style={{
            padding: '24px clamp(20px, 4vw, 56px)',
            fontFamily: 'var(--font-sans)',
            fontSize: 12,
            color: 'var(--color-mist-soft)',
          }}
        >
          {copy.footer}
        </footer>
      </div>

      {/* Image side */}
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
          src={copy.image}
          alt=""
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: 'brightness(0.55) saturate(0.92)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, rgba(10,10,10,0.35) 0%, rgba(10,10,10,0.75) 100%)',
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
          <Eyebrow color="rgba(244,247,250,0.7)">{copy.aside.eyebrow}</Eyebrow>
          <h2
            className="display-md"
            style={{
              marginTop: 16,
              color: 'var(--color-cream)',
              maxWidth: 460,
            }}
          >
            {copy.aside.headline}
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
            {copy.aside.body}
          </p>
        </div>
      </aside>

      <style>{`
        @media (max-width: 1023px) {
          .signin-grid { grid-template-columns: 1fr !important; }
          .signin-aside { display: none !important; }
        }
      `}</style>
    </div>
  );
}
