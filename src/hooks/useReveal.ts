import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export interface RevealOptions {
  selector?: string;
  y?: number;
  stagger?: number;
  duration?: number;
  /** rootMargin for IntersectionObserver */
  rootMargin?: string;
  once?: boolean;
}

/**
 * Reveals descendants matching `selector` (default `[data-reveal]`) as they
 * enter the viewport. Returns a `ref` to attach to the container.
 *
 * Uses IntersectionObserver for reliable mount-time activation (more robust
 * than ScrollTrigger when content mounts after a route change).
 */
export function useReveal<T extends HTMLElement = HTMLElement>({
  selector = '[data-reveal]',
  y = 24,
  stagger = 0.08,
  duration = 0.8,
  rootMargin = '0px 0px -10% 0px',
  once = true,
}: RevealOptions = {}) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const targets = Array.from(root.querySelectorAll<HTMLElement>(selector));
    if (!targets.length) return;

    if (reduceMotion) {
      targets.forEach((t) => {
        t.style.opacity = '1';
        t.style.transform = 'none';
      });
      return;
    }

    let queue: HTMLElement[] = [];
    let flushTimer: number | null = null;
    let raf = 0;
    let io: IntersectionObserver | null = null;

    const flush = () => {
      const batch = queue;
      queue = [];
      flushTimer = null;
      if (!batch.length) return;
      gsap.to(batch, {
        opacity: 1,
        y: 0,
        duration,
        ease: 'expo.out',
        stagger,
        overwrite: 'auto',
      });
    };

    // Wait one frame so layout is settled (important after route transitions)
    raf = requestAnimationFrame(() => {
      gsap.set(targets, { opacity: 0, y });

      io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              queue.push(entry.target as HTMLElement);
              if (once) io!.unobserve(entry.target);
            }
          }
          if (queue.length && flushTimer === null) {
            flushTimer = window.setTimeout(flush, 80);
          }
        },
        { rootMargin, threshold: 0.05 },
      );

      // Animate already-in-view items immediately
      const initiallyVisible: HTMLElement[] = [];
      const deferred: HTMLElement[] = [];
      for (const t of targets) {
        const r = t.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) {
          initiallyVisible.push(t);
        } else {
          deferred.push(t);
        }
      }
      if (initiallyVisible.length) {
        gsap.to(initiallyVisible, {
          opacity: 1,
          y: 0,
          duration,
          ease: 'expo.out',
          stagger,
        });
      }
      deferred.forEach((t) => io!.observe(t));
    });

    return () => {
      if (raf) cancelAnimationFrame(raf);
      io?.disconnect();
      if (flushTimer !== null) window.clearTimeout(flushTimer);
      // Restore visibility if unmounting before animation completes
      targets.forEach((t) => {
        gsap.set(t, { opacity: 1, y: 0 });
      });
    };
  }, [selector, y, stagger, duration, rootMargin, once]);

  return ref;
}
