/// <reference types="vitest" />
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'node:path';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

/**
 * Content version is a digest of the question bank at build time, so a
 * maintainer (and the Sources page) can tell two deployments apart without
 * diffing data files. It changes only when the questions change.
 */
function contentVersion(): string {
  const dir = new URL('./data/questions/', import.meta.url);
  const hash = createHash('sha256');
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.json')).sort()) {
    hash.update(readFileSync(new URL(file, dir)));
  }
  return hash.digest('hex').slice(0, 10);
}

export default defineConfig({
  base: './',
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __CONTENT_VERSION__: JSON.stringify(contentVersion()),
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
      '@data': path.resolve(import.meta.dirname, 'data'),
    },
  },
  plugins: [
    react(),
    VitePWA({
      // A released update must never yank the rug from under a learner in the
      // middle of a mock test. 'prompt' keeps the new service worker waiting
      // until the learner chooses to refresh; the update banner in the app is
      // what turns that into an obvious, safe "refresh to update" choice.
      registerType: 'prompt',
      // The app registers the worker itself via `virtual:pwa-register`
      // (see src/pwa.ts), so nothing is injected into the HTML.
      injectRegister: null,
      includeAssets: ['favicon.svg'],
      manifest: {
        name: "Nova Scotia Class 7 Study — unofficial",
        short_name: 'NS Class 7',
        description:
          "An independent, unofficial study aid for the Nova Scotia Class 7 Learner's Licence knowledge test.",
        theme_color: '#0f172a',
        background_color: '#f8fafc',
        display: 'standalone',
        orientation: 'portrait',
        start_url: './',
        scope: './',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
  },
});
