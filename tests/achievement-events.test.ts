import { describe, expect, it } from 'vitest';
import { activeQuestions } from '@/content';
import { getNewAchievementEvents } from '@/engine/engagement/achievementEvents';
import { emptyProgress, type Progress, type QuestionStat } from '@/engine/learning/types';
import { RULES_TOPICS } from '@/content/types';

function stat(questionId: string, seen: number, correct: number, box: number): QuestionStat {
  return {
    questionId,
    seen,
    correct,
    incorrect: seen - correct,
    lastSeenAt: '2026-08-20T10:00:00.000Z',
    lastResult: 'correct',
    streak: box,
    box,
    dueAt: '2026-09-20T10:00:00.000Z',
    bookmarked: false,
    flaggedForReview: false,
  };
}

function recordTopic(progress: Progress, topic: string, correct: boolean) {
  for (const question of activeQuestions.filter((q) => q.topic === topic)) {
    progress.questions[question.id] = stat(question.id, 1, correct ? 1 : 0, correct ? 1 : 0);
    progress.attempts.push({
      questionId: question.id,
      topic: question.topic,
      type: question.type,
      correct,
      at: '2026-08-20T10:00:00.000Z',
      mode: 'topic',
    });
  }
}

describe('achievement award events', () => {
  it('emits one topic award when Developing crosses to Complete', () => {
    const before = emptyProgress();
    const after = emptyProgress();
    const questions = activeQuestions.filter((q) => q.topic === 'transit-buses');

    questions.forEach((q, index) => {
      before.questions[q.id] = stat(q.id, 1, index < 2 ? 1 : 0, index < 2 ? 1 : 0);
      before.attempts.push({ questionId: q.id, topic: q.topic, type: q.type, correct: index < 2, at: '2026-08-19T10:00:00.000Z', mode: 'topic' });
      after.questions[q.id] = stat(q.id, 2, index < 2 ? 2 : 1, index < 2 ? 2 : 1);
      after.attempts.push(
        { questionId: q.id, topic: q.topic, type: q.type, correct: index < 2, at: '2026-08-19T10:00:00.000Z', mode: 'topic' },
        { questionId: q.id, topic: q.topic, type: q.type, correct: true, at: '2026-08-20T10:00:00.000Z', mode: 'topic' },
      );
    });

    const events = getNewAchievementEvents(activeQuestions, before, after, 'learning');
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ id: 'topic:transit-buses', state: 'complete', family: 'rules' });
  });

  it('emits only Medal Mastered when Complete upgrades to Mastered', () => {
    const before = emptyProgress();
    const after = emptyProgress();
    for (const q of activeQuestions.filter((entry) => entry.topic === 'transit-buses')) {
      before.questions[q.id] = stat(q.id, 1, 1, 1);
      after.questions[q.id] = stat(q.id, 2, 2, 2);
      before.attempts.push({ questionId: q.id, topic: q.topic, type: q.type, correct: true, at: '2026-08-19T10:00:00.000Z', mode: 'topic' });
      after.attempts.push(
        { questionId: q.id, topic: q.topic, type: q.type, correct: true, at: '2026-08-19T10:00:00.000Z', mode: 'topic' },
        { questionId: q.id, topic: q.topic, type: q.type, correct: true, at: '2026-08-20T10:00:00.000Z', mode: 'topic' },
      );
    }

    const events = getNewAchievementEvents(activeQuestions, before, after, 'learning');
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ id: 'topic:transit-buses', state: 'mastered' });
  });

  it('does not re-award an already Complete or Mastered achievement', () => {
    const progress = emptyProgress();
    recordTopic(progress, 'transit-buses', true);
    const completeReplay = getNewAchievementEvents(activeQuestions, progress, progress, 'learning');
    expect(completeReplay).toEqual([]);

    const mastered = structuredClone(progress);
    for (const q of activeQuestions.filter((entry) => entry.topic === 'transit-buses')) {
      mastered.questions[q.id] = stat(q.id, 2, 2, 2);
    }
    const masteredReplay = getNewAchievementEvents(activeQuestions, mastered, mastered, 'learning');
    expect(masteredReplay).toEqual([]);
  });

  it('orders a topic award before a newly earned Rules expert award', () => {
    const before = emptyProgress();
    const after = emptyProgress();
    for (const topic of RULES_TOPICS.slice(0, -1)) recordTopic(before, topic, true);
    for (const topic of RULES_TOPICS) recordTopic(after, topic, true);

    const events = getNewAchievementEvents(activeQuestions, before, after, 'learning');
    expect(events.map((event) => event.id)).toEqual([
      `topic:${RULES_TOPICS[RULES_TOPICS.length - 1]}`,
      'area:rules',
    ]);
  });

  it('can emit both first-test and passed-exam awards together', () => {
    const before = emptyProgress();
    const after = emptyProgress();
    after.mockTests.push({
      id: 'mock-1',
      startedAt: '2026-08-20T10:00:00.000Z',
      completedAt: '2026-08-20T11:00:00.000Z',
      passed: true,
      sections: [
        { sectionId: 'rules', shortName: 'Rules', correct: 16, questionCount: 20, required: 16, passed: true },
        { sectionId: 'signs', shortName: 'Signs', correct: 16, questionCount: 20, required: 16, passed: true },
      ],
      missedQuestionIds: [],
    });

    const events = getNewAchievementEvents(activeQuestions, before, after, 'exam');
    expect(events.map((event) => event.id)).toEqual(['mock:first', 'mock:passed']);
  });
});
