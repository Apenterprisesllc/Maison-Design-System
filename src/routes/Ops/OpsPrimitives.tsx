import { useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';

/**
 * Operations-local primitives. Same brand language as @ap-enterprises/react,
 * tightened ~30% in padding and type sizes for back-office density.
 */

export type OpsPillTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';
export type OpsButtonVariant = 'primary' | 'secondary' | 'ghost';

const TONES: Record<OpsPillTone, { bg: string; fg: string }> = {
  success: { bg: '#E8EEE7', fg: '#3F6B4A' },
  warning: { bg: '#F3EBD7', fg: '#8A6A1F' },
  danger:  { bg: '#F1E2DF', fg: '#7A2E2E' },
  info:    { bg: '#E2E8EE', fg: '#2E4A6B' },
  neutral: { bg: '#ECE6D9', fg: '#4A4A4A' },
};

export function OpsMark({ size = 32 }: { size?: number }) {
  // Renders the AP Enterprises logo at the given height; width scales naturally.
  return (
    <img
      src="/logo.webp"
      alt="AP Enterprises"
      height={size}
      style={{ height: size, width: 'auto', display: 'block' }}
    />
  );
}

export function OpsEyebrow({ children, color = '#8A8378' }: { children: ReactNode; color?: string }) {
  return (
    <div
      style={{
        fontFamily: 'Inter, sans-serif',
        fontSize: 10,
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
        color,
        fontWeight: 500,
      }}
    >
      {children}
    </div>
  );
}

export function OpsHairline({
  width = 32,
  color = '#C4973E',
  margin = '10px 0',
}: {
  width?: number | string;
  color?: string;
  margin?: string;
}) {
  return <div style={{ width, height: 1, background: color, margin }} />;
}

export interface OpsPillProps {
  tone?: OpsPillTone;
  dot?: boolean;
  children: ReactNode;
}

export function OpsPill({ tone = 'neutral', dot = true, children }: OpsPillProps) {
  const c = TONES[tone];
  return (
    <span
      style={{
        fontFamily: 'Inter, sans-serif',
        fontSize: 10,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        padding: '3px 9px',
        borderRadius: 9999,
        background: c.bg,
        color: c.fg,
        fontWeight: 500,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        lineHeight: 1,
      }}
    >
      {dot && (
        <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'currentColor' }} />
      )}
      {children}
    </span>
  );
}

export interface OpsButtonProps {
  variant?: OpsButtonVariant;
  children: ReactNode;
  onClick?: (event?: React.MouseEvent) => void;
  icon?: string;
  style?: CSSProperties;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

export function OpsButton({
  variant = 'primary',
  children,
  onClick,
  icon,
  style = {},
  disabled = false,
  type = 'button',
}: OpsButtonProps) {
  const [hover, setHover] = useState(false);
  const base: CSSProperties = {
    fontFamily: 'Inter, sans-serif',
    fontSize: 12.5,
    fontWeight: 500,
    letterSpacing: '0.01em',
    padding: '9px 16px',
    borderRadius: 4,
    border: '1px solid transparent',
    cursor: 'pointer',
    transition: 'background-color 200ms ease, border-color 200ms ease',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 7,
    lineHeight: 1,
    ...style,
  };
  const variants: Record<OpsButtonVariant, CSSProperties> = {
    primary: {
      ...base,
      background: hover ? '#1A1A1A' : '#0A0A0A',
      color: '#F4F7FA',
      borderColor: hover ? '#1A1A1A' : '#0A0A0A',
    },
    secondary: {
      ...base,
      background: hover ? 'rgba(196,151,62,0.10)' : 'transparent',
      color: '#1A1A1A',
      borderColor: '#C4973E',
    },
    ghost: {
      ...base,
      background: hover ? 'rgba(10,10,10,0.04)' : 'transparent',
      color: '#1A1A1A',
      borderColor: '#D9D2C5',
    },
  };
  return (
    <button
      type={type}
      disabled={disabled}
      style={{
        ...variants[variant],
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.55 : 1,
      }}
      onMouseEnter={() => !disabled && setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={(e) => {
        if (disabled) return;
        onClick?.(e);
      }}
    >
      {icon && <OpsIcon name={icon} size={14} />}
      {children}
    </button>
  );
}

export function OpsIcon({
  name,
  size = 16,
  color = 'currentColor',
}: {
  name: string;
  size?: number;
  color?: string;
}) {
  const html = `<i data-lucide="${name}" width="${size}" height="${size}" style="stroke-width:1.5;width:${size}px;height:${size}px;color:currentColor;display:inline-block;"></i>`;
  return (
    <span
      aria-hidden="true"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        color,
        flexShrink: 0,
        lineHeight: 0,
      }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export interface OpsCardProps {
  children: ReactNode;
  padding?: number | string;
  style?: CSSProperties;
}

export function OpsCard({ children, padding = 20, style = {} }: OpsCardProps) {
  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid #D9D2C5',
        borderRadius: 8,
        boxShadow: '0 1px 3px rgba(10,10,10,0.04)',
        padding,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export interface KpiProps {
  label: ReactNode;
  value: ReactNode;
  sup?: ReactNode;
  delta?: ReactNode;
  deltaTone?: OpsPillTone;
}

export function Kpi({ label, value, sup, delta, deltaTone = 'success' }: KpiProps) {
  return (
    <OpsCard padding="20px 22px">
      <OpsEyebrow>{label}</OpsEyebrow>
      <OpsHairline width={24} margin="10px 0 12px" />
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <div
          style={{
            fontFamily: 'Fraunces, serif',
            fontWeight: 300,
            fontSize: 42,
            letterSpacing: '-0.02em',
            lineHeight: 1,
            color: '#1A1A1A',
          }}
        >
          {value}
          {sup && (
            <span style={{ fontSize: 18, color: '#A67C2E', marginLeft: 3 }}>{sup}</span>
          )}
        </div>
        {delta && (
          <OpsPill tone={deltaTone} dot={false}>
            {delta}
          </OpsPill>
        )}
      </div>
    </OpsCard>
  );
}
