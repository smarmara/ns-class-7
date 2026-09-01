import approvalsJson from '@data/signs/visual-approvals.json';
import learnerScopeJson from '@data/signs/learner-scope.json';
import { getLearnerSignCatalogue, type LearnerSignEntry } from '@/content/learner-signs';
import { getSignArtwork } from '@/signs/artwork';
import type { Rng } from '@/engine/random';
import { signMatchPromptLabel } from './labels';

/**
 * Sign Match — round generation.
 *
 * The learner reads one sign's name and picks its artwork out of two. The
 * whole game is derived from the learner sign catalogue, never from the
 * question bank: Sign Match is supplementary practice and deliberately carries
 * no assessment evidence.
 *
 * The hard part is not picking a target, it is picking a *wrong* sign that
 * teaches something. A distractor should be close enough that the learner has
 * to actually look — No Parking against No Stopping — without ever being close
 * enough that both answers are defensible. `isAmbiguousPair` is where that line
 * is drawn, and it errs toward rejecting.
 */

const approvals = approvalsJson as {
  approvals: Record<string, { designation?: string; displayName: string; status: string }>;
};
const scope = learnerScopeJson as {
  classifications: Record<string, { scope: string; displayName: string; category: string }>;
};

export type SignMatchPool = 'all' | 'core';

export interface SignMatchRound {
  /** App id of the sign the prompt names. */
  target: string;
  /** The learner-facing name shown as the prompt. */
  prompt: string;
  /** Full catalogue name, revealed after the answer. */
  answerName: string;
  /** App ids of the two choices, in display order. */
  choices: readonly [string, string];
  /** Which side holds the target. */
  correctIndex: 0 | 1;
  /** Learner category the target belongs to. */
  category: string;
}

export interface RoundHistory {
  /** Most recent targets, newest first. */
  targets: readonly string[];
  /** Most recent pair, as a sorted key. */
  lastPairKey: string | null;
}

export const EMPTY_HISTORY: RoundHistory = { targets: [], lastPairKey: null };

/** How many recent targets to avoid repeating when alternatives exist. */
const HISTORY_DEPTH = 8;

/**
 * Pairs the data cannot rule out on its own.
 *
 * Kept deliberately tiny — every entry here is a failure to express something
 * structurally, so it needs a reason. Ids are stored as a sorted key.
 */
const AMBIGUOUS_EXCEPTIONS = new Set<string>([
  // Both are octagonal red stop faces; a learner asked for "Stop" could
  // reasonably choose either, and the bilingual plate's name does not contain
  // the other's as a word so the containment rule misses it.
  ['stop', 'RA-1B'].sort().join('|'),
]);

function pairKey(a: string, b: string): string {
  return [a, b].sort().join('|');
}

