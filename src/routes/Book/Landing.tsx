import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { BrandMark, Eyebrow, Hairline, Icon, Spinner, useLucide } from '../../components';
import { searchProperties, type PublicProperty } from '../../lib/api/guestBookings';
import { IMAGERY } from '../../data/imagery';

const DEBOUNCE_MS = 220;

type Track = 'residential' | 'commercial';

export function BookLanding() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  useLucide();

  const rawTrack = searchParams.get('track');
  const track: Track | null =
    rawTrack === 'residential' || rawTrack === 'commercial' ? rawTrack : null;
  const trackQuery = useMemo(() => (track ? `?track=${track}` : ''), [track]);

  const eyebrow = track === 'commercial' ? 'Commercial Service' : track === 'residential' ? 'Residential Service' : 'Schedule a Service';
  const headline = track === 'commercial'
    ? 'Find your facility.'
    : track === 'residential'
      ? 'Find your residence.'
      : 'Find your community.';
  const subcopy = track === 'commercial'
    ? 'Start by typing the name of your office, restaurant, hotel, or commercial site. We schedule visits after-hours by default.'
    : track === 'residential'
      ? 'Start by typing the name of your community or condo. Pick your residence from the list — contact details come at the end.'
      : 'Start by typing the name of your residence or commercial property. Pick your home or suite from the list — your contact details come at the end.';

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PublicProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const runSearch = useCallback(async (q: string) => {
    setLoading(true);
    setError(null);
    try {
      const rows = await searchProperties(q, 18);
      setResults(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load properties.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const handle = window.setTimeout(() => runSearch(query), DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
  }, [query, runSearch]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '20px clamp(20px, 4vw, 56px)',
          borderBottom: '1px solid var(--color-taupe)',
          position: 'sticky',
          top: 0,
          background: 'rgba(244, 247, 250, 0.92)',
          backdropFilter: 'blur(12px)',
          zIndex: 20,
        }}
      >
        <Link
          to="/"
          aria-label="AP Enterprises home"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            textDecoration: 'none',
            border: 0,
            color: 'var(--color-charcoal)',
          }}
        >
          <BrandMark size={40} />
        </Link>
        <div style={{ flex: 1 }} />
        <Link
          to="/sign-in/manager"
          style={{
            border: 0,
            textDecoration: 'none',
            fontFamily: 'var(--font-sans)',
            fontSize: 12,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--color-mist)',
          }}
        >
          Operations
        </Link>
      </header>

      <main
        style={{
          flex: 1,
          maxWidth: 980,
          width: '100%',
          margin: '0 auto',
          padding: 'clamp(48px, 7vw, 88px) clamp(20px, 4vw, 56px) 120px',
        }}
      >
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1
          className="display-md"
          style={{
            marginTop: 12,
            color: 'var(--color-charcoal)',
            maxWidth: 720,
          }}
        >
          {headline}
        </h1>
        <Hairline width={64} margin="24px 0 28px" />
        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 16,
            color: 'var(--color-mist)',
            lineHeight: 1.7,
            margin: 0,
            maxWidth: 560,
          }}
        >
          {subcopy}
        </p>

        <div
          style={{
            marginTop: 36,
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            border: '1px solid var(--color-taupe)',
            borderRadius: 4,
            background: 'var(--bg-surface)',
            padding: '0 16px',
            boxShadow: 'var(--shadow-1)',
          }}
        >
          <Icon name="search" size={18} color="var(--color-mist)" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='Try "Club", "Coastal", "Cypress"…'
            aria-label="Search properties by name"
            autoComplete="off"
            spellCheck={false}
            style={{
              flex: 1,
              border: 0,
              outline: 'none',
              background: 'transparent',
              padding: '20px 12px',
              fontFamily: 'var(--font-serif)',
              fontSize: 22,
              fontWeight: 300,
              color: 'var(--color-charcoal)',
              letterSpacing: '-0.01em',
            }}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear search"
              style={{
                background: 'transparent',
                border: 0,
                padding: 4,
                cursor: 'pointer',
                color: 'var(--color-mist)',
                display: 'inline-flex',
                alignItems: 'center',
              }}
            >
              <Icon name="x" size={16} />
            </button>
          )}
        </div>

        <div style={{ marginTop: 32 }}>
          {error ? (
            <p
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 13,
                color: 'var(--color-status-danger)',
                margin: 0,
              }}
            >
              {error}
            </p>
          ) : loading ? (
            <div style={{ display: 'grid', placeItems: 'center', padding: '40px 0' }}>
              <Spinner />
            </div>
          ) : results.length === 0 ? (
            <p
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 14,
                color: 'var(--color-mist)',
                margin: 0,
                lineHeight: 1.65,
              }}
            >
              No properties match "{query}". Try a shorter word or check the spelling.
            </p>
          ) : (
            <ul
              style={{
                listStyle: 'none',
                margin: 0,
                padding: 0,
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 16,
              }}
              className="property-grid"
            >
              {results.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => navigate(`/book/${p.slug}${trackQuery}`)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      cursor: 'pointer',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--color-taupe)',
                      borderRadius: 6,
                      padding: '20px 22px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                      transition:
                        'border-color var(--dur-state) var(--ease-out), transform var(--dur-state) var(--ease-out), box-shadow var(--dur-state) var(--ease-out)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--color-champagne)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = 'var(--shadow-2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--color-taupe)';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'var(--font-serif)',
                        fontSize: 20,
                        fontWeight: 400,
                        color: 'var(--color-charcoal)',
                        letterSpacing: '-0.01em',
                      }}
                    >
                      {p.name}
                    </span>
                    <span
                      style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: 11,
                        letterSpacing: '0.14em',
                        textTransform: 'uppercase',
                        color: 'var(--color-mist)',
                      }}
                    >
                      {p.city}
                    </span>
                    {p.address && (
                      <span
                        style={{
                          fontFamily: 'var(--font-sans)',
                          fontSize: 13,
                          color: 'var(--color-mist)',
                          marginTop: 4,
                          lineHeight: 1.5,
                        }}
                      >
                        {p.address}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div
          aria-hidden="true"
          style={{
            marginTop: 48,
            position: 'relative',
            aspectRatio: '16 / 7',
            overflow: 'hidden',
            borderRadius: 4,
            border: '1px solid var(--color-taupe)',
          }}
        >
          <img
            src={IMAGERY.hero}
            alt=""
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
              filter: 'brightness(0.85)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: 24,
              bottom: 20,
              color: 'var(--color-cream)',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <span style={{ width: 24, height: 1, background: 'var(--color-champagne)' }} />
            <span
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 10,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
              }}
            >
              South Florida · By appointment
            </span>
          </div>
        </div>
      </main>

      <style>{`
        @media (max-width: 720px) {
          .property-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
