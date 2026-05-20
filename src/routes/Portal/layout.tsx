import { useEffect, useMemo, useRef } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { ToastProvider } from '../../components';
import { PortalProvider } from './context';
import { ResidentChrome } from './ResidentChrome';
import type { ClientTrack } from './types';

function resolveTrack(stateTrack: unknown): ClientTrack {
  if (stateTrack === 'commercial' || stateTrack === 'residential') return stateTrack;
  if (typeof window !== 'undefined') {
    const stored = window.sessionStorage.getItem('apTrack');
    if (stored === 'commercial' || stored === 'residential') return stored;
  }
  return 'residential';
}

function PortalShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const screenRef = useRef<HTMLDivElement>(null);

  // Sub-screen transition: fade + slight slide when location.pathname changes
  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const el = screenRef.current;
    if (!el || reduceMotion) return;
    gsap.fromTo(
      el,
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.32, ease: 'cubic-bezier(0.2, 0.6, 0.2, 1)' },
    );
  }, [location.pathname]);

  return (
    <div>
      <ResidentChrome
        onHome={() => navigate('/portal')}
        onAccount={() => navigate('/portal/account')}
        onSignOut={() => navigate('/')}
      />
      <div ref={screenRef} key={location.pathname} style={{ willChange: 'transform, opacity' }}>
        <Outlet />
      </div>
    </div>
  );
}

/**
 * PortalLayout — wraps every /portal/* route with shared state and chrome.
 * State (resident, bookings) lives inside PortalProvider so it persists
 * across nested route navigations and resets on full unmount (sign-out).
 */
export function PortalLayout() {
  const location = useLocation();
  const initialTrack = useMemo<ClientTrack>(
    () => resolveTrack((location.state as { track?: unknown } | null)?.track),
    // Only re-resolve on first mount; subsequent intra-portal navigations
    // shouldn't reset the track.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.sessionStorage.setItem('apTrack', initialTrack);
  }, [initialTrack]);

  return (
    <PortalProvider initialTrack={initialTrack}>
      <ToastProvider>
        <PortalShell />
      </ToastProvider>
    </PortalProvider>
  );
}
