import { defineConfig, devices } from '@playwright/test';

/**
 * GitHub Pages subdirectory suite.
 *
 * Kept in its own config, and its own build output, for two reasons:
 *
 *  - the app has to be built for `/ns-class-7-study/`, which is a different
 *    artifact from the root build the main suite serves. Sharing `dist/` would
 *    mean the two suites silently clobber each other;
 *  - it is a deployment check, not a product check, so it should not add a
 *    second production build to every ordinary `pnpm test:e2e` run.
 *
 * Run it with `pnpm pages:test`. It is part of `pnpm verify`, so a change that
 * breaks subdirectory hosting fails before it can be deployed.
 */
export default defineConfig({
  testDir: './e2e',
  testMatch: /pages-deployment\.spec\.ts/,
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',

  use: {
    // The base path is part of the URL, exactly as it would be on Pages.
    baseURL: 'http://localhost:4180',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'pages-mobile',
      use: { ...devices['Pixel 7'] },
    },
  ],

  webServer: {
    // Builds into dist-pages/ so the root build in dist/ is left alone.
    command: 'pnpm pages:serve',
    url: 'http://localhost:4180/ns-class-7-study/',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
