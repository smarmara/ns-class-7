import { describe, expect, it } from 'vitest';
import { activeQuestions } from '@/content';
import { ALL_TOPICS } from '@/content/types';
import { emptyProgress, type Progress, type QuestionStat } from '@/engine/learning/types';
import { topicMastery } from '@/engine/learning/mastery';
import {
  LEVELS,
  allMedals,
  isTopicComplete,
  areaMedals,
  courseProgress,
  levelFor,
  mockMedals,
  topicMedals,
} from '@/engine/engagement/progression';

/**
 * Progression is derived entirely from stored progress — no new persistence.
 * These tests pin the two properties that matter to a learner: the ring
 * measures the journey to the end rather than recent activity, and nothing
 * they have earned can be taken away.
 */

function stat(overrides: Partial<QuestionStat> = {}): QuestionStat {
  return {
    questionId: 'q',
    seen: 6,
    correct: 6,
    incorrect: 0,
    lastSeenAt: '2026-08-18T10:00:00.000Z',
    lastResult: 'correct',
    streak: 6,
    box: 4,
    dueAt: '2026-09-18T10:00:00.000Z',
    bookmarked: false,
    flaggedForReview: false,
    ...overrides,
  };
}

/**
 * Answer every question in the given topics correctly and retain them — both
 * the per-question stats and the attempt log, which is where recent accuracy
 * comes from. A fixture that wrote only stats would leave accuracy unknown.
 */
function masteringAll(topics: readonly string[]): Progress {
  const progress = emptyProgress();
  for (const question of activeQuestions) {
    if (!topics.includes(question.topic)) continue;
    progress.questions[question.id] = stat({ questionId: question.id });
    progress.attempts.push({
      questionId: question.id,
      topic: question.topic,
      type: question.type,
      correct: true,
      at: '2026-08-18T10:00:00.000Z',
      mode: 'topic',
    });
  }
  return progress;
}

describe('course progress', () => {
  it('is zero for a learner who has answered nothing', () => {
    const course = courseProgress(activeQuestions, emptyProgress());
    expect(course.completion).toBe(0);
    expect(course.percent).toBe(0);
    expect(course.topicsComplete).toBe(0);
    expect(course.questionsSeen).toBe(0);
    expect(course.topicsTotal).toBeGreaterThan(0);
  });

  it('reaches 100% only when every topic is complete', () => {
    const course = courseProgress(activeQuestions, masteringAll(ALL_TOPICS));
    expect(course.topicsComplete).toBe(course.topicsTotal);
    expect(course.percent).toBe(100);
  });

  it('is achievable for the smallest topics in the bank', () => {
    // transit-buses holds three questions. Progression must not depend on a
    // topic happening to contain some absolute number of them.
    const learned = masteringAll(['transit-buses']);
    expect(isTopicComplete(topicMastery(activeQuestions, learned, 'transit-buses'))).toBe(true);
  });

  it('grows as more topics are learned, rather than tracking recent activity', () => {
    const one = courseProgress(activeQuestions, masteringAll(['traffic-signals']));
    const two = courseProgress(activeQuestions, masteringAll(['traffic-signals', 'right-of-way']));
    expect(two.completion).toBeGreaterThan(one.completion);
    expect(one.completion).toBeGreaterThan(0);
  });

  it('counts questions seen against the whole bank', () => {
    const course = courseProgress(activeQuestions, masteringAll(['traffic-signals']));
    expect(course.questionsTotal).toBe(activeQuestions.length);
    expect(course.questionsSeen).toBeGreaterThan(0);
    expect(course.questionsSeen).toBeLessThan(course.questionsTotal);
  });

  it('keeps a perfect retry Developing when cumulative accuracy is below 80%', () => {
    const questions = activeQuestions.filter((q) => q.topic === 'transit-buses');
    const progress = emptyProgress();
    questions.forEach((question, index) => {
      const correct = index === 0 ? 1 : 0;
      progress.questions[question.id] = stat({
        questionId: question.id,
        seen: 2,
        correct: correct + 1,
        incorrect: 1 - correct,
        lastResult: 'correct',
        streak: 1,
        box: 1,
      });
      progress.attempts.push(
        {
          questionId: question.id,
          topic: question.topic,
          type: question.type,
          correct: Boolean(correct),
          at: '2026-08-18T10:00:00.000Z',
          mode: 'topic',
        },
        {
          questionId: question.id,
          topic: question.topic,
          type: question.type,
          correct: true,
          at: '2026-08-19T10:00:00.000Z',
          mode: 'topic',
        },
      );
    });

    const evidence = topicMastery(activeQuestions, progress, 'transit-buses');
    expect(evidence.questionsAvailable).toBe(3);
    expect(evidence.questionsAttempted).toBe(3);
    expect(evidence.exposures).toBe(6);
    expect(evidence.lifetimeAccuracy).toBeCloseTo(4 / 6);
    expect(evidence.coverage).toBe(1);
    expect(evidence.stage).toBe('developing');
  });

  it('moves to Complete when a retry raises cumulative accuracy above 80%', () => {
    const questions = activeQuestions.filter((q) => q.topic === 'transit-buses');
    const progress = emptyProgress();
    questions.forEach((question, index) => {
      const firstRunCorrect = index < 2;
      progress.questions[question.id] = stat({
        questionId: question.id,
        seen: 2,
        correct: firstRunCorrect ? 2 : 1,
        incorrect: firstRunCorrect ? 0 : 1,
        lastResult: 'correct',
        streak: 2,
        box: 2,
      });
      progress.attempts.push(
        {
          questionId: question.id,
          topic: question.topic,
          type: question.type,
          correct: firstRunCorrect,
          at: '2026-08-18T10:00:00.000Z',
          mode: 'topic',
        },
        {
          questionId: question.id,
          topic: question.topic,
          type: question.type,
          correct: true,
          at: '2026-08-19T10:00:00.000Z',
          mode: 'topic',
        },
      );
    });

    expect(topicMastery(activeQuestions, progress, 'transit-buses').stage).toBe('complete');
  });
});

