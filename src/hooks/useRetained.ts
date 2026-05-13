import { useEffect, useState } from 'react';

/**
 * Retains the last truthy `value` for `delayMs` after it becomes nullish.
 *
 * Use this for drawer / modal content that needs to remain rendered during
 * the close animation so the body doesn't flicker to empty mid-transition.
 *
 *   const renderUnit = useRetained(selectedUnit, 320);
 *   // selectedUnit is undefined the moment the user closes the drawer,
 *   // but renderUnit stays defined for 320ms so the slide-out has content.
 */
export function useRetained<T>(value: T | null | undefined, delayMs: number): T | null | undefined {
  const [retained, setRetained] = useState<T | null | undefined>(value);

  useEffect(() => {
    if (value !== null && value !== undefined) {
      setRetained(value);
      return;
    }
    const t = window.setTimeout(() => setRetained(value), delayMs);
    return () => window.clearTimeout(t);
  }, [value, delayMs]);

  return retained;
}
