import { useEffect, useRef } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { ToastProvider } from '../../components';
import { PortalProvider } from './context';
import { ResidentChrome } from './ResidentChrome';

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
  return (
    <PortalProvider>
      <ToastProvider>
        <PortalShell />
      </ToastProvider>
    </PortalProvider>
  );
}
