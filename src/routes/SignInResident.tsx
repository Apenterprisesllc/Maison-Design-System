import { Link, useNavigate } from 'react-router-dom';
import { Eyebrow, MaisonMark, useLucide } from '../components';
import { IMAGERY } from '../data/imagery';
import { SignIn as SignInForm } from './Portal/SignIn';

export function SignInResident() {
  const navigate = useNavigate();
  useLucide();
  return (
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 1fr' }} className="signin-grid">
      {/* Form side */}
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
            <MaisonMark size={26} />
            <span
              style={{
                fontFamily: 'var(--font-serif)',
                fontWeight: 400,
                fontSize: 18,
                letterSpacing: '0.01em',
              }}
            >
              Maison
            </span>
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
          <SignInForm onSignIn={() => navigate('/portal')} />
        </main>

        <footer
          style={{
            padding: '24px clamp(20px, 4vw, 56px)',
            fontFamily: 'var(--font-sans)',
            fontSize: 12,
            color: 'var(--color-mist-soft)',
          }}
        >
          By invitation only · Maison stewardship
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
          src={IMAGERY.signinResident}
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
              'linear-gradient(180deg, rgba(15,30,61,0.35) 0%, rgba(15,30,61,0.75) 100%)',
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
          <Eyebrow color="rgba(248,245,239,0.7)">For Members</Eyebrow>
          <h2
            className="display-md"
            style={{
              marginTop: 16,
              color: 'var(--color-cream)',
              maxWidth: 460,
            }}
          >
            Your residence is held to a single line.
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
              color: 'rgba(248,245,239,0.78)',
              lineHeight: 1.7,
              maxWidth: 420,
              margin: 0,
            }}
          >
            The directory, the calendar, and the front desk — all in your account.
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
