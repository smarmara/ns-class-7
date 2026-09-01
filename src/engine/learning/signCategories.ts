import {
  LEARNER_TAXONOMY,
  getLearnerSignCatalogue,
  type LearnerSignEntry,
} from '@/content/learner-signs';
import type { Question } from '@/content/types';
import type { Progress } from './types';
import type { MasteryStage } from './mastery';

/**
 * Per-category summaries for the Signs hub.
 *
 * The hub used to describe each category by how many *questions* existed in the
 * matching question topic, which stopped being meaningful once the learner
 * catalogue grew past the question bank: Lane Use & Turns holds 56 signs but
 * only 6 of them are assessed, so the old card advertised "3 questions" for the
 * largest category in the catalogue.
 *
 * Three different quantities are kept separate here, because conflating them is
 * exactly how that regression happened:
 *
 * - `catalogueCount` — signs a learner can study in this category. The headline.
 * - `assessedCount` — Core concepts the question bank actually assesses.
 * - `questionCount` — practice questions. Always ≥ assessedCount, since one
 *   sign can carry several questions, and never the category's identity.
 *
 * Reference signs count towards `catalogueCount` only. They are study material
 * and must never appear in an assessment denominator, or a learner would be
 * told they are behind on material nothing tests.
 */

export interface SignCategorySummary {
  /** Canonical learner-category id, from data/signs/learner-categories.json. */
  id: string;
  label: string;
  blurb: string;
  /** Signs a learner can study here — Core + Reference. */
  catalogueCount: number;
  coreCount: number;
  referenceCount: number;
  /** Core concepts in this category that the question bank assesses. */
  assessedCount: number;
  /** Practice questions whose sign belongs to this category. */
  questionCount: number;
  /** Up to three approved visuals representing the category. */
  representativeSignIds: readonly string[];
  /** Recorded attempts on this category's questions. */
  attempts: number;
  /** Accuracy over those attempts, 0-1. Null when there is nothing to judge. */
  accuracy: number | null;
}

/**
 * Hand-picked thumbnails, three per category.
 *
 * This is the one piece of the catalogue the UI curates rather than derives.
 * Picking automatically produced poor results — the first three ids in a
 * category are frequently near-identical arrow variants — so the choices are
 * explicit, deterministic and reviewable. Selection favours signs a learner
 * recognises, prefers Core over Reference where that still represents the
 * category, and avoids putting three visually similar signs side by side.
 *
 * Lane Use & Turns deliberately includes one Reference roundabout sign: the
 * roundabout family is 11 of the category's 56 signs and none of them is Core,
 * so a Core-only strip would misrepresent what is in there.
 *
 * Every id is validated by `tests/sign-categories.test.ts` — it must exist in
 * the catalogue, sit in the category it is listed under, and resolve to
 * approved artwork.
 */
const REPRESENTATIVE_SIGNS: Record<string, readonly string[]> = {
  regulatory: ['stop', 'yield', 'do-not-enter'],
  'lane-use': ['lane-right-turn-only', 'two-way-left-turn-lane', 'RB-102'],
  'parking-stopping': ['no-parking', 'accessible-parking', 'no-stopping'],
  warning: ['stop-sign-ahead', 'slippery-when-wet', 'traffic-signal-ahead'],
  'pedestrian-cyclist-school': ['school-crosswalk', 'pedestrian-crosswalk', 'RB-37'],
  railway: ['railway-crossbuck', 'railway-crossing-ahead', 'railway-tracks-tab'],
  'work-zone': ['wz-workers-ahead', 'wz-traffic-control-person', 'wz-construction-ahead'],
  guide: ['route-102', 'guide-destination', 'bicycle-route'],
  'pavement-marking': ['pm-double-solid-yellow', 'pm-broken-yellow', 'pm-white-lane-line'],
  shape: ['shape-stop', 'shape-yield', 'shape-warning-sign'],
};

/** Representative sign ids for a category, in display order. */
export function representativeSignsFor(categoryId: string): readonly string[] {
  return REPRESENTATIVE_SIGNS[categoryId] ?? [];
}

/**
 * Which sign each question assesses.
 *
 * Derived from the live question bank rather than the `inQuiz` flag stored in
 * learner-scope.json. That flag is generated, and it had already gone stale
 * once — `shape-yield` gained a question after the file was written — so a
 * count taken from it silently under-reported assessed signs.
 */
function questionsBySign(pool: readonly Question[]): Map<string, Question[]> {
  const bySign = new Map<string, Question[]>();
  for (const question of pool) {
    if (!question.signId) continue;
    const list = bySign.get(question.signId) ?? [];
    list.push(question);
    bySign.set(question.signId, list);
  }
  return bySign;
}

