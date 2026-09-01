import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { App } from '@/App';
import { PracticeExam } from '@/routes/PracticeExam';
import { QuickPractice } from '@/routes/QuickPractice';

describe('Navigation terminology', () => {
  it('labels the practice route as "Practice" in the primary nav', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    );

    // The Practice tab is the primary nav's label for the practice route.
    const practiceLink = screen.getByRole('link', { name: /^practice$/i });
    expect(practiceLink).toBeInTheDocument();
    expect(practiceLink).toHaveAttribute('href', '/practice');
  });

  it('keeps Mock out of the primary nav — the exam lives on the Practice tab', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    );

    const nav = screen.getByRole('navigation', { name: 'Primary' });
    expect(within(nav).queryByRole('link', { name: /^mock/i })).not.toBeInTheDocument();
  });
});

describe('Practice route terminology', () => {
  it('does not present the practice session as a mock test', () => {
    render(
      <MemoryRouter>
        <QuickPractice />
      </MemoryRouter>,
    );

    // The practice surface must use learning language, never exam language.
    // ("pass" is excluded on purpose: driving questions legitimately contain it.)
    expect(screen.getByRole('heading', { level: 1, name: /quick practice/i })).toBeInTheDocument();
    expect(screen.queryByText(/mock/i)).not.toBeInTheDocument();
  });

  it('is the practice exam itself — titled "Practice exam" with a start action', () => {
    render(
      <MemoryRouter>
        <PracticeExam />
      </MemoryRouter>,
    );

    // The Practice tab is not a hub with a secondary mock link: it hosts the
    // full two-part timed exam directly. The page calls it a practice exam
    // and its primary action is the start button.
    expect(screen.getByRole('heading', { level: 1, name: /practice exam/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /start practice exam/i })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /ready for the exam format/i })).not.toBeInTheDocument();
  });
});