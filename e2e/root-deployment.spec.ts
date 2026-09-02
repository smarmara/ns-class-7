/**
 * The production deployment shape: the app mounted at the domain root.
 *
 * Production is https://roadlearn.ca/ — a GitHub Pages site on a custom domain,
 * so the app lives at `/` rather than at the `/ns-class-7/` project path it was
 * first published under. That is a deployment change, not an application one,
 * but it is exactly the kind of change that breaks silently: the build
 * succeeds, the tests pass, and the deployed site is a blank page because
 * every asset URL carries a base that is not there any more.
 *
 * `e2e/pages-deployment.spec.ts` is the mirror of this file. It proves the
 * subdirectory case still works, for forks and project Pages. Neither replaces
 * the other: they are two different artifacts, served two different ways, and
 * production only depends on this one.
 *
 * This suite runs against the root build the main config serves on :4173.
 */
import { expect, test, type Page, type Request } from '@playwright/test';
import { isIconKit } from './helpers';

/** The production base. Not a subpath — that is the whole point of the file. */
const BASE = '/';

/** Fails the test on any 404 for the app's own assets. */
function trackFailures(page: Page): { failures: string[] } {
  const failures: string[] = [];
  page.on('response', (response) => {
    if (response.status() >= 400) failures.push(`${response.status()} ${response.url()}`);
  });
  page.on('requestfailed', (request: Request) => {
    // The icon Kit is allowed to fail; the app is built to work without it.
    if (!isIconKit(request.url())) failures.push(`failed ${request.url()}`);
  });
  return { failures };
}

