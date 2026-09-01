import { expect, test, type Page } from '@playwright/test';
import { seedProgress } from './helpers';
import { loadBank } from './helpers';

/**
 * UX redesign checkpoint: screenshots and viewport measurements.
 *
 * Runs only in the `shots` project (see playwright.config.ts), which pins a
 * single mobile viewport and default text scaling. It is evidence generation,
 * not a gate — the viewport assertions that gate the build live in
 * `mobile-viewport.spec.ts`.
 */

const OUT = 'test-results/ux-redesign';

/** A learner mid-way through, so every screen has real state to render. */
function seededProgress() {
  const bank = loadBank();
  const questions: Record<string, unknown> = {};
  const answer = (ids: string[], correct: number, seen: number) => {
    for (const id of ids) {
      questions[id] = {
        questionId: id,
        seen,
        correct,
        incorrect: seen - correct,
        lastSeenAt: '2026-08-17T10:00:00.000Z',
        lastResult: correct >= seen ? 'correct' : 'incorrect',
        streak: correct >= seen ? correct : 0,
        box: correct >= seen ? 3 : 1,
        dueAt: '2026-08-25T10:00:00.000Z',
        bookmarked: false,
        flaggedForReview: false,
      };
    }
  };
  const byTopic = (topic: string) => bank.filter((q) => q.topic === topic).map((q) => q.id);

  answer(byTopic('traffic-signals').slice(0, 8), 2, 2);
  answer(byTopic('right-of-way').slice(0, 6), 1, 3);
  answer(byTopic('signs-regulatory').slice(0, 9), 2, 2);
  answer(byTopic('signs-warning').slice(0, 5), 2, 2);
  answer(byTopic('speed-and-following').slice(0, 4), 1, 4);

  return {
    version: 1,
    questions,
    attempts: [],
    mockTests: [
      {
        id: 'exam-1',
        startedAt: '2026-08-16T10:00:00.000Z',
        completedAt: '2026-08-16T10:40:00.000Z',
        passed: true,
        sections: [
          { sectionId: 'rules', shortName: 'Rules', correct: 18, questionCount: 20, required: 16, passed: true },
          { sectionId: 'signs', shortName: 'Road Signs', correct: 17, questionCount: 20, required: 16, passed: true },
        ],
        missedQuestionIds: [],
      },
    ],
    streak: { current: 6, longest: 9, lastStudyDay: new Date().toISOString().slice(0, 10) },
  };
}

async function prepare(page: Page) {
  await page.goto('/#/');
  await seedProgress(page, seededProgress());
  await page.evaluate(() => {
    localStorage.setItem(
      'ns-class7:engagement:v1',
      JSON.stringify({ version: 1, xp: 340, goalXp: 20, days: {}, lastAwardDay: null }),
    );
  });
  await page.reload();
  await page.waitForFunction(() => document.fonts.status === 'loaded');
}

async function shot(page: Page, name: string) {
  await page.waitForTimeout(220);
  await page.screenshot({ path: `${OUT}/${name}.png` });
}

for (const scheme of ['light', 'dark'] as const) {
  test(`screens — ${scheme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await prepare(page);

    await shot(page, `home-${scheme}`);

    await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Learn' }).click();
    await expect(page.getByRole('heading', { name: 'Learn', level: 1 })).toBeVisible();
    await shot(page, `learn-${scheme}`);

    await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Signs' }).click();
    await expect(page.getByRole('heading', { name: 'Road signs', level: 1 })).toBeVisible();
    await shot(page, `signs-${scheme}`);

    await page
      .getByRole('navigation', { name: 'Primary' })
      .getByRole('link', { name: 'Profile' })
      .click();
    await expect(page.getByRole('heading', { name: 'Profile', level: 1 })).toBeVisible();
    await shot(page, `progress-${scheme}`);

// Practice exam intro, then a session with unanswered/correct/incorrect states.
    await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Practice' }).click();
    await expect(page.getByRole('heading', { name: 'Practice exam', level: 1 })).toBeVisible();
    await shot(page, `practice-exam-${scheme}`);

    await page.goto('/#/practice/quick');
    await expect(page.locator('.question-stem')).toBeVisible();
    await shot(page, `practice-unanswered-${scheme}`);

    const bank = new Map<string, ReturnType<typeof loadBank>>();
    for (const q of loadBank()) {
      const key = q.question.trim().replace(/\s+/g, ' ');
      bank.set(key, [...(bank.get(key) ?? []), q]);
    }

    const { answerCurrentCorrectly, answerCurrentIncorrectly } = await import('./helpers');
    await answerCurrentCorrectly(page, bank);
    await shot(page, `practice-correct-${scheme}`);

    await page.getByRole('button', { name: /Next question|Finish/ }).click();
    await answerCurrentIncorrectly(page, bank);
    await shot(page, `practice-incorrect-${scheme}`);
  });
}

test('small phone — 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await prepare(page);
  await shot(page, 'home-320');

  await page.goto('/#/practice');
  await expect(page.getByRole('heading', { name: 'Practice exam', level: 1 })).toBeVisible();
  await shot(page, 'practice-exam-320');

  await page.goto('/#/practice/quick');
  await expect(page.locator('.question-stem')).toBeVisible();
  await shot(page, 'practice-320');
});
