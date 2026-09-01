import { describe, expect, it } from 'vitest';
import type { Question, Topic } from '@/content/types';
import type { AttemptRecord, Progress, QuestionStat } from '@/engine/learning/types';
import { emptyProgress } from '@/engine/learning/types';
import { topicMastery, MASTERY_RULES, recommendedNextTopic } from '@/engine/learning/mastery';
import { buildPath, pathProgress } from '@/engine/learning/path';
import { computeReadiness } from '@/engine/learning/readiness';
import { addXp, emptyEngagement, localDate, MAX_DAILY_LOG } from '@/engine/engagement/types';
import { sessionXp } from '@/engine/engagement/xp';

const NOW = new Date('2026-08-17T12:00:00Z');

function q(id: string, topic: Topic = 'traffic-signals'): Question {
  return {
    id,
    type: 'rules',
    topic,
    question: `Stem ${id}?`,
    choices: ['a', 'b', 'c', 'd'],
    correctChoice: 0,
    explanation: 'because',
    difficulty: 'easy',
    tags: [],
    sourceRefs: [{ sourceId: 'ns-handbook-ch2' }],
    legalStatus: 'current',
    verifiedAt: '2026-08-17',
    lawVersion: 'mva',
  };
}

function attempt(questionId: string, correct: boolean, topic: Topic): AttemptRecord {
  return {
    questionId,
    topic,
    type: 'rules',
    correct,
    at: NOW.toISOString(),
    mode: 'quick',
  };
}

function stat(questionId: string, box: number, seen = box > 0 ? 1 : 0): QuestionStat {
  return {
    questionId,
    seen,
    correct: seen,
    incorrect: 0,
    lastSeenAt: NOW.toISOString(),
    lastResult: 'correct',
    streak: 1,
    box,
    dueAt: NOW.toISOString(),
    bookmarked: false,
    flaggedForReview: false,
  };
}

function progress(attempts: AttemptRecord[], stats: QuestionStat[]): Progress {
  return {
    ...emptyProgress(),
    attempts,
    questions: Object.fromEntries(stats.map((s) => [s.questionId, s])),
  };
}

describe('daily XP ledger', () => {
  it('credits lifetime and today, never deducts', () => {
    let e = addXp(emptyEngagement(), 10, NOW);
    e = addXp(e, 25, NOW);
    expect(e.xp).toBe(35);
    expect(e.daily[0]?.date).toBe(localDate(NOW));
    expect(e.daily[0]?.xp).toBe(35);
  });

  it('ignores non-positive amounts', () => {
    const e = addXp(addXp(emptyEngagement(), 10, NOW), -5, NOW);
    expect(e.xp).toBe(10);
  });

  it('keeps one entry per day, newest first', () => {
    const day1 = new Date('2026-08-16T12:00:00Z');
    const day2 = new Date('2026-08-17T12:00:00Z');
    let e = addXp(emptyEngagement(), 10, day1);
    e = addXp(e, 20, day2);
    expect(e.daily.map((d) => d.date)).toEqual([localDate(day2), localDate(day1)]);
    expect(e.daily.map((d) => d.xp)).toEqual([20, 10]);
  });

  it('trims the log to keep storage small', () => {
    let e = emptyEngagement();
    for (let i = 0; i < MAX_DAILY_LOG + 10; i++) {
      const d = new Date(NOW);
      d.setDate(d.getDate() - i);
      e = addXp(e, 5, d);
    }
    expect(e.daily.length).toBe(MAX_DAILY_LOG);
  });
});

