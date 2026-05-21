import { useEffect, useRef } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { ToastProvider } from '../../components';
import { useAuth } from '../../lib/auth';
import { CommandPalette } from './CommandPalette';
import { OpsProvider, useOps } from './context';
import { BookingDetailDrawer } from './BookingDetailDrawer';
import { NewBookingModal } from './NewBookingModal';
import { OpsChrome } from './OpsChrome';
import { UnitDetailDrawer } from './UnitDetailDrawer';

import type { OpsView } from './navigation';

const PATH_FOR_VIEW: Record<OpsView, string> = {
  pipeline: '/ops',
  bookings: '/ops/bookings',
  residences: '/ops/residences',
  residents: '/ops/residents',
  reports: '/ops/reports',
};

function pathToView(pathname: string): OpsView {
  if (pathname === '/ops' || pathname === '/ops/') return 'pipeline';
  if (pathname.startsWith('/ops/bookings')) return 'bookings';
  if (pathname.startsWith('/ops/residences')) return 'residences';
  if (pathname.startsWith('/ops/residents')) return 'residents';
  if (pathname.startsWith('/ops/reports')) return 'reports';
  return 'pipeline';
}

function OpsShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const viewRef = useRef<HTMLDivElement>(null);
  const { togglePalette, openPalette } = useOps();
  const { signOut } = useAuth();

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

  // Global ⌘K shortcut
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isCmd = e.metaKey || e.ctrlKey;
      if (isCmd && e.key.toLowerCase() === 'k') {
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
        onNav={(v) => navigate(PATH_FOR_VIEW[v])}
        onOpenSearch={openPalette}
        onSignOut={handleSignOut}
      >
        <div ref={viewRef} key={location.pathname} style={{ willChange: 'transform, opacity' }}>
          <Outlet />
        </div>
      </OpsChrome>

      <CommandPalette />
      <BookingDetailDrawer />
      <UnitDetailDrawer />
      <NewBookingModal />
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
