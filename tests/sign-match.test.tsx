import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import learnerScopeJson from '@data/signs/learner-scope.json';
import { getSignMeta } from '@/content';
import { groupedVariantCount, signVariantIndex, variantsFor } from '@/content/sign-variants';
import { getSignArtwork } from '@/signs/artwork';
import { createRng } from '@/engine/random';
import {
  EMPTY_HISTORY,
  EMPTY_SCORE,
  createRound,
  eligibleTargets,
  isAmbiguousPair,
  rememberRound,
  scoreAnswer,
} from '@/engine/signmatch/rounds';
import { signMatchPromptLabel } from '@/engine/signmatch/labels';
import { SignMatch } from '@/routes/SignMatch';

const scope = learnerScopeJson as {
  classifications: Record<string, { scope: string; displayName: string }>;
};
const byScope = (name: string) =>
  Object.entries(scope.classifications).filter(([, v]) => v.scope === name);

/** Deterministic RNG so nothing here is probabilistic. */
const rng = (seed: number) => createRng(seed);

describe('inventory reconciles', () => {
  it('splits 232 approved visuals into 80 / 75 / 22 / 55', () => {
    expect(byScope('core')).toHaveLength(80);
    expect(byScope('reference')).toHaveLength(75);
    expect(byScope('variant')).toHaveLength(22);
    expect(byScope('developer-only')).toHaveLength(55);
    expect(Object.keys(scope.classifications)).toHaveLength(232);
    // 232 - 155 top-level = 22 variants + 55 developer-only.
    expect(232 - 155).toBe(22 + 55);
  });
});

describe('Sign Match target pool', () => {
  const all = eligibleTargets('all');
  const core = eligibleTargets('core');

  it('offers every Core and Reference concept', () => {
    expect(all).toHaveLength(155);
    expect(core).toHaveLength(80);
  });

  it('admits no Developer-only visual', () => {
    const developerOnly = new Set(byScope('developer-only').map(([id]) => id));
    for (const entry of all) expect(developerOnly.has(entry.id), entry.id).toBe(false);
  });

  it('admits no Variant visual', () => {
    // All 22 are supplementary tabs whose names do not identify a sign.
    const variants = new Set(byScope('variant').map(([id]) => id));
    for (const entry of all) expect(variants.has(entry.id), entry.id).toBe(false);
  });

  it('gives every target resolvable artwork and a learner name', () => {
    for (const entry of all) {
      expect(getSignArtwork(entry.id), entry.id).toBeDefined();
      expect(entry.displayName.trim().length, entry.id).toBeGreaterThan(0);
    }
  });

  it('narrows to a category when asked', () => {
    const lane = eligibleTargets('all', 'lane-use');
    expect(lane).toHaveLength(56);
    for (const entry of lane) expect(entry.category).toBe('lane-use');
  });
});

describe('ambiguity guard', () => {
  it('rejects a sign against itself', () => {
    expect(isAmbiguousPair('stop', 'stop')).toBe(true);
  });

  it('rejects a name that contains the other as a phrase', () => {
    // "Pedestrian Crosswalk" would not distinguish these two.
    expect(isAmbiguousPair('pedestrian-crosswalk', 'RA-4R')).toBe(true);
    expect(isAmbiguousPair('school-crosswalk', 'RA-3R')).toBe(true);
    // "No Left Turn" against "No Left Turn on Red".
    expect(isAmbiguousPair('no-left-turn', 'RB-17L')).toBe(true);
  });

  it('rejects two variants of one Schedule designation', () => {
    // Both are RB-1; the artwork differs only in the numeral.
    expect(isAmbiguousPair('maximum-speed-50', 'maximum-speed-80')).toBe(true);
  });

  it('rejects the bilingual stop against the plain stop', () => {
    expect(isAmbiguousPair('stop', 'RA-1B')).toBe(true);
  });

  it('accepts genuinely discriminable pairs', () => {
    expect(isAmbiguousPair('no-parking', 'no-stopping')).toBe(false);
    expect(isAmbiguousPair('no-left-turn', 'no-right-turn')).toBe(false);
    expect(isAmbiguousPair('stop', 'yield')).toBe(false);
  });

  it('never produces an ambiguous pair across many generated rounds', () => {
    for (let seed = 1; seed <= 400; seed++) {
      const round = createRound({ rng: rng(seed) });
      expect(round, `seed ${seed}`).not.toBeNull();
      expect(
        isAmbiguousPair(round!.choices[0], round!.choices[1]),
        `seed ${seed}: ${round!.choices.join(' vs ')}`,
      ).toBe(false);
    }
  });
});

