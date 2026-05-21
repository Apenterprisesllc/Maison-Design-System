import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { App } from './App';
import { AuthProvider } from './lib/auth';
import './styles/index.css';

gsap.registerPlugin(ScrollTrigger, DrawSVGPlugin);

gsap.defaults({
  ease: 'cubic-bezier(0.2, 0.6, 0.2, 1)',
  duration: 0.6,
});

async function enableMockingIfNeeded() {
  // Playwright sets VITE_E2E_MOCK=true via playwright.config.webServer.env.
  // In production / regular dev this branch is dead code (Vite tree-shakes).
  if (import.meta.env.VITE_E2E_MOCK === 'true') {
    const { worker } = await import('./test/browser');
    await worker.start({ onUnhandledRequest: 'bypass', quiet: true });
  }
}

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root element in index.html');

void enableMockingIfNeeded().then(() => {
  createRoot(root).render(
    <StrictMode>
      <AuthProvider>
        <App />
      </AuthProvider>
    </StrictMode>,
  );
});
