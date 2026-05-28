import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  BrandMark,
  Eyebrow,
  Hairline,
  Icon,
  Spinner,
  useLucide,
  useReveal,
} from '../../components';
import {
  getPropertyBySlug,
  listServicesForProperty,
  type PublicProperty,
  type PublicService,
} from '../../lib/api/guestBookings';
import { ServiceCard } from '../Portal/ServiceCard';
import type { Service } from '../Portal/types';

function toCardService(svc: PublicService): Service {
  return {
    id: svc.slug,
    name: svc.name,
    kicker: svc.kicker,
    icon: svc.icon,
    tone: svc.tone,
    price: Math.round(svc.price_cents / 100),
    cadence: cadenceLabel(svc.cadence),
    description: svc.description,
    photoPath: svc.photo_path,
  };
}

function cadenceLabel(c: PublicService['cadence']): string {
  switch (c) {
    case 'weekly':
      return 'Weekly';
    case 'monthly':
      return 'Monthly';
    case 'quarterly':
      return 'Quarterly';
    case 'nightly':
      return 'Nightly';
    case 'once':
      return 'Single visit';
    case 'on_request':
      return 'On request';
    case 'per_event':
      return 'Per event';
    case 'per_visit':
      return 'Per visit';
    case 'per_listing':
      return 'Per listing';
    case 'project_based':
      return 'Project';
    case 'seasonal':
      return 'Seasonal';
    default:
      return 'On request';
  }
}

export function PropertyCatalogue() {
  const { propertySlug } = useParams<{ propertySlug: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const ref = useReveal<HTMLDivElement>({ y: 32, stagger: 0.08 });
  useLucide();

  const rawTrack = searchParams.get('track');
  const track: 'residential' | 'commercial' | null =
    rawTrack === 'residential' || rawTrack === 'commercial' ? rawTrack : null;
  const trackQuery = useMemo(() => (track ? `?track=${track}` : ''), [track]);

  const [property, setProperty] = useState<PublicProperty | null>(null);
  const [services, setServices] = useState<PublicService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const visibleServices = useMemo(
    () => (track ? services.filter((s) => s.track === track) : services),
    [services, track],
  );

  useEffect(() => {
    if (!propertySlug) {
      navigate('/book', { replace: true });
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const prop = await getPropertyBySlug(propertySlug);
        if (cancelled) return;
        if (!prop) {
          navigate('/book', { replace: true });
          return;
        }
        const svcs = await listServicesForProperty(prop.id);
        if (cancelled) return;
        setProperty(prop);
        setServices(svcs);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Could not load services.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [propertySlug, navigate]);

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
          to="/book"
          aria-label="Back to search"
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
          to="/book"
          style={{
            border: 0,
            textDecoration: 'none',
            fontFamily: 'var(--font-sans)',
            fontSize: 12,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--color-mist)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Icon name="search" size={14} /> Change property
        </Link>
      </header>

      <main
        style={{
          flex: 1,
          maxWidth: 1240,
          margin: '0 auto',
          width: '100%',
          padding: 'clamp(48px, 7vw, 88px) clamp(20px, 4vw, 56px) 120px',
        }}
      >
        {loading ? (
          <div style={{ display: 'grid', placeItems: 'center', padding: '80px 0' }}>
            <Spinner />
          </div>
        ) : error ? (
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 14,
              color: 'var(--color-status-danger)',
            }}
          >
            {error}
          </p>
        ) : property ? (
          <>
            <Link
              to="/book"
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 13,
                color: 'var(--color-mist)',
                textDecoration: 'none',
                border: 0,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                marginBottom: 28,
              }}
            >
              <Icon name="chevron-left" size={16} /> Other communities
            </Link>

            <Eyebrow>{property.city}</Eyebrow>
            <h1
              className="display-md"
              style={{
                marginTop: 12,
                color: 'var(--color-charcoal)',
                maxWidth: 760,
              }}
            >
              {property.name}
            </h1>
            <Hairline width={64} margin="24px 0 24px" />
            <p
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 15,
                color: 'var(--color-mist)',
                lineHeight: 1.7,
                margin: 0,
                maxWidth: 600,
              }}
            >
              Pick a service to schedule. We'll confirm the date, time and your contact
              details on the next steps.
            </p>

            <div
              ref={ref}
              style={{
                marginTop: 48,
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 24,
              }}
              className="catalogue-grid"
            >
              {visibleServices.map((svc) => (
                <ServiceCard
                  key={svc.id}
                  service={toCardService(svc)}
                  to={`/book/${property.slug}/services/${svc.slug}${trackQuery}`}
                />
              ))}
              {track && visibleServices.length === 0 && (
                <p
                  style={{
                    gridColumn: '1 / -1',
                    fontFamily: 'var(--font-sans)',
                    fontSize: 14,
                    color: 'var(--color-mist)',
                    margin: 0,
                  }}
                >
                  This property has no {track} services configured yet.{' '}
                  <Link to={`/book/${property.slug}`} style={{ color: 'var(--color-champagne-deep)' }}>
                    See the full catalogue
                  </Link>
                  .
                </p>
              )}
            </div>
          </>
        ) : null}
      </main>

      <style>{`
        @media (max-width: 1023px) { .catalogue-grid { grid-template-columns: repeat(2, 1fr) !important; } }
        @media (max-width: 640px)  { .catalogue-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  );
}