describe('round generation', () => {
  it('returns two distinct choices with exactly one correct', () => {
    for (let seed = 1; seed <= 100; seed++) {
      const round = createRound({ rng: rng(seed) })!;
      expect(round.choices[0]).not.toBe(round.choices[1]);
      expect(round.choices[round.correctIndex]).toBe(round.target);
      expect(round.choices.filter((id) => id === round.target)).toHaveLength(1);
    }
  });

  it('uses the game prompt label, and reveals the full name after answering', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const round = createRound({ rng: rng(seed) })!;
      expect(round.prompt).toBe(signMatchPromptLabel(round.target));
      expect(round.answerName).toBe(scope.classifications[round.target]!.displayName);
    }
  });

  it('puts the correct answer on both sides across a run', () => {
    const sides = new Set<number>();
    for (let seed = 1; seed <= 60; seed++) {
      sides.add(createRound({ rng: rng(seed) })!.correctIndex);
    }
    expect([...sides].sort()).toEqual([0, 1]);
  });

  it('resolves artwork for both choices every time', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const round = createRound({ rng: rng(seed) })!;
      for (const id of round.choices) expect(getSignArtwork(id), id).toBeDefined();
    }
  });

  it('prefers a distractor from the target category', () => {
    // Not every round can manage it, but the large majority should.
    let sameCategory = 0;
    const total = 200;
    for (let seed = 1; seed <= total; seed++) {
      const round = createRound({ rng: rng(seed) })!;
      const other = round.choices[round.correctIndex === 0 ? 1 : 0];
      const catalogueOther = eligibleTargets('all').find((e) => e.id === other)!;
      if (catalogueOther.category === round.category) sameCategory++;
    }
    expect(sameCategory / total).toBeGreaterThan(0.9);
  });

  it('falls back rather than failing when a category is thin', () => {
    // Railway holds three signs; a round must still be buildable.
    const round = createRound({ category: 'railway', rng: rng(7) });
    expect(round).not.toBeNull();
    expect(round!.category).toBe('railway');
    expect(isAmbiguousPair(round!.choices[0], round!.choices[1])).toBe(false);
  });

  it('honours the Core-only pool', () => {
    const coreIds = new Set(eligibleTargets('core').map((e) => e.id));
    for (let seed = 1; seed <= 80; seed++) {
      const round = createRound({ pool: 'core', rng: rng(seed) })!;
      expect(coreIds.has(round.target), round.target).toBe(true);
    }
  });
});

describe('recent history', () => {
  it('does not repeat the same target back to back', () => {
    let history = EMPTY_HISTORY;
    const generator = rng(99);
    let previous: string | null = null;
    for (let n = 0; n < 60; n++) {
      const round = createRound({ history, rng: generator })!;
      expect(round.target).not.toBe(previous);
      previous = round.target;
      history = rememberRound(history, round);
    }
  });

  it('remembers the most recent targets and pair', () => {
    const round = createRound({ rng: rng(3) })!;
    const history = rememberRound(EMPTY_HISTORY, round);
    expect(history.targets[0]).toBe(round.target);
    expect(history.lastPairKey).toBe([...round.choices].sort().join('|'));
  });
});

describe('session score', () => {
  it('counts a correct answer and grows the streak', () => {
    const after = scoreAnswer(scoreAnswer(EMPTY_SCORE, true), true);
    expect(after).toEqual({ correct: 2, missed: 0, streak: 2, bestStreak: 2 });
  });

  it('counts a miss and resets the streak without ending the game', () => {
    const after = scoreAnswer(scoreAnswer(EMPTY_SCORE, true), false);
    expect(after.correct).toBe(1);
    expect(after.missed).toBe(1);
    expect(after.streak).toBe(0);
    expect(after.bestStreak).toBe(1);
  });

  it('has no losing state to reach', () => {
    let score = EMPTY_SCORE;
    for (let n = 0; n < 50; n++) score = scoreAnswer(score, false);
    expect(score.missed).toBe(50);
    expect(score).not.toHaveProperty('lives');
    expect(score).not.toHaveProperty('gameOver');
  });
});

