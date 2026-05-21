import { useEffect, useRef } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { ToastProvider } from '../../components';
import { useAuth } from '../../lib/auth';
import { PortalProvider } from './context';
import { ResidentChrome } from './ResidentChrome';

function PortalShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const screenRef = useRef<HTMLDivElement>(null);
  const { signOut } = useAuth();

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

  async function handleSignOut() {
    await signOut();
    navigate('/', { replace: true });
  }

  return (
    <div>
      <ResidentChrome
        onHome={() => navigate('/portal')}
        onAccount={() => navigate('/portal/account')}
        onSignOut={handleSignOut}
      />
      <div ref={screenRef} key={location.pathname} style={{ willChange: 'transform, opacity' }}>
        <Outlet />
      </div>
    </div>
  );
}

/**
 * PortalLayout — wraps every /portal/* route with shared state and chrome.
 * Track comes from the authenticated user's primary unit (or profile fallback)
 * resolved inside PortalProvider, so no URL state is needed.
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
