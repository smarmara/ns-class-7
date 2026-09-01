import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import learnerScopeJson from '@data/signs/learner-scope.json';
import { emptyEngagement, signMatchBestStreak } from '@/engine/engagement/types';
import { allPromptLabels, isPromptShortened, signMatchPromptLabel } from '@/engine/signmatch/labels';
import { eligibleTargets } from '@/engine/signmatch/rounds';
import { useEngagement } from '@/store/useEngagement';
import { SignMatch } from '@/routes/SignMatch';

const scope = learnerScopeJson as {
  classifications: Record<string, { scope: string; displayName: string }>;
};

/* ------------------------------------------------------------ prompt labels */

describe('Sign Match prompt labels', () => {
  const targets = eligibleTargets('all');
  const labels = allPromptLabels();

  it('gives every one of the 155 targets a non-empty prompt', () => {
    expect(targets).toHaveLength(155);
    for (const entry of targets) {
      expect(signMatchPromptLabel(entry.id).trim().length, entry.id).toBeGreaterThan(0);
    }
  });

  it('never produces two targets with the same prompt', () => {
    // A shortened label that collides with another target would make the round
    // unanswerable, so ambiguity is checked across the whole pool.
    const seen = new Map<string, string>();
    for (const entry of targets) {
      const prompt = signMatchPromptLabel(entry.id);
      const clash = seen.get(prompt);
      expect(clash, `"${prompt}" is the prompt for both ${clash} and ${entry.id}`).toBeUndefined();
      seen.set(prompt, entry.id);
    }
  });

  it('strips the geometry suffix from the six Sign Shape concepts', () => {
    expect(signMatchPromptLabel('shape-stop')).toBe('Stop Sign Shape');
    expect(signMatchPromptLabel('shape-warning-sign')).toBe('Warning Sign Shape');
    expect(signMatchPromptLabel('shape-yield')).toBe('Yield Sign Shape');
    expect(signMatchPromptLabel('shape-school-zone')).toBe('School Zone Sign Shape');
    expect(signMatchPromptLabel('shape-regulatory-sign')).toBe('Regulatory Sign Shape');
    expect(signMatchPromptLabel('shape-guide-sign')).toBe('Guide Sign Shape');
  });

  it('leaves Sign Shapes playable — the shape is still the concept asked', () => {
    // "Warning Sign Shape" is answerable by knowing warning signs are diamonds.
    // What it no longer does is print the answer in the prompt.
    for (const id of ['shape-stop', 'shape-warning-sign', 'shape-yield']) {
      const prompt = signMatchPromptLabel(id);
      expect(prompt).toMatch(/Shape$/);
      expect(prompt).not.toMatch(/octagon|diamond|triangle|rectangle|pentagon/i);
    }
  });

  it('shortens exactly those six and nothing else', () => {
    const shortened = targets.filter((entry) => isPromptShortened(entry.id)).map((e) => e.id);
    expect(shortened.sort()).toEqual(
      [
        'shape-guide-sign',
        'shape-regulatory-sign',
        'shape-school-zone',
        'shape-stop',
        'shape-warning-sign',
        'shape-yield',
      ].sort(),
    );
  });

  it('keeps a suffix that carries the rule being tested', () => {
    // These are not decoration: they are the difference between the signs.
    for (const id of [
      'hazard-marker-keep-left',
      'hazard-marker-keep-right',
      'RB-102',
      'RB-57',
      'RA-5L',
      'RB-80',
    ]) {
      expect(signMatchPromptLabel(id), id).toBe(scope.classifications[id]!.displayName);
    }
  });

  it('would have collided on 48 targets under a naive split, and does not', () => {
    // Guards the reason the rule is not "take everything before the em dash".
    const naive = new Map<string, number>();
    for (const entry of targets) {
      const short = entry.displayName.split(' — ')[0]!.trim();
      naive.set(short, (naive.get(short) ?? 0) + 1);
    }
    const collided = [...naive.values()].filter((n) => n > 1).reduce((a, b) => a + b, 0);
    expect(collided).toBe(48);
    expect(new Set(labels.values()).size).toBe(targets.length);
  });
});

/* --------------------------------------------------------------- streak run */

function choices() {
  return [...document.querySelectorAll<HTMLButtonElement>('.match-choice')];
}

/** Answer the current round; returns whether the pick was correct. */
function answer(side: 0 | 1): boolean {
  const button = choices()[side]!;
  fireEvent.click(button);
  return button.getAttribute('data-state') === 'correct';
}

function renderGame() {
  return render(
    <MemoryRouter initialEntries={['/signs/match']}>
      <SignMatch />
    </MemoryRouter>,
  );
}