/**
 * Summaries for every learner category that has signs, in canonical order.
 *
 * Order and membership come from the taxonomy, never from a list held in the
 * UI, so the hub cannot drift from the catalogue.
 */
export function signCategorySummaries(
  pool: readonly Question[],
  progress: Progress,
): SignCategorySummary[] {
  const catalogue = getLearnerSignCatalogue();
  const byCategory = new Map<string, LearnerSignEntry[]>();
  for (const entry of catalogue) {
    const list = byCategory.get(entry.category) ?? [];
    list.push(entry);
    byCategory.set(entry.category, list);
  }

  const bySign = questionsBySign(pool);
  const attemptsByQuestion = new Map<string, { attempts: number; correct: number }>();
  const inPool = new Set(pool.map((q) => q.id));
  for (const attempt of progress.attempts) {
    if (!inPool.has(attempt.questionId)) continue;
    const tally = attemptsByQuestion.get(attempt.questionId) ?? { attempts: 0, correct: 0 };
    tally.attempts++;
    if (attempt.correct) tally.correct++;
    attemptsByQuestion.set(attempt.questionId, tally);
  }

  const summaries: SignCategorySummary[] = [];

  for (const category of LEARNER_TAXONOMY) {
    const entries = byCategory.get(category.id);
    if (!entries || entries.length === 0) continue;

    let coreCount = 0;
    let assessedCount = 0;
    let questionCount = 0;
    let attempts = 0;
    let correct = 0;

    for (const entry of entries) {
      const questions = bySign.get(entry.id) ?? [];
      if (entry.scope === 'core') {
        coreCount++;
        if (questions.length > 0) assessedCount++;
      }
      questionCount += questions.length;
      for (const question of questions) {
        const tally = attemptsByQuestion.get(question.id);
        if (!tally) continue;
        attempts += tally.attempts;
        correct += tally.correct;
      }
    }

    summaries.push({
      id: category.id,
      label: category.label,
      blurb: category.blurb,
      catalogueCount: entries.length,
      coreCount,
      referenceCount: entries.length - coreCount,
      assessedCount,
      questionCount,
      representativeSignIds: representativeSignsFor(category.id),
      attempts,
      accuracy: attempts > 0 ? correct / attempts : null,
    });
  }

  return summaries;
}

/**
 * Per-category progress for the Learn page.
 *
 * The Learn page shows formal assessed progress through Core concepts, not
 * catalogue breadth. A category like Lane Use & Turns has 56 signs in the
 * catalogue but only 6 are assessed, so the Learn card shows progress out of 6,
 * not 56.
 *
 * This is deliberately separate from the Signs hub, which shows study breadth.
 * The two surfaces answer different questions:
 *
 * - Signs hub: "What signs can I study?" → catalogue count
 * - Learn page: "How am I progressing through assessed concepts?" → Core count
 *
 * Reference signs never appear in the Learn denominator. They are study
 * material available through the catalogue and Sign Match, but they do not
 * block completion or affect formal progression.
 */

export interface SignCategoryLearnProgress {
  /** Canonical learner-category id. */
  id: string;
  label: string;
  /** Total Core concepts in this category (the Learn denominator). */
  coreCount: number;
  /** Core concepts the learner has encountered at least once. */
  coreSeen: number;
  /** Coverage ratio: coreSeen / coreCount. */
  coverage: number;
  /** Accuracy over attempts on this category's Core concept questions, 0-1. */
  accuracy: number | null;
  /** Derived presentation state. */
  stage: MasteryStage;
  /** Total catalogue signs in this category (Core + Reference), for context. */
  catalogueCount: number;
  /** Assessment questions covering this category's Core concepts. */
  questionIds: readonly string[];
}

/**
 * Formal Learn practice for one canonical sign category.
 *
 * The catalogue defines the Core concepts; the question bank supplies their
 * formal assessment questions. One least-exposed question is selected for
 * each Core concept so a run has balanced coverage without introducing
 * category-specific persistence or a second question map.
 */
export function signCategoryDrillQuestions(
  categoryId: string,
  pool: readonly Question[],
  progress: Progress,
): Question[] {
  const coreIds = getLearnerSignCatalogue()
    .filter((entry) => entry.category === categoryId && entry.scope === 'core')
    .map((entry) => entry.id);
  const coreIdSet = new Set(coreIds);
  const variants = new Map<string, Question[]>();

  for (const question of pool) {
    if (question.type !== 'sign' || !question.signId || !coreIdSet.has(question.signId)) continue;
    const list = variants.get(question.signId) ?? [];
    list.push(question);
    variants.set(question.signId, list);
  }

  return coreIds.flatMap((signId) => {
    const options = variants.get(signId) ?? [];
    return options
      .slice()
      .sort((a, b) => {
        const seenA = progress.questions[a.id]?.seen ?? 0;
        const seenB = progress.questions[b.id]?.seen ?? 0;
        return seenA - seenB || a.id.localeCompare(b.id);
      })
      .slice(0, 1);
  });
}

