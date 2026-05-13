import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';
import { useLucide } from '../hooks/useLucide';
import { Eyebrow } from './Eyebrow';
import { Hairline } from './Hairline';
import { Icon } from './Icon';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  eyebrow?: ReactNode;
  title: ReactNode;
  children: ReactNode;
  /** Action buttons row at the bottom. */
  footer?: ReactNode;
  width?: number;
  /** Accessible label, used when no `title` text is appropriate. */
  ariaLabel?: string;
}

export function Modal({
  open,
  onClose,
  eyebrow,
  title,
  children,
  footer,
  width = 480,
  ariaLabel,
}: ModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);
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
      // Focus trap
      if (e.key === 'Tab' && cardRef.current) {
        const focusables = cardRef.current.querySelectorAll<HTMLElement>(
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

    // Focus the modal after mount
    requestAnimationFrame(() => {
      const focusable = cardRef.current?.querySelector<HTMLElement>(
        'input, textarea, button, [href]',
      );
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
        zIndex: 60,
        pointerEvents: open ? 'auto' : 'none',
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(15, 30, 61, 0.55)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          opacity: open ? 1 : 0,
          transition: 'opacity var(--dur-layout) var(--ease-soft)',
        }}
      />

      {/* Card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : ariaLabel}
        ref={cardRef}
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: 'min(' + width + 'px, calc(100vw - 32px))',
          maxHeight: 'calc(100vh - 64px)',
          overflowY: 'auto',
          background: 'var(--bg-surface)',
          border: '1px solid var(--color-taupe)',
          borderRadius: 'var(--radius-4)',
          boxShadow: 'var(--shadow-3)',
          padding: 'clamp(28px, 4vw, 40px)',
          transform: open
            ? 'translate3d(-50%, -50%, 0) scale(1)'
            : 'translate3d(-50%, -50%, 0) scale(0.96)',
          opacity: open ? 1 : 0,
          transition:
            'opacity var(--dur-layout) var(--ease-soft), transform var(--dur-layout) var(--ease-soft)',
          willChange: 'transform, opacity',
        }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            background: 'transparent',
            border: 0,
            cursor: 'pointer',
            padding: 6,
            color: 'var(--color-mist)',
            display: 'flex',
          }}
        >
          <Icon name="x" size={18} />
        </button>

        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <h2
          style={{
            fontFamily: 'var(--font-serif)',
            fontWeight: 400,
            fontSize: 26,
            letterSpacing: '-0.01em',
            lineHeight: 1.18,
            color: 'var(--color-charcoal)',
            margin: eyebrow ? '10px 0 0' : 0,
          }}
        >
          {title}
        </h2>
        <Hairline width={40} margin="18px 0 22px" />

        <div>{children}</div>

        {footer && (
          <div
            style={{
              marginTop: 28,
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
