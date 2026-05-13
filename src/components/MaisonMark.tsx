import type { CSSProperties } from 'react';

export interface MaisonMarkProps {
  size?: number;
  dark?: boolean;
  style?: CSSProperties;
}

export function MaisonMark({ size = 28, dark = false, style }: MaisonMarkProps) {
  return (
    <svg viewBox="0 0 80 80" width={size} height={size} aria-hidden="true" style={style}>
      <text
        x="40"
        y="58"
        textAnchor="middle"
        fontFamily="Fraunces, 'Cormorant Garamond', Georgia, serif"
        fontWeight="300"
        fontSize="60"
        fill={dark ? '#F8F5EF' : '#0F1E3D'}
      >
        M
      </text>
      <line x1="22" y1="66" x2="58" y2="66" stroke="#C9A961" strokeWidth="1" />
    </svg>
  );
}
