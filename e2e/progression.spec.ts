import { expect, test, type Page } from '@playwright/test';
import { loadBank, seedProgress } from './helpers';

/**
 * Complete and Mastered in the interface.
 *
 * The model is unit-tested in `tests/engagement.test.ts`; this checks that a
 * learner can actually *see* the difference — that a finished thin topic stops
 * saying "Learning", that finishing it earns a medal, and that mastery reads as
 * a stronger state rather than the same one.
 */

/** A topic small enough that the old ten-question rule made it unwinnable. */
const THIN_TOPIC = 'transit-buses';
const THIN_TOPIC_LABEL = 'Transit buses';

/**
 * Answer every question in a topic correctly, `passes` times over. `box` rises
 * one per correct answer, exactly as the real scheduler does, so retention is
 * earned rather than asserted.
 */
function learnerWhoCompleted(topic: string, passes: number) {
  const ids = loadBank()
    .filter((q) => q.topic === topic)
    .map((q) => q.id);

  const questions: Record<string, unknown> = {};
  const attempts: unknown[] = [];
  for (const id of ids) {
    questions[id] = {
      questionId: id,
      seen: passes,
      correct: passes,
      incorrect: 0,
      lastSeenAt: '2026-08-19T10:00:00.000Z',
      lastResult: 'correct',
      streak: passes,
      box: Math.min(passes, 5),
      dueAt: '2026-09-19T10:00:00.000Z',
      bookmarked: false,
      flaggedForReview: false,
    };
  }
  for (let pass = 0; pass < passes; pass += 1) {
    for (const id of ids) {
      attempts.push({
        questionId: id,
        topic,
        type: 'rules',
        correct: true,
        at: '2026-08-19T10:00:00.000Z',
        mode: 'topic',
      });
    }
  }

  return {
    version: 1,
    questions,
    attempts,
    mockTests: [],
    streak: { current: 1, longest: 1, lastStudyDate: '2026-08-19' },
  };
}

async function seed(page: Page, passes: number) {
  await page.goto('/#/');
  // Clear both stores first: the learner envelope in IndexedDB takes
  // precedence over the legacy localStorage key the seed helper writes, so a
  // second seed in the same test would otherwise be ignored.
  await page.evaluate(async () => {
    localStorage.clear();
    for (const db of await indexedDB.databases()) {
      if (db.name) indexedDB.deleteDatabase(db.name);
    }
  });
  await page.reload();
  await seedProgress(page, learnerWhoCompleted(THIN_TOPIC, passes));
}

/** Topic medals actually earned, once the section has rendered. */
async function earnedTopicMedals(page: Page): Promise<number> {
  const group = page.locator('.medal-group', { hasText: 'Topic expertise' });
  await expect(group).toBeVisible();
  return group.locator('.medal[data-earned="true"]').count();
}

/** The module card for the thin topic on the Learn screen. */
function moduleCard(page: Page) {
  return page.locator('.module', { hasText: THIN_TOPIC_LABEL });
}

test('a finished three-question topic reads Complete, not Learning', async ({ page }) => {
  await seed(page, 1);
  await page.goto('/#/learn');

  const card = moduleCard(page);
  await expect(card).toBeVisible();
  await expect(card).toContainText('Complete');
  await expect(card).not.toContainText('Learning');
  // The state is written out, not carried by the bar colour alone.
  await expect(card.locator('.module-flag[data-state="complete"]')).toBeVisible();
});

test('one perfect pass is Complete but not yet Mastered', async ({ page }) => {
  await seed(page, 1);
  await page.goto('/#/learn');

  const card = moduleCard(page);
  await expect(card).toContainText('Complete');
  await expect(card).not.toContainText('Mastered');
});

test('a second pass promotes the same topic to Mastered', async ({ page }) => {
  await seed(page, 2);
  await page.goto('/#/learn');

  const card = moduleCard(page);
  await expect(card).toContainText('Mastered');
  await expect(card.locator('.module-flag[data-state="mastered"]')).toBeVisible();
});

test('completing a topic earns its medal', async ({ page }) => {
  await seed(page, 1);
  await page.goto('/#/profile');

  await expect(page.getByRole('heading', { name: 'Medals' })).toBeVisible();
  const topicMedals = page.locator('.medal-group', { hasText: 'Topic expertise' });
  await expect(topicMedals).toContainText('1 of 31 topics complete');
  await expect(topicMedals.locator('.medal[data-earned="true"]')).toContainText(THIN_TOPIC_LABEL);
});

test('a medal needs Complete only — not repeated grinding of a tiny topic', async ({ page }) => {
  // One pass earns the medal; the learner is not made to repeat a three-question
  // topic before being rewarded for finishing it.
  await seed(page, 1);
  await page.goto('/#/profile');
  const earnedAfterOnePass = await earnedTopicMedals(page);

  await seed(page, 2);
  await page.goto('/#/profile');
  const earnedAfterTwoPasses = await earnedTopicMedals(page);

  expect(earnedAfterOnePass).toBe(1);
  expect(earnedAfterTwoPasses).toBe(earnedAfterOnePass);
});

test('course progress counts a completed topic without requiring mastery', async ({ page }) => {
  await seed(page, 1);
  await page.goto('/#/');
  await expect(page.locator('.bento-ring-note')).toContainText(/1 \/ \d+ topics complete/);
});
