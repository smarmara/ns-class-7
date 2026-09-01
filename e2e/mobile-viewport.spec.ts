import { expect, test, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';

/**
 * Viewport-first guarantees for the question screens, and first-viewport
 * guarantees for Home.
 *
 * The product rule for a *question* screen is "try very hard to fit normal
 * content, scroll gracefully for exceptional content". These tests encode the
 * first half: at the primary design sizes, with default text scaling and
 * ordinary question content, they should not need meaningful vertical
 * scrolling.
 *
 * **Home is deliberately different.** It used to be held to the same
 * whole-page rule, which is what compressed the Sign Match feature into a 44px
 * navigation row — the page had about 39px of slack at 375x812, so any real
 * feature broke the assertion. That was the artificial requirement winning over
 * the product. The rule is now:
 *
 *   The primary learning action and the essential progress context must be
 *   visible in the first viewport. Secondary feature content may extend below
 *   the fold. Home should stay compact and avoid unnecessary scrolling, and
 *   must never scroll horizontally.
 *
 * `Home first viewport` below encodes that. It is a stronger test than the old
 * one in the ways that matter — it checks what the learner can actually see and
 * reach, not just a page height.
 *
 * The assertions are deliberately tolerant. They compare scrollHeight against
 * clientHeight with a small allowance rather than demanding pixel equality,
 * because sub-pixel rounding and font metrics move by a pixel or two between
 * runs and a brittle assertion here would be worse than no assertion.
 *
 * The 320x568 stress size is measured and reported but never asserted for
 * height: a fallback scroll there is correct behaviour, not a bug.
 */

/** Allowance for sub-pixel rounding and font-metric drift. */
const TOLERANCE = 8;

interface Measurement {
  screen: string;
  viewport: string;
  clientHeight: number;
  scrollHeight: number;
  overflow: number;
  fits: boolean;
  /** Set on sampled screens: how many questions were measured, and how many fit. */
  sampled?: { questions: number; fitting: number; medianOverflow: number; maxOverflow: number };
}

const OUT_DIR = 'test-results/ux-redesign';
const SHARD_DIR = `${OUT_DIR}/viewport`;

/**
 * Playwright runs tests across worker *processes*, so a module-level array is
 * per-worker and the last worker to finish would overwrite everyone else's
 * results. Each test writes its own shard instead; the globalTeardown in
 * playwright.config.ts merges them into one report.
 */
function record(result: Measurement): void {
  mkdirSync(SHARD_DIR, { recursive: true });
  const slug = `${result.screen}-${result.viewport}`.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  writeFileSync(`${SHARD_DIR}/${slug}.json`, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
}

/** Let layout settle — fonts, lazy artwork — before measuring. */
async function settle(page: Page): Promise<void> {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(150);
}

async function overflowOf(page: Page): Promise<{ clientHeight: number; scrollHeight: number }> {
  return page.evaluate(() => ({
    clientHeight: document.documentElement.clientHeight,
    scrollHeight: document.documentElement.scrollHeight,
  }));
}

async function measure(page: Page, screen: string, viewport: string): Promise<Measurement> {
  await settle(page);
  const { clientHeight, scrollHeight } = await overflowOf(page);
  const result: Measurement = {
    screen,
    viewport,
    clientHeight,
    scrollHeight,
    overflow: scrollHeight - clientHeight,
    fits: scrollHeight - clientHeight <= TOLERANCE,
  };
  record(result);
  return result;
}

async function gotoHome(page: Page) {
  await page.goto('/#/');
  await expect(page.getByRole('heading', { name: /Good (morning|afternoon|evening)/ })).toBeVisible();
}

/** A practice question with no artwork. */
async function gotoTextQuestion(page: Page) {
  await page.goto('/#/study/traffic-signals');
  await expect(page.locator('.question-stem')).toBeVisible();
  for (let i = 0; i < 8; i++) {
    if ((await page.locator('.sign-stage').count()) === 0) return;
    await page.locator('.choice').first().click();
    await page.getByRole('button', { name: /Next question|Finish/ }).click();
    await expect(page.locator('.question-stem')).toBeVisible();
  }
}

/** A sign question — one that actually displays artwork. */
async function gotoSignQuestion(page: Page) {
  await page.goto('/#/signs/all');
  await expect(page.locator('.question-stem')).toBeVisible();
  for (let i = 0; i < 8; i++) {
    if ((await page.locator('.sign-stage img, .sign-stage svg').count()) > 0) return;
    await page.locator('.choice').first().click();
    await page.getByRole('button', { name: /Next question|Finish/ }).click();
    await expect(page.locator('.question-stem')).toBeVisible();
  }
}

async function gotoExamQuestion(page: Page) {
  await page.goto('/#/practice');
  await page.getByRole('button', { name: 'Start practice exam' }).click();
  await page.getByRole('button', { name: /Begin Rules/ }).click();
  await expect(page.locator('.question-stem')).toBeVisible();
}

const SCREENS: Array<[string, (page: Page) => Promise<void>]> = [
  ['Home', gotoHome],
  ['Text question', gotoTextQuestion],
  ['Sign question', gotoSignQuestion],
  ['Exam question', gotoExamQuestion],
];

/**
 * Screens still held to the whole-page no-scroll rule.
 *
 * Home is measured and reported for the record, but is asserted by
 * `Home first viewport` instead — see the note at the top of this file.
 */
const FIT_ASSERTED = new Set(['Text question', 'Sign question']);

/** The two primary design targets, where fitting is a product requirement. */
const PRIMARY = [
  { label: '390x844', width: 390, height: 844 },
  { label: '375x812', width: 375, height: 812 },
];

/* -------------------------------------------------------------- single-shot */

/**
 * Home and the two practice-style question screens draw from a scoped pool and
 * measure identically run to run, so a single measurement is a fair assertion.
 */
for (const size of PRIMARY) {
  for (const [name, open] of SCREENS.filter(([n]) => FIT_ASSERTED.has(n))) {
    test(`${name} fits at ${size.label}`, async ({ page }) => {
      await page.setViewportSize({ width: size.width, height: size.height });
      await open(page);
      const m = await measure(page, name, size.label);
      expect(
        m.overflow,
        `${name} at ${size.label}: scrollHeight ${m.scrollHeight} vs clientHeight ${m.clientHeight}`,
      ).toBeLessThanOrEqual(TOLERANCE);
    });
  }
}

/**
 * Home's replacement guarantee.
 *
 * What matters is not that the page ends within the viewport, but that the
 * learner opens the app and immediately sees where to study and how they are
 * doing — and that everything below stays reachable and never sideways.
 */
for (const size of [...PRIMARY, { label: '320x568', width: 320, height: 568 }]) {
  test(`Home first viewport at ${size.label}`, async ({ page }) => {
    await page.setViewportSize({ width: size.width, height: size.height });
    await gotoHome(page);
    await settle(page);

    // Recorded for the report even though height is no longer asserted.
    const m = await measure(page, 'Home', size.label);

    // 1. Never sideways.
    const horizontal = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(horizontal, `Home scrolls horizontally at ${size.label}`).toBeLessThanOrEqual(1);

    // 2. The primary learning action is visible without scrolling.
    const hero = page.locator('.hero-module').first();
    await expect(hero).toBeVisible();
    const heroBox = (await hero.boundingBox())!;
    expect(
      heroBox.y + heroBox.height,
      `Home hero is not fully in the first viewport at ${size.label}`,
    ).toBeLessThanOrEqual(size.height);

    // 3. So is the essential progress context.
    const stats = page.locator('.bento').first();
    const statsBox = (await stats.boundingBox())!;
    expect(
      statsBox.y,
      `Home progress summary starts below the fold at ${size.label}`,
    ).toBeLessThan(size.height);

    // 4. The Sign Match feature is reachable and can be read clear of the
    //    bottom nav. Centring it is what a learner scrolling to it achieves;
    //    a minimal scroll can legitimately leave it tucked under the bar.
    const feature = page.locator('.match-feature');
    await expect(feature).toBeAttached();
    await feature.evaluate((el) => el.scrollIntoView({ block: 'center' }));
    await settle(page);
    await expect(feature).toBeVisible();
    const overlap = await page.evaluate(() => {
      const panel = document.querySelector('.match-feature')!.getBoundingClientRect();
      const nav = document.querySelector('nav')?.getBoundingClientRect();
      if (!nav) return 0;
      return Math.max(0, panel.bottom - nav.top);
    });
    expect(overlap, `Sign Match overlaps the navigation at ${size.label}`).toBeLessThanOrEqual(1);

    // 5. Still compact: Home is a screen, not an endless page.
    expect(
      m.scrollHeight,
      `Home has grown beyond a compact screen at ${size.label}`,
    ).toBeLessThan(size.height * 2);
  });
}

/* ------------------------------------------------------------------ sampled */

/**
 * A practice-exam section draws a random 20-question paper from the whole
 * Rules bank, which includes the longest stems in the app. Asserting that one
 * arbitrary draw fits would be asserting the opposite of the product rule: a
 * genuinely long question is *supposed* to scroll.
 *
 * So the whole section is sampled through the jump pad and judged on the shape
 * of the distribution instead:
 *
 *   - the median question must fit — that is the "normally fits" promise;
 *   - at least 70% must fit — a real regression (extra chrome, bigger answer
 *     padding) collapses this toward zero, while one or two long questions
 *     leave it comfortably above.
 *
 * Measured baselines over full sections: 95–100% fit at 390x844 and 75–90% at
 * 375x812, median 0 in every trial, worst single overflow 27px.
 */
const MIN_FIT_RATE = 0.7;

for (const size of PRIMARY) {
  test(`Exam questions normally fit at ${size.label}`, async ({ page }) => {
    await page.setViewportSize({ width: size.width, height: size.height });
    await gotoExamQuestion(page);

    const overflows: number[] = [];
    let last = { clientHeight: size.height, scrollHeight: size.height };
    const total = await page.locator('.exam-grid button').count();

    for (let i = 0; i < total; i++) {
      await page.locator('.exam-grid button').nth(i).click();
      await settle(page);
      last = await overflowOf(page);
      overflows.push(last.scrollHeight - last.clientHeight);
    }

    const sorted = [...overflows].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)] ?? 0;
    const fitting = overflows.filter((o) => o <= TOLERANCE).length;
    const rate = fitting / overflows.length;

    record({
      screen: 'Exam question',
      viewport: size.label,
      clientHeight: last.clientHeight,
      scrollHeight: last.clientHeight + median,
      overflow: median,
      fits: median <= TOLERANCE,
      sampled: {
        questions: overflows.length,
        fitting,
        medianOverflow: median,
        maxOverflow: Math.max(...overflows),
      },
    });

    expect(
      median,
      `median exam question at ${size.label} overflowed by ${median}px across ${overflows.length} questions`,
    ).toBeLessThanOrEqual(TOLERANCE);

    expect(
      rate,
      `only ${fitting}/${overflows.length} exam questions fit at ${size.label} ` +
        `(overflows: ${overflows.filter((o) => o > TOLERANCE).join(', ') || 'none'})`,
    ).toBeGreaterThanOrEqual(MIN_FIT_RATE);
  });
}

