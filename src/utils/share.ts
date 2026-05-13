/**
 * Cross-platform share helper.
 * Uses the native Web Share API when available (mobile, modern Safari).
 * Falls back to the Async Clipboard API and reports the outcome so callers
 * can show a toast.
 */

export type ShareResult =
  | { kind: 'shared' }
  | { kind: 'copied' }
  | { kind: 'cancelled' }
  | { kind: 'unsupported' }
  | { kind: 'error'; message: string };

export interface ShareInput {
  title?: string;
  text?: string;
  url?: string;
}

export async function share(input: ShareInput): Promise<ShareResult> {
  const data: ShareData = {
    title: input.title,
    text: input.text,
    url: input.url ?? (typeof window !== 'undefined' ? window.location.href : undefined),
  };

  // Native Web Share
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share(data);
      return { kind: 'shared' };
    } catch (err) {
      // User dismissed the sheet
      if ((err as Error).name === 'AbortError') return { kind: 'cancelled' };
      // Fall through to clipboard
    }
  }

  // Clipboard fallback
  const fallbackText = [input.title, input.text, data.url].filter(Boolean).join(' — ');
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(fallbackText);
      return { kind: 'copied' };
    } catch (err) {
      return { kind: 'error', message: (err as Error).message };
    }
  }

  return { kind: 'unsupported' };
}
