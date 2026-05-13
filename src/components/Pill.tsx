import { useState } from 'react';
import type { ReactNode } from 'react';

export type PillTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

export interface PillProps {
  tone?: PillTone;
  children: ReactNode;
  interactive?: boolean;
  onClick?: () => void;
}

const TONES: Record<PillTone, { bg: string; fg: string }> = {
  success: { bg: '#E8EEE7', fg: '#3F6B4A' },
  warning: { bg: '#F3EBD7', fg: '#8A6A1F' },
  danger:  { bg: '#F1E2DF', fg: '#7A2E2E' },
  info:    { bg: '#E2E8EE', fg: '#2E4A6B' },
  neutral: { bg: '#ECE6D9', fg: '#4A4A4A' },
};

export function Pill({ tone = 'neutral', children, interactive, onClick }: PillProps) {
  const [hover, setHover] = useState(false);
  const c = TONES[tone];

  const node = (
    <span
      style={{
        fontFamily: 'var(--font-sans)',
        fontSize: 10.5,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        padding: '5px 11px',
        borderRadius: 9999,
        background: c.bg,
        color: c.fg,
        fontWeight: 500,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        lineHeight: 1,
        cursor: interactive ? 'pointer' : 'default',
        transition: 'transform var(--dur-snap) var(--ease-out), filter var(--dur-state) var(--ease-out)',
        transform: interactive && hover ? 'translateY(-1px)' : 'translateY(0)',
        filter: interactive && hover ? 'brightness(0.98)' : 'none',
      }}
      onMouseEnter={() => interactive && setHover(true)}
      onMouseLeave={() => interactive && setHover(false)}
    >
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor' }} />
      {children}
    </span>
  );

  if (interactive && onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer' }}
      >
        {node}
      </button>
    );
  }
  return node;
}
