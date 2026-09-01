import { expect, test, type Page } from '@playwright/test';

/**
 * Visual QA evidence for the Priority 6D hub refresh. `shots` project only —
 * the gating assertions live in `signs-hub.spec.ts`.
 */

const OUT = 'test-results/signs-hub';

async function openHub(page: Page, theme: 'light' | 'dark') {
  await page.emulateMedia({ colorScheme: theme });
  await page.goto('/#/signs');
  await expect(page.getByRole('heading', { name: 'Road signs' })).toBeVisible();
  await page.waitForLoadState('networkidle');
}

for (const theme of ['light', 'dark'] as const) {
  for (const [w, h] of [[390, 844], [375, 812], [320, 568], [1280, 900]] as const) {
    test(`hub ${w}x${h} — ${theme}`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: h });
      await openHub(page, theme);
      await page.screenshot({ path: `${OUT}/hub-${w}x${h}-${theme}.png`, fullPage: true });

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `${w}px horizontal overflow`).toBeLessThanOrEqual(1);
    });
  }
}
