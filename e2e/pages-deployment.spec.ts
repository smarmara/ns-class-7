import { expect, test, type Page, type Request } from '@playwright/test';
import { isIconKit } from './helpers';

/**
 * GitHub Pages subdirectory regression suite.
 *
 * Everything here runs against a real production build mounted at
 * `/ns-class-7/` rather than at the domain root — the shape a GitHub
 * Pages *project* site actually has. That distinction is the whole point:
 * `pnpm dev` and `pnpm preview` both serve from `/`, so a root-absolute asset
 * path, a wrong PWA scope or a service worker registered at the wrong URL all
 * look perfectly healthy locally and only break once deployed.
 *
 * The suite therefore asserts two things the ordinary end-to-end tests cannot:
 * that the app works from a subpath at all, and that nothing 404s while doing
 * it.
 */

const BASE = '/ns-class-7/';

/** Records every response that failed, so a missing asset cannot pass silently. */
function trackFailures(page: Page) {
  const failures: string[] = [];

  page.on('response', (response) => {
    const status = response.status();
    if (status >= 400) failures.push(`${status} ${response.url()}`);
  });
  page.on('requestfailed', (request: Request) => {
    // Aborted navigations and cancelled preloads are noise, not defects.
    const failure = request.failure()?.errorText ?? '';
    if (/ERR_ABORTED|net::ERR_FAILED/.test(failure)) return;
    failures.push(`${failure} ${request.url()}`);
  });

  return failures;
}

/** Any request that fell back to the domain root instead of the base. */
function rootEscapes(requests: string[]): string[] {
  return requests.filter((url) => {
    const path = new URL(url).pathname;
    if (path === '/' || path === '/favicon.ico') return false;
    return !path.startsWith(BASE);
  });
}

test.describe('serving from a repository subpath', () => {
  test('loads the app and its core assets with no failed requests', async ({ page }) => {
    const failures = trackFailures(page);
    const requested: string[] = [];
    page.on('request', (r) => {
      if (r.url().startsWith('http://localhost:4180')) requested.push(r.url());
    });

    await page.goto(BASE);
    await expect(page.getByRole('navigation', { name: 'Primary' })).toBeVisible();
    await page.waitForLoadState('networkidle');

    expect(failures, 'no failed requests on first load').toEqual([]);
    expect(rootEscapes(requested), 'no request escaped the base path').toEqual([]);
  });

  test('index, JS, CSS and manifest all resolve under the base', async ({ request }) => {
    const index = await request.get(`${BASE}`);
    expect(index.ok()).toBe(true);
    const html = await index.text();

    // Every script/style the document pulls in must live under the base.
    const refs = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map((m) => m[1]!);
    const absolute = refs.filter((r) => r.startsWith('/'));
    expect(absolute.length, 'document references at least one absolute asset').toBeGreaterThan(0);
    for (const ref of absolute) {
      expect(ref, `${ref} must be under ${BASE}`).toContain(BASE);
      const response = await request.get(ref);
      expect(response.ok(), `${ref} should load`).toBe(true);
    }
  });

  test('the web app manifest is scoped to the base, not the domain root', async ({ request }) => {
    const response = await request.get(`${BASE}manifest.webmanifest`);
    expect(response.ok()).toBe(true);

    const manifest = (await response.json()) as {
      start_url: string;
      scope: string;
      id?: string;
      icons: { src: string }[];
    };

    // A scope of '/' would stop the browser treating these pages as the app,
    // which breaks installation on a project site.
    expect(manifest.scope).toBe(BASE);
    expect(manifest.start_url).toBe(BASE);
    expect(manifest.id).toBe(BASE);

    // Icons are manifest-relative, so they resolve under the base too.
    for (const icon of manifest.icons) {
      const iconResponse = await request.get(new URL(icon.src, `http://localhost:4180${BASE}`).toString());
      expect(iconResponse.ok(), `${icon.src} should load`).toBe(true);
    }
  });

  test('the service worker is served and scoped under the base', async ({ page, request }) => {
    const sw = await request.get(`${BASE}sw.js`);
    expect(sw.ok(), 'sw.js served from the base').toBe(true);

    await page.goto(BASE);
    const scope = await page.evaluate(async () => {
      if (!('serviceWorker' in navigator)) return 'unsupported';
      const ready = navigator.serviceWorker.ready.then((r) => r.scope);
      const timeout = new Promise<'none'>((resolve) => setTimeout(() => resolve('none'), 10_000));
      return Promise.race([ready, timeout]);
    });
    expect(scope).toBe(`http://localhost:4180${BASE}`);
  });

  test('fonts load from the base', async ({ page }) => {
    await page.goto(BASE);
    await page.evaluate(() => document.fonts.ready);
    const loaded = await page.evaluate(() => document.fonts.check('16px "Google Sans"'));
    expect(loaded, 'the bundled typeface resolved under the subpath').toBe(true);
  });
});

