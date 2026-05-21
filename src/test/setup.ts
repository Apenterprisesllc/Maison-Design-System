import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { server } from './server';
import { resetStore } from './store';

// jsdom doesn't implement matchMedia — components that check for reduced
// motion or breakpoints crash without this polyfill.
if (typeof window.matchMedia !== 'function') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

// Provide the env vars the app expects without leaking real Supabase creds.
const ENV_DEFAULTS = {
  VITE_SUPABASE_URL: 'https://test.supabase.co',
  VITE_SUPABASE_ANON_KEY: 'test-anon-key',
};
for (const [key, value] of Object.entries(ENV_DEFAULTS)) {
  if (!import.meta.env[key]) {
    (import.meta.env as Record<string, string>)[key] = value;
  }
}

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  cleanup();
  server.resetHandlers();
  resetStore();
});

afterAll(() => {
  server.close();
});
