import { useId, useState } from 'react';
import type { ChangeEvent, InputHTMLAttributes, ReactNode } from 'react';
import { Icon } from './Icon';

export type FieldStatus = 'default' | 'error' | 'success';

export interface FieldProps {
  label: ReactNode;
  value: string;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: InputHTMLAttributes<HTMLInputElement>['type'];
  status?: FieldStatus;
  hint?: string;
  autoComplete?: string;
  required?: boolean;
}

const HAIRLINE_COLOR: Record<FieldStatus, string> = {
  default: 'var(--color-taupe)',
  error: 'var(--color-status-danger)',
  success: 'var(--color-status-success)',
};

const HINT_COLOR: Record<FieldStatus, string> = {
  default: 'var(--color-mist-soft)',
  error: 'var(--color-status-danger)',
  success: 'var(--color-status-success)',
};

export function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  status = 'default',
  hint,
  autoComplete,
  required,
}: FieldProps) {
  const [focused, setFocused] = useState(false);
  const borderColor = focused ? 'var(--color-ink)' : HAIRLINE_COLOR[status];
  const inputId = useId();
  const hintId = hint ? `${inputId}-hint` : undefined;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label
        htmlFor={inputId}
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 11,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: 'var(--color-mist)',
        }}
      >
        {label}
      </label>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <input
          id={inputId}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          aria-invalid={status === 'error' || undefined}
          aria-describedby={hintId}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            flex: 1,
            fontFamily: 'var(--font-sans)',
            fontSize: 16,
            color: 'var(--color-charcoal)',
            background: 'transparent',
            border: 0,
            borderBottom: `1px solid ${borderColor}`,
            padding: '10px 0',
            paddingRight: status !== 'default' ? 28 : 0,
            outline: 'none',
            borderRadius: 0,
            transition: 'border-color var(--dur-state) var(--ease-out)',
          }}
        />
        {status === 'error' && (
          <span
            aria-hidden="true"
            style={{
              position: 'absolute',
              right: 0,
              color: HAIRLINE_COLOR.error,
              display: 'flex',
            }}
          >
            <Icon name="alert-circle" size={16} />
          </span>
        )}
        {status === 'success' && (
          <span
            aria-hidden="true"
            style={{
              position: 'absolute',
              right: 0,
              color: HAIRLINE_COLOR.success,
              display: 'flex',
            }}
          >
            <Icon name="check" size={16} />
          </span>
        )}
      </div>
      {hint && (
        <span
          id={hintId}
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 12,
            color: HINT_COLOR[status],
            lineHeight: 1.5,
          }}
        >
          {hint}
        </span>
      )}
    </div>
  );
}
