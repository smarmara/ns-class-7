import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { answerCurrentCorrectly, loadBank } from './helpers';

/**
 * The private-local-progress lifecycle, end to end:
 * study -> reload -> progress remains -> back up -> reset -> restore -> back.
 *
 * Run on the normal web/PWA build. The downloaded backup is read back from
 * Playwright's temporary download directory and restored through the app; no
 * file is left in the repository.
 */

const bank = loadBank();
const bankByStem = new Map<string, ReturnType<typeof loadBank>>();
for (const q of bank) {
  const key = q.question.trim().replace(/\s+/g, ' ');
  const list = bankByStem.get(key) ?? [];
  list.push(q);
  bankByStem.set(key, list);
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(async () => {
    localStorage.clear();
    for (const db of await indexedDB.databases()) {
      if (db.name) indexedDB.deleteDatabase(db.name);
    }
  });
  await page.reload();
  await expect(page.getByRole('heading', { name: /Good (morning|afternoon|evening)/ })).toBeVisible();
});

function nav(page: Page, name: string) {
  return page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name });
}

function answeredStat(page: Page) {
  return page.locator('.stat-cell', { hasText: 'Answered' }).locator('.stat-cell-value');
}

/** Learner statistics live on the Progress screen. */
async function openProgress(page: Page): Promise<void> {
  await nav(page, 'Profile').click();
  await expect(page.getByRole('heading', { name: 'Your progress' })).toBeVisible();
}

async function totalXp(page: Page): Promise<number> {
  const text =
    (await page.locator('.metric', { hasText: 'total XP' }).locator('.metric-value').textContent()) ??
    '';
  const match = text.match(/(\d+)/);
  return match ? Number(match[1]) : 0;
}

test('progress survives a reload, a backup and a restore', async ({ page }) => {
  // 1-2. Start with empty progress, then study.
  await openProgress(page);
  expect(await totalXp(page)).toBe(0);
  await expect(answeredStat(page)).toHaveText('0');

  // 3. Answer several questions correctly and earn XP.
  await page.goto('/#/practice/quick');
  for (let i = 0; i < 3; i++) {
    await answerCurrentCorrectly(page, bankByStem);
    await page.getByRole('button', { name: /Next question|Finish/ }).click();
  }

  // 4. Bookmark the question now on screen.
  await page.getByRole('button', { name: /^Save$/ }).click();
  await expect(page.getByRole('button', { name: /Saved/ })).toHaveAttribute('aria-pressed', 'true');

  await openProgress(page);
  expect(await totalXp(page)).toBe(30);
  await expect(answeredStat(page)).toHaveText('3');

  // 5. Close/reload: progress must come back. The reload lands back on
  // Progress, which is where the figures being checked are shown.
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Your progress' })).toBeVisible();
  expect(await totalXp(page)).toBe(30);
  await expect(answeredStat(page)).toHaveText('3');

  // The bookmark survived too.
  await nav(page, 'Profile').click();
  await page.getByRole('link', { name: /Saved questions/ }).click();
  await expect(page.getByRole('heading', { name: 'Saved questions' })).toBeVisible();
  await expect(page.locator('.choice').first()).toBeVisible();

  // 6. Export a backup.
  await page.goto('/#/sources');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Back up progress' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^ns-class7-progress-\d{4}-\d{2}-\d{2}\.json$/);

  const backupPath = await download.path();
  expect(backupPath).toBeTruthy();
  const backupJson = readFileSync(backupPath!, 'utf8');
  const parsed = JSON.parse(backupJson);
  expect(parsed.format).toBe('ns-class7-progress');
  expect(parsed.schemaVersion).toBe(1);
  expect(typeof parsed.savedAt).toBe('string');
  expect(parsed.progress).toBeDefined();
  expect(parsed.engagement).toBeDefined();
  expect(parsed.progress.questions).toBeDefined();

  // The backup carries no personally identifying or tracking fields.
  const body = backupJson.toLowerCase();
  for (const forbidden of ['"name"', '"email"', '"uuid"', '"device"', '"advertiser"', '"analytics"']) {
    expect(body).not.toContain(forbidden);
  }

  // 7. Reset progress deliberately.
  await page.getByRole('button', { name: 'Reset all progress' }).click();
  await page.getByRole('button', { name: 'Erase everything' }).click();
  await openProgress(page);
  expect(await totalXp(page)).toBe(0);
  await expect(answeredStat(page)).toHaveText('0');

  // A reload after reset must stay empty.
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Your progress' })).toBeVisible();
  expect(await totalXp(page)).toBe(0);

  // 8-9. Restore the backup through the app.
  await page.goto('/#/sources');
  const buffer = readFileSync(backupPath!);
  await page
    .locator('input[type="file"]')
    .setInputFiles({ name: 'ns-class7-progress-backup.json', mimeType: 'application/json', buffer });
  await page.getByRole('button', { name: 'Restore this backup' }).click();
  await expect(page.getByText(/Progress restored from your backup/)).toBeVisible();

  // 10. Progress is back on the Dashboard, readiness and queues.
  await openProgress(page);
  expect(await totalXp(page)).toBe(30);
  await expect(answeredStat(page)).toHaveText('3');

  await nav(page, 'Profile').click();
  await page.getByRole('link', { name: /Saved questions/ }).click();
  await expect(page.getByRole('heading', { name: 'Saved questions' })).toBeVisible();
  await expect(page.locator('.choice').first()).toBeVisible();
});

test('rejects a file that is not a valid progress backup without touching progress', async ({
  page,
}) => {
  await page.goto('/#/practice/quick');
  await answerCurrentCorrectly(page, bankByStem);
  await page.getByRole('button', { name: /Next question|Finish/ }).click();

  await page.goto('/#/sources');
  const notJson = Buffer.from('this is not json');
  await page
    .locator('input[type="file"]')
    .setInputFiles({ name: 'not-a-backup.json', mimeType: 'application/json', buffer: notJson });
  await expect(
    page.getByText("This doesn't appear to be a valid NS Class 7 progress backup."),
  ).toBeVisible();

  // The invalid file was rejected: no restore confirmation, progress intact.
  await expect(page.getByRole('button', { name: 'Restore this backup' })).toHaveCount(0);

  await openProgress(page);
  await expect(answeredStat(page)).toHaveText('1');
  expect(await totalXp(page)).toBe(10);
});