import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { Icon } from './Icon';

export interface MobileNavProps {
  open: boolean;
  onClose: () => void;
  side?: 'left' | 'right';
  width?: number | string;
  children: ReactNode;
  title?: string;
}

/**
 * Slide-in drawer for mobile navigation. Closes on backdrop click or Esc.
 */
export function MobileNav({
  open,
  onClose,
  side = 'left',
  width = 280,
  children,
  title,
}: MobileNavProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  return (
    <>
      <div
        aria-hidden={!open}
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15,30,61,0.4)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity var(--dur-layout) var(--ease-soft)',
          zIndex: 40,
        }}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={title ?? 'Navigation'}
        style={{
          position: 'fixed',
          top: 0,
          bottom: 0,
          [side]: 0,
          width,
          maxWidth: '88vw',
          background: 'var(--bg-page)',
          borderRight: side === 'left' ? '1px solid var(--color-taupe)' : undefined,
          borderLeft: side === 'right' ? '1px solid var(--color-taupe)' : undefined,
          boxShadow: 'var(--shadow-3)',
          transform: open
            ? 'translate3d(0, 0, 0)'
            : `translate3d(${side === 'left' ? '-100%' : '100%'}, 0, 0)`,
          transition: 'transform var(--dur-layout) var(--ease-soft)',
          zIndex: 41,
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px',
            borderBottom: '1px solid var(--color-taupe)',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 11,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'var(--color-mist)',
            }}
          >
            {title}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            style={{
              background: 'transparent',
              border: 0,
              cursor: 'pointer',
              color: 'var(--color-mist)',
              padding: 4,
              display: 'flex',
            }}
          >
            <Icon name="x" size={20} />
          </button>
        </div>
        <div style={{ padding: 24, flex: 1 }}>{children}</div>
      </aside>
    </>
  );
}
