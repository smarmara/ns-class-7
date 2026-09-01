import { describe, expect, it } from 'vitest';
import { activeQuestions } from '@/content';
import type { Question } from '@/content/types';

/**
 * Adverse-condition content invariants.
 *
 * These guard the three things the Priority 7 audit found easiest to get
 * wrong: presenting safety guidance as law, teaching skid folklore the
 * Handbook does not contain, and implying a posted limit is a safe speed.
 */

const questions = activeQuestions;
const byId = (id: string) => {
  const q = questions.find((x) => x.id === id);
  if (!q) throw new Error(`missing question ${id}`);
  return q;
};
const adverse = questions.filter((q) => q.topic === 'adverse-conditions');
const correctChoice = (q: Question) => q.choices[q.correctChoice]!;

describe('headlight rules keep law and guidance apart', () => {
  it('cites the Motor Vehicle Act for every legally-phrased headlight claim', () => {
    // Verified against data/sources/snapshots/ns-mva.txt s.178 during the
    // Priority 7 audit: the sunset/sunrise period, the 300 m visibility
    // trigger, and the 150 m / 60 m dimming distances all come from the Act.
    for (const id of ['rules-adverse-001', 'rules-adverse-003', 'rules-adverse-021']) {
      const q = byId(id);
      expect(
        q.sourceRefs.some((r) => r.sourceId === 'ns-mva'),
        `${id} makes a legal claim and must cite the Act`,
      ).toBe(true);
    }
  });

  it('keeps the 300 m lighting trigger distinct from the 150 m dimming distance', () => {
    expect(correctChoice(byId('rules-adverse-021'))).toContain('300 metres');
    expect(correctChoice(byId('rules-adverse-003'))).toContain('150 metres');
    // The dimming question must not be answerable with the lighting trigger.
    expect(correctChoice(byId('rules-adverse-003'))).not.toContain('300');
  });

  it('states the lighting requirement as a duty, not a suggestion', () => {
    const explanation = byId('rules-adverse-021').explanation;
    expect(explanation).toMatch(/legal requirement|required|must/i);
    expect(explanation).not.toMatch(/\brecommended\b|\bsuggest/i);
  });
});

describe('skid advice matches the Handbook', () => {
  const skid = byId('rules-adverse-014');

  it('teaches the source response: come off the gas and let the vehicle slow', () => {
    expect(correctChoice(skid)).toMatch(/foot off the gas/i);
  });

  it('does not teach braking or gear-shifting as the first response', () => {
    // The Handbook names braking, shifting gears and sudden steering as the
    // three things that start a skid, so none may be the answer.
    expect(correctChoice(skid)).not.toMatch(/brake|gear|shift/i);
  });

  it('avoids the "steer into the skid" folklore the source never uses', () => {
    for (const q of adverse) {
      expect(JSON.stringify(q), q.id).not.toMatch(/into the skid/i);
    }
  });
});

describe('speed guidance never presents the posted limit as safe', () => {
  it('makes the posted limit a wrong answer in the snow-speed question', () => {
    const q = byId('rules-adverse-016');
    const posted = q.choices.findIndex((c) => /posted limit/i.test(c));
    expect(posted).toBeGreaterThanOrEqual(0);
    expect(posted, 'keeping to the posted limit must not be the correct answer').not.toBe(
      q.correctChoice,
    );
    expect(correctChoice(q)).toMatch(/more than half/i);
  });

  it('has no adverse-condition question whose answer is to keep to the limit', () => {
    for (const q of adverse) {
      expect(correctChoice(q), q.id).not.toMatch(/keep to the posted|posted limit is safe/i);
    }
  });
});

describe('adverse-conditions questions are sourced and current', () => {
  it('gives every question at least one source reference', () => {
    for (const q of adverse) expect(q.sourceRefs.length, q.id).toBeGreaterThan(0);
  });

  it('draws on Chapter 5 or another tracked authority, never nothing', () => {
    const allowed = new Set([
      'ns-handbook-ch4',
      'ns-handbook-ch5',
      'ns-mva',
      'ns-handbook-ch2',
      'ns-reg-studded-tires',
    ]);
    for (const q of adverse) {
      for (const ref of q.sourceRefs) expect(allowed.has(ref.sourceId), `${q.id} -> ${ref.sourceId}`).toBe(true);
    }
  });
});
