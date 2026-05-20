import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { CountUp, useLucide, useToast } from '../../components';
import { buildCsv, downloadCsv } from '../../utils/csv';
import { useOps } from './context';
import {
  Kpi,
  OpsButton,
  OpsCard,
  OpsEyebrow,
  OpsHairline,
} from './OpsPrimitives';

interface MonthPoint {
  m: string;
  v: number;
}

interface ServiceMix {
  name: string;
  pct: number;
  count: number;
}

const MONTHS: MonthPoint[] = [
  { m: 'Nov', v: 180 },
  { m: 'Dec', v: 210 },
  { m: 'Jan', v: 240 },
  { m: 'Feb', v: 226 },
  { m: 'Mar', v: 268 },
  { m: 'Apr', v: 296 },
  { m: 'May', v: 312 },
];
const MAX = 320;

const SERVICES: ServiceMix[] = [
  { name: 'Window Service', pct: 28, count: 412 },
  { name: 'Deep Cleaning', pct: 24, count: 358 },
  { name: 'Handyman', pct: 18, count: 268 },
  { name: 'Pressure Washing', pct: 12, count: 178 },
  { name: 'Landscaping', pct: 10, count: 148 },
  { name: 'Valet', pct: 8, count: 121 },
];

const ATTENDANTS = [
  { name: 'Hudson & Co.', visits: 612, ontime: 99 },
  { name: 'Marble & Linen', visits: 358, ontime: 98 },
  { name: 'Hollis Grounds', visits: 148, ontime: 96 },
  { name: 'Doorman Services', visits: 121, ontime: 100 },
  { name: 'Atelier Restoration', visits: 92, ontime: 95 },
];

const RANGES = [
  { id: 'q2-2026', label: 'Q2 2026' },
  { id: 'q1-2026', label: 'Q1 2026' },
  { id: 'ytd', label: 'YTD' },
  { id: 'last-12', label: 'Last 12 months' },
];

