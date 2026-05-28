import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { Spinner, useLucide } from '../../components';
import { getWeeklyBookingCounts, type WeeklyBookingCount } from '../../lib/api/properties';
import { businessDateKey } from '../../utils/dateKey';
import { useAdmin } from './context';
import { OpsCard, OpsEyebrow, OpsHairline, OpsIcon } from '../Ops/OpsPrimitives';

function startOfWeek(d: Date): Date {
  const out = new Date(d);
  const day = out.getDay(); // 0 = Sunday
  const diff = day === 0 ? -6 : 1 - day; // Mon = first day
  out.setDate(out.getDate() + diff);
  out.setHours(0, 0, 0, 0);
  return out;
}

function addDays(d: Date, n: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + n);
  return out;
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

type RangeWeeks = 1 | 2 | 4;
const RANGE_OPTIONS: { value: RangeWeeks; label: string }[] = [
  { value: 1, label: '1w' },
  { value: 2, label: '2w' },
  { value: 4, label: '4w' },
];
const STORAGE_KEY = 'admin.calendar.range';

function readStoredRange(): RangeWeeks {
  if (typeof window === 'undefined') return 1;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const n = raw ? parseInt(raw, 10) : 1;
    if (n === 1 || n === 2 || n === 4) return n;
  } catch {
    // ignore
  }
  return 1;
}

/**
 * Weekly snapshot: each row is a property AP stewards, each column a day. The
 * cell intensity scales with the count of (non-cancelled) bookings that day.
 * Click a cell → drill into the bookings table filtered to that (building, day).
 * Click a property name → open Pipeline scoped to that property.
 */