describe('session XP', () => {
  const pool = [q('r1', 'right-of-way'), q('r2', 'right-of-way'), q('t1', 'turning'), q('t2', 'turning')];

  it('rewards correct answers and completion', () => {
    const breakdown = sessionXp(pool, emptyProgress(), emptyProgress(), 5);
    expect(breakdown.correct).toBe(50);
    expect(breakdown.completion).toBe(25);
    expect(breakdown.recovery).toBe(0);
    expect(breakdown.total).toBe(75);
  });

  it('credits one recovery bonus per topic that left the weak zone', () => {
    const start = progress(
      [attempt('r1', true, 'right-of-way'), attempt('r2', true, 'right-of-way'), attempt('r1', false, 'right-of-way')],
      [stat('r1', 0), stat('r2', 0)],
    );
    const now = progress(
      [...start.attempts, attempt('r2', true, 'right-of-way'), attempt('r1', true, 'right-of-way')],
      [stat('r1', 1), stat('r2', 1)],
    );
    const breakdown = sessionXp(pool, start, now, 3);
    expect(breakdown.recovery).toBe(15);
    expect(breakdown.recoveredTopics).toEqual(['right-of-way']);
    expect(breakdown.total).toBe(30 + 25 + 15);
  });

  it('does not double-count recovery for the same topic', () => {
    const start = progress(
      [attempt('r1', true, 'right-of-way'), attempt('r2', true, 'right-of-way'), attempt('r1', false, 'right-of-way')],
      [stat('r1', 0), stat('r2', 0)],
    );
    const now = progress(
      [...start.attempts, attempt('r2', true, 'right-of-way'), attempt('r1', true, 'right-of-way')],
      [stat('r1', 1), stat('r2', 1)],
    );
    const breakdown = sessionXp(pool, start, now, 3);
    expect(breakdown.recoveredTopics).toHaveLength(1);
  });
});

describe('topic mastery', () => {
  it('starts every topic at new', () => {
    expect(topicMastery([q('a'), q('b')], emptyProgress(), 'traffic-signals').stage).toBe('new');
  });

  /**
   * The original guard read "cannot reach mastered from one or two questions,
   * however accurate", and enforced it with an absolute floor of ten attempted
   * questions. That floor made mastery unreachable in the 21 topics holding
   * fewer than ten questions, so the rule changed — but the principle it
   * protected has not: a single perfect pass is never mastery, at any topic
   * size. These tests state that principle directly rather than restating a
   * question count.
   */
  it('cannot reach mastered from one perfect pass of a two-question topic', () => {
    const p = progress(
      [attempt('a', true, 'traffic-signals'), attempt('b', true, 'traffic-signals')],
      [stat('a', 5), stat('b', 5)],
    );
    const evidence = topicMastery([q('a'), q('b')], p, 'traffic-signals');
    expect(evidence.stage).not.toBe('mastered');
    // Covered and correct, so the ordinary goal is met — but not yet durable.
    expect(evidence.stage).toBe('complete');
    expect(evidence.exposuresPerQuestion).toBeLessThan(
      MASTERY_RULES.mastered.minExposuresPerQuestion,
    );
  });

  it('cannot reach mastered from one perfect pass of a three-question topic', () => {
    const pool = [q('a'), q('b'), q('c')];
    const p = progress(
      ['a', 'b', 'c'].map((id) => attempt(id, true, 'traffic-signals')),
      [stat('a', 1), stat('b', 1), stat('c', 1)],
    );
    expect(topicMastery(pool, p, 'traffic-signals').stage).toBe('complete');
  });

  it('reaches mastered in a three-question topic after a second successful pass', () => {
    const pool = [q('a'), q('b'), q('c')];
    const p = progress(
      ['a', 'b', 'c', 'a', 'b', 'c'].map((id) => attempt(id, true, 'traffic-signals')),
      [stat('a', 2, 2), stat('b', 2, 2), stat('c', 2, 2)],
    );
    const evidence = topicMastery(pool, p, 'traffic-signals');
    expect(evidence.exposures).toBe(6);
    expect(evidence.exposuresPerQuestion).toBe(2);
    expect(evidence.stage).toBe('mastered');
  });

  it('reaches mastered with breadth, accuracy and durable recall', () => {
    const pool = Array.from({ length: 10 }, (_, i) => q(`m${i}`));
    // Every question met twice and retained: the same shape of evidence the old
    // ten-question rule demanded, now expressed as a ratio.
    const stats = pool.map((qq) => stat(qq.id, 3, 2));
    const attempts = Array.from({ length: 12 }, (_, i) =>
      attempt(`m${i % 10}`, true, 'traffic-signals'),
    );
    const evidence = topicMastery(pool, progress(attempts, stats), 'traffic-signals');
    expect(evidence.stage).toBe('mastered');
    expect(evidence.coverage).toBe(1);
  });

  it('does not make mastery easier for a large topic than a full repeat pass', () => {
    // One pass of a ten-question topic is Complete, never Mastered.
    const pool = Array.from({ length: 10 }, (_, i) => q(`m${i}`));
    const stats = pool.map((qq) => stat(qq.id, 1, 1));
    const attempts = pool.map((qq) => attempt(qq.id, true, 'traffic-signals'));
    expect(topicMastery(pool, progress(attempts, stats), 'traffic-signals').stage).toBe('complete');
  });

  it('classifies a well-covered but shaky topic as developing, not complete', () => {
    const pool = [q('a'), q('b'), q('c')];
    const p = progress(
      [attempt('a', true, 'traffic-signals'), attempt('b', true, 'traffic-signals'), attempt('c', false, 'traffic-signals')],
      [stat('a', 2), stat('b', 2), { ...stat('c', 0), seen: 1 }],
    );
    expect(topicMastery(pool, p, 'traffic-signals').stage).toBe('developing');
  });

  it('is governed by explicit, conservative thresholds', () => {
    // Mastery is strictly above Complete on the shared axes, and adds the
    // repeat-exposure requirement that Complete does not have.
    expect(MASTERY_RULES.mastered.minAccuracy).toBeGreaterThan(MASTERY_RULES.complete.minAccuracy);
    expect(MASTERY_RULES.mastered.minCoverage).toBeGreaterThanOrEqual(
      MASTERY_RULES.complete.minCoverage,
    );
    expect(MASTERY_RULES.mastered.minExposuresPerQuestion).toBeGreaterThanOrEqual(2);
    expect(MASTERY_RULES.mastered.minExposures).toBeGreaterThanOrEqual(6);
    expect(MASTERY_RULES.mastered.minRetained).toBeGreaterThan(0.5);
  });

  it('makes both Complete and Mastered reachable at every topic size', () => {
    for (const size of [1, 2, 3, 4, 5, 6, 10, 22]) {
      const pool = Array.from({ length: size }, (_, i) => q(`s${i}`));
      const ids = pool.map((qq) => qq.id);

      const onePass = progress(
        ids.map((id) => attempt(id, true, 'traffic-signals')),
        ids.map((id) => stat(id, 1, 1)),
      );
      expect(
        topicMastery(pool, onePass, 'traffic-signals').stage,
        `complete at size ${size}`,
      ).toBe('complete');

      // Enough repeat passes to clear the absolute exposure floor as well.
      const passes = Math.max(2, Math.ceil(MASTERY_RULES.mastered.minExposures / size));
      const repeated = progress(
        Array.from({ length: passes }, () => ids)
          .flat()
          .map((id) => attempt(id, true, 'traffic-signals')),
        ids.map((id) => stat(id, 2, passes)),
      );
      expect(
        topicMastery(pool, repeated, 'traffic-signals').stage,
        `mastered at size ${size}`,
      ).toBe('mastered');
    }
  });

  it('recommends the first incomplete topic in curriculum order', () => {
    const pool = [q('a'), q('b')];
    const next = recommendedNextTopic(pool, emptyProgress(), ['traffic-signals', 'turning']);
    expect(next?.topic).toBe('traffic-signals');
  });
});

