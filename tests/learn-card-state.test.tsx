import { act, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import { activeQuestions } from '@/content';
import { emptyProgress } from '@/engine/learning/types';
import { Learn } from '@/routes/Learn';
import { useProgress } from '@/store/useProgress';

afterEach(() => {
  act(() => useProgress.setState({ progress: emptyProgress(), hydrated: true }));
});

describe('Learn card state communication', () => {
  it('explains Developing with cumulative accuracy while keeping coverage explicit', () => {
    const progress = emptyProgress();
    const questions = activeQuestions.filter((q) => q.topic === 'transit-buses');

    questions.forEach((question, index) => {
      const firstRunCorrect = index === 0;
      progress.questions[question.id] = {
        questionId: question.id,
        seen: 2,
        correct: firstRunCorrect ? 2 : 1,
        incorrect: firstRunCorrect ? 0 : 1,
        lastSeenAt: '2026-08-19T10:00:00.000Z',
        lastResult: 'correct',
        streak: 1,
        box: 1,
        dueAt: '2026-08-20T10:00:00.000Z',
        bookmarked: false,
        flaggedForReview: false,
      };
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
    act(() => useProgress.setState({ progress, hydrated: true }));

    render(
      <MemoryRouter initialEntries={['/learn']}>
        <Learn />
      </MemoryRouter>,
    );

    expect(screen.getByText('Developing')).toBeInTheDocument();
    expect(screen.getByText('67% accuracy · 80% needed to complete')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Transit buses progress' })).toHaveAttribute(
      'aria-valuetext',
      '3 of 3 questions seen, Developing',
    );
  });
});