test.describe('serving from the domain root', () => {
  test('loads the app and its core assets with no failed requests', async ({ page }) => {
    const { failures } = trackFailures(page);

    await page.goto(BASE);
    await expect(page.getByRole('navigation')).toBeVisible();
    await page.waitForLoadState('networkidle');

    expect(failures, 'no 404s at the root').toEqual([]);
  });

  test('resolves its own bundle from the root, with no base path left over', async ({ page }) => {
    await page.goto(BASE);

    const local = await page.evaluate(() =>
      [...document.querySelectorAll('script[src], link[href]')]
        .map((el) => el.getAttribute('src') ?? el.getAttribute('href')!)
        .filter((url) => url.startsWith('/')),
    );

    expect(local.length, 'the page loads local assets').toBeGreaterThan(0);
    for (const url of local) {
      expect(url, 'no project-site base survives').not.toMatch(/^\/ns-class-7\//);
    }
  });

  test('declares one canonical address', async ({ page }) => {
    /*
     * The same page answers at the apex, at www, and at the old project URL
     * that GitHub keeps redirecting. One canonical address is what keeps those
     * from reading as separate pages, and gives a shared link a stable URL.
     */
    await page.goto(BASE);
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    const ogUrl = await page.locator('meta[property="og:url"]').getAttribute('content');
    expect(canonical).toBe('https://roadlearn.ca/');
    expect(ogUrl).toBe('https://roadlearn.ca/');
  });
});

test.describe('the PWA is configured for a root deployment', () => {
  test('scope, start_url and id are all the root', async ({ page, request }) => {
    await page.goto(BASE);

    const href = await page.locator('link[rel="manifest"]').getAttribute('href');
    expect(href, 'a manifest is linked').toBeTruthy();
    expect(href!, 'the manifest itself is at the root').toMatch(/^\/[^/]/);

    const manifest = await (await request.get(href!)).json();

    /*
     * `scope` is what makes an installed app treat these URLs as its own. Get
     * it wrong and the browser either refuses to install or opens the app's own
     * links in a browser tab. `id` pins identity so moving host does not
     * register a second, duplicate installed app.
     */
    expect(manifest.scope).toBe(BASE);
    expect(manifest.start_url).toBe(BASE);
    expect(manifest.id).toBe(BASE);

    // Icons stay relative so they resolve against the manifest either way.
    for (const icon of manifest.icons) {
      expect(icon.src, 'icons are base-relative').not.toMatch(/^\//);
    }
  });

  test('every manifest icon actually exists at the root', async ({ request }) => {
    const manifest = await (await request.get('/manifest.webmanifest')).json();
    for (const icon of manifest.icons) {
      const response = await request.get(`/${icon.src}`);
      expect(response.status(), icon.src).toBe(200);
    }
  });

  test('the service worker is served and scoped at the root', async ({ page, request }) => {
    const sw = await request.get('/sw.js');
    expect(sw.status(), '/sw.js is served from the root').toBe(200);

    // A worker's scope cannot be broader than where it is served from, so a
    // root-served worker is what allows it to control the whole site.
    const body = await sw.text();
    expect(body).not.toMatch(/\/ns-class-7\//);

    await page.goto(BASE);
    const scope = await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.ready;
      return registration.scope;
    });
    expect(new URL(scope).pathname, 'registered scope').toBe(BASE);
  });

  test('serves the app again from cache after going offline', async ({ page, context }) => {
    await page.goto(BASE);
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.waitForLoadState('networkidle');

    await context.setOffline(true);
    await page.reload();

    // The point of the whole PWA: a learner on a bus with no signal still gets
    // the app, not a browser error page.
    await expect(page.getByRole('navigation')).toBeVisible();
    await context.setOffline(false);
  });
});

test.describe('hash routing on the root domain', () => {
  const ROUTES = [
    '#/learn',
    '#/practice',
    '#/signs',
    '#/signs/gallery',
    '#/signs/match',
    '#/study/signs/regulatory',
    '#/profile',
    '#/profile/achievements',
    '#/sources',
  ];

  for (const route of ROUTES) {
    test(`${route} survives a direct load and a refresh`, async ({ page }) => {
      const { failures } = trackFailures(page);

      /*
       * Hash routing is why a static host needs no rewrite rules: everything
       * after `#` never reaches the server, so `roadlearn.ca/#/learn` is just a
       * request for `/`. This is the property that makes a refresh on a deep
       * link work, and it is why the app stays on hash routing.
       */
      await page.goto(`${BASE}${route}`);
      await expect(page.getByRole('navigation')).toBeVisible();

      await page.reload();
      await expect(page.getByRole('navigation')).toBeVisible();
      await expect(page).toHaveURL(new RegExp(route.replace(/[#/]/g, '\\$&')));

      expect(failures, `no 404s on ${route}`).toEqual([]);
    });
  }
});

test.describe('learner journey from the root', () => {
  test('a Rules drill opens and can be answered', async ({ page }) => {
    await page.goto(`${BASE}#/practice/quick`);
    const choices = page.locator('.choice');
    await expect(choices.first()).toBeVisible();
    await choices.first().click();

    // Marking the answer proves the question engine and its content reached the
    // browser intact, not just that the shell rendered.
    await expect(page.locator('.feedback')).toBeVisible();
    await expect(page.locator('.feedback-verdict')).not.toBeEmpty();
  });

  test('a Road Sign drill opens and its official artwork loads', async ({ page }) => {
    const { failures } = trackFailures(page);
    await page.goto(`${BASE}#/study/signs/regulatory`);
    await expect(page.locator('.choice').first()).toBeVisible();
    await page.waitForLoadState('networkidle');

    /*
     * The 221 official crops are recorded in the approval data as root-absolute
     * paths and rebased at render time by src/assetUrl.ts. At base `/` that
     * rebasing is a no-op — worth pinning precisely because a bug there would
     * double a slash or leave a stale project path, and `naturalWidth === 0` is
     * how a broken <img> reports itself.
     */
    const broken = await page.evaluate(() =>
      [...document.querySelectorAll('img')]
        .filter((img) => img.complete && img.naturalWidth === 0)
        .map((img) => img.currentSrc || img.src),
    );
    expect(broken, 'no broken sign artwork').toEqual([]);
    expect(failures).toEqual([]);
  });

  test('the sign catalogue renders official crops from the root', async ({ page }) => {
    await page.goto(`${BASE}#/signs/gallery`);
    await expect(page.locator('.sign-card-art img').first()).toBeVisible();

    await page.waitForLoadState('networkidle');
    const images = await page.evaluate(() =>
      [...document.querySelectorAll('img')].map((img) => ({
        src: img.currentSrc || img.src,
        broken: img.complete && img.naturalWidth === 0,
      })),
    );

    expect(images.length, 'the catalogue rendered sign images').toBeGreaterThan(0);
    expect(images.filter((i) => i.broken).map((i) => i.src), 'no broken images').toEqual([]);
    for (const image of images) {
      // Served from the root, with no project path in front of it.
      expect(new URL(image.src).pathname, 'served from the root').not.toMatch(/^\/ns-class-7\//);
    }
  });

  test('Sign Match runs from the root', async ({ page }) => {
    const { failures } = trackFailures(page);
    await page.goto(`${BASE}#/signs/match`);
    await expect(page.locator('main')).toBeVisible();
    await page.waitForLoadState('networkidle');
    expect(failures).toEqual([]);
  });

  test('Practice opens its exam', async ({ page }) => {
    await page.goto(`${BASE}#/practice`);
    await page.getByRole('button', { name: 'Start practice exam' }).click();
    await expect(page.getByRole('button', { name: /Begin Rules/ })).toBeVisible();
  });

  test('Profile and achievement artwork load', async ({ page }) => {
    const { failures } = trackFailures(page);

    await page.goto(`${BASE}#/profile/achievements`);
    await page.waitForLoadState('networkidle');

    // Medals are inline SVG rather than fetched files, so the check that means
    // something is that they rendered and nothing 404'd fetching them.
    const medals = await page.locator('.steering-wheel-badge, .yield-sign-badge').count();
    expect(medals, 'achievement artwork renders').toBeGreaterThan(0);
    expect(failures).toEqual([]);
  });
});

test.describe('fonts and icons at the root', () => {
  test('serves its own font files from the root origin', async ({ page, baseURL }) => {
    const fonts: string[] = [];
    page.on('request', (request) => {
      if (/\.(woff2?|ttf|otf)$/.test(request.url())) fonts.push(request.url());
    });

    await page.goto(BASE);
    await page.evaluate(() => document.fonts.ready);

    expect(fonts.length, 'a local font is fetched').toBeGreaterThan(0);
    for (const url of fonts) {
      expect(url, `${url} is served by the app`).toContain(baseURL!);
      expect(url, 'not from a project subpath').not.toMatch(/\/ns-class-7\//);
    }
  });

  test('the Font Awesome Kit is not rebased onto the app origin', async ({ page }) => {
    /*
     * The failure this prevents: a Kit URL treated as a local path becomes
     * `https://roadlearn.ca/kit.fontawesome.com/…` and 404s silently, leaving a
     * deployment with no icons and nothing in the console explaining why.
     */
    await page.goto(BASE);
    const src = await page.locator('script[src*="fontawesome.com"]').first().getAttribute('src');
    expect(src).toBe('https://kit.fontawesome.com/7eba2de703.js');
  });
});