describe('levels', () => {
  it('starts at Novice and tops out at Expert', () => {
    expect(LEVELS[0]!.name).toBe('Novice');
    expect(LEVELS[LEVELS.length - 1]!.name).toBe('Expert');
    expect(levelFor(0).level.name).toBe('Novice');
    expect(levelFor(1).level.name).toBe('Expert');
  });

  it('reports Expert as the maximum, with no next level', () => {
    const top = levelFor(1);
    expect(top.isMax).toBe(true);
    expect(top.next).toBeNull();
    expect(top.progressToNext).toBe(1);
  });

  it('never goes backwards as completion rises', () => {
    let previous = -1;
    for (let pct = 0; pct <= 100; pct += 1) {
      const index = levelFor(pct / 100).index;
      expect(index).toBeGreaterThanOrEqual(previous);
      previous = index;
    }
  });

  it('reports progress through the current band', () => {
    // Halfway between Novice (0) and Learner (0.2).
    const mid = levelFor(0.1);
    expect(mid.level.name).toBe('Novice');
    expect(mid.next?.name).toBe('Learner');
    expect(mid.progressToNext).toBeCloseTo(0.5, 5);
  });

  it('clamps out-of-range completion rather than throwing', () => {
    expect(levelFor(-1).level.name).toBe('Novice');
    expect(levelFor(9).level.name).toBe('Expert');
  });
});

describe('medals', () => {
  it('awards a topic medal only once that topic is complete', () => {
    const none = topicMedals(activeQuestions, emptyProgress());
    expect(none.every((m) => !m.earned)).toBe(true);

    const learned = masteringAll(['traffic-signals']);
    const earned = topicMedals(activeQuestions, learned).filter((m) => m.earned);
    expect(earned.map((m) => m.title)).toEqual(['traffic-signals']);
  });

  it('awards a section medal only when every topic in it is complete', () => {
    const partial = areaMedals(activeQuestions, masteringAll(['traffic-signals']));
    expect(partial.find((m) => m.id === 'area:rules')?.earned).toBe(false);

    const all = areaMedals(activeQuestions, masteringAll(ALL_TOPICS));
    expect(all.every((m) => m.earned)).toBe(true);
  });

  it('scales mock medals with the mock history', () => {
    const progress = emptyProgress();
    const section = (correct: number) => ({
      sectionId: 's',
      shortName: 'Rules',
      correct,
      questionCount: 20,
      required: 16,
      passed: correct >= 16,
    });
    const record = (passed: boolean, correct: number) => ({
      id: `m${progress.mockTests.length}`,
      startedAt: '2026-08-01T10:00:00.000Z',
      completedAt: '2026-08-01T10:40:00.000Z',
      passed,
      sections: [section(correct), section(correct)],
      missedQuestionIds: [],
    });

    expect(mockMedals(progress).every((m) => !m.earned)).toBe(true);

    progress.mockTests.push(record(false, 12));
    expect(
      mockMedals(progress)
        .filter((m) => m.earned)
        .map((m) => m.id),
    ).toEqual(['mock:first']);

    progress.mockTests.push(record(true, 18));
    expect(
      mockMedals(progress)
        .filter((m) => m.earned)
        .map((m) => m.id),
    ).toEqual(['mock:first', 'mock:passed']);

    progress.mockTests.push(record(true, 18), record(true, 20));
    expect(
      mockMedals(progress)
        .filter((m) => m.earned)
        .map((m) => m.id),
    ).toEqual(['mock:first', 'mock:passed', 'mock:consistent', 'mock:flawless']);
  });

  it('never revokes a medal for a later failure', () => {
    const progress = emptyProgress();
    const good = {
      id: 'm1',
      startedAt: '2026-08-01T10:00:00.000Z',
      completedAt: '2026-08-01T10:40:00.000Z',
      passed: true,
      sections: [
        {
          sectionId: 'r',
          shortName: 'Rules',
          correct: 20,
          questionCount: 20,
          required: 16,
          passed: true,
        },
        {
          sectionId: 's',
          shortName: 'Signs',
          correct: 20,
          questionCount: 20,
          required: 16,
          passed: true,
        },
      ],
      missedQuestionIds: [],
    };
    progress.mockTests.push(good);
    const before = mockMedals(progress).filter((m) => m.earned).length;

    progress.mockTests.push({
      ...good,
      id: 'm2',
      passed: false,
      sections: good.sections.map((s) => ({ ...s, correct: 2, passed: false })),
    });
    const after = mockMedals(progress).filter((m) => m.earned).length;

    expect(after).toBeGreaterThanOrEqual(before);
  });

  it('summarises every medal with a stable total', () => {
    const summary = allMedals(activeQuestions, emptyProgress());
    expect(summary.total).toBe(summary.topics.length + summary.areas.length + summary.mocks.length);
    expect(summary.earned).toBe(0);

    const complete = allMedals(activeQuestions, masteringAll(ALL_TOPICS));
    expect(complete.earned).toBe(complete.topics.length + complete.areas.length);
  });
});
