import { Children, useRef } from 'react';
import type { CSSProperties, ElementType, ReactNode } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

export interface SplitHeadingProps {
  as?: ElementType;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** "words" (default) splits by word with mask reveal. "lines" is no longer
   *  supported — we split by word to avoid DOM mutation outside React. */
  splitBy?: 'words' | 'lines';
  /** Trigger on scroll instead of on mount. */
  onScroll?: boolean;
  stagger?: number;
  delay?: number;
}

/**
 * Headline with word-by-word mask reveal. The split happens in React (no
 * external DOM mutation), so unmount is conflict-free.
 *
 * Only string children are split. Other ReactNode children pass through.
 */
export function SplitHeading({
  as: Tag = 'h1',
  children,
  className,
  style,
  onScroll = false,
  stagger = 0.06,
  delay = 0,
}: SplitHeadingProps) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (!ref.current) return;
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduceMotion) {
        gsap.set(ref.current, { opacity: 1 });
        return;
      }

      const words = ref.current.querySelectorAll<HTMLElement>('[data-word-inner]');
      if (!words.length) {
        gsap.set(ref.current, { opacity: 1 });
        return;
      }
      gsap.set(ref.current, { opacity: 1 });
      gsap.set(words, { yPercent: 110, opacity: 0 });

      const animate = () =>
        gsap.to(words, {
          yPercent: 0,
          opacity: 1,
          duration: 1.1,
          ease: 'expo.out',
          stagger,
          delay,
        });

      let trigger: ScrollTrigger | undefined;
      if (onScroll) {
        trigger = ScrollTrigger.create({
          trigger: ref.current,
          start: 'top 85%',
          once: true,
          onEnter: animate,
        });
      } else {
        animate();
      }

      return () => {
        trigger?.kill();
      };
    },
    { dependencies: [onScroll, stagger, delay] },
  );

  const Component = Tag as ElementType;
  return (
    <Component
      ref={ref}
      className={className}
      style={{ opacity: 0, ...style }}
    >
      {splitChildrenIntoWords(children)}
    </Component>
  );
}

const WORD_STYLE: CSSProperties = {
  display: 'inline-block',
  overflow: 'hidden',
  verticalAlign: 'baseline',
};
const INNER_STYLE: CSSProperties = {
  display: 'inline-block',
  willChange: 'transform, opacity',
};

function splitChildrenIntoWords(children: ReactNode): ReactNode {
  return Children.map(children, (child, idx) => {
    if (typeof child !== 'string') return child;
    const parts = child.split(/(\s+)/); // keep whitespace as its own token
    return parts.map((part, j) => {
      if (/^\s+$/.test(part)) return part; // whitespace stays as text node
      if (part === '') return null;
      return (
        <span key={`${idx}-${j}`} style={WORD_STYLE}>
          <span data-word-inner style={INNER_STYLE}>
            {part}
          </span>
        </span>
      );
    });
  });
}
