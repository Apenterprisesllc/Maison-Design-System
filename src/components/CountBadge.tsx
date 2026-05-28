import type { CSSProperties } from 'react';

export interface CountBadgeProps {
  count: number;
  /** Hidden when count is 0. */
  ariaLabel?: string;
  style?: CSSProperties;
}

export function CountBadge({ count, ariaLabel, style }: CountBadgeProps) {
  if (count <= 0) return null;
  const display = count > 99 ? '99+' : String(count);
  return (
    <span
      aria-label={ariaLabel ?? `${count} new`}
      style={{
        minWidth: 18,
        height: 18,
        padding: '0 6px',
        borderRadius: 9,
        background: 'var(--color-champagne-deep)',
        color: '#FFFFFF',
        fontFamily: 'var(--font-sans)',
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: '0.02em',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        lineHeight: 1,
        verticalAlign: 'middle',
        ...style,
      }}
    >
      {display}
    </span>
  );
}
