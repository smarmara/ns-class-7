import { expect, test } from '@playwright/test';

/**
 * Typography must be local.
 *
 * A remote font is not merely slow — it is unstyled or invisible text the first
 * time a learner opens the app with no signal, and text is the whole product.
 * So Google Sans is self-hosted and these tests fail if that ever regresses.
 *
 * Font Awesome **Pro** icons are the deliberate exception. Pro artwork is
 * licensed per seat and cannot be redistributed through a public repository, so
 * those glyphs come from the maintainer's hosted Kit at runtime. That is
 * decorative chrome: every icon sits beside a text label, and the app is fully
 * usable when the Kit does not load — asserted in `font-awesome-kit.spec.ts`.
 * Free-tier icons remain bundled.
 */

test('never requests fonts or icons from a third-party host', async ({ page }) => {
  const external: string[] = [];
  page.on('request', (request) => {
    const url = request.url();
    // The project's own Font Awesome Kit is expected; anything else is not.
    if (/fonts\.googleapis\.com|fonts\.gstatic\.com|use\.fontawesome\.com|cdn\./.test(url)) {
      external.push(url);
    }
  });

  await page.goto('/#/');
  await page.evaluate(() => document.fonts.ready);
  await page.goto('/#/practice/quick');
  await page.evaluate(() => document.fonts.ready);

  expect(external, 'no remote font or unexpected icon-CDN requests').toEqual([]);
});

test('Google Sans is the applied typeface and is genuinely loaded', async ({ page }) => {
  await page.goto('/#/');
  await page.evaluate(() => document.fonts.ready);

  const applied = await page.evaluate(() => {
    const heading = document.querySelector('h1');
    return {
      body: getComputedStyle(document.body).fontFamily,
      heading: heading ? getComputedStyle(heading).fontFamily : '',
      // `check` is true only once a face matching the family has loaded.
      loaded: document.fonts.check('16px "Google Sans"'),
      faces: [...document.fonts].map((f) => `${f.family} ${f.weight} ${f.status}`),
    };
  });

  expect(applied.body).toContain('Google Sans');
  expect(applied.heading).toContain('Google Sans');
  expect(applied.loaded, 'a Google Sans face is loaded, not just requested').toBe(true);
  // The fallback stack is still declared, so a failed font load degrades to a
  // system sans rather than to a serif.
  expect(applied.body).toMatch(/system-ui|-apple-system|sans-serif/);
  expect(applied.faces.some((f) => f.startsWith('Google Sans'))).toBe(true);
});

test('serves Google Sans from the application origin', async ({ page, baseURL }) => {
  const fontUrls: string[] = [];
  page.on('response', (response) => {
    if (/\.woff2?($|\?)/.test(response.url())) fontUrls.push(response.url());
  });

  await page.goto('/#/');
  await page.evaluate(() => document.fonts.ready);

  expect(fontUrls.length, 'at least one local font file was fetched').toBeGreaterThan(0);
  for (const url of fontUrls) {
    expect(url.startsWith(baseURL!), `${url} must be served from the app origin`).toBe(true);
  }
});

test('navigation icons render offline from bundled paths', async ({ page, context }) => {
  await page.goto('/#/');
  await page.evaluate(() => navigator.serviceWorker.ready);

  await context.setOffline(true);
  await page.reload();

  const icons = page.locator('.nav .nav-icon svg');
  await expect(icons).toHaveCount(5);
  for (let i = 0; i < 5; i++) {
    // An inline <path> with real geometry: the icon is drawn, not a blank box.
    const d = await icons.nth(i).locator('path').getAttribute('d');
    expect(d && d.length, 'icon path data is bundled').toBeGreaterThan(20);
  }

  // Labels do the semantic work; icons never carry meaning alone.
  for (const label of ['Home', 'Learn', 'Practice', 'Signs', 'Profile']) {
    await expect(
      page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: label }),
    ).toBeVisible();
  }

  await context.setOffline(false);
});