export function Reports() {
  useLucide();
  const toast = useToast();
  const { bookings } = useOps();
  const [range, setRange] = useState(RANGES[0]!.id);
  const [rangeOpen, setRangeOpen] = useState(false);
  const barsRef = useRef<HTMLDivElement>(null);
  const mixRef = useRef<HTMLDivElement>(null);

  // Animate bars on scroll into view
  useGSAP(
    () => {
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (barsRef.current) {
        const bars = barsRef.current.querySelectorAll<HTMLElement>('[data-bar]');
        if (bars.length) {
          if (reduceMotion) {
            gsap.set(bars, { scaleY: 1, transformOrigin: 'bottom center' });
          } else {
            gsap.set(bars, { scaleY: 0, transformOrigin: 'bottom center' });
            ScrollTrigger.create({
              trigger: barsRef.current,
              start: 'top 85%',
              once: true,
              onEnter: () => {
                gsap.to(bars, {
                  scaleY: 1,
                  duration: 0.9,
                  ease: 'expo.out',
                  stagger: 0.06,
                });
              },
            });
          }
        }
      }

      if (mixRef.current) {
        const fills = mixRef.current.querySelectorAll<HTMLElement>('[data-mix-bar]');
        if (fills.length) {
          if (reduceMotion) {
            gsap.set(fills, { scaleX: 1, transformOrigin: 'left center' });
          } else {
            gsap.set(fills, { scaleX: 0, transformOrigin: 'left center' });
            ScrollTrigger.create({
              trigger: mixRef.current,
              start: 'top 85%',
              once: true,
              onEnter: () => {
                gsap.to(fills, {
                  scaleX: 1,
                  duration: 1.1,
                  ease: 'expo.out',
                  stagger: 0.06,
                });
              },
            });
          }
        }
      }
    },
    { dependencies: [range] },
  );

  useEffect(() => {
    if (!rangeOpen) return;
    const onClick = () => setRangeOpen(false);
    setTimeout(() => document.addEventListener('click', onClick, { once: true }), 0);
    return () => document.removeEventListener('click', onClick);
  }, [rangeOpen]);

  function exportReport() {
    const csv = buildCsv(MONTHS, [
      { header: 'Month', accessor: (m) => m.m },
      { header: 'Visits', accessor: (m) => m.v },
    ]);
    downloadCsv(`apenterprises-report-${range}-${Date.now()}.csv`, csv);
    toast.success('Report exported.');
  }

  const rangeLabel = RANGES.find((r) => r.id === range)?.label ?? 'Q2 2026';

  return (
    <div style={{ padding: 'clamp(20px, 4vw, 32px) clamp(20px, 4vw, 32px) 56px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <OpsEyebrow>{rangeLabel} · The Arden</OpsEyebrow>
          <h1
            style={{
              fontFamily: 'Fraunces, serif',
              fontWeight: 300,
              fontSize: 36,
              letterSpacing: '-0.02em',
              margin: '6px 0 0',
              color: '#1A1A1A',
            }}
          >
            Reporting
          </h1>
        </div>
        <div style={{ display: 'flex', gap: 8, position: 'relative' }}>
          <div style={{ position: 'relative' }}>
            <OpsButton
              variant="ghost"
              icon="calendar"
              onClick={(e?: React.MouseEvent) => {
                (e as React.MouseEvent | undefined)?.stopPropagation();
                setRangeOpen((v) => !v);
              }}
            >
              {rangeLabel}
            </OpsButton>
            {rangeOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  right: 0,
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--color-taupe)',
                  borderRadius: 6,
                  boxShadow: 'var(--shadow-2)',
                  padding: 6,
                  minWidth: 200,
                  zIndex: 20,
                }}
              >
                {RANGES.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => {
                      setRange(r.id);
                      setRangeOpen(false);
                      toast.info(`Range set to ${r.label}.`);
                    }}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      padding: '8px 12px',
                      background: range === r.id ? 'var(--color-cream-deep)' : 'transparent',
                      border: 0,
                      cursor: 'pointer',
                      fontFamily: 'Inter, sans-serif',
                      fontSize: 13,
                      color: 'var(--color-charcoal)',
                      borderRadius: 4,
                      transition: 'background-color var(--dur-snap) var(--ease-out)',
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = 'var(--color-cream-deep)')
                    }
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background =
                        range === r.id ? 'var(--color-cream-deep)' : 'transparent';
                    }}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <OpsButton variant="ghost" icon="download" onClick={exportReport}>
            Export
          </OpsButton>
        </div>
      </div>
      <OpsHairline width={48} margin="20px 0 28px" />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 16,
          marginBottom: 28,
        }}
        className="reports-kpis"
      >
        <Kpi
          label="Visits · Quarter"
          value={<CountUp to={1840} duration={1.6} />}
          delta="+18% YoY"
          deltaTone="success"
        />
        <Kpi
          label="On-Time Arrivals"
          value={<CountUp to={98} duration={1.5} />}
          sup="%"
          delta="+1.2 pts"
          deltaTone="success"
        />
        <Kpi
          label="Cancellation Rate"
          value={<CountUp to={2.4} duration={1.4} format={(n) => n.toFixed(1)} />}
          sup="%"
          delta="-0.8 pts"
          deltaTone="success"
        />
        <Kpi
          label="Avg Visit Value"
          value={<CountUp to={246} duration={1.4} format={(n) => `$${Math.round(n)}`} />}
          delta="+$12"
          deltaTone="success"
        />
      </div>

      <OpsCard padding="28px 32px">
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <div>
            <OpsEyebrow>Visit Volume</OpsEyebrow>
            <h2
              style={{
                fontFamily: 'Fraunces, serif',
                fontWeight: 400,
                fontSize: 24,
                margin: '6px 0 0',
                color: '#1A1A1A',
              }}
            >
              Seven-Month Trend
            </h2>
          </div>
          <div
            style={{
              display: 'flex',
              gap: 18,
              fontFamily: 'Inter, sans-serif',
              fontSize: 11,
              color: 'var(--color-mist)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              flexWrap: 'wrap',
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 12, height: 1, background: '#0A0A0A' }} />
              Visits
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 12, height: 1, background: '#C4973E' }} />
              Average
            </span>
          </div>
        </div>
        <OpsHairline width="100%" color="var(--color-taupe)" margin="20px 0 28px" />

        <div
          ref={barsRef}
          style={{
            height: 220,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: 12,
            paddingTop: 24,
            paddingBottom: 4,
            position: 'relative',
          }}
        >
          {[0, 0.25, 0.5, 0.75, 1].map((g, i) => (
            <div
              key={i}
              aria-hidden="true"
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: g * 200,
                borderTop: '1px solid var(--color-taupe-soft)',
              }}
            />
          ))}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: (240 / MAX) * 200,
              borderTop: '1px dashed #C4973E',
            }}
          />

          {MONTHS.map((mo, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: 8,
                position: 'relative',
                height: '100%',
              }}
            >
              <div
                style={{
                  fontFamily: 'Fraunces, serif',
                  fontSize: 13,
                  color: '#1A1A1A',
                  position: 'absolute',
                  bottom: (mo.v / MAX) * 200 + 8,
                }}
              >
                {mo.v}
              </div>
              <div
                data-bar
                style={{
                  width: '62%',
                  height: (mo.v / MAX) * 200,
                  background: '#0A0A0A',
                  borderTop: i === MONTHS.length - 1 ? '3px solid #C4973E' : '0',
                  willChange: 'transform',
                }}
              />
              <div
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: 11,
                  color: 'var(--color-mist)',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}
              >
                {mo.m}
              </div>
            </div>
          ))}
        </div>
      </OpsCard>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.4fr 1fr',
          gap: 16,
          marginTop: 16,
        }}
        className="reports-cards"
      >
        <OpsCard padding="24px 28px">
          <OpsEyebrow>Service Mix</OpsEyebrow>
          <h2
            style={{
              fontFamily: 'Fraunces, serif',
              fontWeight: 400,
              fontSize: 22,
              margin: '6px 0 0',
              color: '#1A1A1A',
            }}
          >
            By Category
          </h2>
          <OpsHairline width="100%" color="var(--color-taupe)" margin="16px 0 18px" />

          <div ref={mixRef} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {SERVICES.map((s) => (
              <div
                key={s.name}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '180px 1fr 60px 50px',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#1A1A1A' }}>
                  {s.name}
                </div>
                <div
                  style={{
                    height: 6,
                    background: 'var(--color-cream-deep)',
                    position: 'relative',
                  }}
                >
                  <div
                    data-mix-bar
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: `${s.pct * 3.5}%`,
                      background: '#0A0A0A',
                      willChange: 'transform',
                    }}
                  />
                </div>
                <div
                  style={{
                    fontFamily: 'Fraunces, serif',
                    fontSize: 15,
                    color: '#1A1A1A',
                    textAlign: 'right',
                  }}
                >
                  {s.count}
                </div>
                <div
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: 12,
                    color: 'var(--color-mist)',
                    textAlign: 'right',
                  }}
                >
                  {s.pct}%
                </div>
              </div>
            ))}
          </div>
        </OpsCard>

        <OpsCard padding="24px 28px">
          <OpsEyebrow>Top Attendants</OpsEyebrow>
          <h2
            style={{
              fontFamily: 'Fraunces, serif',
              fontWeight: 400,
              fontSize: 22,
              margin: '6px 0 0',
              color: '#1A1A1A',
            }}
          >
            By Visit Volume
          </h2>
          <OpsHairline width="100%" color="var(--color-taupe)" margin="16px 0 18px" />

          {ATTENDANTS.map((a, i, arr) => (
            <div
              key={a.name}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto auto',
                gap: 16,
                alignItems: 'baseline',
                padding: '12px 0',
                borderBottom: i < arr.length - 1 ? '1px solid var(--color-taupe-soft)' : undefined,
              }}
            >
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#1A1A1A' }}>
                {a.name}
              </div>
              <div style={{ fontFamily: 'Fraunces, serif', fontSize: 15, color: '#1A1A1A' }}>
                {a.visits}
              </div>
              <div
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: 12,
                  color: 'var(--color-mist)',
                  letterSpacing: '0.04em',
                }}
              >
                {a.ontime}% on time
              </div>
            </div>
          ))}
        </OpsCard>
      </div>

      <style>{`
        @media (max-width: 1023px) {
          .reports-kpis { grid-template-columns: repeat(2, 1fr) !important; }
          .reports-cards { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 640px) {
          .reports-kpis { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
