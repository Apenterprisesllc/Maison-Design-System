import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

/**
 * MSW worker for the browser. Started conditionally from main.tsx when the
 * `VITE_E2E_MOCK` env var is set (Playwright sets this via playwright.config).
 */
export const worker = setupWorker(...handlers);
