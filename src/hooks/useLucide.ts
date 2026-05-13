import { useLayoutEffect } from 'react';

declare global {
  interface Window {
    lucide?: { createIcons: () => void };
  }
}

/**
 * Re-runs Lucide's icon renderer after each commit. Place once near the root
 * of any tree that contains `<Icon>` elements.
 */
export function useLucide(): void {
  useLayoutEffect(() => {
    window.lucide?.createIcons();
  });
}
