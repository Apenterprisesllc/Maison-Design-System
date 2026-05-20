import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import gsap from 'gsap';
import { Icon } from '../../components';
import type { TimeSlot } from './types';

export interface CalendarProps {
  selectedDate: Date | null;
  onSelect: (d: Date) => void;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function Calendar({ selectedDate, onSelect }: CalendarProps) {
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const [monthOffset, setMonthOffset] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const gridRef = useRef<HTMLDivElement>(null);

  const base = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  const monthLabel = base.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const firstDow = base.getDay();
  const daysInMonth = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!gridRef.current || reduceMotion) return;
    gsap.fromTo(
      gridRef.current,
      { opacity: 0, x: dir === 1 ? 16 : -16 },
      { opacity: 1, x: 0, duration: 0.28, ease: 'cubic-bezier(0.2, 0.6, 0.2, 1)' },
    );
  }, [monthOffset, dir]);

  const canGoPrev = monthOffset > 0;

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          marginBottom: 20,
        }}
      >
        <h3
          style={{
            fontFamily: 'var(--font-serif)',
            fontWeight: 400,
            fontSize: 22,
            color: 'var(--color-charcoal)',
            margin: 0,
          }}
          aria-live="polite"
        >
          {monthLabel}
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            type="button"
            onClick={() => {
              if (!canGoPrev) return;
              setDir(-1);
              setMonthOffset((v) => v - 1);
            }}
            disabled={!canGoPrev}
            aria-label="Previous month"
            style={navBtnStyle(canGoPrev)}
          >
            <Icon name="chevron-left" size={16} />
          </button>
          <button
            type="button"
            onClick={() => {
              setDir(1);
              setMonthOffset((v) => v + 1);
            }}
            aria-label="Next month"
            style={navBtnStyle(true)}
          >
            <Icon name="chevron-right" size={16} />
          </button>
        </div>
      </div>

      <div style={{ overflow: 'hidden' }}>
        <div
          ref={gridRef}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: 0,
            borderTop: '1px solid var(--color-taupe)',
            borderLeft: '1px solid var(--color-taupe)',
          }}
        >
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div
              key={d}
              style={{
                padding: '8px 10px',
                fontFamily: 'var(--font-sans)',
                fontSize: 10,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: 'var(--color-mist)',
                borderRight: '1px solid var(--color-taupe)',
                borderBottom: '1px solid var(--color-taupe)',
              }}
            >
              {d}
            </div>
          ))}
          {cells.map((d, i) => {
            if (d === null) {
              return (
                <div
                  key={i}
                  aria-hidden="true"
                  style={{
                    height: 64,
                    borderRight: '1px solid var(--color-taupe)',
                    borderBottom: '1px solid var(--color-taupe)',
                    background: 'var(--color-cream-deep)',
                  }}
                />
              );
            }
            const cellDate = new Date(base.getFullYear(), base.getMonth(), d);
            const past = cellDate < todayStart;
            const isToday = isSameDay(cellDate, today);
            const sel = !!selectedDate && isSameDay(cellDate, selectedDate);

            return (
              <button
                key={i}
                type="button"
                onClick={() => !past && onSelect(cellDate)}
                disabled={past}
                aria-pressed={sel}
                aria-current={isToday ? 'date' : undefined}
                aria-label={cellDate.toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
                style={{
                  position: 'relative',
                  height: 64,
                  padding: '8px 10px',
                  borderTop: 0,
                  borderLeft: 0,
                  borderRight: '1px solid var(--color-taupe)',
                  borderBottom: '1px solid var(--color-taupe)',
                  cursor: past ? 'default' : 'pointer',
                  color: past ? 'var(--color-mist-faint)' : 'var(--color-charcoal)',
                  textAlign: 'left',
                  background: sel
                    ? 'rgba(196,151,62,0.12)'
                    : isToday
                      ? 'rgba(244,247,250,0.6)'
                      : 'transparent',
                  boxShadow: sel
                    ? 'inset 0 0 0 1px var(--color-champagne)'
                    : isToday
                      ? 'inset 0 0 0 1px var(--color-taupe)'
                      : 'none',
                  fontFamily: 'var(--font-serif)',
                  fontWeight: sel ? 500 : 400,
                  fontSize: 16,
                  transition:
                    'background-color var(--dur-state) var(--ease-out), box-shadow var(--dur-state) var(--ease-out), color var(--dur-state) var(--ease-out)',
                }}
              >
                {d}
                {isToday && !sel && (
                  <span
                    aria-hidden="true"
                    style={{
                      position: 'absolute',
                      right: 8,
                      top: 8,
                      fontFamily: 'var(--font-sans)',
                      fontSize: 9,
                      letterSpacing: '0.16em',
                      textTransform: 'uppercase',
                      color: 'var(--color-champagne-deep)',
                    }}
                  >
                    Today
                  </span>
                )}
                {sel && (
                  <span
                    aria-hidden="true"
                    style={{
                      position: 'absolute',
                      right: 8,
                      bottom: 8,
                      width: 5,
                      height: 5,
                      borderRadius: '50%',
                      background: 'var(--color-champagne-deep)',
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function navBtnStyle(enabled: boolean): CSSProperties {
  return {
    width: 32,
    height: 32,
    borderRadius: 4,
    border: '1px solid var(--color-taupe)',
    background: 'transparent',
    color: enabled ? 'var(--color-charcoal)' : 'var(--color-mist-faint)',
    cursor: enabled ? 'pointer' : 'not-allowed',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition:
      'border-color var(--dur-state) var(--ease-out), color var(--dur-state) var(--ease-out)',
  };
}

// ─────────────────────────────────────────────────────────────────────────

export interface TimeSlotsProps {
  slots: TimeSlot[];
  selected: string | null;
  onSelect: (id: string) => void;
}

export function TimeSlots({ slots, selected, onSelect }: TimeSlotsProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 10,
        marginTop: 8,
      }}
      className="time-slots"
    >
      {slots.map((s) => {
        const sel = selected === s.id;
        const disabled = !!s.disabled;
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => !disabled && onSelect(s.id)}
            disabled={disabled}
            aria-pressed={sel}
            style={{
              padding: '12px 10px',
              fontFamily: 'var(--font-sans)',
              fontSize: 13,
              background: sel ? 'var(--color-ink)' : 'transparent',
              color: sel
                ? 'var(--color-cream)'
                : disabled
                  ? 'var(--color-mist-faint)'
                  : 'var(--color-charcoal)',
              border: `1px solid ${sel ? 'var(--color-ink)' : 'var(--color-taupe)'}`,
              borderRadius: 4,
              cursor: disabled ? 'default' : 'pointer',
              transition:
                'background-color var(--dur-state) var(--ease-out), color var(--dur-state) var(--ease-out), border-color var(--dur-state) var(--ease-out)',
              textDecoration: disabled ? 'line-through' : 'none',
            }}
          >
            {s.label}
          </button>
        );
      })}
      <style>{`
        @media (max-width: 640px) {
          .time-slots { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </div>
  );
}