export function BuildingsCalendarStrip() {
  const navigate = useNavigate();
  const { properties } = useAdmin();
  const [range, setRange] = useState<RangeWeeks>(() => readStoredRange());
  const [weekOffset, setWeekOffset] = useState(0);
  const [counts, setCounts] = useState<WeeklyBookingCount[]>([]);
  const [loading, setLoading] = useState(true);
  const cardRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useLucide();

  const dayCount = range * 7;

  // Memoised so `start`/`end` are referentially stable per (weekOffset, range).
  // Without this, every render minted fresh Date objects and the fetch effect
  // re-fired forever, freezing the prev/next buttons after a few rapid clicks.
  const { days, start, end } = useMemo(() => {
    const base = startOfWeek(new Date());
    const startDate = addDays(base, weekOffset * dayCount);
    const list = Array.from({ length: dayCount }, (_, i) => addDays(startDate, i));
    const endDate = addDays(list[dayCount - 1]!, 1);
    return { days: list, start: startDate, end: endDate };
  }, [weekOffset, dayCount]);

  const todayKey = businessDateKey(new Date());

  // Track viewport visibility so keyboard shortcuts only fire when the card is
  // on-screen (avoids stealing arrow keys from other panels).
  useEffect(() => {
    if (!cardRef.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => setInView(entry?.isIntersecting ?? false),
      { threshold: 0.15 },
    );
    obs.observe(cardRef.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!inView) return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setWeekOffset((v) => v - 1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setWeekOffset((v) => v + 1);
      } else if (e.key === 't' || e.key === 'T' || e.key === 'Home') {
        e.preventDefault();
        setWeekOffset(0);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [inView]);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    setLoading(true);
    getWeeklyBookingCounts(start, end)
      .then((rows) => {
        if (!cancelled) setCounts(rows);
      })
      .catch((err) => {
        if (cancelled || controller.signal.aborted) return;
        console.error('[admin/calendar] load failed', err);
        setCounts([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [start, end]);

  const countsByProp = useMemo(() => {
    const map = new Map<string, Map<string, number>>();
    for (const row of counts) {
      const inner = map.get(row.property_id) ?? new Map();
      inner.set(row.day, row.count);
      map.set(row.property_id, inner);
    }
    return map;
  }, [counts]);

  const maxCount = useMemo(
    () => counts.reduce((m, r) => Math.max(m, r.count), 0),
    [counts],
  );

  const activeProperties = useMemo(
    () => properties.filter((p) => p.property.active).map((p) => p.property),
    [properties],
  );

  // Totals: by property (row), by day (column), grand total.
  const totalsByProp = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of activeProperties) {
      let sum = 0;
      const inner = countsByProp.get(p.id);
      if (inner) for (const v of inner.values()) sum += v;
      m.set(p.id, sum);
    }
    return m;
  }, [activeProperties, countsByProp]);

  const totalsByDay = useMemo(() => {
    const m = new Map<string, number>();
    for (const d of days) {
      const key = businessDateKey(d);
      let sum = 0;
      for (const inner of countsByProp.values()) {
        sum += inner.get(key) ?? 0;
      }
      m.set(key, sum);
    }
    return m;
  }, [days, countsByProp]);

  const grandTotal = useMemo(
    () => Array.from(totalsByDay.values()).reduce((a, b) => a + b, 0),
    [totalsByDay],
  );

  const maxDayTotal = useMemo(
    () => Math.max(0, ...Array.from(totalsByDay.values())),
    [totalsByDay],
  );

  const rangeLabel = `${start.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })} – ${days[dayCount - 1]!.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

  function handleRange(r: RangeWeeks) {
    setRange(r);
    setWeekOffset(0);
    try {
      window.localStorage.setItem(STORAGE_KEY, String(r));
    } catch {
      // ignore — private mode etc.
    }
  }

  function jumpToDate(input: string) {
    if (!input) return;
    const parts = input.split('-').map((n) => parseInt(n, 10));
    const [y, m, d] = parts;
    if (!y || !m || !d || isNaN(y) || isNaN(m) || isNaN(d)) return;
    const target = new Date(y, m - 1, d);
    const base = startOfWeek(new Date());
    const targetWeekStart = startOfWeek(target);
    const diffDays = Math.round(
      (targetWeekStart.getTime() - base.getTime()) / 86400000,
    );
    setWeekOffset(Math.floor(diffDays / dayCount));
  }

  const showTotals = activeProperties.length > 0;
  const showStaleOverlay = loading && counts.length > 0;
  const cellMinWidth = dayCount > 14 ? 44 : 56;

  return (
    <div ref={cardRef}>
      <OpsCard padding={0} style={{ overflow: 'hidden' }}>
        <div style={headerRowStyle}>
          <div>
            <OpsEyebrow>Calendar by building</OpsEyebrow>
            <h2
              style={{
                fontFamily: 'Fraunces, serif',
                fontWeight: 400,
                fontSize: 22,
                margin: '4px 0 0',
                color: '#1A1A1A',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              {rangeLabel}
              {loading && <Spinner size={10} />}
            </h2>
          </div>

          <div style={controlsRowStyle}>
            {/* Range selector */}
            <div role="group" aria-label="Range" style={segmentedGroupStyle}>
              {RANGE_OPTIONS.map((opt) => {
                const active = opt.value === range;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleRange(opt.value)}
                    aria-pressed={active}
                    title={`${opt.value * 7} days`}
                    style={{
                      ...segmentedBtnStyle,
                      background: active ? '#1A1A1A' : 'transparent',
                      color: active ? '#F4F7FA' : '#4A4A4A',
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>

            {/* Jump to date */}
            <label style={dateLabelStyle} title="Jump to a specific date">
              <span style={dateIconStyle}>
                <OpsIcon name="calendar" size={13} />
              </span>
              <input
                type="date"
                onChange={(e) => jumpToDate(e.target.value)}
                aria-label="Jump to date"
                style={dateInputStyle}
              />
            </label>

            {/* Prev / Today / Next */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <button
                type="button"
                onClick={() => setWeekOffset((v) => v - 1)}
                aria-label="Previous"
                title="Previous (←)"
                style={navBtn}
              >
                <OpsIcon name="chevron-left" size={14} />
              </button>
              <button
                type="button"
                onClick={() => setWeekOffset(0)}
                aria-label="Today"
                title="Today (T)"
                disabled={weekOffset === 0}
                style={{
                  ...navBtn,
                  padding: '6px 14px',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: 11,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  opacity: weekOffset === 0 ? 0.4 : 1,
                  cursor: weekOffset === 0 ? 'default' : 'pointer',
                }}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setWeekOffset((v) => v + 1)}
                aria-label="Next"
                title="Next (→)"
                style={navBtn}
              >
                <OpsIcon name="chevron-right" size={14} />
              </button>
            </div>
          </div>
        </div>

        <OpsHairline color="transparent" width="100%" margin="0" />

        <div
          style={{
            overflowX: 'auto',
            position: 'relative',
            opacity: showStaleOverlay ? 0.55 : 1,
            transition: 'opacity 180ms ease',
          }}
        >
          <table
            style={{
              width: '100%',
              minWidth: 200 + dayCount * cellMinWidth + (showTotals ? 80 : 0),
              borderCollapse: 'separate',
              borderSpacing: 0,
              fontFamily: 'Inter, sans-serif',
            }}
          >
            <thead>
              <tr>
                <th
                  style={{
                    ...thStyle,
                    textAlign: 'left',
                    paddingLeft: 20,
                    background: 'var(--color-cream-deep)',
                    position: 'sticky',
                    left: 0,
                    minWidth: 200,
                    zIndex: 1,
                  }}
                >
                  Property
                </th>
                {days.map((d, i) => {
                  const isToday = businessDateKey(d) === todayKey;
                  const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                  const isMonthBoundary = i > 0 && d.getDate() === 1;
                  const dayTotal = totalsByDay.get(businessDateKey(d)) ?? 0;
                  const isHottest =
                    dayTotal > 0 && dayTotal === maxDayTotal && maxDayTotal > 0;
                  return (
                    <th
                      key={i}
                      style={{
                        ...thStyle,
                        background: isToday
                          ? 'rgba(196,151,62,0.10)'
                          : isWeekend
                            ? 'rgba(74,74,74,0.04)'
                            : 'var(--color-cream-deep)',
                        borderLeft: isMonthBoundary
                          ? '1px solid var(--color-taupe)'
                          : undefined,
                        minWidth: cellMinWidth,
                      }}
                    >
                      <span
                        style={{
                          display: 'block',
                          fontFamily: 'Inter, sans-serif',
                          fontSize: 9,
                          letterSpacing: '0.18em',
                          color: '#8A8378',
                        }}
                      >
                        {DAY_LABELS[(d.getDay() + 6) % 7]}
                      </span>
                      <span
                        style={{
                          display: 'block',
                          fontFamily: 'Fraunces, serif',
                          fontSize: 15,
                          color:
                            isToday || isHottest
                              ? 'var(--color-champagne-deep)'
                              : '#1A1A1A',
                          marginTop: 4,
                        }}
                      >
                        {d.getDate()}
                      </span>
                    </th>
                  );
                })}
                {showTotals && (
                  <th
                    style={{
                      ...thStyle,
                      textAlign: 'center',
                      background: 'var(--color-cream-deep)',
                      borderLeft: '1px solid var(--color-taupe)',
                      minWidth: 60,
                    }}
                  >
                    Σ
                  </th>
                )}
              </tr>
            </thead>

            <tbody>
              {activeProperties.length === 0 && !loading && (
                <tr>
                  <td
                    colSpan={dayCount + (showTotals ? 2 : 1)}
                    style={{
                      padding: '40px 24px',
                      textAlign: 'center',
                      color: 'var(--color-mist)',
                      fontSize: 13,
                    }}
                  >
                    No active properties yet.
                  </td>
                </tr>
              )}
              {activeProperties.map((property) => {
                const inner = countsByProp.get(property.id);
                const propTotal = totalsByProp.get(property.id) ?? 0;
                return (
                  <tr key={property.id}>
                    <td
                      onClick={() => navigate(`/admin/pipeline?property=${property.id}`)}
                      title="Open pipeline for this property"
                      style={{
                        ...tdStyle,
                        paddingLeft: 20,
                        fontFamily: 'Fraunces, serif',
                        fontSize: 15,
                        color: '#1A1A1A',
                        borderRight: '1px solid var(--color-taupe-soft)',
                        background: 'var(--bg-surface)',
                        position: 'sticky',
                        left: 0,
                        zIndex: 1,
                        cursor: 'pointer',
                        transition: 'background-color 200ms ease',
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = 'rgba(196,151,62,0.06)')
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = 'var(--bg-surface)')
                      }
                    >
                      {property.name}
                      <div
                        style={{
                          fontFamily: 'Inter, sans-serif',
                          fontSize: 10,
                          color: '#8A8378',
                          marginTop: 2,
                          letterSpacing: '0.04em',
                        }}
                      >
                        {property.city}
                      </div>
                    </td>
                    {days.map((d, i) => {
                      const key = businessDateKey(d);
                      const cnt = inner?.get(key) ?? 0;
                      const intensity = maxCount === 0 ? 0 : Math.min(1, cnt / maxCount);
                      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                      const isToday = key === todayKey;
                      const isMonthBoundary = i > 0 && d.getDate() === 1;
                      let bg: string;
                      if (cnt > 0) {
                        bg = `rgba(196,151,62,${0.10 + intensity * 0.45})`;
                      } else if (isToday) {
                        bg = 'rgba(196,151,62,0.04)';
                      } else if (isWeekend) {
                        bg = 'rgba(74,74,74,0.03)';
                      } else {
                        bg = 'transparent';
                      }
                      return (
                        <td
                          key={i}
                          onClick={() => {
                            if (cnt > 0) {
                              navigate(
                                `/admin/bookings?property=${property.id}&date=${key}`,
                              );
                            }
                          }}
                          title={
                            cnt > 0
                              ? `${cnt} ${cnt === 1 ? 'booking' : 'bookings'} · ${d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}`
                              : undefined
                          }
                          style={{
                            ...tdStyle,
                            textAlign: 'center',
                            cursor: cnt > 0 ? 'pointer' : 'default',
                            background: bg,
                            borderLeft: isMonthBoundary
                              ? '1px solid var(--color-taupe)'
                              : undefined,
                            transition: 'background-color 200ms ease',
                            color: cnt > 0 ? '#1A1A1A' : '#D9D2C5',
                            fontFamily: 'Fraunces, serif',
                            fontSize: 15,
                          }}
                        >
                          {cnt > 0 ? cnt : '·'}
                        </td>
                      );
                    })}
                    {showTotals && (
                      <td
                        style={{
                          ...tdStyle,
                          textAlign: 'center',
                          borderLeft: '1px solid var(--color-taupe)',
                          fontFamily: 'Fraunces, serif',
                          fontSize: 15,
                          color: propTotal > 0 ? '#1A1A1A' : '#D9D2C5',
                          background:
                            propTotal > 0 ? 'var(--color-cream-deep)' : 'transparent',
                        }}
                      >
                        {propTotal > 0 ? propTotal : '·'}
                      </td>
                    )}
                  </tr>
                );
              })}
              {showTotals && activeProperties.length > 0 && (
                <tr>
                  <td
                    style={{
                      ...tdStyle,
                      paddingLeft: 20,
                      borderTop: '1px solid var(--color-taupe)',
                      borderRight: '1px solid var(--color-taupe-soft)',
                      background: 'var(--color-cream-deep)',
                      position: 'sticky',
                      left: 0,
                      zIndex: 1,
                      fontFamily: 'Inter, sans-serif',
                      fontSize: 10,
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                      color: '#4A4A4A',
                    }}
                  >
                    Daily total
                  </td>
                  {days.map((d, i) => {
                    const key = businessDateKey(d);
                    const dayTotal = totalsByDay.get(key) ?? 0;
                    const isHottest = dayTotal > 0 && dayTotal === maxDayTotal;
                    const isMonthBoundary = i > 0 && d.getDate() === 1;
                    return (
                      <td
                        key={i}
                        style={{
                          ...tdStyle,
                          textAlign: 'center',
                          borderTop: '1px solid var(--color-taupe)',
                          borderLeft: isMonthBoundary
                            ? '1px solid var(--color-taupe)'
                            : undefined,
                          background: 'var(--color-cream-deep)',
                          fontFamily: 'Fraunces, serif',
                          fontSize: 14,
                          color: isHottest
                            ? 'var(--color-champagne-deep)'
                            : dayTotal > 0
                              ? '#1A1A1A'
                              : '#D9D2C5',
                          fontWeight: isHottest ? 500 : 400,
                        }}
                      >
                        {dayTotal > 0 ? dayTotal : '·'}
                      </td>
                    );
                  })}
                  <td
                    style={{
                      ...tdStyle,
                      textAlign: 'center',
                      borderTop: '1px solid var(--color-taupe)',
                      borderLeft: '1px solid var(--color-taupe)',
                      background: '#1A1A1A',
                      color: '#F4F7FA',
                      fontFamily: 'Fraunces, serif',
                      fontSize: 15,
                    }}
                  >
                    {grandTotal > 0 ? grandTotal : '·'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer: shortcut hint + summary */}
        <div style={footerStyle}>
          <span>
            <kbd style={kbdStyle}>←</kbd> <kbd style={kbdStyle}>→</kbd> navigate ·{' '}
            <kbd style={kbdStyle}>T</kbd> today
          </span>
          <span>
            {activeProperties.length}{' '}
            {activeProperties.length === 1 ? 'property' : 'properties'} · {grandTotal}{' '}
            {grandTotal === 1 ? 'visit' : 'visits'} in range
          </span>
        </div>
      </OpsCard>
    </div>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const navBtn: CSSProperties = {
  background: 'transparent',
  border: '1px solid var(--color-taupe)',
  width: 32,
  height: 32,
  borderRadius: 4,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  color: '#1A1A1A',
};

const thStyle: CSSProperties = {
  padding: '10px 8px',
  fontSize: 10,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: '#4A4A4A',
  fontWeight: 500,
  borderBottom: '1px solid var(--color-taupe)',
};

const tdStyle: CSSProperties = {
  padding: '14px 8px',
  borderBottom: '1px solid var(--color-taupe-soft)',
};

const headerRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '16px 20px',
  borderBottom: '1px solid var(--color-taupe)',
  gap: 12,
  flexWrap: 'wrap',
};

const controlsRowStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 12,
  flexWrap: 'wrap',
  justifyContent: 'flex-end',
};

const segmentedGroupStyle: CSSProperties = {
  display: 'inline-flex',
  border: '1px solid var(--color-taupe)',
  borderRadius: 4,
  overflow: 'hidden',
};

const segmentedBtnStyle: CSSProperties = {
  border: 0,
  cursor: 'pointer',
  padding: '6px 12px',
  fontFamily: 'Inter, sans-serif',
  fontSize: 11,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  transition: 'background-color 200ms ease, color 200ms ease',
};

const dateLabelStyle: CSSProperties = {
  position: 'relative',
  display: 'inline-flex',
  alignItems: 'center',
};

const dateIconStyle: CSSProperties = {
  position: 'absolute',
  left: 10,
  color: 'var(--color-mist)',
  pointerEvents: 'none',
  display: 'inline-flex',
};

const dateInputStyle: CSSProperties = {
  fontFamily: 'Inter, sans-serif',
  fontSize: 12,
  padding: '6px 10px 6px 30px',
  border: '1px solid var(--color-taupe)',
  borderRadius: 4,
  background: 'transparent',
  color: 'var(--color-charcoal)',
  outline: 'none',
  minWidth: 160,
};

const footerStyle: CSSProperties = {
  padding: '10px 20px',
  borderTop: '1px solid var(--color-taupe-soft)',
  background: 'var(--bg-page)',
  fontFamily: 'Inter, sans-serif',
  fontSize: 10,
  letterSpacing: '0.10em',
  textTransform: 'uppercase',
  color: 'var(--color-mist)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexWrap: 'wrap',
  gap: 12,
};

const kbdStyle: CSSProperties = {
  display: 'inline-block',
  padding: '2px 6px',
  border: '1px solid var(--color-taupe)',
  borderRadius: 3,
  fontFamily: 'Inter, sans-serif',
  fontSize: 10,
  letterSpacing: '0.04em',
  color: 'var(--color-charcoal)',
  background: 'var(--bg-surface)',
};
