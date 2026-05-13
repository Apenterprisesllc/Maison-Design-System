import { useEffect, useRef } from 'react';
import type { CSSProperties, ElementType, ReactNode } from 'react';
import gsap from 'gsap';

export interface RevealProps {
  as?: ElementType;
  children: ReactNode;
  delay?: number;
  y?: number;
  duration?: number;
  /** rootMargin for IntersectionObserver. Default reveals slightly before scroll-in. */
  rootMargin?: string;
  className?: string;
  style?: CSSProperties;
}

/**
 * Single-element reveal. Uses IntersectionObserver (more robust than
 * ScrollTrigger during route transitions / late mounts). If the element
 * is already in-view at mount, animates immediately. Respects reduced-motion.
 */
export function Reveal({
  as: Tag = 'div',
  children,
  delay = 0,
  y = 24,
  duration = 0.9,
  rootMargin = '0px 0px -10% 0px',
  className,
  style,
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      el.style.opacity = '1';
      el.style.transform = 'none';
      return;
    }

    let io: IntersectionObserver | null = null;
    const raf = requestAnimationFrame(() => {
      gsap.set(el, { opacity: 0, y });

      const animate = () => {
        gsap.to(el, {
          opacity: 1,
          y: 0,
          duration,
          delay,
          ease: 'expo.out',
          overwrite: 'auto',
        });
      };

      const rect = el.getBoundingClientRect();
      const inView = rect.top < window.innerHeight && rect.bottom > 0;
      if (inView) {
        animate();
        return;
      }

      io = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting) {
            animate();
            io!.disconnect();
          }
        },
        { rootMargin, threshold: 0.05 },
      );
      io.observe(el);
    });

    return () => {
      cancelAnimationFrame(raf);
      io?.disconnect();
      // Restore on unmount in case animation was mid-flight
      gsap.set(el, { opacity: 1, y: 0 });
    };
  }, [delay, y, duration, rootMargin]);

  const Component = Tag as ElementType;
  return (
    <Component
      ref={ref}
      className={className}
      style={{ willChange: 'transform, opacity', ...style }}
    >
      {children}
    </Component>
  );
}
