import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

export interface CountUpOptions {
  to: number;
  from?: number;
  duration?: number;
  start?: string;
  format?: (n: number) => string;
}

/**
 * Animates a number from `from` (default 0) up to `to` when its element
 * enters the viewport. Returns a `ref` to attach to the element whose
 * textContent should hold the animated value.
 */
export function useCountUp<T extends HTMLElement = HTMLElement>({
  to,
  from = 0,
  duration = 1.6,
  start = 'top 85%',
  format = (n) => Math.round(n).toLocaleString(),
}: CountUpOptions) {
  const ref = useRef<T | null>(null);

  useGSAP(
    () => {
      if (!ref.current) return;
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const el = ref.current;

      if (reduceMotion) {
        el.textContent = format(to);
        return;
      }

      el.textContent = format(from);
      const obj = { val: from };

      const tween = gsap.to(obj, {
        val: to,
        duration,
        ease: 'expo.out',
        scrollTrigger: { trigger: el, start, once: true },
        onUpdate: () => {
          el.textContent = format(obj.val);
        },
      });

      return () => {
        tween.scrollTrigger?.kill();
        tween.kill();
      };
    },
    { dependencies: [to, from, duration, start] },
  );

  return ref;
}
