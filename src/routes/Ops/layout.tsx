import { useEffect, useRef } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { ToastProvider } from '../../components';
import { useAuth } from '../../lib/auth';
import { OpsProvider, useOps } from './context';
import { BookingDetailDrawer } from './BookingDetailDrawer';
import { CommandPalette } from './CommandPalette';
import { OpsChrome } from './OpsChrome';

import type { OpsView } from './navigation';

const PATH_FOR_VIEW: Record<OpsView, string> = {
  bookings: '/ops',
  referrals: '/ops/referrals',
};

function pathToView(pathname: string): OpsView {
  if (pathname.startsWith('/ops/referrals')) return 'referrals';
  return 'bookings';
}

function OpsShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const viewRef = useRef<HTMLDivElement>(null);
  const { signOut } = useAuth();
  const { openPalette, togglePalette } = useOps();

  async function handleSignOut() {
    await signOut();
    navigate('/', { replace: true });
  }

  const activeView = pathToView(location.pathname);

  // Sub-view fade-in
  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const el = viewRef.current;
    if (!el || reduceMotion) return;
    gsap.fromTo(
      el,
      { opacity: 0, y: 8 },
      { opacity: 1, y: 0, duration: 0.32, ease: 'cubic-bezier(0.2, 0.6, 0.2, 1)' },
    );
  }, [location.pathname]);

  // ⌘K / Ctrl+K toggles the command palette anywhere inside /ops.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        togglePalette();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [togglePalette]);

  return (
    <>
      <OpsChrome
        active={activeView}
        onNav={(v) => navigate(`${PATH_FOR_VIEW[v]}${location.search}`)}
        onOpenSearch={openPalette}
        onSignOut={handleSignOut}
      >
        <div ref={viewRef} key={location.pathname} style={{ willChange: 'transform, opacity' }}>
          <Outlet />
        </div>
      </OpsChrome>

      <BookingDetailDrawer />
      <CommandPalette />
    </>
  );
}

export function OpsLayout() {
  return (
    <OpsProvider>
      <ToastProvider>
        <OpsShell />
      </ToastProvider>
    </OpsProvider>
  );
}
