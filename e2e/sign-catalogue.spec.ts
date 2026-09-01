import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { expect, test } from '@playwright/test';

/**
 * The learner sign catalogue.
 *
 * Guards the two defects Priority 6C fixed: Reference signs rendering a
 * missing-artwork warning instead of their approved image, and lane-control
 * signs being dumped into a catch-all Regulatory section.
 */

const dataDir = resolve(dirname(fileURLToPath(import.meta.url)), '../data/signs');
const read = (file: string) => JSON.parse(readFileSync(resolve(dataDir, file), 'utf8'));

const categoryData = read('learner-categories.json') as {
  taxonomy: { id: string; label: string }[];
  categories: Record<string, string>;
};
const scopeData = read('learner-scope.json') as {
  classifications: Record<string, { scope: string; displayName: string }>;
};

const learnerIds = Object.entries(scopeData.classifications)
  .filter(([, c]) => c.scope === 'core' || c.scope === 'reference')
  .map(([id]) => id);

const expectedCounts = new Map<string, number>();
for (const id of learnerIds) {
  const category = categoryData.categories[id]!;
  expectedCounts.set(category, (expectedCounts.get(category) ?? 0) + 1);
}

async function openCatalogue(page: import('@playwright/test').Page) {
  await page.goto('/#/signs/gallery');
  await expect(page.getByRole('heading', { name: 'Sign catalogue' })).toBeVisible();
}

test.describe('sign catalogue', () => {
  test('loads every learner sign with real artwork and no missing-art warnings', async ({
    page,
  }) => {
    await openCatalogue(page);

    // One card per top-level learner entry.
    const cards = page.locator('.sign-gallery > li');
    await expect(cards).toHaveCount(learnerIds.length);

    // The fallback placeholder must not appear anywhere on the page.
    await expect(page.getByText('⚠️')).toHaveCount(0);
    await expect(page.getByRole('img', { name: /Missing sign artwork/ })).toHaveCount(0);

    // Every card holds a rendered visual.
    const visuals = page.locator('.sign-card-art img, .sign-card-art svg');
    await expect(visuals).toHaveCount(learnerIds.length);
  });

  test('serves each official crop successfully, not as a broken image', async ({ page }) => {
    const failed: string[] = [];
    page.on('response', (response) => {
      if (response.url().includes('/signs/') && !response.ok()) failed.push(response.url());
    });
    await openCatalogue(page);

    // Force the lazy images to load by walking to the bottom of the page.
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 600) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 30));
      }
    });
    await page.waitForLoadState('networkidle');

    const broken = await page.evaluate(() =>
      [...document.querySelectorAll('.sign-card-art img')]
        .filter((img) => (img as HTMLImageElement).naturalWidth === 0)
        .map((img) => (img as HTMLImageElement).getAttribute('src')),
    );
    expect(broken).toEqual([]);
    expect(failed).toEqual([]);
  });

  test('shows every category with the count the data declares', async ({ page }) => {
    await openCatalogue(page);

    for (const { id, label } of categoryData.taxonomy) {
      const count = expectedCounts.get(id)!;
      await expect(page.getByRole('heading', { name: `${label} (${count})` })).toBeVisible();
    }
  });

  test('groups lane-control signs under Lane Use & Turns, not Regulatory', async ({ page }) => {
    await openCatalogue(page);

    const laneUse = page.locator('#signs-lane-use');
    const regulatory = page.locator('#signs-regulatory');

    // Representative families that used to sit in the Regulatory dump.
    for (const name of [
      'Straight or Right Turn', // lane-direction
      'Reserved Lane — Overhead', // reserved lane
      'Roundabout Lane — Through Only', // roundabout lane control
      'No Lane Change', // no-lane-change family
      'Two-Lane Control — Both Lanes Left Turn', // multi-lane diagram
    ]) {
      await expect(laneUse.getByText(name, { exact: true })).toHaveCount(1);
      await expect(regulatory.getByText(name, { exact: true })).toHaveCount(0);
    }

    await expect(laneUse.locator('.sign-gallery > li')).toHaveCount(expectedCounts.get('lane-use')!);
  });

  test('leaves Regulatory holding only general regulatory commands', async ({ page }) => {
    await openCatalogue(page);

    const regulatory = page.locator('#signs-regulatory');
    await expect(regulatory.locator('.sign-gallery > li')).toHaveCount(
      expectedCounts.get('regulatory')!,
    );
    for (const name of ['Stop', 'Yield', 'One Way', 'Do Not Enter']) {
      await expect(regulatory.getByText(name, { exact: true })).toHaveCount(1);
    }
  });

  test('gives parking and crossings their own sections', async ({ page }) => {
    await openCatalogue(page);

    const parking = page.locator('#signs-parking-stopping');
    await expect(parking.getByText('No Parking', { exact: true })).toHaveCount(1);
    await expect(parking.getByText('Accessible Parking', { exact: true })).toHaveCount(1);

    const crossings = page.locator('#signs-pedestrian-cyclist-school');
    await expect(crossings.getByText('School Area', { exact: true })).toHaveCount(1);
    await expect(crossings.getByText('Turning Vehicles Yield to Bicycles', { exact: true })).toHaveCount(1);
  });

  test('keeps the Reference badge as a quiet status, not a section', async ({ page }) => {
    await openCatalogue(page);

    const badges = page.getByText('Reference', { exact: true });
    const referenceCount = learnerIds.filter(
      (id) => scopeData.classifications[id]!.scope === 'reference',
    ).length;
    await expect(badges).toHaveCount(referenceCount);

    // Reference is not a category heading.
    await expect(page.getByRole('heading', { name: /^Reference/ })).toHaveCount(0);

    // Reference signs sit inside topic sections alongside Core ones.
    const laneUse = page.locator('#signs-lane-use');
    await expect(laneUse.getByText('Reference', { exact: true }).first()).toBeVisible();
    await expect(laneUse.getByText('Two-Way Left Turn Lane', { exact: true })).toHaveCount(1);
  });

  test('reads and scrolls cleanly on a small phone', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await openCatalogue(page);

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);

    // Artwork stays big enough to study rather than collapsing with the column.
    const box = await page.locator('.sign-card-art').first().boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(70);
  });
});
