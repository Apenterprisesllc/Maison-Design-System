import { useRef } from 'react';
import type { ReactNode } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

export interface MarqueeProps {
  children: ReactNode;
  /** Seconds per full loop. */
  duration?: number;
  /** "left" by default. Pass "right" to reverse. */
  direction?: 'left' | 'right';
  gap?: number;
}

/**
 * Infinite horizontal marquee. Duplicates content so the loop is seamless.
 * Pauses on hover. Pauses entirely if user prefers reduced motion.
 */
export function Marquee({ children, duration = 35, direction = 'left', gap = 56 }: MarqueeProps) {
  const trackRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!trackRef.current) return;
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduceMotion) return;

      const tween = gsap.to(trackRef.current, {
        xPercent: direction === 'left' ? -50 : 50,
        duration,
        ease: 'none',
        repeat: -1,
      });

      const el = trackRef.current.parentElement;
      const onEnter = () => tween.pause();
      const onLeave = () => tween.resume();
      el?.addEventListener('mouseenter', onEnter);
      el?.addEventListener('mouseleave', onLeave);

      return () => {
        tween.kill();
        el?.removeEventListener('mouseenter', onEnter);
        el?.removeEventListener('mouseleave', onLeave);
      };
    },
    { dependencies: [duration, direction] },
  );

  return (
    <div
      style={{
        overflow: 'hidden',
        width: '100%',
        position: 'relative',
        maskImage:
          'linear-gradient(90deg, transparent 0%, #000 8%, #000 92%, transparent 100%)',
        WebkitMaskImage:
          'linear-gradient(90deg, transparent 0%, #000 8%, #000 92%, transparent 100%)',
      }}
    >
      <div
        ref={trackRef}
        style={{
          display: 'flex',
          gap,
          width: 'max-content',
          willChange: 'transform',
        }}
      >
        <div style={{ display: 'flex', gap, alignItems: 'center' }}>{children}</div>
        <div style={{ display: 'flex', gap, alignItems: 'center' }} aria-hidden="true">
          {children}
        </div>
      </div>
    </div>
  );
}
