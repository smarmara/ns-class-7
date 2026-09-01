import { describe, expect, it } from 'vitest';
import { activeQuestions, sourceManifest } from '@/content';
import type { Question } from '@/content/types';

/**
 * Licensing content invariants.
 *
 * Chapter 1 of the Handbook predates the April 2015 amendment that added the
 * restricted individual stage and extended the learner's licence to two years.
 * These tests exist so the superseded figures cannot come back, and so
 * stage-specific restrictions are never taught as if they applied everywhere.
 */

const questions = activeQuestions;
const byId = (id: string) => {
  const q = questions.find((x) => x.id === id);
  if (!q) throw new Error(`missing question ${id}`);
  return q;
};
const gdl = questions.filter((q) => q.topic === 'graduated-licensing');
const answerOf = (q: Question) => q.choices[q.correctChoice]!;

describe('the 2015 GDL amendment is reflected, not the superseded chapter text', () => {
  it('teaches a two-year learner licence, never the old one-year figure', () => {
    const q = byId('rules-gdl-004');
    expect(answerOf(q)).toMatch(/2 years|two years/i);
    expect(answerOf(q)).not.toMatch(/1 year|one year/i);
    expect(q.sourceRefs.some((r) => r.sourceId === 'ns-handbook-intro-amendments')).toBe(true);
  });

  it('teaches three GDL stages including the restricted individual stage', () => {
    expect(answerOf(byId('rules-gdl-012'))).toMatch(/restricted individual/i);
    expect(answerOf(byId('rules-gdl-013'))).toMatch(/zero alcohol or drugs/i);
  });

  it('cites the amendment wherever an amended rule is taught', () => {
    for (const id of ['rules-gdl-004', 'rules-gdl-012', 'rules-gdl-013', 'rules-gdl-018']) {
      expect(
        byId(id).sourceRefs.some((r) => r.sourceId === 'ns-handbook-intro-amendments'),
        `${id} teaches amended material and must cite the amendment`,
      ).toBe(true);
    }
  });
});

describe('restrictions stay tied to their licence stage', () => {
  it('names a stage in every stage-specific question', () => {
    // A restriction that differs between stages must say which stage it means,
    // or a learner will read a Class 5N rule as their own.
    const stageSpecific = ['rules-gdl-009', 'rules-gdl-010', 'rules-gdl-013', 'rules-gdl-019'];
    for (const id of stageSpecific) {
      const q = byId(id);
      expect(
        /class 7|learner|5N|newly licensed|5R|restricted individual/i.test(q.question),
        `${id} must name the licence stage it applies to`,
      ).toBe(true);
    }
  });

  it('keeps the curfew and the passenger limit at the newly licensed stage', () => {
    // Neither applies to a Class 7 learner, whose rule is "no passengers at
    // all besides the supervising driver".
    for (const id of ['rules-gdl-009', 'rules-gdl-010']) {
      expect(byId(id).question).toMatch(/5N|newly licensed/i);
    }
    const everyStage = byId('rules-gdl-021');
    expect(answerOf(everyStage)).toMatch(/zero alcohol/i);
    for (const choice of everyStage.choices) {
      if (choice === answerOf(everyStage)) continue;
      expect(choice).not.toMatch(/zero alcohol/i);
    }
  });

  it('does not let a learner question imply a curfew or a passenger allowance', () => {
    const learner = byId('rules-gdl-001');
    expect(answerOf(learner)).toMatch(/no other passengers/i);
  });
});

describe('supervising driver requirements are current and complete', () => {
  it('requires two years of experience and exit from the GDL program', () => {
    const q = byId('rules-gdl-002');
    expect(answerOf(q)).toMatch(/two years/i);
    expect(answerOf(q)).toMatch(/no longer in the GDL/i);
  });

  it('records the licence-class element in the explanation', () => {
    expect(byId('rules-gdl-002').explanation).toMatch(/Class 1, 2, 3, 4 or 5/);
  });

  it('cites the Act for the two-year experience definition', () => {
    expect(byId('rules-gdl-002').sourceRefs.some((r) => r.sourceId === 'ns-mva')).toBe(true);
  });

  it('uses the current "supervising driver" term rather than "experienced driver"', () => {
    // The 2015 amendment renamed the role. Existing answers should not teach
    // the superseded label.
    for (const q of gdl) {
      expect(answerOf(q), q.id).not.toMatch(/experienced driver/i);
    }
  });
});

