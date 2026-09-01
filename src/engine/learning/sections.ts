import { RULES_TOPICS, type Question, type Topic } from '@/content/types';
import { TOPIC_LABELS } from '@/content';
import { LEARNER_TAXONOMY } from '@/content/learner-signs';
import { isComplete, topicMastery } from './mastery';
import { signCategoryLearnProgress } from './signCategories';
import type { Progress } from './types';

/**
 * The canonical Learn sequence, and where a learner goes after finishing a
 * section well.
 *
 * There is deliberately no second recommendation engine here. The order is the
 * order the Learn page already presents — the Rules topics in `RULES_TOPICS`,
 * then the sign categories in the canonical learner taxonomy — and the
 * destinations are the same ones a Learn card links to. Anything else would let
 * "continue" mean something different from "tap the next card".
 */

export type LearnSection =
  | { kind: 'rules'; topic: Topic }
  | { kind: 'signs'; category: string };

export interface LearnSectionTarget {
  section: LearnSection;
  /** Learner-facing name, e.g. "Right of Way" or "Lane Use & Turns". */
  label: string;
  /** Where selecting this section normally goes. */
  to: string;
}

/**
 * Session accuracy that counts as a strong result.
 *
 * A UX threshold only. The repository has no pre-existing session-level notion
 * of a strong result — mastery's 0.8/0.9 and progression's 0.8 are computed
 * over a topic's whole history, not one sitting — so this is a new, deliberately
 * separate rule.
 *
 * It says nothing about Complete or Mastered. A learner can answer six of six
 * correctly in one short session and still be a long way from either.
 */
export const STRONG_SESSION_ACCURACY = 0.9;

/**
 * Whether a finished session was strong enough to suggest moving on.
 *
 * Compared as integers so that 9/10 is unambiguously strong and 89/100 is
 * unambiguously not, with no floating-point edge to argue about.
 */
export function isStrongSession(correct: number, total: number): boolean {
  if (total <= 0) return false;
  return correct * 10 >= total * 9;
}

/** Every Learn section, in the order the Learn page lists them. */
export function learnSectionSequence(): LearnSectionTarget[] {
  const rules: LearnSectionTarget[] = RULES_TOPICS.map((topic) => ({
    section: { kind: 'rules', topic },
    label: TOPIC_LABELS[topic] ?? topic,
    to: `/study/${topic}`,
  }));
  const signs: LearnSectionTarget[] = LEARNER_TAXONOMY.map((entry) => ({
    section: { kind: 'signs', category: entry.id },
    label: entry.label,
    to: `/study/signs/${entry.id}`,
  }));
  return [...rules, ...signs];
}

function sameSection(a: LearnSection, b: LearnSection): boolean {
  if (a.kind !== b.kind) return false;
  return a.kind === 'rules' && b.kind === 'rules'
    ? a.topic === b.topic
    : a.kind === 'signs' && b.kind === 'signs' && a.category === b.category;
}

/** Whether the learner has already finished a section. */
function isSectionFinished(
  target: LearnSectionTarget,
  pool: readonly Question[],
  progress: Progress,
): boolean {
  if (target.section.kind === 'rules') {
    return isComplete(topicMastery(pool, progress, target.section.topic).stage);
  }
  const category = signCategoryLearnProgress(pool, progress).find(
    (entry) => entry.id === (target.section as { category: string }).category,
  );
  return category ? isComplete(category.stage) : false;
}

/**
 * The next section worth continuing to, or null at the end of the sequence.
 *
 * Walks forward from the section just finished and takes the first one the
 * learner has not already completed, so a learner who has worked ahead is not
 * sent back through material they have finished. If everything after this point
 * is complete, it returns the immediate next section anyway — reaching the end
 * of the course should not make the button vanish while sections remain — and
 * only returns null when there is genuinely nothing after this one.
 *
 * Deliberately not adaptive: this is sequential continuation, nothing more.
 */
export function nextLearnSection(
  current: LearnSection,
  pool: readonly Question[],
  progress: Progress,
): LearnSectionTarget | null {
  const sequence = learnSectionSequence();
  const index = sequence.findIndex((entry) => sameSection(entry.section, current));
  if (index === -1) return null;

  const remaining = sequence.slice(index + 1);
  if (remaining.length === 0) return null;

  const unfinished = remaining.find((entry) => !isSectionFinished(entry, pool, progress));
  return unfinished ?? remaining[0]!;
}
