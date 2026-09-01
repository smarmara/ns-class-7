import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { expect, test, type Page } from '@playwright/test';

const scope = JSON.parse(
  readFileSync(
    resolve(dirname(fileURLToPath(import.meta.url)), '../data/signs/learner-scope.json'),
    'utf8',
  ),
) as { classifications: Record<string, { scope: string; displayName: string }> };

/**
 * Names as the game prompts them.
 *
 * Mirrors src/engine/signmatch/labels.ts: only a geometry suffix is dropped,
 * because every other em-dash suffix carries meaning (and stripping them all
 * would collide "No Parking — Times Shown" with plain "No Parking").
 */
const GEOMETRY = new Set([
  'octagon',
  'diamond',
  'pentagon',
  'inverted triangle',
  'vertical rectangle',
  'horizontal rectangle',
]);

function promptLabel(name: string): string {
  const at = name.indexOf(' — ');
  if (at === -1) return name;
  const suffix = name.slice(at + 3).trim().toLowerCase();
  return GEOMETRY.has(suffix) ? name.slice(0, at).trim() : name;
}

const namesInScope = (want: string) =>
  new Set(
    Object.values(scope.classifications)
      .filter((entry) => entry.scope === want)
      .map((entry) => promptLabel(entry.displayName)),
  );

/**
 * Sign Match — endless two-choice sign recognition.
 *
 * Covers the loop itself, the anti-answer-leak rule that a choice must not
 * announce the sign's name before it is picked, and the promise that the game
 * never touches formal learner progress.
 */

async function openGame(page: Page) {
  await page.goto('/#/signs');
  await page.getByRole('link', { name: /Sign Match/ }).click();
  await expect(page.locator('.match-choice')).toHaveCount(2);
}

/** Answer the current round; returns whether the pick was right. */
async function answer(page: Page, side: 0 | 1): Promise<boolean> {
  const choice = page.locator('.match-choice').nth(side);
  await choice.click();
  return (await choice.getAttribute('data-state')) === 'correct';
}

/**
 * Move on after answering.
 *
 * Sign Match is a streak run: a correct answer continues it, a miss ends it and
 * the learner starts another. This keeps a long session going either way.
 */
async function carryOn(page: Page, wasCorrect: boolean) {
  if (wasCorrect) {
    await page.getByRole('button', { name: 'Next', exact: true }).click();
  } else {
    await page.getByRole('button', { name: 'See your run' }).click();
    await page.getByRole('button', { name: 'Try again' }).click();
  }
}

