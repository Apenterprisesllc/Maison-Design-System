import { useEffect } from 'react';
import gsap from 'gsap';

/**
 * Wrapper around `gsap.matchMedia()` that auto-revokes on unmount.
 * Use this for any scroll/scroll-trigger work so animations respect
 * `prefers-reduced-motion` AND can vary per breakpoint.
 *
 * ```ts
 * useGsapMatchMedia((mm) => {
 *   mm.add({
 *     reduceMotion: '(prefers-reduced-motion: reduce)',
 *     isDesktop:    '(min-width: 1024px)',
 *   }, (ctx) => {
 *     const { reduceMotion, isDesktop } = ctx.conditions!;
 *     if (reduceMotion) return;
 *     // GSAP code here
 *   });
 * }, [deps]);
 * ```
 */
export function useGsapMatchMedia(
  setup: (mm: gsap.MatchMedia) => void,
  deps: React.DependencyList = [],
): void {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const mm = gsap.matchMedia();
    setup(mm);
    return () => {
      mm.revert();
    };
  }, deps);
}
