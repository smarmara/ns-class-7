import { expect, test, type Page } from '@playwright/test';
import {
  answerCurrentCorrectly,
  completeMockSection,
  loadBank,
  seedProgress,
  startMockTest,
} from './helpers';

/**
 * Release-candidate journeys: deterministic mock outcomes, returning-learner
 * recovery, empty states, the 404 fallback, and release-identity provenance.
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
  await expect(page.getByRole('heading', { name: 'Your readiness' })).toBeVisible();
});

function nav(page: Page, name: string) {
  return page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name });
}

test.describe('mock test outcome messaging', () => {
  test('says not passed and names the failed section when Rules passes but Signs fails', async ({
    page,
  }) => {
    test.setTimeout(300_000);
    await startMockTest(page);
    await completeMockSection(page, 'Rules', 'correct', bankByStem);
    await completeMockSection(page, 'Road Signs', 'incorrect', bankByStem);

    await expect(page.getByRole('heading', { name: 'Mock test results' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Not passed' })).toBeVisible();
    await expect(page.getByText(/You would need to retake: Road Signs/)).toBeVisible();
    await expect(page.locator('.result-badge')).toHaveText(['Pass', 'Fail']);
    await expect(page.getByText('20/20', { exact: true })).toBeVisible();
    await expect(page.getByText('0/20', { exact: true })).toBeVisible();
    await expect(page.getByText(/needed to pass/).first()).toBeVisible();
    await expect(page.getByText('Questions you missed (20)')).toBeVisible();
    await expect(page.getByText(/Suggested study areas/)).toBeVisible();
  });

  test('says not passed and names the failed section when Signs passes but Rules fails', async ({
    page,
  }) => {
    test.setTimeout(300_000);
    await startMockTest(page);
    await completeMockSection(page, 'Rules', 'incorrect', bankByStem);
    await completeMockSection(page, 'Road Signs', 'correct', bankByStem);

    await expect(page.getByRole('heading', { name: 'Mock test results' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Not passed' })).toBeVisible();
    await expect(page.getByText(/You would need to retake: Rules/)).toBeVisible();
    await expect(page.locator('.result-badge')).toHaveText(['Fail', 'Pass']);
    await expect(page.getByText('0/20', { exact: true })).toBeVisible();
    await expect(page.getByText('20/20', { exact: true })).toBeVisible();
    await expect(page.getByText('Questions you missed (20)')).toBeVisible();
  });

  test('celebrates a pass honestly without predicting the real exam', async ({ page }) => {
    test.setTimeout(300_000);
    await startMockTest(page);
    await completeMockSection(page, 'Rules', 'correct', bankByStem);
    await completeMockSection(page, 'Road Signs', 'correct', bankByStem);

    await expect(page.getByRole('heading', { name: 'Passed' })).toBeVisible();
    await expect(page.getByText(/met the threshold on both parts/)).toBeVisible();
    await expect(page.locator('.result-badge')).toHaveText(['Pass', 'Pass']);

    // Honest framing: the pass is about THIS practice test, with no
    // guarantee/prediction language about the real exam anywhere on results.
    const copy = await page.locator('body').innerText();
    expect(copy).not.toMatch(/definitely pass|guaranteed|will pass|will definitely/i);
    expect(copy).toMatch(/met the threshold on both parts of this practice test/i);

    // Encourages the next step.
    await expect(page.getByRole('button', { name: 'Take another mock test' })).toBeVisible();
  });
});

test.describe('returning learner', () => {
  test('rehydrates history and points the learner at the right next actions', async ({ page }) => {
    const now = new Date().toISOString();
    const past = new Date(Date.now() - 86_400_000).toISOString();

    const weakIds = new Set<string>();
    for (const q of bank) {
      if (q.id.startsWith('rules-row-') || q.id.startsWith('rules-turn-')) weakIds.add(q.id);
    }

    const stats = new Map<string, unknown>();
    const attempts: unknown[] = [];
    for (const q of bank) {
      const weak = weakIds.has(q.id);
      stats.set(q.id, {
        questionId: q.id,
        seen: weak ? 4 : 1,
        correct: weak ? 1 : 1,
        incorrect: weak ? 3 : 0,
        lastSeenAt: now,
        lastResult: weak ? 'incorrect' : 'correct',
        streak: weak ? 0 : 1,
        box: weak ? 0 : 1,
        dueAt: past,
        bookmarked: q.id === 'rules-gdl-001' || q.id === 'signs-reg-001',
        flaggedForReview: weak,
      });
      if (weak) {
        attempts.push({ questionId: q.id, topic: q.topic, type: q.type, correct: false, at: past, mode: 'quick' });
        attempts.push({ questionId: q.id, topic: q.topic, type: q.type, correct: false, at: past, mode: 'quick' });
        attempts.push({ questionId: q.id, topic: q.topic, type: q.type, correct: false, at: past, mode: 'quick' });
        attempts.push({ questionId: q.id, topic: q.topic, type: q.type, correct: true, at: now, mode: 'quick' });
      } else {
        attempts.push({ questionId: q.id, topic: q.topic, type: q.type, correct: true, at: now, mode: 'quick' });
      }
    }

    const progress = {
      version: 1,
      questions: Object.fromEntries(stats),
      attempts,
      mockTests: [
        {
          id: 'mock-return-1',
          startedAt: past,
          completedAt: past,
          passed: false,
          sections: [
            { sectionId: 'rules', shortName: 'Rules', correct: 17, questionCount: 20, required: 16, passed: true },
            { sectionId: 'signs', shortName: 'Road Signs', correct: 14, questionCount: 20, required: 16, passed: false },
          ],
          missedQuestionIds: [],
        },
      ],
      streak: { current: 2, longest: 4, lastStudyDate: '2026-08-16' },
    };

    await seedProgress(page, progress);

    // Progress survived the restart. "Answered" sums per-question attempts, so
    // compute it from the seeded history rather than the question count.
    const expectedAnswered = Object.values(
      progress.questions as Record<string, { seen: number }>,
    ).reduce((n, s) => n + s.seen, 0);
    const answered = page.locator('.stat', { hasText: 'Answered' }).locator('.stat-value');
    await expect(answered).toHaveText(String(expectedAnswered));
    await expect(page.getByText('Last mock test')).toBeVisible();
    await expect(page.locator('.result-badge').first()).toHaveText('Fail');
    await expect(page.getByText(/Rules 17\/20 · Road Signs 14\/20/)).toBeVisible();

    // The dashboard prioritises the weak topic and the outstanding mistakes.
    await expect(page.getByRole('heading', { name: 'Weak topics' })).toBeVisible();
    await expect(page.locator('.tile-accuracy[data-band="weak"]').first()).toBeVisible();
    await expect(page.getByRole('link', { name: /Review your mistakes/ })).toBeVisible();

    // Saved bookmarks are still there.
    await nav(page, 'Review').click();
    await page.getByRole('link', { name: /Saved questions/ }).click();
    await expect(page.getByRole('heading', { name: 'Saved questions' })).toBeVisible();
    await expect(page.locator('.choice').first()).toBeVisible();

    // Readiness reflects the mixed record (recent accuracy is weak-dominated).
    await nav(page, 'Home').click();
    await expect(page.locator('.readiness-score').first()).toHaveText(/\d+/);
  });
});

test.describe('empty states and fallbacks', () => {
  test('shows friendly empty states for empty review queues', async ({ page }) => {
    await page.goto('/#/review/mistakes');
    await expect(page.getByRole('heading', { name: 'No outstanding mistakes' })).toBeVisible();
    await page.goto('/#/review/saved');
    await expect(page.getByRole('heading', { name: 'Nothing saved yet' })).toBeVisible();
    await page.goto('/#/review/weak');
    await expect(page.getByRole('heading', { name: 'No weak topics yet' })).toBeVisible();
  });

  test('renders a friendly 404 with a way back', async ({ page }) => {
    await page.goto('/#/definitely-not-a-route');
    await expect(page.getByRole('heading', { name: /Nothing here/ })).toBeVisible();
    await page.getByRole('link', { name: /dashboard/i }).click();
    await expect(page.getByRole('heading', { name: 'Your readiness' })).toBeVisible();
  });

  test('exposes app and content versions on the Sources page', async ({ page }) => {
    await page.goto('/#/sources');
    await expect(page.getByRole('heading', { name: 'Sources and about' })).toBeVisible();
    const card = page.locator('.card', { has: page.getByText('App version') });
    await expect(card).toBeVisible();
    await expect(card.getByText(/^\d+\.\d+\.\d+$/)).toBeVisible();
    await expect(card.getByText(/Content version/)).toBeVisible();
  });
});

test.describe('reset', () => {
  test('clears an in-progress mock test along with all progress', async ({ page }) => {
    await startMockTest(page);
    await page.getByRole('button', { name: /Begin Rules/ }).click();
    await page.locator('.choice').first().click();

    // Reset while the test is in flight.
    await page.goto('/#/sources');
    await page.getByRole('button', { name: 'Reset all progress' }).click();
    await page.getByRole('button', { name: 'Erase everything' }).click();

    // Returning to the mock route must not resume the old paper.
    await page.goto('/#/mock');
    await expect(page.getByRole('button', { name: 'Start mock test' })).toBeVisible();
    await expect(page.locator('.exam-timer')).toHaveCount(0);

    // And a reload must not resurrect it from storage either.
    await page.reload();
    await expect(page.getByRole('button', { name: 'Start mock test' })).toBeVisible();
  });
});

test.describe('practice accuracy', () => {
  test('marks the only correct choice as correct in practice (bank-driven)', async ({ page }) => {
    await nav(page, 'Practice').click();
    const index = await answerCurrentCorrectly(page, bankByStem);
    await expect(page.locator('.choice').nth(index)).toHaveAttribute('data-state', 'correct');
  });
});