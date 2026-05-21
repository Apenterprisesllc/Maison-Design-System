import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    // Force test env values BEFORE module load so the Supabase client points
    // at the MSW-handled URL instead of whatever lives in .env.local.
    env: {
      VITE_SUPABASE_URL: 'https://test.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'test-anon-key',
    },
    // E2E lives in its own runner (Playwright) so vitest skips that folder.
    exclude: ['node_modules', 'dist', 'e2e/**', '.idea', '.git', '.cache'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.d.ts',
        'src/test/**',
        'src/main.tsx',
        'src/vite-env.d.ts',
        'src/lib/types/db.ts',
      ],
    },
  },
});
