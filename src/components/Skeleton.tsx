import type { CSSProperties } from 'react';

export interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  radius?: number | string;
  style?: CSSProperties;
}

export function Skeleton({ width = '100%', height = 16, radius = 2, style }: SkeletonProps) {
  return (
    <span
      aria-hidden="true"
      style={{
        display: 'block',
        width,
        height,
        borderRadius: radius,
        background:
          'linear-gradient(90deg, var(--color-taupe-soft) 0%, var(--color-taupe) 50%, var(--color-taupe-soft) 100%)',
        backgroundSize: '200% 100%',
        animation: 'mai-shimmer 1.8s ease-in-out infinite',
        ...style,
      }}
    />
  );
}
