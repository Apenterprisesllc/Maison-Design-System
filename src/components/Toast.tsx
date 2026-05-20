import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Icon } from './Icon';

export type ToastKind = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  kind: ToastKind;
  message: string;
  durationMs: number;
}

interface ToastContextValue {
  show: (message: string, kind?: ToastKind, durationMs?: number) => string;
  success: (message: string, durationMs?: number) => string;
  error: (message: string, durationMs?: number) => string;
  info: (message: string, durationMs?: number) => string;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATION = 4000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Map<string, number>>(new Map());

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const handle = timers.current.get(id);
    if (handle !== undefined) {
      window.clearTimeout(handle);
      timers.current.delete(id);
    }
  }, []);

  const show = useCallback(
    (message: string, kind: ToastKind = 'info', durationMs: number = DEFAULT_DURATION) => {
      const id = 't' + Date.now() + Math.random().toString(36).slice(2, 6);
      setToasts((prev) => [...prev, { id, kind, message, durationMs }]);
      const handle = window.setTimeout(() => dismiss(id), durationMs);
      timers.current.set(id, handle);
      return id;
    },
    [dismiss],
  );

  const api = useMemo<ToastContextValue>(
    () => ({
      show,
      success: (m, d) => show(m, 'success', d),
      error: (m, d) => show(m, 'error', d),
      info: (m, d) => show(m, 'info', d),
      dismiss,
    }),
    [show, dismiss],
  );

  useEffect(() => {
    const captured = timers.current;
    return () => {
      captured.forEach((h) => window.clearTimeout(h));
      captured.clear();
    };
  }, []);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}

function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}) {
  return (
    <div
      role="region"
      aria-live="polite"
      aria-label="Notifications"
      style={{
        position: 'fixed',
        right: 16,
        bottom: 16,
        zIndex: 70,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        maxWidth: 360,
        pointerEvents: 'none',
      }}
    >
      {toasts.map((t) => (
        <ToastCard key={t.id} toast={t} onDismiss={() => onDismiss(t.id)} />
      ))}
    </div>
  );
}

const ACCENTS: Record<ToastKind, string> = {
  success: 'var(--color-status-success)',
  error: 'var(--color-status-danger)',
  info: 'var(--color-champagne)',
};

function ToastCard({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const accent = ACCENTS[toast.kind];

  return (
    <div
      role="status"
      style={{
        position: 'relative',
        background: 'var(--color-ink)',
        color: 'var(--color-cream)',
        borderRadius: 'var(--radius-3)',
        padding: '14px 36px 14px 18px',
        boxShadow: 'var(--shadow-3)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translate3d(0, 0, 0)' : 'translate3d(0, 16px, 0)',
        transition:
          'opacity var(--dur-layout) var(--ease-out), transform var(--dur-layout) var(--ease-out)',
        pointerEvents: 'auto',
        overflow: 'hidden',
      }}
    >
      {/* Accent rail */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 3,
          background: accent,
        }}
      />
      <span
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 13,
          lineHeight: 1.55,
          letterSpacing: '0.01em',
          color: 'rgba(244,247,250,0.92)',
          flex: 1,
        }}
      >
        {toast.message}
      </span>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        style={{
          position: 'absolute',
          top: 10,
          right: 10,
          background: 'transparent',
          border: 0,
          cursor: 'pointer',
          color: 'rgba(244,247,250,0.7)',
          padding: 4,
          display: 'flex',
        }}
      >
        <Icon name="x" size={14} />
      </button>
      {/* Progress bar — shrinks over duration */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: 1,
          background: accent,
          opacity: 0.5,
          transformOrigin: 'left center',
          animation: `mai-toast-progress ${toast.durationMs}ms linear forwards`,
        }}
      />
      <style>{`
        @keyframes mai-toast-progress {
          from { transform: scaleX(1); }
          to   { transform: scaleX(0); }
        }
      `}</style>
    </div>
  );
}
