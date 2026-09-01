import { expect, test, type Page } from '@playwright/test';

/** Visual QA evidence. `shots` project only. */
const OUT = 'test-results/profile-runs';

async function endRun(page: Page) {
  for (let n = 0; n < 40; n++) {
    const choice = page.locator('.match-choice').nth(0);
    await choice.click();
    if ((await choice.getAttribute('data-state')) === 'correct') {
      await page.getByRole('button', { name: 'Next', exact: true }).click();
    } else {
      await page.getByRole('button', { name: 'See your run' }).click();
      return;
    }
  }
}

for (const [w, h] of [[390, 844], [320, 568]] as const) {
  test(`sign match active ${w}`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: h });
    await page.goto('/#/signs/match');
    await expect(page.locator('.match-choice')).toHaveCount(2);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: `${OUT}/match-active-${w}.png` });
  });

  test(`sign match result ${w}`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: h });
    await page.goto('/#/signs/match');
    await expect(page.locator('.match-choice')).toHaveCount(2);
    await endRun(page);
    await page.screenshot({ path: `${OUT}/match-result-${w}.png` });
  });
}

for (const theme of ['light', 'dark'] as const) {
  for (const [w, h] of [[390, 844], [320, 568], [1280, 900]] as const) {
    test(`home ${w} ${theme}`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: theme });
      await page.setViewportSize({ width: w, height: h });
      await page.goto('/#/');
      await expect(page.locator('.match-feature')).toBeVisible();
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: `${OUT}/home-${w}-${theme}.png`, fullPage: true });
    });

    test(`profile ${w} ${theme}`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: theme });
      await page.setViewportSize({ width: w, height: h });
      await page.goto('/#/profile');
      await expect(page.locator('.profile-card')).toBeVisible();
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: `${OUT}/profile-${w}-${theme}.png`, fullPage: true });
    });
  }
}
