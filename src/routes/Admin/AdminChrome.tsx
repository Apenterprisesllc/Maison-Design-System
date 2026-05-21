import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { NotificationBell, useLucide } from '../../components';
import { useAuth } from '../../lib/auth';
import { OpsIcon, OpsMark } from '../Ops/OpsPrimitives';

export interface AdminChromeProps {
  onSignOut: () => Promise<void> | void;
  children: ReactNode;
}

const NAV: { to: string; label: string }[] = [
  { to: '/admin', label: 'Overview' },
  { to: '/admin/managers', label: 'Managers' },
];

export function AdminChrome({ onSignOut, children }: AdminChromeProps) {
  const { profile } = useAuth();
  const location = useLocation();
  useLucide();

  const initials = (profile?.full_name ?? profile?.email ?? 'A')
    .split(/[\s@.]+/)
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-page)' }}>
      <header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: 64,
          background: '#0A0A0A',
          color: '#F4F7FA',
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
          zIndex: 20,
          borderBottom: '1px solid rgba(196,151,62,0.18)',
          gap: 16,
        }}
      >
        <Link
          to="/admin"
          aria-label="Admin home"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            textDecoration: 'none',
            color: 'inherit',
          }}
        >
          <OpsMark size={36} />
          <span
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: 10,
              letterSpacing: '0.16em',
              color: 'rgba(244,247,250,0.55)',
              border: '1px solid rgba(196,151,62,0.4)',
              padding: '3px 7px',
              borderRadius: 2,
              textTransform: 'uppercase',
              fontWeight: 500,
            }}
          >
            Platform
          </span>
        </Link>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: 'rgba(244,247,250,0.06)',
            border: '1px solid rgba(196,151,62,0.25)',
            padding: '7px 12px',
            borderRadius: 4,
            marginLeft: 16,
          }}
        >
          <OpsIcon name="shield-check" size={14} color="rgba(244,247,250,0.6)" />
          <span style={{ fontFamily: 'Fraunces, serif', fontSize: 14 }}>Super Admin</span>
        </div>

        <nav style={{ display: 'flex', gap: 4, marginLeft: 20 }}>
          {NAV.map((item) => {
            const active =
              item.to === '/admin'
                ? location.pathname === '/admin'
                : location.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: 12.5,
                  color: active ? '#F4F7FA' : 'rgba(244,247,250,0.65)',
                  textDecoration: 'none',
                  padding: '8px 12px',
                  borderRadius: 4,
                  background: active ? 'rgba(244,247,250,0.08)' : 'transparent',
                  transition: 'background var(--dur-state) var(--ease-out), color var(--dur-state) var(--ease-out)',
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div style={{ flex: 1 }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: 12,
              color: 'rgba(244,247,250,0.65)',
            }}
            className="desktop-only"
          >
            {profile?.email}
          </span>
          <NotificationBell tone="dark" />
          <button
            type="button"
            onClick={() => void onSignOut()}
            aria-label="Sign out"
            style={{
              background: 'transparent',
              border: 0,
              color: '#F4F7FA',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              borderRadius: 4,
            }}
          >
            <OpsIcon name="log-out" size={16} color="#F4F7FA" />
          </button>
          <div
            aria-label="Profile"
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: '#C4973E',
              color: '#0A0A0A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'Fraunces, serif',
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            {initials || 'A'}
          </div>
        </div>
      </header>

      <main style={{ paddingTop: 64, minHeight: '100vh' }}>{children}</main>
    </div>
  );
}
