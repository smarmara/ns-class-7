import { expect, test, type Page } from '@playwright/test';

/**
 * Visual QA evidence for the Priority 6C catalogue cleanup.
 *
 * Runs only in the `shots` project. Evidence generation, not a gate — the
 * assertions that gate the build live in `sign-catalogue.spec.ts`.
 */

const OUT = 'test-results/sign-catalogue';

async function openCatalogue(page: Page, theme: 'light' | 'dark') {
  await page.emulateMedia({ colorScheme: theme });
  await page.goto('/#/signs/gallery');
  await expect(page.getByRole('heading', { name: 'Sign catalogue' })).toBeVisible();
  // Settle the lazy images before capturing.
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 40));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForLoadState('networkidle');
}

const SECTIONS = [
  'regulatory',
  'lane-use',
  'parking-stopping',
  'pedestrian-cyclist-school',
] as const;

for (const theme of ['light', 'dark'] as const) {
  test(`catalogue on a phone — ${theme}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openCatalogue(page, theme);
    await page.screenshot({ path: `${OUT}/mobile-390-${theme}.png`, fullPage: false });

    for (const section of SECTIONS) {
      await page.locator(`#signs-${section}`).scrollIntoViewIfNeeded();
      await page
        .locator(`#signs-${section}`)
        .screenshot({ path: `${OUT}/mobile-390-${theme}-${section}.png` });
    }
  });

  test(`catalogue on a wide screen — ${theme}`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await openCatalogue(page, theme);
    await page.screenshot({ path: `${OUT}/desktop-1280-${theme}.png`, fullPage: false });

    for (const section of SECTIONS) {
      await page.locator(`#signs-${section}`).scrollIntoViewIfNeeded();
      await page
        .locator(`#signs-${section}`)
        .screenshot({ path: `${OUT}/desktop-1280-${theme}-${section}.png` });
    }
  });
}
