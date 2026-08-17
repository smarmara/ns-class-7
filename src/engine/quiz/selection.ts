import type { Question } from '@/content/types';
import { createRng, shuffle, weightedSampleWithoutReplacement, type Rng } from '../random';

/**
 * A question paired with the order its choices are presented in.
 *
 * `question.correctChoice` always refers to the choices AS AUTHORED. Shuffling
 * never rewrites it — instead `displayOrder` maps presentation positions back
 * to authored indices. Every comparison goes through the helpers below, so
 * there is no way for a shuffle to silently change which answer is correct.
 */
export interface PreparedQuestion {
  question: Question;
  /** displayOrder[displayIndex] = authored choice index. */
  displayOrder: number[];
}

/**
 * Choices that refer to other choices by position cannot be reordered without
 * changing their meaning. The bank does not currently use any, but the guard
 * means a future "All of the above" cannot quietly corrupt a test.
 */
const POSITIONAL_CHOICE = /\b(all|none|both|either|neither) of the (above|following)\b|\bboth a and b\b/i;

export function choicesAreShuffleSafe(question: Question): boolean {
  return !question.choices.some((c) => POSITIONAL_CHOICE.test(c));
}

export function prepareQuestion(question: Question, rng: Rng): PreparedQuestion {
  const indices = question.choices.map((_, i) => i);
  const displayOrder = choicesAreShuffleSafe(question) ? shuffle(indices, rng) : indices;
  return { question, displayOrder };
}

/** Where the correct answer sits in the presented order. */
export function correctDisplayIndex(prepared: PreparedQuestion): number {
  return prepared.displayOrder.indexOf(prepared.question.correctChoice);
}

/** Convert a position the learner clicked into the authored choice index. */
export function toAuthoredIndex(prepared: PreparedQuestion, displayIndex: number): number {
  const authored = prepared.displayOrder[displayIndex];
  if (authored === undefined) throw new RangeError(`No choice at display index ${displayIndex}`);
  return authored;
}

export function isCorrectDisplayChoice(
  prepared: PreparedQuestion,
  displayIndex: number,
): boolean {
  return toAuthoredIndex(prepared, displayIndex) === prepared.question.correctChoice;
}

/** Choice texts in the order they should be rendered. */
export function displayChoices(prepared: PreparedQuestion): string[] {
  return prepared.displayOrder.map((i) => prepared.question.choices[i]!);
}

/** Sign ids for each rendered choice, for identify-the-sign questions. */
export function displayChoiceSignIds(prepared: PreparedQuestion): string[] | undefined {
  const ids = prepared.question.choiceSignIds;
  if (!ids) return undefined;
  return prepared.displayOrder.map((i) => ids[i]!);
}

export interface SelectionOptions {
  /** How many questions to draw. */
  count: number;
  seed: number;
  /**
   * Relative likelihood of each question being drawn. Higher = more likely.
   * Defaults to a flat 1 for every question.
   */
  weightOf?: (q: Question) => number;
}

/**
 * Draw a set of questions with no repeats, then fix each one's choice order.
 *
 * Both the draw and the shuffles come from the same seed, so re-running with
 * the same seed and the same pool reproduces the session exactly.
 */
export function selectQuestions(
  pool: readonly Question[],
  { count, seed, weightOf }: SelectionOptions,
): PreparedQuestion[] {
  const rng = createRng(seed);
  const chosen = weightOf
    ? weightedSampleWithoutReplacement(pool, weightOf, count, rng)
    : shuffle(pool, rng).slice(0, count);
  return chosen.map((q) => prepareQuestion(q, rng));
}
