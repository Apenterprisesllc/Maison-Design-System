import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Eyebrow, Field, Hairline, MaisonMark, useLucide } from '../components';
import { IMAGERY } from '../data/imagery';

export function SignInManager() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('manager@maison.example');
  const [building, setBuilding] = useState('The Arden');
  useLucide();

  function handle(e: FormEvent) {
    e.preventDefault();
    navigate('/ops');
  }

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
              'linear-gradient(180deg, rgba(15,30,61,0.4) 0%, rgba(15,30,61,0.8) 100%)',
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
          <Eyebrow color="rgba(248,245,239,0.7)">For Property Managers</Eyebrow>
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
              color: 'rgba(248,245,239,0.78)',
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
            <form
              onSubmit={handle}
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
              <Eyebrow>Maison · Operations</Eyebrow>
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

              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <Field
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
                <Field
                  label="Building"
                  value={building}
                  onChange={(e) => setBuilding(e.target.value)}
                  required
                />
              </div>

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
                <Link
                  to="/sign-in/resident"
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: 13,
                    color: 'var(--color-mist)',
                    border: 0,
                    textDecoration: 'none',
                  }}
                >
                  Resident Instead
                </Link>
                <Button variant="primary" type="submit" iconAfter="arrow-right">
                  Enter Operations
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
                Operations access is granted to property managers under signed Maison stewardship.
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
          Operations · Maison stewardship
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
