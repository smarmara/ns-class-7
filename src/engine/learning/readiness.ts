import type { Question, QuestionType, Topic } from '@/content/types';
import type { Progress } from './types';

/**
 * Readiness is a transparent study-progress score, NOT a prediction.
 *
 * It deliberately does not claim to estimate a probability of passing the real
 * knowledge test: this app has no access to the official question bank and any
 * such number would be invented. What it does measure is how much of the
 * material you have worked through, how accurate you have been recently, and
 * how much of it has stuck. Every component is shown to the learner alongside
 * the score so the number can be checked rather than trusted.
 */

export interface ReadinessBreakdown {
  /** 0-100. */
  score: number;
  /** Share of the available questions attempted at least once, 0-1. */
  coverage: number;
  /** Accuracy over recent attempts, 0-1. Null when there is nothing to judge. */
  accuracy: number | null;
  /** Share of attempted questions that have reached a durable Leitner box, 0-1. */
  retention: number;
  questionsAvailable: number;
  questionsAttempted: number;
  attemptsCounted: number;
  /** False until there is enough evidence for the score to mean anything. */
  hasEnoughData: boolean;
}

export const READINESS_WEIGHTS = { accuracy: 0.45, coverage: 0.35, retention: 0.2 } as const;
/** Attempts in the recent window used for the accuracy term. */
export const RECENT_WINDOW = 60;
/** Below this many attempts the score is shown as provisional. */
export const MIN_ATTEMPTS_FOR_CONFIDENCE = 15;
/** Box at or above which a question counts as retained. */
export const RETAINED_BOX = 3;

export function computeReadiness(
  pool: readonly Question[],
  progress: Progress,
  filter?: { type?: QuestionType },
): ReadinessBreakdown {
  const questions = filter?.type ? pool.filter((q) => q.type === filter.type) : pool;
  const ids = new Set(questions.map((q) => q.id));

  const stats = Object.values(progress.questions).filter((s) => ids.has(s.questionId));
  const attempted = stats.filter((s) => s.seen > 0);

  const recent = progress.attempts
    .filter((a) => ids.has(a.questionId))
    .slice(-RECENT_WINDOW);

  const coverage = questions.length === 0 ? 0 : attempted.length / questions.length;
  const accuracy =
    recent.length === 0 ? null : recent.filter((a) => a.correct).length / recent.length;
  const retention =
    attempted.length === 0
      ? 0
      : attempted.filter((s) => s.box >= RETAINED_BOX).length / attempted.length;

  // With no attempts at all, accuracy contributes nothing rather than
  // defaulting to a flattering value.
  const accuracyTerm = accuracy ?? 0;
  const raw =
    READINESS_WEIGHTS.accuracy * accuracyTerm +
    READINESS_WEIGHTS.coverage * coverage +
    READINESS_WEIGHTS.retention * retention;

  return {
    score: Math.round(clamp01(raw) * 100),
    coverage,
    accuracy,
    retention,
    questionsAvailable: questions.length,
    questionsAttempted: attempted.length,
    attemptsCounted: recent.length,
    hasEnoughData: recent.length >= MIN_ATTEMPTS_FOR_CONFIDENCE,
  };
}

export interface TopicPerformance {
  topic: Topic;
  type: QuestionType;
  attempts: number;
  correct: number;
  accuracy: number;
  questionsAvailable: number;
  questionsAttempted: number;
}

/** Minimum attempts before a topic is judged strong or weak. */
export const MIN_TOPIC_ATTEMPTS = 3;
/** Accuracy at or below which a topic counts as weak. */
export const WEAK_TOPIC_THRESHOLD = 0.75;
/** Accuracy at or above which a topic counts as strong. */
export const STRONG_TOPIC_THRESHOLD = 0.9;

export function topicPerformance(
  pool: readonly Question[],
  progress: Progress,
): TopicPerformance[] {
  const byTopic = new Map<Topic, TopicPerformance>();

  for (const q of pool) {
    const entry = byTopic.get(q.topic) ?? {
      topic: q.topic,
      type: q.type,
      attempts: 0,
      correct: 0,
      accuracy: 0,
      questionsAvailable: 0,
      questionsAttempted: 0,
    };
    entry.questionsAvailable++;
    if ((progress.questions[q.id]?.seen ?? 0) > 0) entry.questionsAttempted++;
    byTopic.set(q.topic, entry);
  }

  const inPool = new Set(pool.map((q) => q.id));
  for (const attempt of progress.attempts) {
    if (!inPool.has(attempt.questionId)) continue;
    const entry = byTopic.get(attempt.topic);
    if (!entry) continue;
    entry.attempts++;
    if (attempt.correct) entry.correct++;
  }

  for (const entry of byTopic.values()) {
    entry.accuracy = entry.attempts === 0 ? 0 : entry.correct / entry.attempts;
  }

  return [...byTopic.values()];
}

export function weakTopics(pool: readonly Question[], progress: Progress): TopicPerformance[] {
  return topicPerformance(pool, progress)
    .filter((t) => t.attempts >= MIN_TOPIC_ATTEMPTS && t.accuracy <= WEAK_TOPIC_THRESHOLD)
    .sort((a, b) => a.accuracy - b.accuracy || b.attempts - a.attempts);
}

export function strongTopics(pool: readonly Question[], progress: Progress): TopicPerformance[] {
  return topicPerformance(pool, progress)
    .filter((t) => t.attempts >= MIN_TOPIC_ATTEMPTS && t.accuracy >= STRONG_TOPIC_THRESHOLD)
    .sort((a, b) => b.accuracy - a.accuracy || b.attempts - a.attempts);
}

export interface RecentPerformance {
  total: number;
  correct: number;
  accuracy: number | null;
}

export function recentPerformance(progress: Progress, window = 20): RecentPerformance {
  const recent = progress.attempts.slice(-window);
  const correct = recent.filter((a) => a.correct).length;
  return {
    total: recent.length,
    correct,
    accuracy: recent.length === 0 ? null : correct / recent.length,
  };
}

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}
