import { useEffect, useRef } from 'react';
import { Eyebrow } from './Eyebrow';
import { Hairline } from './Hairline';
import { Icon } from './Icon';

export interface HelpPopoverProps {
  open: boolean;
  onClose: () => void;
  /** Anchor element to align below. */
  anchorRef: React.RefObject<HTMLElement | null>;
}

/**
 * Concierge contact popover. Anchors below the "Need Help" button.
 * Click outside or Esc to close. Fades + slides down on mount.
 */
export function HelpPopover({ open, onClose, anchorRef }: HelpPopoverProps) {
  const popRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const onClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (popRef.current?.contains(target)) return;
      if (anchorRef.current?.contains(target)) return;
      onClose();
    };

    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, [open, onClose, anchorRef]);

  return (
    <div
      ref={popRef}
      role="dialog"
      aria-label="Concierge contact"
      aria-hidden={!open}
      style={{
        position: 'absolute',
        top: 'calc(100% + 12px)',
        left: 0,
        width: 320,
        background: 'var(--bg-surface)',
        border: '1px solid var(--color-taupe)',
        borderRadius: 'var(--radius-3)',
        boxShadow: 'var(--shadow-2)',
        padding: '20px 22px',
        opacity: open ? 1 : 0,
        transform: open ? 'translate3d(0, 0, 0)' : 'translate3d(0, -6px, 0)',
        pointerEvents: open ? 'auto' : 'none',
        transition:
          'opacity var(--dur-state) var(--ease-out), transform var(--dur-state) var(--ease-out)',
        zIndex: 30,
      }}
    >
      <Eyebrow>Reach the Concierge</Eyebrow>
      <Hairline width={28} margin="12px 0 14px" />
      <ContactRow icon="phone" label="Call" value="+1 (212) 555 0100" href="tel:+12125550100" />
      <Hairline color="var(--color-taupe-soft)" width="100%" margin="12px 0" />
      <ContactRow
        icon="mail"
        label="Email"
        value="concierge@apenterprises.example"
        href="mailto:concierge@apenterprises.example"
      />
      <Hairline color="var(--color-taupe-soft)" width="100%" margin="12px 0" />
      <ContactRow icon="clock" label="Hours" value="24 hours · Every day" />
    </div>
  );
}

function ContactRow({
  icon,
  label,
  value,
  href,
}: {
  icon: string;
  label: string;
  value: string;
  href?: string;
}) {
  const inner = (
    <>
      <span
        style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          border: '1px solid var(--color-taupe)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-mist)',
          flexShrink: 0,
        }}
      >
        <Icon name={icon} size={14} />
      </span>
      <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 10,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--color-mist)',
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 15,
            color: 'var(--color-charcoal)',
          }}
        >
          {value}
        </span>
      </span>
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          textDecoration: 'none',
          border: 0,
          padding: '2px 0',
        }}
      >
        {inner}
      </a>
    );
  }
  return <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '2px 0' }}>{inner}</div>;
}
