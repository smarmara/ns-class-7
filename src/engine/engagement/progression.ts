import { ALL_TOPICS, RULES_TOPICS, SIGNS_TOPICS, type Question, type Topic } from '@/content/types';
import type { Progress } from '@/engine/learning/types';
import { isComplete, topicMastery, type MasteryEvidence } from '@/engine/learning/mastery';

/**
 * Long-run progression: how far through the whole course a learner is, what
 * that makes them, and what they have earned along the way.
 *
 * Everything here is *derived* from progress that is already stored — topic
 * mastery and the mock-test history. Nothing new is persisted, so backup,
 * restore and the storage schema are untouched.
 *
 * This deliberately measures the journey to the end rather than recent
 * activity. Readiness (see engine/learning/readiness.ts) answers "how am I
 * doing lately"; this answers "how far through am I", which is the question a
 * progress ring should be answering.
 */

/**
 * Course progress measures the way to **Complete**, not to Mastered.
 *
 * Complete is the ordinary goal — the learner has covered a topic's material
 * and got it right — and it is reachable in every topic regardless of how many
 * questions that topic holds. Mastery sits above it and is a separate, deeper
 * state; folding it into the ring would leave the ring permanently short of
 * 100% for anyone who had genuinely finished the course.
 *
 * A topic that is Complete scores a full 1. Below that the score rises
 * smoothly with coverage and accuracy so the ring moves during a session
 * rather than jumping only when a topic finishes.
 */
const WEIGHTS = { coverage: 0.75, accuracy: 0.25 } as const;

/** Accuracy at or above this counts as full marks for the accuracy term. */
const TARGET_ACCURACY = 0.8;

/** How far through a single topic the learner is, 0-1. */
export function topicScore(evidence: MasteryEvidence): number {
  if (isComplete(evidence.stage)) return 1;
  const accuracy = evidence.accuracy === null ? 0 : Math.min(1, evidence.accuracy / TARGET_ACCURACY);
  const score = WEIGHTS.coverage * evidence.coverage + WEIGHTS.accuracy * accuracy;
  // Never quite 1 until the topic is genuinely complete.
  return Math.min(score, 0.99);
}

export function isTopicComplete(evidence: MasteryEvidence): boolean {
  return isComplete(evidence.stage);
}

export interface CourseProgress {
  /** 0–1: the mean topic score across every topic that has questions. */
  completion: number;
  /** Whole-percent form, for display. */
  percent: number;
  topicsComplete: number;
  topicsTotal: number;
  questionsSeen: number;
  questionsTotal: number;
}

/**
 * Progress toward finishing the course.
 *
 * Each topic contributes its own score, so the ring fills steadily as topics
 * deepen rather than jumping only when one is finished — and it reaches 100%
 * only when every topic is complete.
 */
export function courseProgress(pool: readonly Question[], progress: Progress): CourseProgress {
  const topics = ALL_TOPICS.filter((topic) => pool.some((q) => q.topic === topic));
  let scoreSum = 0;
  let topicsComplete = 0;

  for (const topic of topics) {
    const evidence = topicMastery(pool, progress, topic);
    scoreSum += topicScore(evidence);
    if (isTopicComplete(evidence)) topicsComplete += 1;
  }

  const completion = topics.length === 0 ? 0 : scoreSum / topics.length;
  const questionsSeen = pool.filter((q) => (progress.questions[q.id]?.seen ?? 0) > 0).length;

  return {
    completion,
    percent: Math.round(completion * 100),
    topicsComplete,
    topicsTotal: topics.length,
    questionsSeen,
    questionsTotal: pool.length,
  };
}

/* ------------------------------------------------------------------ levels */

export interface Level {
  name: string;
  /** Completion at which this level starts, 0–1. */
  from: number;
}

/**
 * Five named stages, ending at Expert.
 *
 * Levels are earned by mastering the material, not by time spent — "Expert"
 * should mean something. A learner who studies hard for one day and one who
 * studies lightly for a month reach the same level for the same knowledge.
 */
export const LEVELS: readonly Level[] = [
  { name: 'Novice', from: 0 },
  { name: 'Learner', from: 0.2 },
  { name: 'Competent', from: 0.45 },
  { name: 'Proficient', from: 0.7 },
  { name: 'Expert', from: 0.9 },
];

export interface LevelStanding {
  level: Level;
  index: number;
  /** The level above, or null at Expert. */
  next: Level | null;
  /** Progress through the current band, 0–1. 1 when Expert. */
  progressToNext: number;
  isMax: boolean;
}

