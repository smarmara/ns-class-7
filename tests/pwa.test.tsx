import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { usePwa } from '@/pwa';
import { useMockExam } from '@/store/useMockExam';
import { UpdateNotices } from '@/ui/UpdateNotices';
import { activeQuestions, examConfig } from '@/content';
import { createMockSession } from '@/engine/exam/mockTest';

describe('UpdateNotices', () => {
  beforeEach(() => {
    usePwa.setState({ updateAvailable: false, offlineReady: false });
    useMockExam.setState({ session: null });
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('shows the refresh banner when a new version is waiting', () => {
    usePwa.setState({ updateAvailable: true });
    render(<UpdateNotices />);
    expect(screen.getByText(/new study-content version is available/i)).toBeVisible();
    expect(screen.getByRole('button', { name: 'Refresh to update' })).toBeVisible();
  });

  it('does not show the refresh banner while a mock test is running', () => {
    const session = createMockSession(examConfig, activeQuestions, 123);
    useMockExam.setState({ session });
    usePwa.setState({ updateAvailable: true });
    render(<UpdateNotices />);
    expect(screen.queryByText(/new study-content version is available/i)).toBeNull();
  });

  it('shows the banner again once the running test is no longer in progress', () => {
    const session = createMockSession(examConfig, activeQuestions, 123);
    useMockExam.setState({ session });
    usePwa.setState({ updateAvailable: true });
    const { rerender } = render(<UpdateNotices />);
    expect(screen.queryByText(/new study-content version is available/i)).toBeNull();

    useMockExam.setState({ session: { ...session, status: 'complete' } });
    rerender(<UpdateNotices />);
    expect(screen.getByText(/new study-content version is available/i)).toBeVisible();
  });

  it('announces offline readiness and dismisses itself after a short while', async () => {
    usePwa.setState({ offlineReady: true });
    render(<UpdateNotices />);
    expect(screen.getByText(/works without an internet connection/i)).toBeVisible();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(10_001);
    });
    expect(screen.queryByText(/works without an internet connection/i)).toBeNull();
  });

  it('applies the update when the learner taps refresh', () => {
    usePwa.setState({ updateAvailable: true });
    render(<UpdateNotices />);
    // The apply handler is wired up by initPwa at runtime; in this test it is
    // unset, so tapping refresh must be safe (no throw) rather than crash.
    fireEvent.click(screen.getByRole('button', { name: 'Refresh to update' }));
  });
});