import { expect, test } from '@playwright/test';
import { isIconKit } from './helpers';

/**
 * Native readiness, verified against the real production build.
 *
 * These run in a browser, so what they can prove is the WEB half of the
 * contract: that adding a Capacitor shell has not degraded the PWA, and that
 * the whole learning experience is served from bundled assets. The native half
 * — status bar, Android Back, share sheet — is covered by unit tests for the
 * decisions and by docs/NATIVE_SMOKE_TEST.md on a device.
 */

test.describe('PWA survives the native integration', () => {
  test('still registers a service worker on the web', async ({ page }) => {
    // The native build deliberately does not register one. The web build must
    // still do so, or the installable PWA quietly stops working offline.
    await page.goto('/#/');
    const registered = await page.evaluate(async () => {
      if (!('serviceWorker' in navigator)) return 'unsupported';
      // Registration is asynchronous and happens after the app mounts, so wait
      // for it rather than sampling the instant the page loads.
      const ready = navigator.serviceWorker.ready.then(() => 'registered' as const);
      const timeout = new Promise<'none'>((resolve) => setTimeout(() => resolve('none'), 10_000));
      return Promise.race([ready, timeout]);
    });
    expect(registered).toBe('registered');
  });

  test('still serves a web app manifest with icons', async ({ page, request }) => {
    await page.goto('/#/');
    const href = await page.getAttribute('link[rel="manifest"]', 'href');
    expect(href, 'manifest link present').toBeTruthy();

    const response = await request.get(new URL(href!, 'http://localhost:4173').toString());
    expect(response.ok()).toBe(true);
    const manifest = (await response.json()) as {
      name: string;
      icons: { src: string; sizes: string }[];
      display: string;
    };
    expect(manifest.display).toBe('standalone');
    expect(manifest.icons.length).toBeGreaterThanOrEqual(3);
    expect(manifest.icons.some((i) => i.sizes === '512x512')).toBe(true);
  });
});

test.describe('offline operation', () => {
  test('the whole study journey loads without touching the network', async ({ page }) => {
    /*
     * The strongest available statement of "everything needed to study is
     * already in the app": walk the real learner journey and assert that no
     * request left the origin. Anything that did would become a blank screen
     * on a phone with no signal.
     *
     * One exception, and only one: the Font Awesome Pro icon Kit. Pro artwork
     * is licensed per seat and cannot be shipped in a public repository, so
     * those glyphs load at runtime. They are decorative — every icon sits
     * beside a text label — and `font-awesome-kit.spec.ts` proves the journey
     * still works with the Kit blocked. Nothing else may leave the origin.
     */
    const offOrigin: string[] = [];
    page.on('request', (request) => {
      const url = request.url();
      if (isIconKit(url)) return;
      if (!url.startsWith('http://localhost:4173') && !url.startsWith('data:') && !url.startsWith('blob:')) {
        offOrigin.push(url);
      }
    });

    for (const route of [
      '/#/',
      '/#/learn',
      '/#/practice',
      '/#/signs',
      '/#/signs/gallery',
      '/#/signs/match',
      '/#/profile',
      '/#/profile/achievements',
      '/#/sources',
    ]) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');
    }

    expect(offOrigin, 'nothing but the icon Kit leaves the origin during ordinary study').toEqual([]);
  });

  test('renders sign artwork from bundled images', async ({ page }) => {
    await page.goto('/#/signs/gallery');
    await page.waitForLoadState('networkidle');

    const broken = await page.evaluate(() =>
      [...document.querySelectorAll('img')]
        .filter((img) => img.complete && img.naturalWidth === 0)
        .map((img) => img.src),
    );
    expect(broken, 'every sign image resolves from the bundle').toEqual([]);
  });
});

test.describe('privacy', () => {
  test('sends nothing to any analytics or telemetry endpoint', async ({ page }) => {
    const suspicious: string[] = [];
    page.on('request', (request) => {
      if (
        /analytics|telemetry|sentry|mixpanel|amplitude|googletagmanager|doubleclick|facebook/i.test(
          request.url(),
        )
      ) {
        suspicious.push(request.url());
      }
    });

    await page.goto('/#/');
    await page.goto('/#/practice/quick');
    await page.waitForLoadState('networkidle');

    expect(suspicious).toEqual([]);
  });

  test('states the independence disclaimer and the privacy position', async ({ page }) => {
    await page.goto('/#/sources');
    await expect(
      page.getByText(/not affiliated with.*Government of Nova Scotia/i).first(),
    ).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Privacy' })).toBeVisible();
    await expect(page.getByText(/No analytics, tracking, advertising/i)).toBeVisible();
    await expect(page.getByText(/No backend service/i)).toBeVisible();
  });

  test('shows app and content version as separate facts', async ({ page }) => {
    // The native binary version and the learner-facing Content Version are
    // different concepts and must not be conflated.
    await page.goto('/#/sources');
    await expect(page.getByText('App version', { exact: true })).toBeVisible();
    await expect(page.getByText('Content version', { exact: true })).toBeVisible();
  });
});

test.describe('production build hygiene', () => {
  test('does not expose the developer achievement showroom', async ({ page }) => {
    await page.goto('/#/dev/achievements');
    // Route is DEV-only, so production falls through to the not-found screen.
    await expect(page.getByRole('heading', { name: /not found/i })).toBeVisible();
  });
});
