import { describe, expect, it } from 'vitest';
import type { Question } from '@/content/types';
import { createRng, shuffle, weightedSampleWithoutReplacement } from '@/engine/random';
import {
  choicesAreShuffleSafe,
  correctDisplayIndex,
  displayChoices,
  isCorrectDisplayChoice,
  prepareQuestion,
  selectQuestions,
  toAuthoredIndex,
} from '@/engine/quiz/selection';

function q(id: string, choices = ['alpha', 'bravo', 'charlie', 'delta'], correct = 2): Question {
  return {
    id,
    type: 'rules',
    topic: 'right-of-way',
    question: `Stem ${id}?`,
    choices,
    correctChoice: correct,
    explanation: 'because',
    difficulty: 'easy',
    tags: [],
    sourceRefs: [{ sourceId: 'ns-handbook-ch2' }],
    legalStatus: 'current',
    verifiedAt: '2026-08-17',
    lawVersion: 'mva',
  };
}

const pool = Array.from({ length: 40 }, (_, i) => q(`q${i}`));

describe('shuffle', () => {
  it('is a permutation — nothing lost, nothing invented', () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8];
    const out = shuffle(input, createRng(7));
    expect([...out].sort((a, b) => a - b)).toEqual(input);
  });

  it('does not mutate its input', () => {
    const input = [1, 2, 3, 4];
    shuffle(input, createRng(1));
    expect(input).toEqual([1, 2, 3, 4]);
  });

  it('is deterministic for a given seed', () => {
    expect(shuffle([1, 2, 3, 4, 5], createRng(99))).toEqual(shuffle([1, 2, 3, 4, 5], createRng(99)));
  });

  it('actually reorders across seeds', () => {
    const results = new Set(
      Array.from({ length: 20 }, (_, s) => shuffle([1, 2, 3, 4, 5], createRng(s)).join(',')),
    );
    expect(results.size).toBeGreaterThan(1);
  });
});

describe('answer-order randomisation', () => {
  it('keeps the correct answer correct however the choices are ordered', () => {
    for (let seed = 0; seed < 200; seed++) {
      const prepared = prepareQuestion(q('x'), createRng(seed));
      const index = correctDisplayIndex(prepared);
      expect(displayChoices(prepared)[index]).toBe('charlie');
      expect(isCorrectDisplayChoice(prepared, index)).toBe(true);
      for (let i = 0; i < 4; i++) {
        if (i !== index) expect(isCorrectDisplayChoice(prepared, i)).toBe(false);
      }
    }
  });

  it('never rewrites the authored correctChoice', () => {
    const question = q('x');
    const prepared = prepareQuestion(question, createRng(3));
    expect(prepared.question.correctChoice).toBe(2);
    expect(question.choices[2]).toBe('charlie');
  });

  it('presents every authored choice exactly once', () => {
    const prepared = prepareQuestion(q('x'), createRng(11));
    expect([...prepared.displayOrder].sort()).toEqual([0, 1, 2, 3]);
    expect(displayChoices(prepared).sort()).toEqual(['alpha', 'bravo', 'charlie', 'delta']);
  });

  it('maps a clicked position back to the authored index', () => {
    const prepared = prepareQuestion(q('x'), createRng(5));
    for (let i = 0; i < 4; i++) {
      expect(prepared.question.choices[toAuthoredIndex(prepared, i)]).toBe(
        displayChoices(prepared)[i],
      );
    }
  });

  it('does not put the correct answer in the same slot every time', () => {
    const positions = new Set(
      Array.from({ length: 60 }, (_, s) => correctDisplayIndex(prepareQuestion(q('x'), createRng(s)))),
    );
    expect(positions.size).toBeGreaterThan(1);
  });

  it('refuses to shuffle choices that refer to other choices by position', () => {
    const positional = q('p', ['Only A', 'Only B', 'Both of the above', 'Neither'], 2);
    expect(choicesAreShuffleSafe(positional)).toBe(false);
    const prepared = prepareQuestion(positional, createRng(4));
    expect(prepared.displayOrder).toEqual([0, 1, 2, 3]);
    expect(correctDisplayIndex(prepared)).toBe(2);
  });

  it('treats ordinary choices as safe to shuffle', () => {
    expect(choicesAreShuffleSafe(q('ok'))).toBe(true);
  });
});

describe('selectQuestions', () => {
  it('never repeats a question within a set', () => {
    for (let seed = 0; seed < 40; seed++) {
      const picked = selectQuestions(pool, { count: 20, seed });
      const ids = picked.map((p) => p.question.id);
      expect(new Set(ids).size).toBe(20);
    }
  });

  it('is reproducible from its seed', () => {
    const a = selectQuestions(pool, { count: 12, seed: 424242 });
    const b = selectQuestions(pool, { count: 12, seed: 424242 });
    expect(a.map((p) => p.question.id)).toEqual(b.map((p) => p.question.id));
    expect(a.map((p) => p.displayOrder)).toEqual(b.map((p) => p.displayOrder));
  });

  it('produces different sets for different seeds', () => {
    const sets = new Set(
      Array.from({ length: 15 }, (_, s) =>
        selectQuestions(pool, { count: 10, seed: s })
          .map((p) => p.question.id)
          .join(','),
      ),
    );
    expect(sets.size).toBeGreaterThan(1);
  });

  it('caps at the pool size instead of repeating to fill the count', () => {
    const small = pool.slice(0, 5);
    const picked = selectQuestions(small, { count: 20, seed: 1 });
    expect(picked).toHaveLength(5);
    expect(new Set(picked.map((p) => p.question.id)).size).toBe(5);
  });

  it('honours weights while still avoiding repeats', () => {
    const favoured = new Set(['q0', 'q1', 'q2']);
    let favouredHits = 0;
    const runs = 60;

    for (let seed = 0; seed < runs; seed++) {
      const picked = selectQuestions(pool, {
        count: 5,
        seed,
        weightOf: (question) => (favoured.has(question.id) ? 50 : 1),
      });
      expect(new Set(picked.map((p) => p.question.id)).size).toBe(5);
      favouredHits += picked.filter((p) => favoured.has(p.question.id)).length;
    }

    // Unweighted, 3 favourites in a 40-pool drawn 5 at a time would appear
    // about 0.375 times per run. Heavy weighting must beat that decisively.
    expect(favouredHits / runs).toBeGreaterThan(2);
  });
});

describe('weightedSampleWithoutReplacement', () => {
  it('returns distinct items', () => {
    const items = ['a', 'b', 'c', 'd', 'e'];
    const picked = weightedSampleWithoutReplacement(items, () => 1, 5, createRng(2));
    expect(new Set(picked).size).toBe(5);
  });

  it('never returns more than the pool holds', () => {
    const picked = weightedSampleWithoutReplacement(['a', 'b'], () => 1, 10, createRng(2));
    expect(picked).toHaveLength(2);
  });

  it('tolerates zero weights without crashing or excluding everything', () => {
    const picked = weightedSampleWithoutReplacement(['a', 'b', 'c'], () => 0, 3, createRng(2));
    expect(new Set(picked).size).toBe(3);
  });
});