export function levelFor(completion: number): LevelStanding {
  const clamped = Math.min(1, Math.max(0, completion));
  let index = 0;
  for (let i = 0; i < LEVELS.length; i += 1) {
    if (clamped >= LEVELS[i]!.from) index = i;
  }
  const level = LEVELS[index]!;
  const next = LEVELS[index + 1] ?? null;
  const isMax = next === null;
  const span = next ? next.from - level.from : 0;
  const progressToNext = isMax || span === 0 ? 1 : (clamped - level.from) / span;

  return { level, index, next, progressToNext: Math.min(1, Math.max(0, progressToNext)), isMax };
}

/* ------------------------------------------------------------------ medals */

export type MedalKind = 'topic' | 'area' | 'mock';

export interface Medal {
  id: string;
  kind: MedalKind;
  title: string;
  /** What earns it — shown whether or not it has been earned. */
  requirement: string;
  earned: boolean;
  /** Ordering weight for mock medals; higher is rarer. */
  tier?: number;
}

/** A medal for every topic worked all the way through and retained. */
export function topicMedals(pool: readonly Question[], progress: Progress): Medal[] {
  return ALL_TOPICS.filter((topic) => pool.some((q) => q.topic === topic)).map((topic) => ({
    id: `topic:${topic}`,
    kind: 'topic' as const,
    title: topic,
    requirement: 'Answer every question in this topic correctly and remember it',
    earned: isTopicComplete(topicMastery(pool, progress, topic)),
  }));
}

/** Two bigger medals for finishing a whole half of the official test. */
export function areaMedals(pool: readonly Question[], progress: Progress): Medal[] {
  const allComplete = (topics: readonly Topic[]) =>
    topics
      .filter((topic) => pool.some((q) => q.topic === topic))
      .every((topic) => isTopicComplete(topicMastery(pool, progress, topic)));

  return [
    {
      id: 'area:rules',
      kind: 'area',
      title: 'Rules of the Road expert',
      requirement: 'Complete every Rules of the Road topic',
      earned: allComplete(RULES_TOPICS),
    },
    {
      id: 'area:signs',
      kind: 'area',
      title: 'Road Signs expert',
      requirement: 'Complete every Road Signs topic',
      earned: allComplete(SIGNS_TOPICS),
    },
  ];
}

/**
 * Practice-exam medals on a rising scale.
 *
 * Earned from the stored mock history, so they survive a backup and restore
 * like everything else. Nothing here is ever taken away — a failed test costs
 * a learner nothing.
 */
export function mockMedals(progress: Progress): Medal[] {
  const tests = progress.mockTests;
  const passed = tests.filter((t) => t.passed);
  const bestScore = tests.reduce((best, t) => {
    const correct = t.sections.reduce((n, s) => n + s.correct, 0);
    const total = t.sections.reduce((n, s) => n + s.questionCount, 0);
    return total > 0 ? Math.max(best, correct / total) : best;
  }, 0);

  return [
    {
      id: 'mock:first',
      kind: 'mock',
      tier: 1,
      title: 'First full test',
      requirement: 'Complete a practice exam',
      earned: tests.length >= 1,
    },
    {
      id: 'mock:passed',
      kind: 'mock',
      tier: 2,
      title: 'Passed both parts',
      requirement: 'Pass a practice exam',
      earned: passed.length >= 1,
    },
    {
      id: 'mock:consistent',
      kind: 'mock',
      tier: 3,
      title: 'Consistent',
      requirement: 'Pass three practice exams',
      earned: passed.length >= 3,
    },
    {
      id: 'mock:flawless',
      kind: 'mock',
      tier: 4,
      title: 'Flawless',
      requirement: 'Score every question correctly in one practice exam',
      earned: bestScore >= 1,
    },
  ];
}

export interface MedalSummary {
  topics: Medal[];
  areas: Medal[];
  mocks: Medal[];
  earned: number;
  total: number;
}

export function allMedals(pool: readonly Question[], progress: Progress): MedalSummary {
  const topics = topicMedals(pool, progress);
  const areas = areaMedals(pool, progress);
  const mocks = mockMedals(progress);
  const every = [...topics, ...areas, ...mocks];
  return {
    topics,
    areas,
    mocks,
    earned: every.filter((m) => m.earned).length,
    total: every.length,
  };
}
