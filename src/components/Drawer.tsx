import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';
import { useLucide } from '../hooks/useLucide';
import { Eyebrow } from './Eyebrow';
import { Hairline } from './Hairline';
import { Icon } from './Icon';

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  eyebrow?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  /** Width in px. */
  width?: number;
  side?: 'left' | 'right';
  children: ReactNode;
  footer?: ReactNode;
  ariaLabel?: string;
  /** Hide the default header — caller renders its own. */
  customHeader?: boolean;
}

/**
 * Premium side drawer. Slides in from the right (or left), backdrop blur,
 * Esc to dismiss, focus-trap, restores focus on close.
 */
export function Drawer({
  open,
  onClose,
  eyebrow,
  title,
  subtitle,
  width = 520,
  side = 'right',
  children,
  footer,
  ariaLabel,
  customHeader,
}: DrawerProps) {
  const ref = useRef<HTMLElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  // Run Lucide each render so portaled icons are processed.
  useLucide();

  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    document.body.style.overflow = 'hidden';

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
      if (e.key === 'Tab' && ref.current) {
        const focusables = ref.current.querySelectorAll<HTMLElement>(
          'button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])',
        );
        if (!focusables.length) return;
        const first = focusables[0]!;
        const last = focusables[focusables.length - 1]!;
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', onKey);

    requestAnimationFrame(() => {
      const focusable = ref.current?.querySelector<HTMLElement>('button, [href], input');
      focusable?.focus();
    });

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
      previouslyFocused.current?.focus();
    };
  }, [open, onClose]);

  return createPortal(
    <div
      aria-hidden={!open}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        pointerEvents: open ? 'auto' : 'none',
      }}
    >
      <div
        onClick={onClose}
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(15, 30, 61, 0.45)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          opacity: open ? 1 : 0,
          transition: 'opacity var(--dur-layout) var(--ease-soft)',
        }}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : ariaLabel}
        ref={ref}
        style={{
          position: 'absolute',
          top: 64, // Below OpsChrome topbar
          bottom: 0,
          [side]: 0,
          width: 'min(' + width + 'px, calc(100vw - 32px))',
          background: 'var(--bg-page)',
          borderLeft: side === 'right' ? '1px solid var(--color-taupe)' : undefined,
          borderRight: side === 'left' ? '1px solid var(--color-taupe)' : undefined,
          boxShadow: 'var(--shadow-3)',
          transform: open
            ? 'translate3d(0, 0, 0)'
            : `translate3d(${side === 'right' ? '100%' : '-100%'}, 0, 0)`,
          transition: 'transform var(--dur-layout) var(--ease-soft)',
          display: 'flex',
          flexDirection: 'column',
          willChange: 'transform',
        }}
      >
        {!customHeader && (
          <div
            style={{
              padding: '20px 28px',
              borderBottom: '1px solid var(--color-taupe)',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 16,
            }}
          >
            <div style={{ minWidth: 0 }}>
              {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
              <h2
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontWeight: 400,
                  fontSize: 24,
                  letterSpacing: '-0.01em',
                  margin: eyebrow ? '6px 0 0' : 0,
                  color: 'var(--color-charcoal)',
                  lineHeight: 1.2,
                }}
              >
                {title}
              </h2>
              {subtitle && (
                <p
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: 13,
                    color: 'var(--color-mist)',
                    margin: '6px 0 0',
                    lineHeight: 1.5,
                  }}
                >
                  {subtitle}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              style={{
                background: 'transparent',
                border: 0,
                cursor: 'pointer',
                color: 'var(--color-mist)',
                padding: 6,
                marginTop: -4,
                marginRight: -8,
                display: 'flex',
                flexShrink: 0,
              }}
            >
              <Icon name="x" size={18} />
            </button>
          </div>
        )}

        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
          {!customHeader && <Hairline width={32} margin="0 0 18px" />}
          {children}
        </div>

        {footer && (
          <div
            style={{
              padding: '18px 28px',
              borderTop: '1px solid var(--color-taupe)',
              background: 'var(--bg-surface)',
              display: 'flex',
              gap: 10,
              justifyContent: 'flex-end',
              flexWrap: 'wrap',
            }}
          >
            {footer}
          </div>
        )}
      </aside>
    </div>,
    document.body,
  );
}