describe('related sign variants', () => {
  it('groups variants under parents derived from the designation', () => {
    const index = signVariantIndex();
    expect(index.size).toBe(8);
    expect(groupedVariantCount()).toBe(14);
    expect(variantsFor('stop').map((v) => v.id)).toEqual([
      'RA-1S1',
      'RA-1S2',
      'RA-1S3',
      'RA-1S4',
      'RA-1S5',
    ]);
    expect(variantsFor('two-way-left-turn-lane').map((v) => v.id)).toEqual(['RB-48S']);
  });

  it('only ever groups Variant-scoped visuals', () => {
    for (const [parent, list] of signVariantIndex()) {
      expect(['core', 'reference']).toContain(scope.classifications[parent]!.scope);
      for (const variant of list) {
        expect(scope.classifications[variant.id]!.scope, variant.id).toBe('variant');
      }
    }
  });

  it('never surfaces a Developer-only visual as a related sign', () => {
    const developerOnly = new Set(byScope('developer-only').map(([id]) => id));
    for (const list of signVariantIndex().values()) {
      for (const variant of list) expect(developerOnly.has(variant.id), variant.id).toBe(false);
    }
  });

  it('resolves approved artwork for every grouped variant', () => {
    for (const list of signVariantIndex().values()) {
      for (const variant of list) expect(getSignArtwork(variant.id), variant.id).toBeDefined();
    }
  });

  it('leaves the top-level catalogue count untouched', () => {
    // Grouped variants enrich parents; they are not extra concepts.
    expect(eligibleTargets('all')).toHaveLength(155);
  });
});

describe('the Sign Match screen', () => {
  const renderGame = () =>
    render(
      <MemoryRouter initialEntries={['/signs/match']}>
        <SignMatch />
      </MemoryRouter>,
    );

  it('starts a valid round immediately, with no setup step', () => {
    renderGame();
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /.+/ })).not.toHaveLength(0);
    expect(document.querySelectorAll('.match-choice')).toHaveLength(2);
  });

  it('does not reveal the answer before a choice is made', () => {
    renderGame();
    const prompt = screen.getByRole('heading', { level: 1 }).textContent!;
    for (const button of document.querySelectorAll('.match-choice')) {
      // The button's accessible name describes appearance, never meaning.
      expect(button.getAttribute('aria-label')).not.toBe(prompt);
      expect(button.textContent).not.toContain(prompt);
      // And the artwork itself is decorative, so nothing leaks through alt.
      const img = button.querySelector('[alt], [aria-label]');
      if (img) expect(img.getAttribute('alt') ?? '').not.toContain(prompt);
    }
  });

  it('uses answer-neutral labels drawn from appearance where available', () => {
    renderGame();
    for (const button of document.querySelectorAll('.match-choice')) {
      const label = button.getAttribute('aria-label')!;
      expect(label.length).toBeGreaterThan(0);
      const described = Object.values(scope.classifications).some(
        (entry) => entry.displayName === label,
      );
      expect(described, `"${label}" must not be a sign's semantic name`).toBe(false);
    }
  });

  it('renders no missing-artwork fallback', () => {
    renderGame();
    expect(document.querySelector('.match-choices')!.textContent).not.toContain('⚠️');
  });

  it('offers the pool and category filters without blocking play', () => {
    renderGame();
    const selects = screen.getAllByRole('combobox');
    expect(selects).toHaveLength(2);
    expect(within(selects[0]!).getByText('All study signs')).toBeInTheDocument();
    expect(within(selects[0]!).getByText('Assessed signs')).toBeInTheDocument();
    // The round is already on screen behind the filters.
    expect(document.querySelectorAll('.match-choice')).toHaveLength(2);
  });

  it('describes itself as practice that does not count towards mastery', () => {
    renderGame();
    expect(screen.getByText(/does not count towards your topic progress or mastery/i)).toBeInTheDocument();
  });
});

describe('choice labels never carry meaning', () => {
  it('uses the visual description, not the sign name, wherever meta exists', () => {
    for (const entry of eligibleTargets('all')) {
      const meta = getSignMeta(entry.id);
      if (!meta) continue;
      expect(meta.visualDescription, entry.id).not.toBe(entry.displayName);
    }
  });
});
