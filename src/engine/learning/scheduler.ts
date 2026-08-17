import type { Question } from '@/content/types';
import type { Progress, QuestionStat } from './types';

/**
 * Spaced practice.
 *
 * Questions live in Leitner boxes. Answer correctly and the question moves up
 * a box and comes back later; miss it and it drops back to box 0 and returns
 * soon. The intent is that a question you keep getting right stops eating your
 * study time, while one you keep missing returns often enough to fix — but not
 * so often that it becomes the only thing you see.
 */

/** Hours to wait before a question in each box is due again. */
export const BOX_INTERVAL_HOURS = [0.15, 8, 24, 72, 168, 336] as const;
export const MAX_BOX = BOX_INTERVAL_HOURS.length - 1;

/**
 * A missed question drops to box 0 but is held back briefly rather than being
 * shown again immediately — answering the same question twice in a row teaches
 * recall of the last click, not the rule.
 */
export function nextStat(previous: QuestionStat | undefined, correct: boolean, now: Date): QuestionStat {
  const base: QuestionStat = previous ?? {
    questionId: '',
    seen: 0,
    correct: 0,
    incorrect: 0,
    lastSeenAt: now.toISOString(),
    lastResult: 'incorrect',
    streak: 0,
    box: 0,
    dueAt: now.toISOString(),
    bookmarked: false,
    flaggedForReview: false,
  };

  const box = correct ? Math.min(base.box + 1, MAX_BOX) : 0;
  const intervalHours = BOX_INTERVAL_HOURS[box]!;
  const dueAt = new Date(now.getTime() + intervalHours * 3600_000);

  return {
    ...base,
    seen: base.seen + 1,
    correct: base.correct + (correct ? 1 : 0),
    incorrect: base.incorrect + (correct ? 0 : 1),
    lastSeenAt: now.toISOString(),
    lastResult: correct ? 'correct' : 'incorrect',
    streak: correct ? base.streak + 1 : 0,
    box,
    dueAt: dueAt.toISOString(),
    // Getting it right twice in a row clears a manual review flag.
    flaggedForReview: correct && base.streak + 1 >= 2 ? false : base.flaggedForReview,
  };
}

/**
 * How strongly a question should be favoured when drawing a practice set.
 *
 * Higher is more likely. The weights are deliberately gentle multipliers
 * rather than hard filters, so a practice set always retains some breadth
 * instead of collapsing onto three questions you keep missing.
 */
export function practiceWeight(question: Question, progress: Progress, now: Date): number {
  const stat = progress.questions[question.id];

  // Unseen questions are the priority: coverage first.
  if (!stat || stat.seen === 0) return 3;

  let weight = 1;

  // Well-known questions fade, but never to zero.
  weight *= [1.9, 1.5, 1.15, 0.8, 0.45, 0.25][stat.box] ?? 0.25;

  // Not yet due? Suppress hard, but leave a small chance so sets stay varied.
  const due = new Date(stat.dueAt).getTime();
  if (due > now.getTime()) {
    weight *= 0.15;
  } else {
    // Reward being overdue, with a ceiling so an old miss cannot dominate.
    const overdueDays = (now.getTime() - due) / 86_400_000;
    weight *= 1 + Math.min(overdueDays, 7) * 0.12;
  }

  if (stat.lastResult === 'incorrect') weight *= 2.2;
  if (stat.flaggedForReview) weight *= 2.0;

  // Persistent trouble spots get a lasting nudge, scaled by how bad the ratio is.
  const accuracy = stat.correct / stat.seen;
  if (stat.seen >= 2 && accuracy < 0.6) weight *= 1.5;

  return weight;
}

export function isDue(stat: QuestionStat, now: Date): boolean {
  return new Date(stat.dueAt).getTime() <= now.getTime();
}

/** Questions the learner has missed and not yet re-learned. */
export function mistakeQueue(progress: Progress): string[] {
  return Object.values(progress.questions)
    .filter((s) => s.lastResult === 'incorrect' || s.flaggedForReview)
    .sort((a, b) => new Date(a.lastSeenAt).getTime() - new Date(b.lastSeenAt).getTime())
    .map((s) => s.questionId);
}

export function bookmarkedQuestions(progress: Progress): string[] {
  return Object.values(progress.questions)
    .filter((s) => s.bookmarked)
    .sort((a, b) => new Date(b.lastSeenAt).getTime() - new Date(a.lastSeenAt).getTime())
    .map((s) => s.questionId);
}