test.describe('learner journey from the subpath', () => {
  test('Home, Learn, Practice, Signs and Profile all open', async ({ page }) => {
    const failures = trackFailures(page);
    await page.goto(BASE);

    const nav = page.getByRole('navigation', { name: 'Primary' });
    await expect(nav).toBeVisible();

    for (const label of ['Learn', 'Practice', 'Signs', 'Profile', 'Home']) {
      await nav.getByRole('link', { name: label, exact: true }).click();
      await expect(page.locator('main')).toBeVisible();
      await page.waitForLoadState('networkidle');
    }

    expect(failures, 'no failed requests while navigating').toEqual([]);
  });

  test('a Rules drill opens and can be answered', async ({ page }) => {
    await page.goto(`${BASE}#/practice/quick`);
    const choices = page.locator('.choice');
    await expect(choices.first()).toBeVisible();
    await choices.first().click();
    // Marking the answer proves the question engine and its content reached
    // the browser intact from the subpath, not just that the shell rendered.
    await expect(page.locator('.feedback')).toBeVisible();
    await expect(page.locator('.feedback-verdict')).not.toBeEmpty();
  });

  test('a Road Sign drill opens and its artwork actually loads', async ({ page }) => {
    /*
     * The single most likely subpath failure: the 221 official Schedule images
     * are recorded in the approvals data as root-absolute paths, so without
     * rebasing they would resolve to the domain root and every sign would be a
     * broken image. `naturalWidth === 0` is how a broken <img> reports itself.
     */
    const failures = trackFailures(page);
    await page.goto(`${BASE}#/signs/gallery`);
    await page.waitForLoadState('networkidle');

    const images = await page.evaluate(() =>
      [...document.querySelectorAll('img')].map((img) => ({
        src: img.currentSrc || img.src,
        broken: img.complete && img.naturalWidth === 0,
      })),
    );

    expect(images.length, 'the catalogue rendered sign images').toBeGreaterThan(0);
    expect(images.filter((i) => i.broken).map((i) => i.src), 'no broken sign images').toEqual([]);
    for (const image of images) {
      expect(new URL(image.src).pathname, 'sign image served from the base').toContain(BASE);
    }
    expect(failures, 'no 404s loading sign artwork').toEqual([]);
  });

  test('Sign Match runs from the subpath', async ({ page }) => {
    const failures = trackFailures(page);
    await page.goto(`${BASE}#/signs/match`);
    await expect(page.locator('main')).toBeVisible();
    await page.waitForLoadState('networkidle');
    expect(failures).toEqual([]);
  });

  test('a practice exam can be started', async ({ page }) => {
    await page.goto(`${BASE}#/practice`);
    await expect(page.getByRole('button', { name: /start|begin/i }).first()).toBeVisible();
  });
});

test.describe('hash routing on a static host', () => {
  const routes = [
    '#/learn',
    '#/practice',
    '#/signs',
    '#/signs/gallery',
    '#/signs/match',
    '#/profile',
    '#/profile/achievements',
    '#/sources',
  ];

  for (const route of routes) {
    test(`${route} survives a direct load and a refresh`, async ({ page }) => {
      /*
       * The reason this app uses hash routing. On a static host there is no
       * server to rewrite `/ns-class-7/learn` back to index.html, so a
       * history route would 404 on refresh. The hash never reaches the server.
       */
      const failures = trackFailures(page);

      await page.goto(`${BASE}${route}`);
      await expect(page.locator('main')).toBeVisible();

      await page.reload();
      await expect(page.locator('main')).toBeVisible();
      expect(page.url()).toContain(route);

      expect(failures, `no failed requests on ${route}`).toEqual([]);
    });
  }
});

test.describe('production hygiene on the deployed build', () => {
  test('the developer showroom is not reachable', async ({ page }) => {
    await page.goto(`${BASE}#/dev/achievements`);
    await expect(page.getByRole('heading', { name: /not found/i })).toBeVisible();
  });

  /*
   * The Kit must survive subdirectory hosting.
   *
   * Every other asset in this build is rebased under /ns-class-7/, which
   * is exactly the bug to look for: a Kit URL that got treated as a local path
   * would become /ns-class-7/kit.fontawesome.com/… and silently 404,
   * leaving a fork with no icons and no error to explain it. The Kit is
   * absolute by construction — this test is what keeps it that way.
   */
  test('the icon Kit is loaded from its own origin, not rebased under the subpath', async ({
    page,
  }) => {
    await page.goto(`${BASE}#/`);

    const kitSrc = await page.locator('script[src*="fontawesome.com"]').first().getAttribute('src');
    expect(kitSrc, 'the Kit script is present in the deployed HTML').toBeTruthy();
    expect(kitSrc!, 'absolute Kit URL').toMatch(/^https:\/\/kit\.fontawesome\.com\//);
    expect(kitSrc!, 'not rebased under the deployment path').not.toContain(BASE);
  });

  // The Font Awesome Pro icon Kit is the one sanctioned off-origin host: Pro
  // artwork cannot ship in a public repository. It is decorative, and the app
  // works without it — see `font-awesome-kit.spec.ts`.
  test('nothing but the icon Kit is requested from outside the origin', async ({ page }) => {
    const offOrigin: string[] = [];
    page.on('request', (request) => {
      const url = request.url();
      if (isIconKit(url)) return;
      if (!url.startsWith('http://localhost:4180') && !url.startsWith('data:') && !url.startsWith('blob:')) {
        offOrigin.push(url);
      }
    });

    for (const route of ['#/', '#/learn', '#/signs/gallery', '#/profile']) {
      await page.goto(`${BASE}${route}`);
      await page.waitForLoadState('networkidle');
    }
    expect(offOrigin, 'the deployed app studies without the network').toEqual([]);
  });
});
