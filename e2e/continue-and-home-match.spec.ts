import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { answerCurrentCorrectly, answerCurrentIncorrectly, loadBank } from './helpers';

const signsDir = resolve(dirname(fileURLToPath(import.meta.url)), '../data/signs');
const readSigns = (file: string) => JSON.parse(readFileSync(resolve(signsDir, file), 'utf8'));
const scope = readSigns('learner-scope.json') as {
  classifications: Record<string, { scope: string; displayName: string }>;
};
const approvals = readSigns('visual-approvals.json') as {
  approvals: Record<string, { assetPath?: string }>;
};

/** Prompt text -> the image src that answers it, for crop-backed signs. */
const assetForPrompt = new Map<string, string>();
for (const [id, entry] of Object.entries(scope.classifications)) {
  if (entry.scope !== 'core' && entry.scope !== 'reference') continue;
  const asset = approvals.approvals[id]?.assetPath;
  if (asset) assetForPrompt.set(entry.displayName, asset);
}

/**
 * Two UX additions: continuing to the next section after a strong result, and
 * the Sign Match promotion on Home with a persisted personal best.
 */

const bank = loadBank();
const bankByStem = new Map<string, ReturnType<typeof loadBank>>();
for (const q of bank) {
  const key = q.question.trim().replace(/\s+/g, ' ');
  const list = bankByStem.get(key) ?? [];
  list.push(q);
  bankByStem.set(key, list);
}

/** Play a whole topic session, answering every question the same way. */
async function playTopic(page: Page, topic: string, strategy: 'correct' | 'wrong') {
  const size = Math.min(10, bank.filter((q) => q.topic === topic).length);
  expect(size, `topic ${topic} has no questions`).toBeGreaterThan(0);

  await page.goto(`/#/study/${topic}`);
  for (let i = 0; i < size; i++) {
    if (strategy === 'correct') await answerCurrentCorrectly(page, bankByStem);
    else await answerCurrentIncorrectly(page, bankByStem);
    await page.getByRole('button', { name: /Next question|Finish/ }).click();
  }
  await expect(page.locator('.session-result')).toBeVisible();
}

test.describe('sign match on Home', () => {
  test('promotes Sign Match and links straight to the game', async ({ page }) => {
    await page.goto('/#/');
    const card = page.locator('.match-feature');
    await expect(card).toBeVisible();
    await expect(card).toContainText('Sign Match');
    await expect(card).toContainText(/best streak/i);
    await expect(card).toContainText('Play Sign Match');

    await card.click();
    await expect(page).toHaveURL(/\/signs\/match/);
    await expect(page.locator('.match-choice')).toHaveCount(2);
  });

  test('reads as one clear control, with the artwork kept out of the way', async ({ page }) => {
    await page.goto('/#/');
    const card = page.getByRole('link', { name: /Sign Match/ }).first();

    // One accessible name carrying what it is, what it does, the record and
    // the action — and it matches the visible copy, so voice control works.
    const name = (await card.getAttribute('aria-label')) ?? (await card.innerText());
    const flat = name.replace(/\s+/g, ' ');
    expect(flat).toContain('Sign Match');
    expect(flat).toContain('Choose the sign that matches the name');
    expect(flat).toContain('Play Sign Match');
    expect(flat).toMatch(/Best streak/i);

    // The decorative signs add no announcements of their own.
    const artNodes = await page
      .locator('.match-feature-sign, .match-feature-disc')
      .evaluateAll((els) => els.map((el) => el.getAttribute('aria-hidden')));
    expect(artNodes.length).toBeGreaterThan(0);
    for (const hidden of artNodes) expect(hidden).toBe('true');

    // No nested interactive control inside the panel.
    await expect(card.locator('button, a')).toHaveCount(0);
  });

  test('shows a zero best streak for a learner who has never played', async ({ page }) => {
    await page.goto('/#/');
    await expect(page.locator('.match-feature-streak-value')).toHaveText('0');
  });

  test('records a best streak that survives a reload', async ({ page }) => {
    await page.goto('/#/signs/match');
    await expect(page.locator('.match-choice')).toHaveCount(2);

    // Answer deterministically: the prompt names a sign, and that sign's
    // approved artwork is on exactly one of the two buttons.
    const TARGET = 4;
    let streak = 0;
    for (let round = 0; round < 30 && streak < TARGET; round++) {
      const prompt = (await page.getByRole('heading', { level: 1 }).textContent())!.trim();
      const wanted = assetForPrompt.get(prompt);
      const srcs = await page
        .locator('.match-choice .match-art img')
        .evaluateAll((els) => els.map((el) => el.getAttribute('src') ?? ''));

      const side = wanted ? srcs.findIndex((src) => src === wanted) : -1;
      let wasCorrect: boolean;
      if (side < 0) {
        // A concept drawn as SVG rather than a crop; answer without guessing
        // which side, and accept whatever happens.
        const choice = page.locator('.match-choice').nth(0);
        await choice.click();
        wasCorrect = (await choice.getAttribute('data-state')) === 'correct';
      } else {
        const choice = page.locator('.match-choice').nth(side);
        await choice.click();
        await expect(choice).toHaveAttribute('data-state', 'correct');
        wasCorrect = true;
      }

      // A miss ends the run: read the result, then start another.
      if (wasCorrect) {
        streak += 1;
        await page.getByRole('button', { name: 'Next', exact: true }).click();
      } else {
        streak = 0;
        await page.getByRole('button', { name: 'See your run' }).click();
        await page.getByRole('button', { name: 'Try again' }).click();
      }
    }
    expect(streak, 'could not build a streak in 30 rounds').toBeGreaterThanOrEqual(TARGET);

    await page.goto('/#/');
    const shown = Number(await page.locator('.match-feature-streak-value').textContent());
    expect(shown).toBeGreaterThanOrEqual(TARGET);

    // The record is persisted, not session state.
    await page.reload();
    await expect(page.locator('.match-feature-streak-value')).toHaveText(String(shown));
  });

  test('does not displace the main learning call to action', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/#/');

    const hero = page.locator('.hero-module').first();
    const promo = page.locator('.match-feature');
    const heroBox = await hero.boundingBox();
    const promoBox = await promo.boundingBox();

    expect(heroBox!.y).toBeLessThan(promoBox!.y);
    // The hero stays above the fold.
    expect(heroBox!.y).toBeLessThan(844);
  });

  test('fits a small phone without horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto('/#/');
    await expect(page.locator('.match-feature')).toBeVisible();

    await expect
      .poll(() =>
        page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        ),
      )
      .toBeLessThanOrEqual(1);
  });
});

