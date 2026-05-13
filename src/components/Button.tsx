import { useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { Icon } from './Icon';
import { Spinner } from './Spinner';

export type ButtonVariant = 'primary' | 'secondary' | 'quiet' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  icon?: string;
  iconAfter?: string;
  style?: CSSProperties;
  disabled?: boolean;
  loading?: boolean;
  'aria-label'?: string;
}

const PADDING: Record<ButtonSize, string> = {
  sm: '8px 16px',
  md: '12px 24px',
  lg: '16px 32px',
};

const FONT_SIZE: Record<ButtonSize, number> = {
  sm: 12,
  md: 13,
  lg: 14,
};

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  onClick,
  type = 'button',
  icon,
  iconAfter,
  style = {},
  disabled,
  loading,
  ...aria
}: ButtonProps) {
  const [hover, setHover] = useState(false);
  const interactive = !disabled && !loading;

  const base: CSSProperties = {
    fontFamily: 'var(--font-sans)',
    fontSize: FONT_SIZE[size],
    fontWeight: 500,
    letterSpacing: '0.01em',
    padding: PADDING[size],
    borderRadius: 4,
    border: '1px solid transparent',
    cursor: interactive ? 'pointer' : 'not-allowed',
    transition:
      'background-color var(--dur-state) var(--ease-out), border-color var(--dur-state) var(--ease-out), color var(--dur-state) var(--ease-out), transform var(--dur-snap) var(--ease-out)',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    lineHeight: 1,
    opacity: disabled ? 0.4 : 1,
    pointerEvents: interactive ? 'auto' : 'none',
    willChange: 'transform',
    ...style,
  };

  const variants: Record<ButtonVariant, CSSProperties> = {
    primary: {
      ...base,
      background: hover ? '#0A1530' : 'var(--color-ink)',
      color: 'var(--color-cream)',
      borderColor: hover ? '#0A1530' : 'var(--color-ink)',
    },
    secondary: {
      ...base,
      background: hover ? 'rgba(201,169,97,0.10)' : 'transparent',
      color: 'var(--color-charcoal)',
      borderColor: 'var(--color-champagne)',
    },
    quiet: {
      ...base,
      background: 'transparent',
      color: 'var(--color-charcoal)',
      border: 0,
      padding: size === 'lg' ? '16px 0' : size === 'sm' ? '8px 0' : '12px 0',
      position: 'relative',
    },
    destructive: {
      ...base,
      background: hover ? '#5E2222' : 'var(--color-status-danger)',
      color: 'var(--color-cream)',
      borderColor: 'var(--color-status-danger)',
    },
  };

  return (
    <button
      type={type}
      style={variants[variant]}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onClick}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      aria-label={aria['aria-label']}
      onMouseDown={(e) => (e.currentTarget.style.transform = 'translateY(1px)')}
      onMouseUp={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
    >
      {loading ? (
        <Spinner size={size === 'lg' ? 20 : 16} tone={variant === 'primary' || variant === 'destructive' ? 'inverse' : 'default'} />
      ) : (
        icon && <Icon name={icon} size={size === 'lg' ? 18 : 16} />
      )}
      {children}
      {iconAfter && !loading && <Icon name={iconAfter} size={size === 'lg' ? 18 : 16} />}
      {variant === 'quiet' && (
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: 0,
            bottom: size === 'lg' ? 10 : 8,
            height: 1,
            background: 'var(--color-champagne)',
            width: hover ? '100%' : 0,
            transition: 'width var(--dur-state) var(--ease-out)',
          }}
        />
      )}
    </button>
  );
}
