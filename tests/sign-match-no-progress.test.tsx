import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ALL_TOPICS, activeQuestions } from '@/content';
import { topicMastery } from '@/engine/learning/mastery';
import { allMedals, courseProgress } from '@/engine/engagement/progression';
import { recommendedNextTopic } from '@/engine/learning/mastery';
import { emptyEngagement, signMatchBestStreak } from '@/engine/engagement/types';
import { useEngagement } from '@/store/useEngagement';
import { useProgress } from '@/store/useProgress';
import { SignMatch } from '@/routes/SignMatch';

/**
 * Sign Match must leave the formal learner record completely alone.
 *
 * This is the single most important guarantee of the feature. Mastery,
 * Complete, medals and the recommended next topic are all built from answered
 * *questions*; if a game quietly fed into that evidence, those words would stop
 * meaning what the rest of the app says they mean.
 */

/**
 * Answer one round and move on.
 *
 * Since Sign Match became a streak run, a miss ends the run: the correct sign
 * is revealed, then the result screen appears, and continuing means starting
 * another run. This drives that loop so a test can play a long session
 * regardless of how the rounds fall.
 */
function playRound(): boolean {
  const choices = [...document.querySelectorAll<HTMLButtonElement>('.match-choice')];
  expect(choices).toHaveLength(2);

  const first = choices[0]!;
  fireEvent.click(first);
  const wasCorrect = first.getAttribute('data-state') === 'correct';

  if (wasCorrect) {
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
  } else {
    // Reveal, then the run result, then a fresh run.
    fireEvent.click(screen.getByRole('button', { name: 'See your run' }));
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
  }
  return wasCorrect;
}

describe('Sign Match does not mutate formal learner progress', () => {
  beforeEach(() => {
    useProgress.setState({ progress: useProgress.getState().progress, hydrated: true });
  });

  it('leaves the progress record deep-equal after a full session', () => {
    const before = structuredClone(useProgress.getState().progress);

    render(
      <MemoryRouter initialEntries={['/signs/match']}>
        <SignMatch />
      </MemoryRouter>,
    );

    // Play a run that includes both correct and incorrect answers.
    let correctCount = 0;
    let missedCount = 0;
    for (let round = 0; round < 12; round++) {
      const wasCorrect = playRound();
      if (wasCorrect) correctCount++;
      else missedCount++;
    }

    // The session really happened.
    expect(correctCount + missedCount).toBe(12);

    const after = useProgress.getState().progress;
    expect(after).toEqual(before);
  });

  it('records no question as seen and logs no attempt', () => {
    const before = structuredClone(useProgress.getState().progress);

    render(
      <MemoryRouter initialEntries={['/signs/match']}>
        <SignMatch />
      </MemoryRouter>,
    );
    for (let round = 0; round < 8; round++) {
      playRound();
    }

    const after = useProgress.getState().progress;
    expect(Object.keys(after.questions)).toEqual(Object.keys(before.questions));
    expect(after.attempts).toHaveLength(before.attempts.length);
  });

  it('never calls the answer-recording action', () => {
    const recordAnswer = vi.spyOn(useProgress.getState(), 'recordAnswer');

    render(
      <MemoryRouter initialEntries={['/signs/match']}>
        <SignMatch />
      </MemoryRouter>,
    );
    for (let round = 0; round < 6; round++) {
      playRound();
    }

    expect(recordAnswer).not.toHaveBeenCalled();
    recordAnswer.mockRestore();
  });

  it('leaves mastery, medals and the recommended topic unchanged', () => {
    const progressBefore = useProgress.getState().progress;
    const signsTopic = 'signs-regulatory' as const;
    const masteryBefore = topicMastery(activeQuestions, progressBefore, signsTopic);
    const medalsBefore = allMedals(activeQuestions, progressBefore);
    const courseBefore = courseProgress(activeQuestions, progressBefore);
    const nextBefore = recommendedNextTopic(activeQuestions, progressBefore, ALL_TOPICS);

    render(
      <MemoryRouter initialEntries={['/signs/match']}>
        <SignMatch />
      </MemoryRouter>,
    );
    for (let round = 0; round < 10; round++) {
      playRound();
    }

    const progressAfter = useProgress.getState().progress;
    expect(topicMastery(activeQuestions, progressAfter, signsTopic)).toEqual(masteryBefore);
    expect(allMedals(activeQuestions, progressAfter)).toEqual(medalsBefore);
    expect(courseProgress(activeQuestions, progressAfter)).toEqual(courseBefore);
    expect(recommendedNextTopic(activeQuestions, progressAfter, ALL_TOPICS)).toEqual(nextBefore);
  });

  it('writes only the personal best, and nothing else, to engagement', () => {
    // Sign Match gained one persisted datum: the all-time best streak. Every
    // other engagement figure — XP above all — must be untouched, or the game
    // would be feeding the motivational economy without earning it.
    useEngagement.setState({ engagement: emptyEngagement(), hydrated: true });
    const before = structuredClone(useEngagement.getState().engagement);

    render(
      <MemoryRouter initialEntries={['/signs/match']}>
        <SignMatch />
      </MemoryRouter>,
    );
    for (let round = 0; round < 10; round++) {
      playRound();
    }

    const after = useEngagement.getState().engagement;
    expect(after.xp, 'Sign Match must not award XP').toBe(before.xp);
    expect(after.daily).toEqual(before.daily);
    expect(after.goalXp).toBe(before.goalXp);
    // Only the record may differ, and only upward.
    expect(signMatchBestStreak(after)).toBeGreaterThanOrEqual(signMatchBestStreak(before));
    expect({ ...after, signMatchBestStreak: 0 }).toEqual({ ...before, signMatchBestStreak: 0 });
  });

  it('keeps its score in component state only, so a remount resets it', () => {
    const first = render(
      <MemoryRouter initialEntries={['/signs/match']}>
        <SignMatch />
      </MemoryRouter>,
    );
    playRound();
    first.unmount();

    render(
      <MemoryRouter initialEntries={['/signs/match']}>
        <SignMatch />
      </MemoryRouter>,
    );
    // A fresh run starts at zero — the streak is not persisted.
    const score = document.querySelector('.match-score')!;
    expect(score.textContent).toMatch(/Streak 0/);
  });
});