test.describe('sign match', () => {
  test('starts straight from the Signs hub with a playable round', async ({ page }) => {
    await page.goto('/#/signs');
    await expect(page.getByRole('link', { name: /Sign Match/ })).toBeVisible();
    await page.getByRole('link', { name: /Sign Match/ }).click();

    await expect(page).toHaveURL(/\/signs\/match/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.locator('.match-choice')).toHaveCount(2);
    // No setup step stands between the learner and the first round.
    await expect(page.getByRole('button', { name: 'Start' })).toHaveCount(0);
  });

  test('does not name the sign on either choice before it is picked', async ({ page }) => {
    await openGame(page);
    const prompt = (await page.getByRole('heading', { level: 1 }).textContent())!.trim();

    for (const choice of await page.locator('.match-choice').all()) {
      const label = (await choice.getAttribute('aria-label')) ?? '';
      expect(label).not.toContain(prompt);
      expect(((await choice.textContent()) ?? '').trim()).not.toContain(prompt);
      // Concept signs render as inline SVG, so there may be no <img> at all —
      // check the count first rather than waiting for one that never appears.
      const images = choice.locator('img');
      if ((await images.count()) > 0) {
        const alt = await images.first().getAttribute('alt');
        if (alt) expect(alt).not.toContain(prompt);
      }
    }
  });

  test('confirms a correct pick and reveals the sign', async ({ page }) => {
    await openGame(page);

    // Keep playing until a correct pick lands, then check the confirmation.
    for (let round = 0; round < 12; round++) {
      const prompt = (await page.getByRole('heading', { level: 1 }).textContent())!.trim();
      if (await answer(page, 0)) {
        await expect(page.locator('.match-verdict')).toContainText('Correct');
        await expect(page.locator('.match-reveal')).toContainText(prompt);
        await expect(page.getByRole('button', { name: 'Next', exact: true })).toBeVisible();
        return;
      }
      await carryOn(page, false);
    }
    throw new Error('no correct answer occurred in 12 rounds');
  });

  test('reveals the right sign after a miss and ends the run', async ({ page }) => {
    await openGame(page);

    // Always pick the left side until a round comes up where it is wrong.
    let missed = false;
    for (let round = 0; round < 12 && !missed; round++) {
      const prompt = (await page.getByRole('heading', { level: 1 }).textContent())!.trim();
      const wasCorrect = await answer(page, 0);
      if (!wasCorrect) {
        missed = true;
        await expect(page.locator('.match-verdict')).toContainText('Not quite');
        // The correct sign is revealed by name and marked in place.
        await expect(page.locator('.match-reveal')).toContainText(prompt);
        await expect(page.locator('.match-choice[data-state="correct"]')).toHaveCount(1);
        await expect(page.locator('.match-choice[data-state="wrong"]')).toHaveCount(1);
        // The run is over, so there is no Next — only a way to the result.
        await expect(page.getByRole('button', { name: 'Next', exact: true })).toHaveCount(0);
        await expect(page.getByRole('button', { name: 'See your run' })).toBeEnabled();
      } else {
        await page.getByRole('button', { name: 'Next', exact: true }).click();
      }
    }
    expect(missed, 'no wrong answer occurred in 12 rounds of always picking the left side').toBe(
      true,
    );
  });

  test('locks the round after one choice', async ({ page }) => {
    await openGame(page);
    await answer(page, 0);
    for (const choice of await page.locator('.match-choice').all()) {
      await expect(choice).toBeDisabled();
    }
  });

  test('keeps going well past a normal quiz session', async ({ page }) => {
    await openGame(page);
    let correct = 0;
    let missed = 0;

    for (let round = 0; round < 25; round++) {
      await expect(page.locator('.match-choice')).toHaveCount(2);
      const wasCorrect = await answer(page, (round % 2) as 0 | 1);
      wasCorrect ? correct++ : missed++;
      await carryOn(page, wasCorrect);
    }

    expect(correct + missed).toBe(25);
    // Still playable after 25 answers — a miss ends a run, never the session.
    await expect(page.locator('.match-choice')).toHaveCount(2);
    await expect(page.getByText(/game over|out of lives|you lost|failed/i)).toHaveCount(0);
  });

  test('renders real artwork with no missing-art fallback', async ({ page }) => {
    await openGame(page);
    for (let round = 0; round < 10; round++) {
      await expect(page.locator('.match-choices')).not.toContainText('⚠️');

      // Wait for both images to finish decoding before judging them broken.
      const broken = await page.evaluate(async () => {
        const images = [...document.querySelectorAll<HTMLImageElement>('.match-art img')];
        await Promise.all(
          images.map((img) =>
            img.complete
              ? Promise.resolve()
              : new Promise<void>((done) => {
                  img.addEventListener('load', () => done(), { once: true });
                  img.addEventListener('error', () => done(), { once: true });
                }),
          ),
        );
        return images.filter((img) => img.naturalWidth === 0).map((img) => img.getAttribute('src'));
      });
      expect(broken).toEqual([]);

      await carryOn(page, await answer(page, 0));
    }
  });

  test('restricts targets to assessed signs when asked', async ({ page }) => {
    await openGame(page);
    await page.getByLabel('Sign pool').selectOption('core');

    const core = namesInScope('core');
    const reference = namesInScope('reference');

    for (let round = 0; round < 12; round++) {
      const prompt = (await page.getByRole('heading', { level: 1 }).textContent())!.trim();
      expect(core.has(prompt), `"${prompt}" should be a Core concept`).toBe(true);
      expect(reference.has(prompt), `"${prompt}" is Reference and must not appear`).toBe(false);
      await carryOn(page, await answer(page, 0));
    }
  });

  test('restricts targets to a chosen category', async ({ page }) => {
    await openGame(page);
    await page.getByLabel('Category').selectOption('railway');

    for (let round = 0; round < 4; round++) {
      const prompt = (await page.getByRole('heading', { level: 1 }).textContent())!.trim();
      expect(prompt).toMatch(/railway/i);
      await carryOn(page, await answer(page, 0));
    }
  });

  test('leaves formal sign progress untouched', async ({ page }) => {
    await page.goto('/#/signs');
    const before = await page.locator('.signs-summary-value').textContent();

    await page.getByRole('link', { name: /Sign Match/ }).click();
    for (let round = 0; round < 8; round++) {
      await carryOn(page, await answer(page, (round % 2) as 0 | 1));
    }

    await page.getByRole('link', { name: '← Signs' }).click();
    await expect(page.getByRole('heading', { name: 'Road signs' })).toBeVisible();
    await expect(page.locator('.signs-summary-value')).toHaveText(before!.trim());
  });

  test('returns to Signs with the browser Back button', async ({ page }) => {
    await openGame(page);
    await page.goBack();
    await expect(page.getByRole('heading', { name: 'Road signs' })).toBeVisible();
  });

  test('fits a small phone without horizontal scrolling', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await openGame(page);

    // Measure once the artwork has laid out; a half-loaded image is briefly
    // wider than its column and would report a false overflow.
    await page.evaluate(async () => {
      const images = [...document.querySelectorAll<HTMLImageElement>('.match-art img')];
      await Promise.all(
        images.map((img) =>
          img.complete
            ? Promise.resolve()
            : new Promise<void>((done) => {
                img.addEventListener('load', () => done(), { once: true });
                img.addEventListener('error', () => done(), { once: true });
              }),
        ),
      );
      await new Promise((done) => requestAnimationFrame(() => done(null)));
    });

    // Poll rather than sleep: the assertion still fails if the layout really
    // overflows, but a frame of mid-load reflow does not fail it.
    await expect
      .poll(
        () =>
          page.evaluate(
            () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
          ),
        { message: 'Sign Match must not scroll horizontally at 320px' },
      )
      .toBeLessThanOrEqual(1);

    // Touch targets stay comfortable.
    const box = await page.locator('.match-choice').first().boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(120);
  });
});

test.describe('related sign variants', () => {
  test('shows tab plates under their parent without adding catalogue cards', async ({ page }) => {
    await page.goto('/#/signs/gallery?category=regulatory');
    await expect(page.getByRole('heading', { name: /^Regulatory \(21\)/ })).toBeVisible();

    // The Stop concept carries five supplementary tabs.
    const details = page.locator('.sign-variants').first();
    await expect(details).toBeVisible();
    await details.locator('summary').click();
    await expect(details.locator('li').first()).toBeVisible();

    // Still 21 top-level cards in the section.
    await expect(page.locator('.sign-gallery > li')).toHaveCount(21);
  });

  test('keeps the catalogue headline at 155 concepts', async ({ page }) => {
    await page.goto('/#/signs/gallery');
    await expect(page.getByText(/155 signs to study/)).toBeVisible();
  });
});