describe('Sign Match streak runs', () => {
  beforeEach(() => {
    useEngagement.setState({ engagement: emptyEngagement(), hydrated: true });
  });

  it('continues the run after a correct answer', () => {
    renderGame();
    let advanced = false;
    for (let n = 0; n < 12 && !advanced; n++) {
      if (answer(0)) {
        expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument();
        expect(screen.queryByText('Streak ended')).toBeNull();
        fireEvent.click(screen.getByRole('button', { name: 'Next' }));
        expect(choices()).toHaveLength(2);
        advanced = true;
      } else {
        fireEvent.click(screen.getByRole('button', { name: 'See your run' }));
        fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
      }
    }
    expect(advanced, 'no correct answer in 12 rounds').toBe(true);
  });

  it('reveals the correct sign and ends the run on a miss', () => {
    renderGame();
    let missed = false;
    for (let n = 0; n < 12 && !missed; n++) {
      const prompt = screen.getByRole('heading', { level: 1 }).textContent!;
      if (!answer(0)) {
        missed = true;
        // The teaching moment survives: the answer is named and marked.
        expect(screen.getByText(/Not quite/)).toBeInTheDocument();
        expect(document.querySelector('.match-reveal')!.textContent).toContain(prompt);
        expect(document.querySelectorAll('.match-choice[data-state="correct"]')).toHaveLength(1);
        // And the run does not silently deal another round.
        expect(screen.queryByRole('button', { name: 'Next' })).toBeNull();
        expect(screen.getByRole('button', { name: 'See your run' })).toBeInTheDocument();
      } else {
        fireEvent.click(screen.getByRole('button', { name: 'Next' }));
      }
    }
    expect(missed, 'no wrong answer in 12 rounds').toBe(true);
  });

  it('shows the result screen with the streak reached', () => {
    renderGame();
    let streak = 0;
    for (let n = 0; n < 30; n++) {
      if (answer(0)) {
        streak += 1;
        fireEvent.click(screen.getByRole('button', { name: 'Next' }));
      } else {
        fireEvent.click(screen.getByRole('button', { name: 'See your run' }));
        break;
      }
    }
    expect(screen.getByText('Streak ended')).toBeInTheDocument();
    expect(document.querySelector('.match-result-score strong')!.textContent).toBe(String(streak));
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Close' })).toHaveAttribute('href', '/signs');
  });

  it('reports 0 honestly when the first answer is wrong', () => {
    renderGame();

    // Each iteration begins a *fresh* run, so a miss here is genuinely the
    // run's first answer. A correct first answer is driven to the run's end
    // and restarted rather than being counted.
    for (let attempt = 0; attempt < 30; attempt++) {
      if (!answer(0)) {
        fireEvent.click(screen.getByRole('button', { name: 'See your run' }));
        expect(document.querySelector('.match-result-score strong')!.textContent).toBe('0');
        return;
      }
      // Finish this run, however long it lasts, then start another.
      fireEvent.click(screen.getByRole('button', { name: 'Next' }));
      while (!screen.queryByRole('button', { name: 'See your run' })) {
        if (answer(0)) fireEvent.click(screen.getByRole('button', { name: 'Next' }));
      }
      fireEvent.click(screen.getByRole('button', { name: 'See your run' }));
      fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    }
    throw new Error('no run died on its first answer in 30 attempts');
  });

  it('acknowledges a new personal best', () => {
    renderGame();
    let streak = 0;
    for (let n = 0; n < 30; n++) {
      if (answer(0)) {
        streak += 1;
        fireEvent.click(screen.getByRole('button', { name: 'Next' }));
      } else {
        fireEvent.click(screen.getByRole('button', { name: 'See your run' }));
        break;
      }
    }
    const best = document.querySelector('.match-result-best')!;
    if (streak > 0) {
      expect(best.getAttribute('data-state')).toBe('new');
      expect(best.textContent).toContain('New best');
    } else {
      expect(best.getAttribute('data-state')).toBeNull();
    }
  });

  it('resets the run but not the record when trying again', () => {
    renderGame();
    for (let n = 0; n < 30; n++) {
      if (answer(0)) fireEvent.click(screen.getByRole('button', { name: 'Next' }));
      else {
        fireEvent.click(screen.getByRole('button', { name: 'See your run' }));
        break;
      }
    }
    const bestBefore = signMatchBestStreak(useEngagement.getState().engagement);

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(screen.queryByText('Streak ended')).toBeNull();
    expect(choices()).toHaveLength(2);
    expect(document.querySelector('.match-score')!.textContent).toContain('Streak 0');
    expect(signMatchBestStreak(useEngagement.getState().engagement)).toBe(bestBefore);
  });

  it('shows streak and best, and no missed tally', () => {
    renderGame();
    const score = document.querySelector('.match-score')!;
    expect(score.textContent).toContain('Streak');
    expect(score.textContent).not.toMatch(/missed/i);
    expect(score.textContent).not.toMatch(/correct/i);
  });
});