/** Normalised words of a sign name, for whole-word containment tests. */
function nameWords(name: string): string[] {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function containsAsPhrase(haystack: string[], needle: string[]): boolean {
  if (needle.length === 0 || needle.length > haystack.length) return false;
  for (let i = 0; i + needle.length <= haystack.length; i++) {
    if (needle.every((word, k) => haystack[i + k] === word)) return true;
  }
  return false;
}

/**
 * Whether naming one of these two signs would leave both defensible.
 *
 * Rejects when:
 *  - the ids or the artwork are the same;
 *  - one name contains the other as a whole phrase, which is how a parent and
 *    its qualified sibling read ("Pedestrian Crosswalk" against "Pedestrian
 *    Crosswalk — Symbol Facing Right", or "No Left Turn" against "No Left Turn
 *    on Red");
 *  - both carry the same official designation, so they are numeric or lettered
 *    variants of one Schedule sign;
 *  - the pair is on the small exception list above.
 */
export function isAmbiguousPair(a: string, b: string): boolean {
  if (a === b) return true;
  if (AMBIGUOUS_EXCEPTIONS.has(pairKey(a, b))) return true;

  const designationA = approvals.approvals[a]?.designation;
  const designationB = approvals.approvals[b]?.designation;
  if (designationA && designationB && designationA === designationB) return true;

  const artA = getSignArtwork(a);
  const artB = getSignArtwork(b);
  if (!artA || !artB) return true;
  if (artA.kind === 'crop' && artB.kind === 'crop' && artA.src === artB.src) return true;

  const wordsA = nameWords(displayNameFor(a));
  const wordsB = nameWords(displayNameFor(b));
  if (containsAsPhrase(wordsA, wordsB) || containsAsPhrase(wordsB, wordsA)) return true;

  return false;
}

function displayNameFor(id: string): string {
  return scope.classifications[id]?.displayName ?? approvals.approvals[id]?.displayName ?? id;
}

/**
 * Signs that may appear in the game.
 *
 * Core and Reference catalogue concepts only. The 55 Developer-only visuals are
 * excluded by construction — they are not in the learner catalogue — and so are
 * the 22 Variants, which are all supplementary tab plates whose names ("Ends
 * Tab", "Time Tab", "4-Way Tab") do not identify a sign on their own and would
 * make an unanswerable prompt.
 */
export function eligibleTargets(pool: SignMatchPool = 'all', category?: string): LearnerSignEntry[] {
  return getLearnerSignCatalogue().filter((entry) => {
    if (pool === 'core' && entry.scope !== 'core') return false;
    if (category && entry.category !== category) return false;
    return getSignArtwork(entry.id) !== undefined && displayNameFor(entry.id).trim().length > 0;
  });
}

function pickTarget(
  candidates: readonly LearnerSignEntry[],
  history: RoundHistory,
  rng: Rng,
): LearnerSignEntry | null {
  if (candidates.length === 0) return null;
  const recent = new Set(history.targets.slice(0, HISTORY_DEPTH));
  const fresh = candidates.filter((entry) => !recent.has(entry.id));
  const from = fresh.length > 0 ? fresh : candidates;
  return from[rng.int(from.length)] ?? null;
}

/**
 * Pick the wrong sign.
 *
 * Same learner category first, because discriminating two lane-control signs
 * teaches more than telling a stop sign from a bicycle route. Falls back to the
 * whole pool rather than ever returning an ambiguous or artless pairing.
 */
function pickDistractor(
  target: LearnerSignEntry,
  pool: readonly LearnerSignEntry[],
  history: RoundHistory,
  rng: Rng,
): LearnerSignEntry | null {
  const usable = pool.filter((entry) => !isAmbiguousPair(target.id, entry.id));
  const sameCategory = usable.filter((entry) => entry.category === target.category);

  for (const tier of [sameCategory, usable]) {
    if (tier.length === 0) continue;
    // Avoid repeating the exact pair we just showed, when there is a choice.
    const notJustSeen = tier.filter(
      (entry) => pairKey(target.id, entry.id) !== history.lastPairKey,
    );
    const from = notJustSeen.length > 0 ? notJustSeen : tier;
    return from[rng.int(from.length)] ?? null;
  }
  return null;
}

export interface CreateRoundOptions {
  pool?: SignMatchPool;
  category?: string;
  history?: RoundHistory;
  rng: Rng;
}

/**
 * Build one round, or null when the filters leave nothing playable.
 *
 * Returning null rather than relaxing the ambiguity rules is deliberate: a
 * category with only one usable sign should disable itself, not start serving
 * pairs where both answers are right.
 */
export function createRound({
  pool = 'all',
  category,
  history = EMPTY_HISTORY,
  rng,
}: CreateRoundOptions): SignMatchRound | null {
  const candidates = eligibleTargets(pool, category);
  const wholePool = eligibleTargets(pool);

  // Try a few targets before giving up: a category can contain a sign whose
  // only partners are all ambiguous with it.
  for (let attempt = 0; attempt < 12; attempt++) {
    const target = pickTarget(candidates, history, rng);
    if (!target) return null;
    const distractor = pickDistractor(target, wholePool, history, rng);
    if (!distractor) continue;

    const targetFirst = rng.next() < 0.5;
    return {
      target: target.id,
      prompt: signMatchPromptLabel(target.id),
      answerName: target.displayName,
      choices: targetFirst ? [target.id, distractor.id] : [distractor.id, target.id],
      correctIndex: targetFirst ? 0 : 1,
      category: target.category,
    };
  }
  return null;
}

/** Record a round in the history buffer. */
export function rememberRound(history: RoundHistory, round: SignMatchRound): RoundHistory {
  return {
    targets: [round.target, ...history.targets].slice(0, HISTORY_DEPTH),
    lastPairKey: pairKey(round.choices[0], round.choices[1]),
  };
}

export interface SignMatchScore {
  correct: number;
  missed: number;
  streak: number;
  bestStreak: number;
}

export const EMPTY_SCORE: SignMatchScore = { correct: 0, missed: 0, streak: 0, bestStreak: 0 };

/** Fold an answer into the session score. There is no losing state. */
export function scoreAnswer(score: SignMatchScore, wasCorrect: boolean): SignMatchScore {
  if (!wasCorrect) return { ...score, missed: score.missed + 1, streak: 0 };
  const streak = score.streak + 1;
  return {
    correct: score.correct + 1,
    missed: score.missed,
    streak,
    bestStreak: Math.max(score.bestStreak, streak),
  };
}
