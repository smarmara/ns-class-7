import type { Question, Topic } from '@/content/types';
import type { Progress } from './types';

/**
 * Topic standing: a five-stage, evidence-based picture of where the learner
 * sits on a topic.
 *
 * Two ideas are deliberately kept apart:
 *
 * **Complete** — the learner has covered the material this topic actually
 * contains, and got it right. It is the ordinary goal: it drives the Learn
 * screen, course progression and medals. Reaching it depends on the *share* of
 * the topic covered, never on the topic happening to hold a particular number
 * of questions.
 *
 * **Mastered** — the learner has shown durable knowledge by meeting the same
 * material again, later, and getting it right again. It sits above Complete
 * and cannot be reached in a single pass, however perfect that pass is.
 *
 * The distinction matters because the bank is uneven: 21 of the 31 topics hold
 * fewer than ten questions, and several hold three. An absolute
 * "ten questions attempted" bar made mastery unreachable for two thirds of the
 * course. Scaling that bar down to the topic size would have been worse — a
 * three-question topic would become Mastered on one lucky pass. So mastery is
 * defined by *repeated* successful exposure instead, which any topic can
 * supply through later practice and review.
 *
 * Everything here is derived from evidence already stored per question, so
 * nothing new is persisted and backup/restore keeps working unchanged.
 */

export type MasteryStage = 'new' | 'learning' | 'developing' | 'complete' | 'mastered';

export const MASTERY_ORDER: MasteryStage[] = [
  'new',
  'learning',
  'developing',
  'complete',
  'mastered',
];

export const MASTERY_LABELS: Record<MasteryStage, string> = {
  new: 'Not started',
  learning: 'Learning',
  developing: 'Developing',
  complete: 'Complete',
  mastered: 'Mastered',
};

/** Attempts judged "recent" for the accuracy term. */
export const MASTERY_RECENT_WINDOW = 12;

/**
 * Leitner box at or above which a question counts as retained. The box rises
 * by one per correct answer and resets to zero on a miss, so box 2 means the
 * learner has answered that question correctly on two consecutive encounters.
 */
export const MASTERY_RETAINED_BOX = 2;

export interface MasteryEvidence {
  topic: Topic;
  stage: MasteryStage;
  /** Recent attempts counted for the accuracy term. */
  attempts: number;
  /**
   * Accuracy used for grading: recent accuracy where there is a recent record,
   * otherwise the lifetime figure from the per-question stats. The fallback
   * matters because the attempt log is trimmed, and a Complete topic should
   * not quietly un-complete because old attempts rotated out of the log.
   */
  accuracy: number | null;
  /** Accuracy over every answer ever given in this topic, 0-1. */
  lifetimeAccuracy: number | null;
  /** Share of the topic's questions attempted at least once, 0-1. */
  coverage: number;
  /** Share of attempted questions that have reached a durable box, 0-1. */
  retained: number;
  /** Total answers given in this topic, counting repeat encounters. */
  exposures: number;
  /** Exposures divided by the questions available — average times each was met. */
  exposuresPerQuestion: number;
  questionsAvailable: number;
  questionsAttempted: number;
}

/**
 * Thresholds, expressed as shares rather than absolute question counts so that
 * every stage is reachable in a three-question topic and in a twenty-two
 * question one.
 *
 * `minExposuresPerQuestion` is what separates Complete from Mastered: two
 * means the learner has, on average, met every question in the topic at least
 * twice. `minExposures` is an absolute floor so that a very small topic still
 * requires real evidence rather than a couple of answers.
 */
export const MASTERY_RULES = {
  developing: {
    minCoverage: 0.5,
    minAccuracy: 0.6,
  },
  complete: {
    /** Every question in the topic has been attempted. "Complete" means complete. */
    minCoverage: 1,
    minAccuracy: 0.8,
  },
  mastered: {
    minCoverage: 1,
    minAccuracy: 0.9,
    minRetained: 0.75,
    minExposuresPerQuestion: 2,
    minExposures: 6,
  },
} as const;

