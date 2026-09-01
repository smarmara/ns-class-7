import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import type { Question } from '@/content/types';
import { QuizSession } from '@/ui/QuizSession';

function question(id: string, topic: Question['topic']): Question {
  return {
    id,
    type: 'rules',
    topic,
    question: `Question ${id}`,
    choices: ['Correct', 'Wrong'],
    correctChoice: 0,
    explanation: 'Because this is the test answer.',
    difficulty: 'easy',
    tags: [],
    sourceRefs: [],
    legalStatus: 'current',
    verifiedAt: '2026-01-01',
  };
}

function renderSession(sessionKey: string, pool: readonly Question[]) {
  return render(
    <MemoryRouter>
      <QuizSession
        sessionKey={sessionKey}
        title={pool[0]?.topic ?? 'Test session'}
        pool={pool}
        count={pool.length}
        mode="topic"
        weighted={false}
      />
    </MemoryRouter>,
  );
}

async function advance(user: ReturnType<typeof userEvent.setup>, times: number) {
  for (let i = 0; i < times; i += 1) {
    await user.click(document.querySelector<HTMLButtonElement>('.choice')!);
    await user.click(screen.getByRole('button', { name: /Next question|Finish/ }));
  }
}

describe('QuizSession lifecycle', () => {
  it('remounts a new topic at question 1 even after the old index would overflow it', async () => {
    const user = userEvent.setup();
    const longTopic = Array.from({ length: 6 }, (_, i) => question(`long-${i}`, 'speed-limits'));
    const shortTopic = Array.from({ length: 3 }, (_, i) => question(`short-${i}`, 'following-and-stopping'));
    const view = renderSession('topic:speed-limits', longTopic);

    await advance(user, 5);
    expect(screen.getByRole('progressbar', { name: 'Session progress' })).toHaveAttribute(
      'aria-valuetext',
      'Question 6 of 6',
    );

    view.rerender(
      <MemoryRouter>
        <QuizSession
          sessionKey="topic:following-and-stopping"
          title="Following and stopping"
          pool={shortTopic}
          count={shortTopic.length}
          mode="topic"
          weighted={false}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole('progressbar', { name: 'Session progress' })).toHaveAttribute(
      'aria-valuetext',
      'Question 1 of 3',
    );
    expect(screen.queryByText('Session complete')).not.toBeInTheDocument();
    expect(screen.getByRole('paragraph')).toHaveTextContent(/^Question short-/);
    expect(screen.queryByText('Question long-5')).not.toBeInTheDocument();
  });

  it('creates a fresh same-topic run for Practise again', async () => {
    const user = userEvent.setup();
    const pool = [question('repeat-0', 'speed-limits')];
    renderSession('topic:speed-limits', pool);

    await user.click(document.querySelector<HTMLButtonElement>('.choice')!);
    await user.click(screen.getByRole('button', { name: 'Finish' }));
    expect(screen.getByText('Session complete')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Practise again' }));
    expect(screen.getByRole('progressbar', { name: 'Session progress' })).toHaveAttribute(
      'aria-valuetext',
      'Question 1 of 1',
    );
    expect(screen.queryByText('Session complete')).not.toBeInTheDocument();
    expect(document.querySelector<HTMLButtonElement>('.choice')).toHaveAttribute('aria-pressed', 'false');
  });
});
