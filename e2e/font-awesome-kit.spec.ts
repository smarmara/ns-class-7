/**
 * The icon Kit is decorative, and the app must prove it.
 *
 * Font Awesome Pro artwork is licensed per seat, so it cannot be committed to a
 * public repository. The Pro glyphs therefore load at runtime from the
 * maintainer's hosted Kit — the app's only off-origin dependency.
 *
 * That is a defensible trade only while a missing Kit is a cosmetic loss rather
 * than a broken app, and "we were careful" is not evidence. These tests block
 * *.fontawesome.com outright and then do the things a learner actually does:
 * navigate, answer a question, look at signs, read the sources page. If any of
 * that breaks without the Kit, the trade is off.
 *
 * They also guard the licensing boundary from the other side: with the Kit
 * blocked, no Pro glyph geometry may appear in the DOM, because the only way it
 * could is if someone had embedded the artwork in the bundle again.
 */
import { expect, test } from '@playwright/test';
import { blockIconKit, startPracticeExam } from './helpers';

test.describe('with the icon Kit blocked', () => {
  test.beforeEach(async ({ page }) => {
    await blockIconKit(page);
  });

  test('the app boots and the whole journey still works', async ({ page }) => {
    const crashes: string[] = [];
    page.on('pageerror', (error) => crashes.push(error.message));

    await page.goto('/#/');
    await expect(page.getByRole('navigation')).toBeVisible();

    for (const [route, heading] of [
      ['/#/learn', /learn/i],
      ['/#/signs', /signs/i],
      ['/#/profile', /progress|profile/i],
      ['/#/sources', /sources/i],
    ] as const) {
      await page.goto(route);
      await expect(page.getByRole('heading', { name: heading }).first()).toBeVisible();
    }

    expect(crashes, 'no unhandled error when the Kit is unavailable').toEqual([]);
  });

  test('a learner can still answer a question', async ({ page }) => {
    await startPracticeExam(page);
    await page.getByRole('button', { name: /Begin Rules/ }).click();

    // Which choice is right does not matter here — this is about whether the
    // question machinery works at all without the Kit. An exam withholds the
    // verdict until submission, so the observable outcome is that the answer
    // registers and the learner can move on.
    await expect(page.locator('.question-stem')).toBeVisible();
    await page.locator('.choice').first().click();
    await expect(page.locator('.choice').first()).toHaveAttribute('aria-pressed', 'true');
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await expect(page.locator('.question-stem')).toBeVisible();
  });

  test('navigation stays labelled and reachable without its icons', async ({ page }) => {
    await page.goto('/#/');

    // The labels are what make the app usable, so they are what must not depend
    // on the Kit. Each one is a real link, not just visible text.
    for (const label of ['Learn', 'Signs', 'Practice']) {
      await expect(page.getByRole('link', { name: new RegExp(label, 'i') }).first()).toBeVisible();
    }

    await page.getByRole('link', { name: /signs/i }).first().click();
    await expect(page).toHaveURL(/#\/signs/);
  });

  test('icon slots hold their space so nothing reflows', async ({ page }) => {
    await page.goto('/#/');
    const slot = page.locator('.app-icon').first();
    await expect(slot).toBeAttached();

    // An un-upgraded <i> must still occupy its box: a collapsed icon would
    // shift the layout the moment the Kit loaded on a later visit.
    const box = await slot.boundingBox();
    expect(box?.width ?? 0, 'icon slot reserves width').toBeGreaterThan(0);
    expect(box?.height ?? 0, 'icon slot reserves height').toBeGreaterThan(0);
  });

  test('no Pro glyph artwork is present in the bundle', async ({ page }) => {
    await page.goto('/#/');

    /*
     * With the Kit blocked, any Font Awesome <svg> in the DOM would mean the
     * artwork came from the bundle — which is exactly what must never be
     * committed. This project's own sign SVGs are unrelated and live under
     * /#/signs, not on the dashboard chrome.
     */
    const faSvgs = await page.locator('svg[data-prefix], svg.svg-inline--fa').count();
    expect(faSvgs, 'no Font Awesome artwork is bundled').toBe(0);
  });
});

test.describe('with the icon Kit available', () => {
  test('the Kit loader is requested from the expected host', async ({ page }) => {
    const requested: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('fontawesome.com')) requested.push(request.url());
    });

    await page.goto('/#/');
    await page.waitForLoadState('networkidle');

    // Whether the request succeeds depends on the network this test runs on, so
    // assert on what the app *asks for*: the Kit, from the Kit host, and
    // nothing else off-origin. Whether it renders is Font Awesome's job.
    expect(requested.length, 'the app asks for its Kit').toBeGreaterThan(0);
    for (const url of requested) {
      expect(url, 'only the sanctioned Kit hosts').toMatch(
        /^https:\/\/(?:kit|ka-p)\.fontawesome\.com\//,
      );
    }
  });

  test('a replaced icon stays hidden from assistive technology', async ({ page }) => {
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');

    /*
     * Font Awesome swaps each <i> for an <svg> and gives it `role="img"`. That
     * is fine only because the `aria-hidden` this app sets survives the swap —
     * otherwise a screen reader would announce a nameless image next to every
     * label it already reads. Worth pinning: it depends on FA's behaviour, not
     * on ours.
     */
    const replaced = page.locator('svg.svg-inline--fa');
    const count = await replaced.count();
    test.skip(count === 0, 'the Kit did not load in this environment');

    for (let i = 0; i < count; i++) {
      const icon = replaced.nth(i);
      const hidden = await icon.getAttribute('aria-hidden');
      const label = await icon.getAttribute('aria-label');
      expect(
        hidden === 'true' || Boolean(label),
        'each icon is either hidden or named',
      ).toBe(true);
    }
  });
});
