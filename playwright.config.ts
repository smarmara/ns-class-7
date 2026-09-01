import { defineConfig, devices } from '@playwright/test';

/*
 * Specs the two main projects do not run.
 *
 * `*-shots.spec.ts` are screenshot-evidence suites, run on demand by the
 * `shots` project at a pinned viewport.
 *
 * `pages-deployment.spec.ts` needs the app built for, and served from, a
 * subdirectory — a different artifact from the root build this config serves on
 * :4173. It has its own config and output directory (playwright.pages.config.ts,
 * `pnpm pages:test`); running it here would test the Pages build against the
 * root server and fail on every asset path.
 */
const IGNORED_BY_MAIN_SUITE = [/-shots\.spec\.ts/, /ux-shots\.spec\.ts/, /pages-deployment\.spec\.ts/];

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',

  // Merges the per-worker viewport measurement shards into one report; see
  // e2e/viewport-report.ts for why the tests cannot just share an array.
  globalTeardown: './e2e/viewport-report.ts',

  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      // The primary target is a phone, so that is the primary test device.
      name: 'mobile',
      use: { ...devices['Pixel 7'] },
      testIgnore: IGNORED_BY_MAIN_SUITE,
    },
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: IGNORED_BY_MAIN_SUITE,
    },
    {
      /**
       * Screenshot evidence for the UX redesign, pinned to the primary design
       * target (390x844, default text scaling) so the images are comparable
       * between runs. Runs only when asked for by name.
       */
      name: 'shots',
      testMatch: /ux-shots\.spec\.ts|sign-catalogue-shots\.spec\.ts|signs-hub-shots\.spec\.ts|sign-match-shots\.spec\.ts|continue-home-shots\.spec\.ts|profile-runs-shots\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 390, height: 844 },
        isMobile: false,
        deviceScaleFactor: 2,
      },
    },
  ],

  webServer: {
    command: 'pnpm build && pnpm preview --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
