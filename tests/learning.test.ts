import { describe, expect, it } from 'vitest';
import type { Question } from '@/content/types';
import {
  BOX_INTERVAL_HOURS,
  MAX_BOX,
  bookmarkedQuestions,
  mistakeQueue,
  nextStat,
  practiceWeight,
} from '@/engine/learning/scheduler';
import {
  MIN_TOPIC_ATTEMPTS,
  computeReadiness,
  recentPerformance,
  strongTopics,
  topicPerformance,
  weakTopics,
} from '@/engine/learning/readiness';
import { emptyProgress, type Progress, type QuestionStat } from '@/engine/learning/types';

const NOW = new Date('2026-08-17T12:00:00Z');

function q(id: string, topic: Question['topic'] = 'right-of-way', type: Question['type'] = 'rules'): Question {
  return {
    id,
    type,
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

function stat(overrides: Partial<QuestionStat> & { questionId: string }): QuestionStat {
  return {
    seen: 1,
    correct: 1,
    incorrect: 0,
    lastSeenAt: NOW.toISOString(),
    lastResult: 'correct',
    streak: 1,
    box: 1,
    dueAt: NOW.toISOString(),
    bookmarked: false,
    flaggedForReview: false,
    ...overrides,
  };
}

describe('spaced repetition', () => {
  it('starts a new question in box 0', () => {
    const s = nextStat(undefined, true, NOW);
    expect(s.seen).toBe(1);
    expect(s.correct).toBe(1);
    expect(s.box).toBe(1); // promoted by the correct answer
  });

  it('promotes one box per correct answer, up to the ceiling', () => {
    let s = nextStat(undefined, true, NOW);
    for (let i = 0; i < 20; i++) s = nextStat(s, true, NOW);
    expect(s.box).toBe(MAX_BOX);
  });

  it('drops straight back to box 0 on a miss, however well known it was', () => {
    let s = nextStat(undefined, true, NOW);
    for (let i = 0; i < 10; i++) s = nextStat(s, true, NOW);
    expect(s.box).toBe(MAX_BOX);
    s = nextStat(s, false, NOW);
    expect(s.box).toBe(0);
    expect(s.streak).toBe(0);
    expect(s.lastResult).toBe('incorrect');
  });

  it('schedules a longer wait for each higher box', () => {
    for (let i = 1; i < BOX_INTERVAL_HOURS.length; i++) {
      expect(BOX_INTERVAL_HOURS[i]!).toBeGreaterThan(BOX_INTERVAL_HOURS[i - 1]!);
    }
  });

  it('holds a missed question back briefly rather than repeating it immediately', () => {
    const s = nextStat(undefined, false, NOW);
    expect(new Date(s.dueAt).getTime()).toBeGreaterThan(NOW.getTime());
  });

  it('tracks running totals and streaks', () => {
    let s = nextStat(undefined, true, NOW);
    s = nextStat(s, false, NOW);
    s = nextStat(s, true, NOW);
    s = nextStat(s, true, NOW);
    expect(s.seen).toBe(4);
    expect(s.correct).toBe(3);
    expect(s.incorrect).toBe(1);
    expect(s.streak).toBe(2);
  });

  it('clears a manual review flag after two correct answers in a row', () => {
    let s = { ...nextStat(undefined, false, NOW), flaggedForReview: true };
    s = nextStat(s, true, NOW);
    expect(s.flaggedForReview).toBe(true);
    s = nextStat(s, true, NOW);
    expect(s.flaggedForReview).toBe(false);
  });
});

describe('practice weighting', () => {
  const progress = emptyProgress();

  it('favours questions never seen before', () => {
    const unseen = practiceWeight(q('new'), progress, NOW);
    const known = practiceWeight(q('old'), withStat(stat({ questionId: 'old', box: 4 })), NOW);
    expect(unseen).toBeGreaterThan(known);
  });

  it('favours a question answered incorrectly over one answered correctly', () => {
    const missed = practiceWeight(
      q('a'),
      withStat(stat({ questionId: 'a', lastResult: 'incorrect', box: 0, correct: 0, incorrect: 1 })),
      NOW,
    );
    const right = practiceWeight(q('b'), withStat(stat({ questionId: 'b', box: 1 })), NOW);
    expect(missed).toBeGreaterThan(right);
  });

  it('suppresses questions that are not yet due, without excluding them', () => {
    const notDue = practiceWeight(
      q('a'),
      withStat(
        stat({ questionId: 'a', dueAt: new Date(NOW.getTime() + 86_400_000).toISOString() }),
      ),
      NOW,
    );
    const due = practiceWeight(q('b'), withStat(stat({ questionId: 'b' })), NOW);
    expect(notDue).toBeGreaterThan(0);
    expect(notDue).toBeLessThan(due);
  });

  it('raises the weight of an overdue question but caps how far', () => {
    const slightlyOverdue = practiceWeight(
      q('a'),
      withStat(stat({ questionId: 'a', dueAt: new Date(NOW.getTime() - 86_400_000).toISOString() })),
      NOW,
    );
    const wildlyOverdue = practiceWeight(
      q('a'),
      withStat(
        stat({ questionId: 'a', dueAt: new Date(NOW.getTime() - 400 * 86_400_000).toISOString() }),
      ),
      NOW,
    );
    expect(wildlyOverdue).toBeGreaterThan(slightlyOverdue);
    expect(wildlyOverdue / slightlyOverdue).toBeLessThan(3);
  });

  it('boosts questions the learner flagged to review again', () => {
    const flagged = practiceWeight(
      q('a'),
      withStat(stat({ questionId: 'a', flaggedForReview: true })),
      NOW,
    );
    const plain = practiceWeight(q('b'), withStat(stat({ questionId: 'b' })), NOW);
    expect(flagged).toBeGreaterThan(plain);
  });

  it('lets a well-known question fade but never to zero', () => {
    const mastered = practiceWeight(
      q('a'),
      withStat(
        stat({
          questionId: 'a',
          box: MAX_BOX,
          seen: 12,
          correct: 12,
          streak: 12,
          dueAt: new Date(NOW.getTime() + 1_000_000).toISOString(),
        }),
      ),
      NOW,
    );
    expect(mastered).toBeGreaterThan(0);
    expect(mastered).toBeLessThan(practiceWeight(q('b'), progress, NOW));
  });

  function withStat(s: QuestionStat): Progress {
    return { ...emptyProgress(), questions: { [s.questionId]: s } };
  }
});

describe('mistake and bookmark queues', () => {
  it('collects questions last answered incorrectly', () => {
    const progress: Progress = {
      ...emptyProgress(),
      questions: {
        a: stat({ questionId: 'a', lastResult: 'incorrect' }),
        b: stat({ questionId: 'b', lastResult: 'correct' }),
        c: stat({ questionId: 'c', lastResult: 'correct', flaggedForReview: true }),
      },
    };
    const queue = mistakeQueue(progress);
    expect(queue).toContain('a');
    expect(queue).toContain('c');
    expect(queue).not.toContain('b');
  });

  it('collects bookmarked questions', () => {
    const progress: Progress = {
      ...emptyProgress(),
      questions: {
        a: stat({ questionId: 'a', bookmarked: true }),
        b: stat({ questionId: 'b' }),
      },
    };
    expect(bookmarkedQuestions(progress)).toEqual(['a']);
  });
});

describe('topic performance and weak areas', () => {
  const pool = [
    q('r1', 'right-of-way'),
    q('r2', 'right-of-way'),
    q('r3', 'right-of-way'),
    q('r4', 'right-of-way'),
    q('p1', 'passing'),
    q('p2', 'passing'),
    q('p3', 'passing'),
    q('p4', 'passing'),
  ];

  function progressWith(results: [string, Question['topic'], boolean][]): Progress {
    const progress = emptyProgress();
    for (const [questionId, topic, correct] of results) {
      progress.attempts.push({
        questionId,
        topic,
        type: 'rules',
        correct,
        at: NOW.toISOString(),
        mode: 'quick',
      });
      progress.questions[questionId] = stat({
        questionId,
        lastResult: correct ? 'correct' : 'incorrect',
      });
    }
    return progress;
  }

  it('computes per-topic accuracy', () => {
    const progress = progressWith([
      ['r1', 'right-of-way', true],
      ['r2', 'right-of-way', true],
      ['r3', 'right-of-way', false],
      ['r4', 'right-of-way', false],
    ]);
    const perf = topicPerformance(pool, progress).find((t) => t.topic === 'right-of-way')!;
    expect(perf.attempts).toBe(4);
    expect(perf.correct).toBe(2);
    expect(perf.accuracy).toBe(0.5);
    expect(perf.questionsAvailable).toBe(4);
  });

  it('flags a topic as weak once there is enough evidence', () => {
    const progress = progressWith([
      ['r1', 'right-of-way', false],
      ['r2', 'right-of-way', false],
      ['r3', 'right-of-way', true],
      ['p1', 'passing', true],
      ['p2', 'passing', true],
      ['p3', 'passing', true],
      ['p4', 'passing', true],
    ]);
    const weak = weakTopics(pool, progress);
    expect(weak.map((t) => t.topic)).toEqual(['right-of-way']);

    const strong = strongTopics(pool, progress);
    expect(strong.map((t) => t.topic)).toEqual(['passing']);
  });

  it('does not judge a topic on fewer than the minimum attempts', () => {
    const progress = progressWith([
      ['r1', 'right-of-way', false],
      ['r2', 'right-of-way', false],
    ]);
    expect(MIN_TOPIC_ATTEMPTS).toBe(3);
    expect(weakTopics(pool, progress)).toEqual([]);
  });

  it('sorts the weakest topic first', () => {
    const progress = progressWith([
      ['r1', 'right-of-way', false],
      ['r2', 'right-of-way', false],
      ['r3', 'right-of-way', false],
      ['p1', 'passing', false],
      ['p2', 'passing', true],
      ['p3', 'passing', true],
    ]);
    const weak = weakTopics(pool, progress);
    expect(weak[0]!.topic).toBe('right-of-way');
    expect(weak[0]!.accuracy).toBeLessThan(weak[1]!.accuracy);
  });

  it('ignores attempts for questions outside the pool', () => {
    const progress = progressWith([['gone', 'right-of-way', false]]);
    const perf = topicPerformance(pool, progress).find((t) => t.topic === 'right-of-way')!;
    expect(perf.attempts).toBe(0);
  });
});

describe('readiness', () => {
  const pool = [q('a'), q('b'), q('c'), q('d'), q('s1', 'signs-regulatory', 'sign')];

  it('is zero with no history', () => {
    const r = computeReadiness(pool, emptyProgress());
    expect(r.score).toBe(0);
    expect(r.accuracy).toBeNull();
    expect(r.hasEnoughData).toBe(false);
  });

  it('never exceeds 100 or drops below 0', () => {
    const progress = emptyProgress();
    for (const question of pool) {
      progress.questions[question.id] = stat({ questionId: question.id, box: 5 });
      for (let i = 0; i < 30; i++) {
        progress.attempts.push({
          questionId: question.id,
          topic: question.topic,
          type: question.type,
          correct: true,
          at: NOW.toISOString(),
          mode: 'quick',
        });
      }
    }
    const r = computeReadiness(pool, progress);
    expect(r.score).toBeLessThanOrEqual(100);
    expect(r.score).toBeGreaterThanOrEqual(0);
    expect(r.score).toBe(100);
  });

  it('rises with coverage even before accuracy is perfect', () => {
    const partial = emptyProgress();
    partial.questions['a'] = stat({ questionId: 'a' });
    partial.attempts.push({
      questionId: 'a',
      topic: 'right-of-way',
      type: 'rules',
      correct: true,
      at: NOW.toISOString(),
      mode: 'quick',
    });

    const broader = structuredClone(partial);
    for (const id of ['b', 'c']) {
      broader.questions[id] = stat({ questionId: id });
      broader.attempts.push({
        questionId: id,
        topic: 'right-of-way',
        type: 'rules',
        correct: true,
        at: NOW.toISOString(),
        mode: 'quick',
      });
    }

    expect(computeReadiness(pool, broader).score).toBeGreaterThan(
      computeReadiness(pool, partial).score,
    );
  });

  it('scores rules and signs separately', () => {
    const progress = emptyProgress();
    progress.questions['s1'] = stat({ questionId: 's1', box: 5 });
    progress.attempts.push({
      questionId: 's1',
      topic: 'signs-regulatory',
      type: 'sign',
      correct: true,
      at: NOW.toISOString(),
      mode: 'signs',
    });

    const signs = computeReadiness(pool, progress, { type: 'sign' });
    const rules = computeReadiness(pool, progress, { type: 'rules' });
    expect(signs.coverage).toBe(1);
    expect(rules.coverage).toBe(0);
    expect(signs.score).toBeGreaterThan(rules.score);
  });

  it('marks the score provisional until there is enough evidence', () => {
    const progress = emptyProgress();
    progress.questions['a'] = stat({ questionId: 'a' });
    progress.attempts.push({
      questionId: 'a',
      topic: 'right-of-way',
      type: 'rules',
      correct: true,
      at: NOW.toISOString(),
      mode: 'quick',
    });
    expect(computeReadiness(pool, progress).hasEnoughData).toBe(false);
  });
});

describe('recent performance', () => {
  it('summarises only the most recent window', () => {
    const progress = emptyProgress();
    for (let i = 0; i < 30; i++) {
      progress.attempts.push({
        questionId: `q${i}`,
        topic: 'right-of-way',
        type: 'rules',
        correct: i >= 20, // last 10 correct, first 20 wrong
        at: NOW.toISOString(),
        mode: 'quick',
      });
    }
    const recent = recentPerformance(progress, 10);
    expect(recent.total).toBe(10);
    expect(recent.correct).toBe(10);
    expect(recent.accuracy).toBe(1);
  });

  it('reports null accuracy when there is nothing to summarise', () => {
    expect(recentPerformance(emptyProgress()).accuracy).toBeNull();
  });
});
