import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../lib/auth';
import {
  listNotificationsForUser,
  markAllRead,
  subscribeToUserNotifications,
} from '../lib/api/notifications';
import type { NotificationRow } from '../lib/types/db';
import { Icon } from './Icon';

interface Props {
  /** Visual tone — Ops/Admin chrome are dark, Portal chrome is light. */
  tone?: 'light' | 'dark';
}

const KIND_LABEL: Record<string, string> = {
  booking_created: 'New booking',
  booking_status_changed: 'Booking updated',
  booking_cancelled: 'Booking cancelled',
  referral_created: 'New referral',
  unit_invited: 'Unit invitation',
  password_reset: 'Password reset',
};

function describe(notif: NotificationRow): { title: string; body: string } {
  const payload = (notif.payload ?? {}) as {
    reference?: string;
    status?: string;
    service?: { name?: string };
    referred_name?: string;
  };
  const ref = payload.reference ?? '';
  const svc = payload.service?.name ?? 'Booking';
  switch (notif.kind) {
    case 'booking_created':
      return { title: `New booking · ${ref}`, body: svc };
    case 'booking_status_changed':
      return { title: `${ref} · ${payload.status ?? ''}`, body: svc };
    case 'booking_cancelled':
      return { title: `Cancelled · ${ref}`, body: svc };
    case 'referral_created':
      return { title: `New referral · ${ref}`, body: payload.referred_name ?? '' };
    default:
      return { title: KIND_LABEL[notif.kind] ?? notif.kind, body: '' };
  }
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const day = Math.floor(hr / 24);
  return `${day}d`;
}

export function NotificationBell({ tone = 'dark' }: Props) {
  const { profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationRow[]>([]);
  const anchorRef = useRef<HTMLDivElement>(null);

  const fg = tone === 'dark' ? '#F4F7FA' : 'var(--color-charcoal)';
  const fgMuted = tone === 'dark' ? 'rgba(244,247,250,0.7)' : 'var(--color-mist)';

  const load = useCallback(async () => {
    if (!profile?.id) return;
    try {
      const rows = await listNotificationsForUser(profile.id);
      setItems(rows);
    } catch (err) {
      console.error('[notifications]', err);
    }
  }, [profile?.id]);

  useEffect(() => {
    if (!profile?.id) return;
    load();
    const unsub = subscribeToUserNotifications(profile.id, load);
    return unsub;
  }, [profile?.id, load]);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (!anchorRef.current?.contains(e.target as Node)) setOpen(false);
    }
    setTimeout(() => document.addEventListener('mousedown', onClick), 0);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  async function toggle() {
    setOpen((v) => !v);
    if (!open && profile?.id && items.some((n) => !n.read_at)) {
      try {
        await markAllRead(profile.id);
        await load();
      } catch {
        /* non-fatal */
      }
    }
  }

  const unread = items.filter((n) => !n.read_at).length;

  return (
    <div ref={anchorRef} style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        type="button"
        onClick={toggle}
        aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ''}`}
        style={{
          background: 'transparent',
          border: 0,
          color: fg,
          width: 32,
          height: 32,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          borderRadius: 4,
          position: 'relative',
        }}
      >
        <Icon name="bell" size={16} color={fg} />
        {unread > 0 && (
          <span
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: 5,
              right: 5,
              minWidth: 14,
              height: 14,
              padding: '0 4px',
              borderRadius: 7,
              background: 'var(--color-champagne-deep)',
              color: '#FFFFFF',
              fontFamily: 'var(--font-sans)',
              fontSize: 9,
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: 1,
            }}
          >
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Notifications"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: 340,
            maxHeight: 420,
            overflowY: 'auto',
            background: 'var(--bg-surface)',
            border: '1px solid var(--color-taupe)',
            borderRadius: 6,
            boxShadow: 'var(--shadow-2)',
            zIndex: 60,
          }}
        >
          <div
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid var(--color-taupe-soft)',
              fontFamily: 'var(--font-sans)',
              fontSize: 11,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'var(--color-mist)',
            }}
          >
            Notifications
          </div>
          {items.length === 0 ? (
            <div
              style={{
                padding: '20px 16px',
                fontFamily: 'var(--font-sans)',
                fontSize: 13,
                color: 'var(--color-mist)',
              }}
            >
              You're all caught up.
            </div>
          ) : (
            items.map((n) => {
              const { title, body } = describe(n);
              return (
                <div
                  key={n.id}
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--color-taupe-soft)',
                    background: n.read_at ? 'transparent' : 'rgba(196,151,62,0.06)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'baseline',
                      gap: 8,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'var(--font-serif)',
                        fontSize: 14,
                        color: 'var(--color-charcoal)',
                      }}
                    >
                      {title}
                    </span>
                    <span
                      style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: 10,
                        color: fgMuted,
                        letterSpacing: '0.04em',
                      }}
                    >
                      {timeAgo(n.created_at)}
                    </span>
                  </div>
                  {body && (
                    <div
                      style={{
                        marginTop: 4,
                        fontFamily: 'var(--font-sans)',
                        fontSize: 12,
                        color: 'var(--color-mist)',
                      }}
                    >
                      {body}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
