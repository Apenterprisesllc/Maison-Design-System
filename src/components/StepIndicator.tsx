import type { ReactNode } from 'react';
import { Icon } from './Icon';

export interface StepIndicatorProps {
  steps: { id: string; label: ReactNode }[];
  current: number; // 1-based
}

/**
 * Editorial 3-step indicator. Active step gets a champagne serif number;
 * completed steps get a check; pending dim.
 */
export function StepIndicator({ steps, current }: StepIndicatorProps) {
  return (
    <ol
      style={{
        listStyle: 'none',
        margin: 0,
        padding: 0,
        display: 'flex',
        alignItems: 'center',
        gap: 0,
        flexWrap: 'wrap',
      }}
    >
      {steps.map((step, i) => {
        const idx = i + 1;
        const active = idx === current;
        const done = idx < current;
        return (
          <li
            key={step.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              opacity: done || active ? 1 : 0.42,
              transition: 'opacity var(--dur-state) var(--ease-out)',
            }}
          >
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontWeight: 300,
                  fontSize: 22,
                  letterSpacing: '-0.01em',
                  color: active
                    ? 'var(--color-champagne-deep)'
                    : done
                      ? 'var(--color-charcoal)'
                      : 'var(--color-mist)',
                  lineHeight: 1,
                  width: 22,
                  display: 'inline-flex',
                  justifyContent: 'center',
                }}
              >
                {done ? <Icon name="check" size={16} color="var(--color-champagne-deep)" /> : idx.toString().padStart(2, '0')}
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: 11,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: active
                    ? 'var(--color-charcoal)'
                    : 'var(--color-mist)',
                  fontWeight: active ? 500 : 400,
                  whiteSpace: 'nowrap',
                }}
              >
                {step.label}
              </span>
            </span>
            {i < steps.length - 1 && (
              <span
                aria-hidden="true"
                style={{
                  width: 56,
                  height: 1,
                  background:
                    done || (active && idx > 1)
                      ? 'var(--color-champagne)'
                      : 'var(--color-taupe)',
                  margin: '0 18px',
                  transition: 'background-color var(--dur-state) var(--ease-out)',
                }}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
