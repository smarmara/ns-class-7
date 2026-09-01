import { ALL_TOPICS, RULES_TOPICS, SIGNS_TOPICS, type Question, type Topic } from '@/content/types';
import type { Progress } from './types';
import type { ReadinessBreakdown } from './readiness';
import { isComplete, topicMastery, type MasteryEvidence } from './mastery';

/**
 * The recommended learning path: a curriculum-ordered sequence of topic nodes
 * with checkpoints between the Rules and Signs sections and a final transition
 * into practice-exam readiness. It is guidance only — every topic remains
 * directly reachable, and the path never locks a topic behind another.
 */

export interface TopicStep {
  kind: 'topic';
  topic: Topic;
}

export interface CheckpointStep {
  kind: 'checkpoint';
  id: string;
  title: string;
  sub: string;
  to: string;
  /** Filled in by pathProgress. Static definition leaves it unset. */
  done?: boolean;
}

export type PathStep = TopicStep | CheckpointStep;

export function buildPath(): PathStep[] {
  const topics: TopicStep[] = RULES_TOPICS.map((topic) => ({ kind: 'topic', topic }));
  const signs: TopicStep[] = SIGNS_TOPICS.map((topic) => ({ kind: 'topic', topic }));
  return [
    ...topics,
    {
      kind: 'checkpoint',
      id: 'rules-foundation',
      title: 'Rules foundation',
      sub: 'You have worked through the Rules of the Road.',
      to: '/practice',
    },
    ...signs,
    {
      kind: 'checkpoint',
      id: 'signs-foundation',
      title: 'Signs foundation',
      sub: 'You have worked through Road Signs and Pavement Markings.',
      to: '/practice',
    },
    {
      kind: 'checkpoint',
      id: 'mock-ready',
      title: 'Practice exam ready',
      sub: 'Rules and Signs foundations are complete — take a timed practice exam.',
      to: '/practice',
    },
  ];
}

export interface EnrichedTopicStep {
  kind: 'topic';
  topic: Topic;
  evidence: MasteryEvidence;
}

export interface EnrichedCheckpointStep {
  kind: 'checkpoint';
  id: string;
  title: string;
  sub: string;
  to: string;
  done: boolean;
  /** Extra readiness context for the final milestone. */
  ready?: boolean;
}

export type EnrichedStep = EnrichedTopicStep | EnrichedCheckpointStep;

export interface PathProgress {
  steps: EnrichedStep[];
  /** The topic the learner should start next, in curriculum order. */
  next: EnrichedTopicStep | null;
  /** True when every topic in the path is mastered. */
  complete: boolean;
}

function allTopicsInOrder(topics: readonly Topic[], check: (topic: Topic) => boolean): boolean {
  return topics.every(check);
}

export function pathProgress(
  pool: readonly Question[],
  progress: Progress,
  rulesReadiness: ReadinessBreakdown,
  signsReadiness: ReadinessBreakdown,
): PathProgress {
  // Progression follows Complete: mastery is a deeper achievement, not a gate.
  const rulesDone = allTopicsInOrder(RULES_TOPICS, (t) => isComplete(topicMastery(pool, progress, t).stage));
  const signsDone = allTopicsInOrder(SIGNS_TOPICS, (t) => isComplete(topicMastery(pool, progress, t).stage));
  const mockReady = rulesReadiness.score >= 60 && signsReadiness.score >= 60;

  const steps: EnrichedStep[] = buildPath().map((step) => {
    if (step.kind === 'topic') {
      return { kind: 'topic', topic: step.topic, evidence: topicMastery(pool, progress, step.topic) };
    }
    if (step.id === 'rules-foundation') {
      return { ...step, done: rulesDone };
    }
    if (step.id === 'signs-foundation') {
      return { ...step, done: signsDone };
    }
    return { ...step, done: rulesDone && signsDone, ready: mockReady };
  });

  let next: EnrichedTopicStep | null = null;
  for (const step of steps) {
    if (step.kind === 'topic' && step.evidence.questionsAvailable > 0 && !isComplete(step.evidence.stage)) {
      next = step;
      break;
    }
  }

  const complete = ALL_TOPICS.every((t) => isComplete(topicMastery(pool, progress, t).stage));

  return { steps, next, complete };
}