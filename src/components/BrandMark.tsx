import type { CSSProperties } from 'react';

export interface BrandMarkProps {
  /** Rendered height in px. Width scales from the logo's natural aspect (~2:1). */
  size?: number;
  /** Reserved for future dark-variant swap. Currently the gold logo reads on both
   *  cream and ink surfaces without modification. */
  dark?: boolean;
  style?: CSSProperties;
}

export function BrandMark({ size = 40, dark: _dark = false, style }: BrandMarkProps) {
  return (
    <img
      src="/logo.webp"
      alt="AP Enterprises"
      height={size}
      style={{
        height: size,
        width: 'auto',
        display: 'block',
        ...style,
      }}
    />
  );
}
