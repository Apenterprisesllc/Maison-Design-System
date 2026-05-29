import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: false,
    open: true,
  },
  build: {
    outDir: 'dist',
    // No sourcemaps in the deploy: there's no error-tracking service consuming
    // them, so emitting ~2.6 MB of .map files only bloats the artifact. Flip to
    // 'hidden' if a Sentry-style uploader is added later.
    sourcemap: false,
  },
});
