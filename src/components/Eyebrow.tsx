import type { ReactNode } from 'react';

export interface EyebrowProps {
  children: ReactNode;
  color?: string;
}

export function Eyebrow({ children, color = 'var(--color-mist)' }: EyebrowProps) {
  return (
    <div
      style={{
        fontFamily: 'var(--font-sans)',
        fontSize: 11,
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
        color,
      }}
    >
      {children}
    </div>
  );
}
