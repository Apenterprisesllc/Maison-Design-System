import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Hairline } from '../../components';
import { IMAGERY } from '../../data/imagery';
import { publicUrlFor } from '../../lib/api/attachments';
import type { Service } from './types';

export interface ServiceCardProps {
  service: Service;
  /** Override the destination link. Defaults to the resident portal booking
   *  flow so existing call sites keep working. */
  to?: string;
}

const SERVICE_IMG: Record<string, string> = {
  // residential
  window: IMAGERY.serviceWindow,
  deep: IMAGERY.serviceDeep,
  housekeeping: IMAGERY.serviceHousekeeping,
  marble: IMAGERY.serviceMarble,
  disinfecting: IMAGERY.serviceDisinfecting,
  moveinout: IMAGERY.serviceMoveinout,
  // commercial
  'post-construction': IMAGERY.servicePostConstruction,
  'office-night': IMAGERY.serviceOfficeNight,
  'restaurant-night': IMAGERY.serviceRestaurantNight,
  commercial: IMAGERY.serviceCommercial,
  epoxy: IMAGERY.serviceEpoxy,
  events: IMAGERY.serviceEvents,
  'real-estate': IMAGERY.serviceRealEstate,
};

export function ServiceCard({ service, to }: ServiceCardProps) {
  const [hover, setHover] = useState(false);
  const [loaded, setLoaded] = useState(false);
  // Prefer a property-uploaded photo from Storage; fall back to the brand stock library.
  const img = service.photoPath ? publicUrlFor('service-photos', service.photoPath) : SERVICE_IMG[service.id];

  return (
    <Link
      to={to ?? `/portal/services/${service.id}/book`}
      aria-label={`Schedule ${service.name}`}
      data-reveal
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        textDecoration: 'none',
        border: 0,
        color: 'inherit',
        background: 'var(--bg-surface)',
        borderRadius: 8,
        boxShadow: hover ? 'var(--shadow-2)' : 'var(--shadow-1)',
        outline: `1px solid ${hover ? 'var(--color-champagne)' : 'var(--color-taupe)'}`,
        outlineOffset: '-1px',
        transition:
          'outline-color var(--dur-state) var(--ease-out), box-shadow var(--dur-state) var(--ease-out), transform var(--dur-state) var(--ease-out)',
        transform: hover ? 'translateY(-2px)' : 'translateY(0)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        willChange: 'transform',
      }}
    >
      <div
        style={{
          height: 200,
          position: 'relative',
          overflow: 'hidden',
          background: 'var(--color-cream-deep)',
        }}
      >
        {/* Skeleton shimmer while image loads */}
        {!loaded && (
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(90deg, var(--color-taupe-soft) 0%, var(--color-taupe) 50%, var(--color-taupe-soft) 100%)',
              backgroundSize: '200% 100%',
              animation: 'mai-shimmer 1.8s ease-in-out infinite',
            }}
          />
        )}
        {img && (
          <img
            src={img}
            alt={service.name}
            loading="lazy"
            onLoad={() => setLoaded(true)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: loaded ? 1 : 0,
              transition: 'transform 1.4s var(--ease-editorial), filter 600ms ease, opacity 400ms ease',
              transform: hover ? 'scale(1.05)' : 'scale(1)',
              filter: hover ? 'brightness(0.92)' : 'brightness(0.78)',
            }}
          />
        )}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, rgba(10,10,10,0) 40%, rgba(10,10,10,0.5) 100%)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 18,
            left: 20,
            fontFamily: 'var(--font-sans)',
            fontSize: 10,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'rgba(244,247,250,0.85)',
            padding: '4px 10px',
            background: 'rgba(10,10,10,0.45)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
          }}
        >
          {service.kicker}
        </div>
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            bottom: 20,
            left: 20,
            width: 28,
            height: 28,
            color: '#F4F7FA',
            opacity: 0.92,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            lineHeight: 0,
          }}
          dangerouslySetInnerHTML={{
            __html: `<i data-lucide="${service.icon}" width="28" height="28" style="stroke-width:1.5;width:28px;height:28px;color:currentColor;display:inline-block;"></i>`,
          }}
        />
      </div>
      <div style={{ padding: '24px 22px 22px' }}>
        <h3
          style={{
            fontFamily: 'var(--font-serif)',
            fontWeight: 400,
            fontSize: 22,
            margin: 0,
            color: 'var(--color-charcoal)',
            lineHeight: 1.15,
          }}
        >
          {service.name}
        </h3>
        <Hairline width={32} margin="14px 0" />
        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 13,
            color: 'var(--color-mist)',
            margin: 0,
            lineHeight: 1.65,
          }}
        >
          {service.description}
        </p>
        <div
          style={{
            marginTop: 20,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 17,
              color: 'var(--color-charcoal)',
            }}
          >
            <span style={{ fontWeight: 300 }}>from </span>${service.price}
          </div>
          <div
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 11,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--color-mist)',
            }}
          >
            {service.cadence}
          </div>
        </div>
      </div>
    </Link>
  );
}
