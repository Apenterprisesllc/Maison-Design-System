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
 */
export function PageTransition({ children, transitionKey }: PageTransitionProps) {
  const location = useLocation();
  const key = transitionKey ?? location.pathname;
  const [rendered, setRendered] = useState<{ key: string; node: ReactNode }>({
    key,
    node: children,
  });
  const [phase, setPhase] = useState<'in' | 'out'>('in');
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    // Same key — keep children fresh without animating.
    if (rendered.key === key) {
      setRendered((prev) => ({ ...prev, node: children }));
      return;
    }

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduceMotion) {
      setRendered({ key, node: children });
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
      return;
    }

    setPhase('out');
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      setRendered({ key, node: children });
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
      requestAnimationFrame(() => setPhase('in'));
    }, FADE_MS);

    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [key, children, rendered.key]);

  return (
    <div
      style={{
        opacity: phase === 'in' ? 1 : 0,
        transform: phase === 'in' ? 'translate3d(0, 0, 0)' : 'translate3d(0, -6px, 0)',
        transition: `opacity ${FADE_MS}ms cubic-bezier(0.4, 0, 0.2, 1), transform ${FADE_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`,
        willChange: 'transform, opacity',
      }}
    >
      {rendered.node}
    </div>
  );
}
