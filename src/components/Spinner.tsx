/**
 * Brand spinner — a champagne dot travelling along a hairline rule.
 * No spinning wheel. No skeleton waves.
 */

export interface SpinnerProps {
  size?: number;
  tone?: 'default' | 'inverse';
}

export function Spinner({ size = 16, tone = 'default' }: SpinnerProps) {
  const hairlineColor = tone === 'inverse' ? 'rgba(248,245,239,0.35)' : 'var(--color-taupe)';
  const dotColor = tone === 'inverse' ? 'var(--color-champagne-soft)' : 'var(--color-champagne)';

  return (
    <span
      role="status"
      aria-label="Loading"
      style={{
        position: 'relative',
        display: 'inline-block',
        width: size * 3,
        height: size,
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: '50%',
          left: 0,
          right: 0,
          height: 1,
          background: hairlineColor,
        }}
      />
      <span
        style={{
          position: 'absolute',
          top: '50%',
          left: 0,
          width: Math.max(4, size / 3),
          height: Math.max(4, size / 3),
          marginTop: -Math.max(4, size / 3) / 2,
          background: dotColor,
          borderRadius: '50%',
          animation: 'mai-spinner-travel 1.2s cubic-bezier(0.4, 0, 0.2, 1) infinite',
        }}
      />
      <style>{`
        @keyframes mai-spinner-travel {
          0%   { transform: translateX(0); opacity: 0; }
          15%  { opacity: 1; }
          85%  { opacity: 1; }
          100% { transform: translateX(${size * 3 - Math.max(4, size / 3)}px); opacity: 0; }
        }
      `}</style>
    </span>
  );
}
