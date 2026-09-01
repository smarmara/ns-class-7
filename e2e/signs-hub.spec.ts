import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { expect, test, type Page } from '@playwright/test';

/**
 * The Signs hub category grid.
 *
 * Guards the Priority 6D regression: the grid described the question bank
 * rather than the study catalogue, so Lane Use & Turns — 56 signs — displayed
 * as "3 questions", School and Pedestrian/Cyclist rendered as two cards, and
 * Parking & Stopping had no card at all.
 */

const dataDir = resolve(dirname(fileURLToPath(import.meta.url)), '../data/signs');
const read = (file: string) => JSON.parse(readFileSync(resolve(dataDir, file), 'utf8'));

const categoryData = read('learner-categories.json') as {
  taxonomy: { id: string; label: string }[];
  categories: Record<string, string>;
};
const scopeData = read('learner-scope.json') as {
  classifications: Record<string, { scope: string }>;
};

const counts = new Map<string, number>();
for (const [id, category] of Object.entries(categoryData.categories)) {
  const scope = scopeData.classifications[id]!.scope;
  if (scope !== 'core' && scope !== 'reference') continue;
  counts.set(category, (counts.get(category) ?? 0) + 1);
}
const total = [...counts.values()].reduce((a, b) => a + b, 0);

async function openHub(page: Page) {
  await page.goto('/#/signs');
  await expect(page.getByRole('heading', { name: 'Road signs' })).toBeVisible();
}

test.describe('signs hub', () => {
  test('shows exactly the ten canonical catalogue categories', async ({ page }) => {
    await openHub(page);
    const cards = page.locator('.category-grid > li');
    await expect(cards).toHaveCount(categoryData.taxonomy.length);
    for (const { label } of categoryData.taxonomy) {
      await expect(page.locator('.category-grid').getByText(label, { exact: true })).toHaveCount(1);
    }
  });

  test('describes each category by its catalogue size, never by question count', async ({
    page,
  }) => {
    await openHub(page);
    for (const { id, label } of categoryData.taxonomy) {
      const card = page.getByRole('link', { name: new RegExp(`^${label.replace(/[&]/g, '&')},`) });
      await expect(card).toContainText(`${counts.get(id)} signs`);
    }
    await expect(page.locator('.category-grid')).not.toContainText('question');
  });

  test('fixes the Lane Use & Turns regression', async ({ page }) => {
    await openHub(page);
    const card = page.getByRole('link', { name: /^Lane Use & Turns,/ });
    await expect(card).toContainText(`${counts.get('lane-use')} signs`);
    await expect(card).not.toContainText('3 questions');
  });

  test('gives Parking & Stopping a card and merges school with pedestrian', async ({ page }) => {
    await openHub(page);
    await expect(page.getByRole('link', { name: /^Parking & Stopping,/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /^School, Pedestrian & Cyclist,/ })).toBeVisible();
    // The retired stale cards.
    await expect(page.getByText('School signs', { exact: true })).toHaveCount(0);
    await expect(page.getByText('Pedestrian and cyclist signs', { exact: true })).toHaveCount(0);
    await expect(page.getByText('Lane use signs', { exact: true })).toHaveCount(0);
  });

  test('agrees with the catalogue call-to-action about the total', async ({ page }) => {
    await openHub(page);
    await expect(page.getByText(new RegExp(`Browse ${total} signs`))).toBeVisible();
    const shown = await page
      .locator('.category-grid .category-meta')
      .evaluateAll((nodes) =>
        nodes.reduce((sum, n) => sum + Number(/(\d+) signs?/.exec(n.textContent ?? '')?.[1] ?? 0), 0),
      );
    expect(shown).toBe(total);
  });

  test('renders real artwork on every card, with no missing-art warnings', async ({ page }) => {
    await openHub(page);
    const thumbs = page.locator('.category-grid .sign-thumb img, .category-grid .sign-thumb svg');
    await expect(thumbs).toHaveCount(categoryData.taxonomy.length * 3);
    await expect(page.getByText('⚠️')).toHaveCount(0);

    const broken = await page.evaluate(() =>
      [...document.querySelectorAll('.category-grid .sign-thumb img')]
        .filter((img) => (img as HTMLImageElement).naturalWidth === 0)
        .map((img) => (img as HTMLImageElement).getAttribute('src')),
    );
    expect(broken).toEqual([]);
  });

  test('opens the catalogue filtered to the chosen category, and Back returns', async ({ page }) => {
    await openHub(page);
    await page.getByRole('link', { name: /^Lane Use & Turns,/ }).click();

    await expect(page).toHaveURL(/category=lane-use/);
    await expect(
      page.getByRole('heading', { name: `Lane Use & Turns (${counts.get('lane-use')})` }),
    ).toBeVisible();
    // Only the chosen category is rendered.
    await expect(page.locator('.sign-gallery')).toHaveCount(1);
    await expect(page.locator('.sign-gallery > li')).toHaveCount(counts.get('lane-use')!);
    await expect(page.getByRole('heading', { name: /^Regulatory \(/ })).toHaveCount(0);

    await page.goBack();
    await expect(page.getByRole('heading', { name: 'Road signs' })).toBeVisible();
  });

  test('filters to Parking & Stopping from its card', async ({ page }) => {
    await openHub(page);
    await page.getByRole('link', { name: /^Parking & Stopping,/ }).click();
    await expect(page).toHaveURL(/category=parking-stopping/);
    await expect(page.locator('.sign-gallery > li')).toHaveCount(counts.get('parking-stopping')!);
  });

  test('reads cleanly on a small phone', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await openHub(page);

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);

    // Thumbnails stay identifiable rather than collapsing with the column.
    const thumb = await page.locator('.category-grid .sign-thumb').first().boundingBox();
    expect(thumb!.width).toBeGreaterThanOrEqual(40);

    // The longest label wraps inside its card instead of spilling out.
    const card = page.getByRole('link', { name: /^School, Pedestrian & Cyclist,/ });
    const box = await card.boundingBox();
    const name = await card.locator('.category-name').boundingBox();
    expect(name!.width).toBeLessThanOrEqual(box!.width);
  });
});
