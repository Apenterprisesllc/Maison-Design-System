import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

export interface PageTransitionProps {
  children: ReactNode;
  /**
   * Identifier whose change triggers the fade. Default: `location.pathname`.
   * Pass a coarser key (e.g. top-level route segment) to skip transitions on
   * nested route changes.
   */
  transitionKey?: string;
}

const FADE_MS = 220;

/**
 * Route-level cross-fade. CSS-only — no inline GSAP styles, so we can never
 * leave the wrapper stuck at opacity 0 if a re-render fires mid-animation.
 *
 * Behaviour:
 *  1. Path changes → we mark `phase=out`, current children fade out.
 *  2. After FADE_MS we swap in the new children, scroll to top, and mark
 *     `phase=in` → they fade back up.
 *
 * IMPORTANT — the transition effect deliberately does NOT depend on
 * `children`. JSX produces a fresh `children` reference on every render of
 * the parent (router state changes, auth context settling, realtime
 * subscriptions, etc.). If `children` were a dep, every unrelated re-render
 * would clear the fade-out timer, leaving the wrapper stuck at `phase='out'`
 * (opacity 0 + `pointer-events: none`) — clicks would silently fail. A
 * separate effect keeps `rendered.node` in sync with the latest children
 * when the key matches, with no timer involvement.
 */
export function PageTransition({ children, transitionKey }: PageTransitionProps) {
  const location = useLocation();
  const key = transitionKey ?? location.pathname;
  const childrenRef = useRef<ReactNode>(children);
  childrenRef.current = children;

  const [rendered, setRendered] = useState<{ key: string; node: ReactNode }>({
    key,
    node: children,
  });
  const [phase, setPhase] = useState<'in' | 'out'>('in');

  // Key-change transition. NO `children` in deps — see comment above.
  useEffect(() => {
    if (rendered.key === key) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      setRendered({ key, node: childrenRef.current });
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
      return;
    }

    setPhase('out');
    const timer = window.setTimeout(() => {
      setRendered({ key, node: childrenRef.current });
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
      requestAnimationFrame(() => setPhase('in'));
    }, FADE_MS);
    return () => window.clearTimeout(timer);
  }, [key, rendered.key]);

  // Keep rendered.node fresh when children change without a key change —
  // e.g. a list inside the active route updates after a fetch. No animation
  // reset, no timer.
  useEffect(() => {
    if (rendered.key === key) {
      setRendered((prev) => (prev.node === children ? prev : { key, node: children }));
    }
  }, [children, key, rendered.key]);

  return (
    <div
      style={{
        opacity: phase === 'in' ? 1 : 0,
        transform: phase === 'in' ? 'translate3d(0, 0, 0)' : 'translate3d(0, -6px, 0)',
        transition: `opacity ${FADE_MS}ms cubic-bezier(0.4, 0, 0.2, 1), transform ${FADE_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`,
        willChange: 'transform, opacity',
        // Disable interactions during the fade-out so clicks aren't routed to
        // soon-to-be-stale handlers (e.g. a header logo on the outgoing page).
        pointerEvents: phase === 'in' ? 'auto' : 'none',
      }}
    >
      {rendered.node}
    </div>
  );
}