export function topicMastery(
  pool: readonly Question[],
  progress: Progress,
  topic: Topic,
): MasteryEvidence {
  const questions = pool.filter((q) => q.topic === topic);
  const ids = new Set(questions.map((q) => q.id));
  const stats = Object.values(progress.questions).filter((s) => ids.has(s.questionId));

  const attemptedStats = stats.filter((s) => s.seen > 0);
  const questionsAttempted = attemptedStats.length;

  const recent = progress.attempts.filter((a) => a.topic === topic).slice(-MASTERY_RECENT_WINDOW);
  const recentAccuracy =
    recent.length === 0 ? null : recent.filter((a) => a.correct).length / recent.length;

  // Exposures and lifetime accuracy come from the per-question stats, which are
  // permanent. The attempt log is a rolling window and would under-report both.
  const exposures = attemptedStats.reduce((n, s) => n + s.seen, 0);
  const correctTotal = attemptedStats.reduce((n, s) => n + s.correct, 0);
  const lifetimeAccuracy = exposures === 0 ? null : correctTotal / exposures;

  const accuracy = recentAccuracy ?? lifetimeAccuracy;

  const coverage = questions.length === 0 ? 0 : questionsAttempted / questions.length;
  const retained =
    questionsAttempted === 0
      ? 0
      : attemptedStats.filter((s) => s.box >= MASTERY_RETAINED_BOX).length / questionsAttempted;
  const exposuresPerQuestion = questions.length === 0 ? 0 : exposures / questions.length;

  const acc = accuracy ?? 0;
  const rules = MASTERY_RULES;

  let stage: MasteryStage;
  if (questionsAttempted === 0) {
    stage = 'new';
  } else if (
    coverage >= rules.mastered.minCoverage &&
    acc >= rules.mastered.minAccuracy &&
    retained >= rules.mastered.minRetained &&
    exposuresPerQuestion >= rules.mastered.minExposuresPerQuestion &&
    exposures >= rules.mastered.minExposures
  ) {
    stage = 'mastered';
  } else if (coverage >= rules.complete.minCoverage && acc >= rules.complete.minAccuracy) {
    stage = 'complete';
  } else if (coverage >= rules.developing.minCoverage && acc >= rules.developing.minAccuracy) {
    stage = 'developing';
  } else {
    stage = 'learning';
  }

  return {
    topic,
    stage,
    attempts: recent.length,
    accuracy,
    lifetimeAccuracy,
    coverage,
    retained,
    exposures,
    exposuresPerQuestion,
    questionsAvailable: questions.length,
    questionsAttempted,
  };
}

/** 0-4 so a stage can drive rings and bars. */
export function masteryLevel(stage: MasteryStage): number {
  return MASTERY_ORDER.indexOf(stage);
}

/** True once the topic has been covered successfully — the ordinary goal. */
export function isComplete(stage: MasteryStage): boolean {
  return masteryLevel(stage) >= masteryLevel('complete');
}

export function isMastered(stage: MasteryStage): boolean {
  return stage === 'mastered';
}

export function topicMasteryMap(
  pool: readonly Question[],
  progress: Progress,
  topics: readonly Topic[],
): Map<Topic, MasteryEvidence> {
  return new Map(topics.map((topic) => [topic, topicMastery(pool, progress, topic)]));
}

/**
 * The next topic to study: the first in the given order that is not yet
 * complete. Guidance only — no topic is ever locked.
 */
export function recommendedNextTopic(
  pool: readonly Question[],
  progress: Progress,
  topics: readonly Topic[],
): MasteryEvidence | null {
  for (const topic of topics) {
    const evidence = topicMastery(pool, progress, topic);
    if (evidence.questionsAvailable > 0 && !isComplete(evidence.stage)) return evidence;
  }
  return null;
}