/* ------------------------------------------------------------ stress sizing */

/**
 * 320x568 is a stress size, not a design size. Content is measured and
 * reported; scrolling here is an accepted fallback, so nothing is asserted
 * about fit — only that the layout never scrolls sideways.
 */
for (const [name, open] of SCREENS) {
  test(`${name} degrades gracefully at 320x568`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await open(page);
    await measure(page, name, '320x568');

    const horizontal = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(horizontal, `${name} must not scroll horizontally at 320px`).toBeLessThanOrEqual(1);
  });
}

for (const [name, path, heading] of [
  ['Practice exam', '/#/practice', 'Practice exam'],
  ['Profile', '/#/profile', 'Profile'],
] as const) {
  test(`${name} degrades gracefully at 320x568`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto(path);
    await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
    const horizontal = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(horizontal, `${name} must not scroll horizontally at 320px`).toBeLessThanOrEqual(1);
  });
}

test('content screens are allowed to scroll', async ({ page }) => {
  // The complement of the rule above: browsing screens are content-first and
  // must not be compressed to fit. This asserts they are reachable and render,
  // never that they fit.
  await page.setViewportSize({ width: 390, height: 844 });
  for (const [path, heading] of [
    ['/#/learn', 'Learn'],
    ['/#/practice', 'Practice exam'],
    ['/#/signs', 'Road signs'],
    ['/#/profile', 'Profile'],
  ] as const) {
    await page.goto(path);
    await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
    const horizontal = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(horizontal, `${heading} must not scroll horizontally`).toBeLessThanOrEqual(1);
  }
});