test.describe('continue after a strong section', () => {
  const TOPIC = 'traffic-signals';

  test('offers the next section by name and opens it', async ({ page }) => {
    await playTopic(page, TOPIC, 'correct');

    const continueCta = page.getByRole('link', { name: /^Continue to / });
    await expect(continueCta).toBeVisible();

    // The destination is named, not just "Next".
    const label = (await continueCta.textContent())!.replace('Continue to', '').trim();
    expect(label.length).toBeGreaterThan(2);

    // Continue is the primary action; practising again is secondary.
    await expect(continueCta).toHaveClass(/btn-primary/);
    await expect(page.getByRole('button', { name: 'Practise again' })).toBeVisible();

    const href = await continueCta.getAttribute('href');
    await continueCta.click();
    await expect(page).toHaveURL(new RegExp(href!.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));

    // A completed session must never donate its index or result state to the
    // next topic, even when the next topic has fewer questions.
    await expect(page.locator('.session-result')).toHaveCount(0);
    await expect(page.getByRole('progressbar', { name: 'Session progress' })).toHaveAttribute(
      'aria-valuetext',
      /^Question 1 of /,
    );
    await expect(page.locator('.quiz-topic')).not.toHaveText('Traffic signals');
  });

  test('Practise again starts the same topic at question one', async ({ page }) => {
    await playTopic(page, TOPIC, 'correct');
    await page.getByRole('button', { name: 'Practise again' }).click();

    await expect(page.locator('.session-result')).toHaveCount(0);
    await expect(page.getByRole('progressbar', { name: 'Session progress' })).toHaveAttribute(
      'aria-valuetext',
      /^Question 1 of /,
    );
  });

  test('withholds Continue after a weak session and keeps a retry', async ({ page }) => {
    await playTopic(page, TOPIC, 'wrong');

    await expect(page.getByRole('link', { name: /^Continue to / })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Practise again' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Back to dashboard' })).toBeVisible();
  });

  test('shows no Continue on a mixed session that spans no single section', async ({ page }) => {
    // Quick Practice draws across topics, so "the next section" means nothing.
    await page.goto('/#/practice/quick');
    for (let i = 0; i < 12; i++) {
      await answerCurrentCorrectly(page, bankByStem);
      await page.getByRole('button', { name: /Next question|Finish/ }).click();
    }
    await expect(page.locator('.session-result')).toBeVisible();
    await expect(page.getByRole('link', { name: /^Continue to / })).toHaveCount(0);
  });

  test('reads cleanly at 320px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await playTopic(page, TOPIC, 'correct');
    await expect(page.getByRole('link', { name: /^Continue to / })).toBeVisible();

    await expect
      .poll(() =>
        page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        ),
      )
      .toBeLessThanOrEqual(1);
  });
});

test.describe('Learn road-sign category drills', () => {
  test('opens Lane Use & Turns as formal practice, not the catalogue', async ({ page }) => {
    await page.goto('/#/learn');
    await page.getByRole('link', { name: 'Lane Use & Turns' }).click();

    await expect(page).toHaveURL(/\/study\/signs\/lane-use$/);
    await expect(page.locator('.quiz-topic')).toHaveText('Lane Use & Turns');
    await expect(page.getByRole('heading', { name: 'Sign Catalogue' })).toHaveCount(0);
    await expect(page.getByRole('progressbar', { name: 'Session progress' })).toHaveAttribute(
      'aria-valuetext',
      'Question 1 of 6',
    );
  });

  test('opens Parking & Stopping with its two Core concepts', async ({ page }) => {
    await page.goto('/#/learn');
    await page.getByRole('link', { name: 'Parking & Stopping' }).click();

    await expect(page).toHaveURL(/\/study\/signs\/parking-stopping$/);
    await expect(page.locator('.quiz-topic')).toHaveText('Parking & Stopping');
    await expect(page.getByRole('progressbar', { name: 'Session progress' })).toHaveAttribute(
      'aria-valuetext',
      'Question 1 of 2',
    );
  });
});
