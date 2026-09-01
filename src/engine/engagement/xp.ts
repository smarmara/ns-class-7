import type { Question } from '@/content/types';
import { topicPerformance, weakTopics, WEAK_TOPIC_THRESHOLD } from '@/engine/learning/readiness';
import type { Progress } from '@/engine/learning/types';
import {
  XP_CORRECT_ANSWER,
  XP_MOCK_COMPLETION,
  XP_SESSION_COMPLETION,
  XP_WEAK_RECOVERY,
} from './types';

export interface XpBreakdown {
  total: number;
  correct: number;
  completion: number;
  /** XP from topics that crossed out of weak during this session. */
  recovery: number;
  recoveredTopics: string[];
}

/**
 * XP for a completed practice session. Positive only.
 *
 * Recovery credit is given when a topic that was weak at the start of the
 * session is no longer weak when it ends — an honest reward for remediation,
 * awarded at most once per topic per session.
 */
export function sessionXp(
  pool: readonly Question[],
  progressAtStart: Progress,
  progressNow: Progress,
  correctCount: number,
): XpBreakdown {
  const wasWeak = new Set(weakTopics(pool, progressAtStart).map((t) => t.topic));
  const stillWeak = new Set(weakTopics(pool, progressNow).map((t) => t.topic));
  const recoveredTopics = [...wasWeak].filter((topic) => !stillWeak.has(topic));

  const recovery = recoveredTopics.length * XP_WEAK_RECOVERY;
  const correct = correctCount * XP_CORRECT_ANSWER;
  const completion = XP_SESSION_COMPLETION;

  return { total: correct + completion + recovery, correct, completion, recovery, recoveredTopics };
}

/** Whether a topic currently counts as weak. */
export function isTopicWeak(pool: readonly Question[], progress: Progress, topic: string): boolean {
  const entry = topicPerformance(pool, progress).find((t) => t.topic === topic);
  if (!entry) return false;
  return entry.attempts >= 3 && entry.accuracy <= WEAK_TOPIC_THRESHOLD;
}

export function mockCompletionXp(): number {
  return XP_MOCK_COMPLETION;
}