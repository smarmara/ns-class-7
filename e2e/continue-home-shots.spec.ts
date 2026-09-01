import { expect, test, type Page } from '@playwright/test';
import { answerCurrentCorrectly, loadBank } from './helpers';

/** Visual QA evidence. `shots` project only. */
const OUT = 'test-results/continue-home';

const bank = loadBank();
const bankByStem = new Map<string, ReturnType<typeof loadBank>>();
for (const q of bank) {
  const key = q.question.trim().replace(/\s+/g, ' ');
  bankByStem.set(key, [...(bankByStem.get(key) ?? []), q]);
}

async function home(page: Page, theme: 'light' | 'dark') {
  await page.emulateMedia({ colorScheme: theme });
  await page.goto('/#/');
  await expect(page.locator('.match-feature')).toBeVisible();
  await page.waitForLoadState('networkidle');
}

for (const theme of ['light', 'dark'] as const) {
  for (const [w, h] of [[390, 844], [375, 812], [320, 568], [1280, 900]] as const) {
    test(`home ${w}x${h} — ${theme}`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: h });
      await home(page, theme);
      await page.screenshot({ path: `${OUT}/home-${w}x${h}-${theme}.png`, fullPage: true });
    });
  }
}

for (const [w, h] of [[390, 844], [320, 568]] as const) {
  test(`completion ${w}x${h}`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: h });
    const topic = 'traffic-signals';
    const size = Math.min(10, bank.filter((q) => q.topic === topic).length);
    await page.goto(`/#/study/${topic}`);
    for (let i = 0; i < size; i++) {
      await answerCurrentCorrectly(page, bankByStem);
      await page.getByRole('button', { name: /Next question|Finish/ }).click();
    }
    await expect(page.getByRole('link', { name: /^Continue to / })).toBeVisible();
    await page.screenshot({ path: `${OUT}/completion-${w}x${h}.png`, fullPage: true });
  });
}