/**
 * Learn-page progress for every learner category, in canonical order.
 *
 * The denominator is unique Core concepts, not raw question count. If a Core
 * concept has multiple assessment questions, attempting all of them still
 * counts as 1 concept seen. This prevents question-count inflation from
 * distorting the progress picture.
 *
 * State derivation reuses the existing mastery thresholds where possible:
 *
 * - 0 seen → 'new' (Not started)
 * - Some seen, coverage < 0.5 or accuracy < 0.6 → 'learning' (Learning)
 * - Coverage >= 0.5, accuracy >= 0.6 → 'developing' (Developing)
 * - All seen (coverage = 1.0), accuracy >= 0.8 → 'complete' (Complete)
 * - All seen, accuracy >= 0.9, with retention → 'mastered' (Mastered)
 *
 * Retention is derived from the per-question Leitner boxes in the existing
 * progress data, so no new persistence is required.
 */
export function signCategoryLearnProgress(
  pool: readonly Question[],
  progress: Progress,
): SignCategoryLearnProgress[] {
  const catalogue = getLearnerSignCatalogue();
  const byCategory = new Map<string, LearnerSignEntry[]>();
  for (const entry of catalogue) {
    const list = byCategory.get(entry.category) ?? [];
    list.push(entry);
    byCategory.set(entry.category, list);
  }

  // Map each sign to its assessment questions
  const questionsBySign = new Map<string, Question[]>();
  for (const question of pool) {
    if (!question.signId) continue;
    const list = questionsBySign.get(question.signId) ?? [];
    list.push(question);
    questionsBySign.set(question.signId, list);
  }

  // Build per-question stats from progress
  const questionStats = new Map<string, { seen: number; correct: number; box: number }>();
  for (const stat of Object.values(progress.questions)) {
    questionStats.set(stat.questionId, {
      seen: stat.seen,
      correct: stat.correct,
      box: stat.box,
    });
  }

  const results: SignCategoryLearnProgress[] = [];

  for (const category of LEARNER_TAXONOMY) {
    const entries = byCategory.get(category.id);
    if (!entries || entries.length === 0) continue;

    const coreEntries = entries.filter((e) => e.scope === 'core');
    const coreCount = coreEntries.length;

    // For each Core concept, check if any of its questions have been attempted
    let coreSeen = 0;
    const questionIds: string[] = [];
    let totalAttempts = 0;
    let totalCorrect = 0;
    let retainedConcepts = 0;

    for (const entry of coreEntries) {
      const questions = questionsBySign.get(entry.id) ?? [];
      if (questions.length === 0) continue;

      const questionIdsForConcept = questions.map((q) => q.id);
      questionIds.push(...questionIdsForConcept);

      // Check if this concept has been seen (any question attempted)
      const conceptSeen = questionIdsForConcept.some((qid) => {
        const stats = questionStats.get(qid);
        return stats && stats.seen > 0;
      });

      if (conceptSeen) {
        coreSeen++;

        // Check retention: concept is retained if all its questions are in box >= 2
        const allRetained = questionIdsForConcept.every((qid) => {
          const stats = questionStats.get(qid);
          return stats && stats.box >= 2;
        });
        if (allRetained) retainedConcepts++;
      }

      // Tally attempts and accuracy
      for (const qid of questionIdsForConcept) {
        const stats = questionStats.get(qid);
        if (stats) {
          totalAttempts += stats.seen;
          totalCorrect += stats.correct;
        }
      }
    }

    const coverage = coreCount === 0 ? 0 : coreSeen / coreCount;
    const accuracy = totalAttempts === 0 ? null : totalCorrect / totalAttempts;
    const acc = accuracy ?? 0;
    const retained = coreSeen === 0 ? 0 : retainedConcepts / coreSeen;

    // Derive stage using existing mastery thresholds
    let stage: MasteryStage;
    if (coreSeen === 0) {
      stage = 'new';
    } else if (
      coverage >= 1.0 &&
      acc >= 0.9 &&
      retained >= 0.75 &&
      totalAttempts >= coreCount * 2 &&
      totalAttempts >= 6
    ) {
      stage = 'mastered';
    } else if (coverage >= 1.0 && acc >= 0.8) {
      stage = 'complete';
    } else if (coverage >= 0.5 && acc >= 0.6) {
      stage = 'developing';
    } else {
      stage = 'learning';
    }

    results.push({
      id: category.id,
      label: category.label,
      coreCount,
      coreSeen,
      coverage,
      accuracy,
      stage,
      catalogueCount: entries.length,
      questionIds,
    });
  }

  return results;
}
