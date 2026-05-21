import { useEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { CountUp, useLucide, useToast } from '../../components';
import { buildCsv, downloadCsv } from '../../utils/csv';
import { useOps } from './context';
import type { OpsBooking } from './data';
import {
  Kpi,
  OpsButton,
  OpsCard,
  OpsEyebrow,
  OpsHairline,
} from './OpsPrimitives';

type RangeId = 'q1-2026' | 'q2-2026' | 'q3-2026' | 'q4-2026' | 'ytd' | 'last-12';

interface RangeOption {
  id: RangeId;
  label: string;
}

const RANGES: RangeOption[] = [
  { id: 'q2-2026', label: 'Q2 2026' },
  { id: 'q1-2026', label: 'Q1 2026' },
  { id: 'ytd', label: 'YTD' },
  { id: 'last-12', label: 'Last 12 months' },
];

function rangeBounds(id: RangeId, now: Date = new Date()): { start: Date; end: Date } {
  const year = 2026;
  switch (id) {
    case 'q1-2026':
      return { start: new Date(year, 0, 1), end: new Date(year, 3, 1) };
    case 'q2-2026':
      return { start: new Date(year, 3, 1), end: new Date(year, 6, 1) };
    case 'q3-2026':
      return { start: new Date(year, 6, 1), end: new Date(year, 9, 1) };
    case 'q4-2026':
      return { start: new Date(year, 9, 1), end: new Date(year + 1, 0, 1) };
    case 'ytd': {
      return { start: new Date(now.getFullYear(), 0, 1), end: new Date(now.getFullYear() + 1, 0, 1) };
    }
    case 'last-12': {
      const start = new Date(now.getFullYear(), now.getMonth() - 11, 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      return { start, end };
    }
  }
}

interface MonthBucket {
  key: string; // yyyy-mm
  label: string; // "May"
  count: number;
}

function bucketByMonth(bookings: OpsBooking[], start: Date, end: Date): MonthBucket[] {
  const buckets: MonthBucket[] = [];
  const cursor = new Date(start);
  while (cursor < end) {
    const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`;
    const label = cursor.toLocaleDateString('en-US', { month: 'short' });
    buckets.push({ key, label, count: 0 });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  for (const b of bookings) {
    const d = parseOpsBookingDate(b);
    if (!d) continue;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const found = buckets.find((x) => x.key === key);
    if (found) found.count += 1;
  }
  return buckets;
}

// OpsBooking.date is "14 May" — combine with assumed year to get a Date.
// We use service_snapshot's scheduled_at on the underlying row when available;
// since OpsBooking doesn't carry scheduled_at, we parse what we have.
function parseOpsBookingDate(b: OpsBooking): Date | null {
  const labelWithYear = /\d{4}/.test(b.date) ? b.date : `${b.date} ${new Date().getFullYear()}`;
  const parsed = new Date(labelWithYear);
  return isNaN(parsed.getTime()) ? null : parsed;
}

export function Reports() {
  useLucide();
  const toast = useToast();
  const { bookings, propertyName } = useOps();
  const [range, setRange] = useState<RangeId>('q2-2026');
  const [rangeOpen, setRangeOpen] = useState(false);
  const barsRef = useRef<HTMLDivElement>(null);
  const mixRef = useRef<HTMLDivElement>(null);

  const { start, end } = useMemo(() => rangeBounds(range), [range]);

  const filtered = useMemo(() => {
    return bookings.filter((b) => {
      const d = parseOpsBookingDate(b);
      if (!d) return false;
      return d >= start && d < end;
    });
  }, [bookings, start, end]);

  // ─── KPIs ──────────────────────────────────────────────────────────────
  const visits = filtered.filter((b) => b.status !== 'cancelled').length;
  const cancelled = filtered.filter((b) => b.status === 'cancelled').length;
  const cancellationRate = filtered.length === 0 ? 0 : (cancelled / filtered.length) * 100;
  const avgVisitValue =
    filtered.length === 0
      ? 0
      : filtered.reduce((sum, b) => sum + (b.price ?? 0), 0) / filtered.length;
  const arrived = filtered.filter((b) => b.arrivedAt);
  const onTime = arrived.filter((b) => {
    if (!b.arrivedAt) return false;
    return new Date(b.arrivedAt).getTime() - new Date(b.scheduledAt).getTime() <= 15 * 60 * 1000;
  });
  const onTimePct = arrived.length === 0 ? 0 : Math.round((onTime.length / arrived.length) * 100);
  const months = useMemo(() => bucketByMonth(filtered, start, end), [filtered, start, end]);
  const maxMonth = Math.max(1, ...months.map((m) => m.count));

  // ─── Service mix + Top attendants ───────────────────────────────────────
  type Slice = { name: string; count: number; pct: number };
  const serviceMix: Slice[] = useMemo(() => {
    const counts = new Map<string, number>();
    for (const b of filtered) {
      counts.set(b.service, (counts.get(b.service) ?? 0) + 1);
    }
    const total = Array.from(counts.values()).reduce((a, b) => a + b, 0);
    return Array.from(counts.entries())
      .map(([name, count]) => ({
        name,
        count,
        pct: total === 0 ? 0 : Math.round((count / total) * 100),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [filtered]);

  const topAttendants = useMemo(() => {
    const counts = new Map<string, number>();
    for (const b of filtered) {
      if (!b.attendant || b.attendant === '—') continue;
      counts.set(b.attendant, (counts.get(b.attendant) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([name, visits]) => ({ name, visits, ontime: 0 }))
      .sort((a, b) => b.visits - a.visits)
      .slice(0, 6);
  }, [filtered]);

  useGSAP(
    () => {
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (barsRef.current) {
        const bars = barsRef.current.querySelectorAll<HTMLElement>('[data-bar]');
        if (bars.length) {
          if (reduceMotion) gsap.set(bars, { scaleY: 1, transformOrigin: 'bottom center' });
          else {
            gsap.set(bars, { scaleY: 0, transformOrigin: 'bottom center' });
            ScrollTrigger.create({
              trigger: barsRef.current,
              start: 'top 85%',
              once: true,
              onEnter: () => {
                gsap.to(bars, { scaleY: 1, duration: 0.9, ease: 'expo.out', stagger: 0.06 });
              },
            });
          }
        }
      }
      if (mixRef.current) {
        const fills = mixRef.current.querySelectorAll<HTMLElement>('[data-mix-bar]');
        if (fills.length) {
          if (reduceMotion) gsap.set(fills, { scaleX: 1, transformOrigin: 'left center' });
          else {
            gsap.set(fills, { scaleX: 0, transformOrigin: 'left center' });
            ScrollTrigger.create({
              trigger: mixRef.current,
              start: 'top 85%',
              once: true,
              onEnter: () => {
                gsap.to(fills, { scaleX: 1, duration: 1.1, ease: 'expo.out', stagger: 0.06 });
              },
            });
          }
        }
      }
    },
    { dependencies: [range, months.length, serviceMix.length] },
  );

  useEffect(() => {
    if (!rangeOpen) return;
    const onClick = () => setRangeOpen(false);
    setTimeout(() => document.addEventListener('click', onClick, { once: true }), 0);
    return () => document.removeEventListener('click', onClick);
  }, [rangeOpen]);

  function exportReport() {
    const csv = buildCsv(filtered, [
      { header: 'Ref', accessor: (b) => b.reference },
      { header: 'Date', accessor: (b) => b.date },
      { header: 'Time', accessor: (b) => b.time },
      { header: 'Residence', accessor: (b) => b.unit },
      { header: 'Resident', accessor: (b) => b.resident },
      { header: 'Service', accessor: (b) => b.service },
      { header: 'Attendant', accessor: (b) => b.attendant },
      { header: 'Status', accessor: (b) => b.status },
      { header: 'Price', accessor: (b) => b.price },
    ]);
    downloadCsv(`apenterprises-report-${range}-${Date.now()}.csv`, csv);
    toast.success(`${filtered.length} bookings exported.`);
  }

  const rangeLabel = RANGES.find((r) => r.id === range)?.label ?? 'Q2 2026';

  return (
    <div style={{ padding: 'clamp(20px, 4vw, 32px) clamp(20px, 4vw, 32px) 56px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <OpsEyebrow>{rangeLabel} · {propertyName}</OpsEyebrow>
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }} className="reports-kpis">
        <Kpi
          label={`Visits · ${rangeLabel}`}
          value={<CountUp to={visits} duration={1.4} />}
          delta={filtered.length === 0 ? 'No data' : `${filtered.length} total`}
          deltaTone={filtered.length === 0 ? 'warning' : 'neutral'}
        />
        <Kpi
          label="On-Time Arrivals"
          value={<CountUp to={onTimePct} duration={1.2} />}
          sup="%"
          delta={arrived.length === 0 ? 'Mark arrivals to populate' : `${onTime.length} of ${arrived.length} arrived on time`}
          deltaTone={arrived.length === 0 ? 'neutral' : 'success'}
        />
        <Kpi
          label="Cancellation Rate"
          value={<CountUp to={cancellationRate} duration={1.2} format={(n) => n.toFixed(1)} />}
          sup="%"
          delta={cancelled === 0 ? 'No cancellations' : `${cancelled} cancelled`}
          deltaTone={cancellationRate > 10 ? 'warning' : 'success'}
        />
        <Kpi
          label="Avg Visit Value"
          value={<CountUp to={avgVisitValue} duration={1.4} format={(n) => `$${Math.round(n)}`} />}
          delta="Across non-cancelled visits"
          deltaTone="neutral"
        />
      </div>

      <OpsCard padding="28px 32px">
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <div>
            <OpsEyebrow>Visit Volume</OpsEyebrow>
            <h2 style={{ fontFamily: 'Fraunces, serif', fontWeight: 400, fontSize: 24, margin: '6px 0 0', color: '#1A1A1A' }}>
              {rangeLabel}
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

          {months.length === 0 && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'grid',
                placeItems: 'center',
                color: 'var(--color-mist)',
                fontFamily: 'var(--font-sans)',
                fontSize: 13,
              }}
            >
              No data in the selected range.
            </div>
          )}

          {months.map((mo, i) => (
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
                  bottom: (mo.count / maxMonth) * 200 + 8,
                }}
              >
                {mo.count}
              </div>
              <div
                data-bar
                style={{
                  width: '62%',
                  height: (mo.count / maxMonth) * 200,
                  background: '#0A0A0A',
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
                {mo.label}
              </div>
            </div>
          ))}
        </div>
      </OpsCard>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16, marginTop: 16 }} className="reports-cards">
        <OpsCard padding="24px 28px">
          <OpsEyebrow>Service Mix</OpsEyebrow>
          <h2 style={{ fontFamily: 'Fraunces, serif', fontWeight: 400, fontSize: 22, margin: '6px 0 0', color: '#1A1A1A' }}>
            By Category
          </h2>
          <OpsHairline width="100%" color="var(--color-taupe)" margin="16px 0 18px" />

          {serviceMix.length === 0 && (
            <p
              style={{
                margin: 0,
                fontFamily: 'var(--font-sans)',
                fontSize: 13,
                color: 'var(--color-mist)',
              }}
            >
              No services booked in this range.
            </p>
          )}

          <div ref={mixRef} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {serviceMix.map((s) => (
              <div
                key={s.name}
                style={{ display: 'grid', gridTemplateColumns: '180px 1fr 60px 50px', alignItems: 'center', gap: 12 }}
              >
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#1A1A1A' }}>
                  {s.name}
                </div>
                <div style={{ height: 6, background: 'var(--color-cream-deep)', position: 'relative' }}>
                  <div
                    data-mix-bar
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: `${Math.max(2, s.pct)}%`,
                      background: '#0A0A0A',
                      willChange: 'transform',
                    }}
                  />
                </div>
                <div style={{ fontFamily: 'Fraunces, serif', fontSize: 15, color: '#1A1A1A', textAlign: 'right' }}>
                  {s.count}
                </div>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: 'var(--color-mist)', textAlign: 'right' }}>
                  {s.pct}%
                </div>
              </div>
            ))}
          </div>
        </OpsCard>

        <OpsCard padding="24px 28px">
          <OpsEyebrow>Top Attendants</OpsEyebrow>
          <h2 style={{ fontFamily: 'Fraunces, serif', fontWeight: 400, fontSize: 22, margin: '6px 0 0', color: '#1A1A1A' }}>
            By Visit Volume
          </h2>
          <OpsHairline width="100%" color="var(--color-taupe)" margin="16px 0 18px" />

          {topAttendants.length === 0 && (
            <p style={{ margin: 0, fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--color-mist)' }}>
              No attendant visits in this range.
            </p>
          )}

          {topAttendants.map((a, i, arr) => (
            <div
              key={a.name}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                gap: 16,
                alignItems: 'baseline',
                padding: '12px 0',
                borderBottom: i < arr.length - 1 ? '1px solid var(--color-taupe-soft)' : undefined,
              }}
            >
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#1A1A1A' }}>{a.name}</div>
              <div style={{ fontFamily: 'Fraunces, serif', fontSize: 15, color: '#1A1A1A' }}>{a.visits}</div>
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
