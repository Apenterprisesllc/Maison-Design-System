import { useEffect, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eyebrow, BrandMark, useLucide } from '../components';
import { IMAGERY } from '../data/imagery';
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

function readTrack(param: string | null): ClientTrack {
  if (param === 'commercial' || param === 'residential') return param;
  const stored = typeof window !== 'undefined' ? window.sessionStorage.getItem('apTrack') : null;
  return stored === 'commercial' ? 'commercial' : 'residential';
}

export function SignInResident() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  useLucide();

  const track = useMemo<ClientTrack>(() => readTrack(params.get('track')), [params]);
  const copy = TRACK_COPY[track];

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.sessionStorage.setItem('apTrack', track);
  }, [track]);

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
          <SignInForm onSignIn={() => navigate('/portal', { state: { track } })} />
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
