import { LEARNER_TAXONOMY } from '@/content/learner-signs';
import { RULES_TOPICS, TOPIC_LABELS, type Question, type Topic } from '@/content/types';
import { signCategoryLearnProgress } from '@/engine/learning/signCategories';
import { isComplete, topicMastery } from '@/engine/learning/mastery';
import type { Progress } from '@/engine/learning/types';
import type { Medal } from './progression';

export interface PresentedMedal extends Medal {
  tone: 'rules' | 'signs';
  label: string;
  mastered?: boolean;
}

/**
 * Learner-facing achievement view. Historical question topics remain the
 * progression engine's source of truth; canonical sign categories are an
 * aggregation/presentation layer over assessed Core evidence.
 */
export function achievementMedals(pool: readonly Question[], progress: Progress): PresentedMedal[] {
  const rules = RULES_TOPICS.filter((topic) => pool.some((q) => q.topic === topic)).map((topic) => {
    const evidence = topicMastery(pool, progress, topic);
    return {
      id: `topic:${topic}`,
      kind: 'topic' as const,
      title: topic,
      label: TOPIC_LABELS[topic],
      tone: 'rules' as const,
      requirement: 'Complete this topic',
      earned: isComplete(evidence.stage),
      mastered: evidence.stage === 'mastered',
    };
  });

  const signProgress = signCategoryLearnProgress(pool, progress);
  const signs = LEARNER_TAXONOMY.map((category) => {
    const evidence = signProgress.find((entry) => entry.id === category.id);
    return {
      id: `sign-category:${category.id}`,
      kind: 'topic' as const,
      title: category.id,
      label: category.label,
      tone: 'signs' as const,
      requirement: 'Complete all assessed material in this topic',
      earned: evidence?.stage === 'complete' || evidence?.stage === 'mastered',
      mastered: evidence?.stage === 'mastered',
    };
  });

  return [...rules, ...signs];
}

export function sectionPresentation(pool: readonly Question[], progress: Progress) {
  const medals = achievementMedals(pool, progress);
  const rules = medals.filter((medal) => medal.tone === 'rules');
  const signs = medals.filter((medal) => medal.tone === 'signs');
  return [
    { id: 'area:rules', label: 'Rules of the Road expert', tone: 'rules' as const, requirement: 'Complete all 21 Rules topics', earned: rules.length === 21 && rules.every((medal) => medal.earned) },
    { id: 'area:signs', label: 'Road Signs expert', tone: 'signs' as const, requirement: 'Complete all 10 assessed sign categories', earned: signs.length === 10 && signs.every((medal) => medal.earned) },
  ];
}

export function topicLabel(topic: Topic | string) {
  return TOPIC_LABELS[topic as Topic] ?? topic;
}