describe('learning path', () => {
  it('orders rules before signs with three checkpoints', () => {
    const steps = buildPath();
    const checkpointIds = steps.filter((s) => s.kind === 'checkpoint').map((s) => s.id);
    expect(steps).toHaveLength(21 + 10 + 3);
    expect(checkpointIds).toEqual(['rules-foundation', 'signs-foundation', 'mock-ready']);
    const rulesTopics = steps.filter((s) => s.kind === 'topic').slice(0, 21);
    expect(rulesTopics[0]?.topic).toBe('traffic-signals');
  });

  it('flags the first topic as next for a fresh learner', () => {
    const pool = [q('a')];
    const rules = computeReadiness(pool, emptyProgress(), { type: 'rules' });
    const signs = computeReadiness(pool, emptyProgress(), { type: 'sign' });
    const path = pathProgress(pool, emptyProgress(), rules, signs);
    expect(path.next?.topic).toBe('traffic-signals');
    expect(path.complete).toBe(false);
  });

  it('reports no next topic once every available topic is complete', () => {
    const pool = Array.from({ length: 10 }, (_, i) => q(`m${i}`));
    const stats = pool.map((qq) => stat(qq.id, 3, 2));
    const attempts = Array.from({ length: 12 }, (_, i) =>
      attempt(`m${i % 10}`, true, 'traffic-signals'),
    );
    const p = progress(attempts, stats);
    const rules = computeReadiness(pool, p, { type: 'rules' });
    const signs = computeReadiness(pool, p, { type: 'sign' });
    const path = pathProgress(pool, p, rules, signs);
    expect(path.next).toBeNull();
  });
});