describe('progression rules are sourced to the Act, not only the old Handbook', () => {
  it('cites the Motor Vehicle Act for the newly licensed stage duration', () => {
    const q = byId('rules-gdl-019');
    expect(answerOf(q)).toMatch(/two years/i);
    expect(q.sourceRefs.some((r) => r.sourceId === 'ns-mva')).toBe(true);
  });

  it('requires driver training and the restricted stage to exit the program', () => {
    const q = byId('rules-gdl-020');
    expect(answerOf(q)).toMatch(/driver training/i);
    expect(answerOf(q)).toMatch(/restricted/i);
    expect(q.sourceRefs.some((r) => r.sourceId === 'ns-mva')).toBe(true);
  });
});

describe('licensing questions avoid administrative trivia', () => {
  it('asks about no fees, forms or booking procedures', () => {
    for (const q of gdl) {
      expect(q.question, q.id).not.toMatch(/\$\d|fee\b|application form|book an appointment|phone/i);
    }
  });

  it('never tests the app\'s own mock configuration', () => {
    for (const q of gdl) {
      expect(q.question, q.id).not.toMatch(/mock test|this app|practice test/i);
    }
  });
});

describe('the Class 7 practice period reflects current RMV guidance', () => {
  const waitingPeriod = byId('rules-gdl-005');

  it('teaches the 12-month practice period with a 9-month reduction', () => {
    expect(answerOf(waitingPeriod)).toMatch(/twelve months/i);
    expect(answerOf(waitingPeriod)).toMatch(/nine/i);
  });

  it('cannot re-adopt the superseded six-and-three-month rule', () => {
    // Replaced on 1 April 2016. It survives only as a distractor, never as an
    // answer, and never in the explanation as though it were current.
    expect(answerOf(waitingPeriod)).not.toMatch(/six months|three months/i);
    for (const q of gdl) {
      expect(
        answerOf(q),
        `${q.id} must not teach a six- or three-month road-test wait`,
      ).not.toMatch(/(six|three) months.*(road test|reduc|wait)|wait.*(six|three) months/i);
    }
  });

  it('cites current RMV guidance rather than the superseded Handbook page', () => {
    const ids = waitingPeriod.sourceRefs.map((r) => r.sourceId);
    expect(ids).toContain('ns-rmv-gdl-system');
    expect(ids).toContain('ns-rmv-who-takes-exam');
    // Handbook ch.1 states the old figures, so it must not back this question.
    expect(ids).not.toContain('ns-handbook-ch1');
    for (const ref of waitingPeriod.sourceRefs) {
      const source = sourceManifest.sources.find((s) => s.id === ref.sourceId);
      expect(source?.precedence, `${ref.sourceId} should be current RMV guidance`).toBe(3);
    }
  });

  it('describes the reduction as an approved course, not any lessons', () => {
    expect(answerOf(waitingPeriod)).toMatch(/approved driver education/i);
    expect(waitingPeriod.explanation).toMatch(/approved by the Registrar of Motor Vehicles/i);
  });
});

describe('demerit consequences stay stage-specific and current', () => {
  const learnerPoints = byId('rules-gdl-006');

  it('gives the learner four-point consequence as an interview, not a suspension', () => {
    // The current Registry point table puts 4 points in the Interview column
    // for a learner and leaves the suspension cell empty; the old Handbook
    // prose claimed a six-month suspension at four.
    expect(learnerPoints.question).toMatch(/class 7|learner/i);
    expect(answerOf(learnerPoints)).toMatch(/interview/i);
    expect(answerOf(learnerPoints)).not.toMatch(/suspend/i);
  });

  it('cites the current point system', () => {
    expect(learnerPoints.sourceRefs.map((r) => r.sourceId)).toContain('ns-rmv-point-system');
  });

  it('does not collapse every speeding offence into one point value', () => {
    // The current schedule runs 2, 3, 4 and 6 points depending on the offence.
    for (const q of questions) {
      expect(
        answerOf(q),
        `${q.id} must not state a single point value for speeding generally`,
      ).not.toMatch(/speeding.*(always|every).*(point|demerit)/i);
    }
  });

  it('leaves the newly licensed and restricted stage rules untouched', () => {
    expect(answerOf(byId('rules-gdl-019'))).toMatch(/two years/i);
    expect(answerOf(byId('rules-gdl-013'))).toMatch(/zero alcohol or drugs/i);
    expect(answerOf(byId('rules-gdl-009'))).toMatch(/midnight and 5:00 am/i);
  });
});

describe('administrative road-test process is documented, not assessed', () => {
  it('adds no question about how soon a failed road test may be rebooked', () => {
    for (const q of questions) {
      const text = `${q.question} ${answerOf(q)}`;
      expect(text, `${q.id} should not test road-test rebooking intervals`).not.toMatch(
        /(re-?book|retake|take the (road )?test again).*(next day|one week|seven days)/i,
      );
    }
  });
});
