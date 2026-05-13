import type { ReactNode } from 'react';
import { Eyebrow } from './Eyebrow';
import { Hairline } from './Hairline';

export interface MetricProps {
  value: ReactNode;
  sup?: ReactNode;
  label: ReactNode;
}

export function Metric({ value, sup, label }: MetricProps) {
  return (
    <div>
      <div
        style={{
          fontFamily: 'var(--font-serif)',
          fontWeight: 300,
          fontSize: 56,
          letterSpacing: '-0.02em',
          lineHeight: 1,
          color: 'var(--color-charcoal)',
        }}
      >
        {value}
        {sup && (
          <span style={{ fontSize: 22, color: 'var(--color-champagne-deep)', marginLeft: 4 }}>
            {sup}
          </span>
        )}
      </div>
      <Hairline width={28} margin="10px 0" />
      <Eyebrow>{label}</Eyebrow>
    </div>
  );
}
