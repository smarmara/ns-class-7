import { expect, test, type Page } from '@playwright/test';

/** Visual QA evidence for Priority 6F. `shots` project only. */
const OUT = 'test-results/sign-match';

async function open(page: Page, theme: 'light' | 'dark') {
  await page.emulateMedia({ colorScheme: theme });
  await page.goto('/#/signs/match');
  await expect(page.locator('.match-choice')).toHaveCount(2);
  await page.waitForLoadState('networkidle');
}

for (const theme of ['light', 'dark'] as const) {
  for (const [w, h] of [[390, 844], [320, 568], [1280, 900]] as const) {
    test(`sign match ${w}x${h} — ${theme}`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: h });
      await open(page, theme);
      await page.screenshot({ path: `${OUT}/match-${w}x${h}-${theme}.png` });

      // And the answered state, which is what the learner reads longest.
      await page.locator('.match-choice').first().click();
      await page.screenshot({ path: `${OUT}/match-${w}x${h}-${theme}-answered.png` });
    });
  }
}

test('related signs open on a catalogue card', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/#/signs/gallery?category=regulatory');
  const details = page.locator('.sign-variants').first();
  await details.locator('summary').click();
  await expect(details.locator('li').first()).toBeVisible();
  await details.scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${OUT}/related-signs-390.png` });
});
