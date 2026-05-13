import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import gsap from 'gsap';
import { MobileNav, useLucide } from '../../components';
import { useOps } from './context';
import type { OpsView } from './navigation';
import { OpsEyebrow, OpsHairline, OpsIcon, OpsMark } from './OpsPrimitives';

export interface OpsChromeProps {
  active: OpsView;
  onNav: (v: OpsView) => void;
  onOpenSearch?: () => void;
  onSignOut?: () => void;
  children: ReactNode;
}

const NAV_ITEMS: { id: OpsView; label: string; icon: string }[] = [
  { id: 'pipeline',   label: 'Pipeline',   icon: 'kanban-square' },
  { id: 'bookings',   label: 'Bookings',   icon: 'calendar-check' },
  { id: 'residences', label: 'Residences', icon: 'building-2' },
  { id: 'residents',  label: 'Residents',  icon: 'users' },
  { id: 'reports',    label: 'Reports',    icon: 'chart-no-axes-column' },
];

const chromeIconBtn: CSSProperties = {
  background: 'transparent',
  border: 0,
  color: '#F8F5EF',
  width: 32,
  height: 32,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  borderRadius: 4,
};

export function OpsChrome({ active, onNav, onOpenSearch, onSignOut, children }: OpsChromeProps) {
  const { building } = useOps();
  useLucide();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);

  // Track viewport size so we only render the hamburger + mobile drawer when
  // the desktop sidebar is hidden. Avoids "WORKSPACE" showing twice and a
  // ghost button on desktop.
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(max-width: 1023px)').matches
      : false,
  );
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    if (!isMobile && drawerOpen) setDrawerOpen(false);
  }, [isMobile, drawerOpen]);

  // Animate the side-rail active indicator
  useEffect(() => {
    if (!indicatorRef.current || !navRef.current) return;
    const activeBtn = navRef.current.querySelector<HTMLElement>(`[data-nav-id="${active}"]`);
    if (!activeBtn) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const { offsetTop, offsetHeight } = activeBtn;
    gsap.to(indicatorRef.current, {
      y: offsetTop,
      height: offsetHeight,
      duration: reduceMotion ? 0 : 0.36,
      ease: 'cubic-bezier(0.4, 0, 0.2, 1)',
    });
  }, [active]);

  const handleNav = (id: OpsView) => {
    onNav(id);
    setDrawerOpen(false);
  };

  const navItems = (
    <nav
      ref={navRef}
      style={{ display: 'flex', flexDirection: 'column', gap: 2, position: 'relative' }}
    >
      <div
        ref={indicatorRef}
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: 1,
          background: 'var(--color-champagne)',
          willChange: 'transform, height',
        }}
      />
      {NAV_ITEMS.map((item) => {
        const isActive = item.id === active;
        return (
          <button
            key={item.id}
            data-nav-id={item.id}
            onClick={() => handleNav(item.id)}
            aria-current={isActive ? 'page' : undefined}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 12px',
              border: 0,
              cursor: 'pointer',
              background: isActive ? '#FFFFFF' : 'transparent',
              borderRadius: 4,
              color: isActive ? '#0F1E3D' : '#4A4A4A',
              fontFamily: 'Inter, sans-serif',
              fontSize: 13,
              fontWeight: isActive ? 500 : 400,
              textAlign: 'left',
              position: 'relative',
              transition: 'background-color 200ms ease, color 200ms ease',
              paddingLeft: 11,
            }}
          >
            <OpsIcon name={item.icon} size={15} />
            {item.label}
          </button>
        );
      })}
    </nav>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-page)' }}>
      {/* Top bar */}
      <header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: 64,
          background: '#0F1E3D',
          color: '#F8F5EF',
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
          zIndex: 20,
          borderBottom: '1px solid rgba(201,169,97,0.18)',
          gap: 16,
        }}
      >
        {isMobile && (
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open navigation"
            style={{ ...chromeIconBtn, marginLeft: -8 }}
          >
            <OpsIcon name="menu" size={18} />
          </button>
        )}

        <div
          className="desktop-only"
          style={{ display: 'flex', alignItems: 'center', gap: 12, width: 216 }}
        >
          <OpsMark size={24} />
          <span
            style={{
              fontFamily: 'Fraunces, serif',
              fontSize: 17,
              fontWeight: 400,
              letterSpacing: '0.01em',
            }}
          >
            Maison
          </span>
          <span
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: 10,
              letterSpacing: '0.16em',
              color: 'rgba(248,245,239,0.55)',
              border: '1px solid rgba(201,169,97,0.4)',
              padding: '3px 7px',
              borderRadius: 2,
              textTransform: 'uppercase',
              fontWeight: 500,
            }}
          >
            Operations
          </span>
        </div>

        <div
          className="desktop-only"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: 'rgba(248,245,239,0.06)',
            border: '1px solid rgba(201,169,97,0.25)',
            padding: '7px 12px',
            borderRadius: 4,
            minWidth: 320,
            marginLeft: 24,
          }}
        >
          <OpsIcon name="building-2" size={14} color="rgba(248,245,239,0.6)" />
          <span style={{ fontFamily: 'Fraunces, serif', fontSize: 14 }}>{building}</span>
          <span style={{ marginLeft: 'auto', color: 'rgba(248,245,239,0.4)' }}>
            <OpsIcon name="chevrons-up-down" size={12} />
          </span>
        </div>

        <span
          className="mobile-only"
          style={{
            fontFamily: 'Fraunces, serif',
            fontSize: 16,
            color: 'var(--color-cream)',
            flex: 1,
            textAlign: 'center',
          }}
        >
          Operations
        </span>

        <div style={{ flex: 1 }} className="desktop-only" />

        <button
          type="button"
          onClick={onOpenSearch}
          aria-label="Open command palette"
          className="desktop-only"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'rgba(248,245,239,0.06)',
            padding: '7px 12px',
            borderRadius: 4,
            width: 260,
            color: 'rgba(248,245,239,0.7)',
            cursor: 'pointer',
            transition: 'background-color var(--dur-state) var(--ease-out), border-color var(--dur-state) var(--ease-out)',
            border: '1px solid rgba(201,169,97,0.15)',
            fontFamily: 'Inter, sans-serif',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(248,245,239,0.12)';
            e.currentTarget.style.borderColor = 'rgba(201,169,97,0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(248,245,239,0.06)';
            e.currentTarget.style.borderColor = 'rgba(201,169,97,0.15)';
          }}
        >
          <OpsIcon name="search" size={14} color="rgba(248,245,239,0.6)" />
          <span style={{ fontSize: 12.5 }}>Search · ⌘K</span>
          <span style={{ flex: 1 }} />
          <span
            style={{
              fontSize: 10,
              color: 'rgba(248,245,239,0.45)',
              letterSpacing: '0.08em',
              border: '1px solid rgba(248,245,239,0.18)',
              padding: '2px 6px',
              borderRadius: 3,
            }}
          >
            ⌘ K
          </span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button style={chromeIconBtn} aria-label="Notifications">
            <OpsIcon name="bell" color="#F8F5EF" size={16} />
          </button>
          {onSignOut && (
            <button onClick={onSignOut} aria-label="Sign Out" style={chromeIconBtn}>
              <OpsIcon name="log-out" color="#F8F5EF" size={16} />
            </button>
          )}
          <div
            aria-label="Profile"
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: '#C9A961',
              color: '#0F1E3D',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'Fraunces, serif',
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            JA
          </div>
        </div>
      </header>

      {/* Desktop sidebar */}
      <aside
        className="ops-sidebar desktop-only"
        style={{
          position: 'fixed',
          top: 64,
          left: 0,
          bottom: 0,
          width: 240,
          background: 'var(--bg-page)',
          borderRight: '1px solid var(--color-taupe)',
          padding: '24px 16px',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <OpsEyebrow>Workspace</OpsEyebrow>
        <div style={{ marginTop: 16 }}>{navItems}</div>

        <div style={{ flex: 1 }} />

        <div
          style={{
            marginTop: 24,
            padding: 14,
            background: 'var(--color-cream-deep)',
            border: '1px solid var(--color-taupe)',
            borderRadius: 6,
          }}
        >
          <OpsEyebrow>Today</OpsEyebrow>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 8 }}>
            <span
              style={{
                fontFamily: 'Fraunces, serif',
                fontSize: 28,
                fontWeight: 300,
                lineHeight: 1,
                color: '#1A1A1A',
              }}
            >
              14
            </span>
            <span
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: 11,
                color: 'var(--color-mist)',
              }}
            >
              Visits scheduled
            </span>
          </div>
          <OpsHairline width="100%" color="var(--color-taupe)" margin="10px 0" />
          <div
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: 11,
              color: 'var(--color-mist)',
              lineHeight: 1.5,
            }}
          >
            3 attendants on premises. 1 awaiting access.
          </div>
        </div>
      </aside>

      {/* Mobile drawer */}
      {isMobile && (
        <MobileNav
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          title="Workspace"
          side="left"
        >
          {navItems}
        </MobileNav>
      )}

      <main
        className="ops-main"
        style={{ marginLeft: 240, paddingTop: 64, minHeight: '100vh' }}
      >
        {children}
      </main>

      <style>{`
        @media (max-width: 1023px) {
          .ops-main { margin-left: 0 !important; }
          .ops-sidebar { display: none !important; }
        }
      `}</style>
    </div>
  );
}
