import { create } from 'zustand';
import type { Question } from '@/content/types';
import type { AttemptRecord, MockTestRecord, Progress, QuestionStat } from '@/engine/learning/types';
import {
  MAX_ATTEMPT_LOG,
  MAX_MOCK_TESTS,
  emptyProgress,
} from '@/engine/learning/types';
import { nextStat } from '@/engine/learning/scheduler';
import { clearMockSession, clearProgress, loadProgress, saveProgress } from './persistence';

interface ProgressState {
  progress: Progress;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  recordAnswer: (question: Question, correct: boolean, mode: AttemptRecord['mode']) => void;
  toggleBookmark: (questionId: string) => void;
  setFlaggedForReview: (questionId: string, flagged: boolean) => void;
  recordMockTest: (record: MockTestRecord) => void;
  resetAll: () => Promise<void>;
}

function localDate(d: Date): string {
  // Local calendar date, not UTC — a streak should follow the learner's day.
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function daysBetween(a: string, b: string): number {
  const toUtc = (s: string) => {
    const [y, m, d] = s.split('-').map(Number);
    return Date.UTC(y!, (m ?? 1) - 1, d ?? 1);
  };
  return Math.round((toUtc(b) - toUtc(a)) / 86_400_000);
}

function bumpStreak(progress: Progress, now: Date): Progress['streak'] {
  const today = localDate(now);
  const last = progress.streak.lastStudyDate;
  if (last === today) return progress.streak;

  const current = last && daysBetween(last, today) === 1 ? progress.streak.current + 1 : 1;
  return {
    current,
    longest: Math.max(progress.streak.longest, current),
    lastStudyDate: today,
  };
}

/** Persist without blocking the UI. Failures are non-fatal by design. */
function persist(progress: Progress): void {
  void saveProgress(progress);
}

export const useProgress = create<ProgressState>((set, get) => ({
  progress: emptyProgress(),
  hydrated: false,

  hydrate: async () => {
    if (get().hydrated) return;
    const progress = await loadProgress();
    set({ progress, hydrated: true });
  },

  recordAnswer: (question, correct, mode) => {
    const now = new Date();
    const state = get().progress;
    const previous = state.questions[question.id];

    const updated: QuestionStat = {
      ...nextStat(previous, correct, now),
      questionId: question.id,
      bookmarked: previous?.bookmarked ?? false,
    };

    const attempt: AttemptRecord = {
      questionId: question.id,
      topic: question.topic,
      type: question.type,
      correct,
      at: now.toISOString(),
      mode,
    };

    const progress: Progress = {
      ...state,
      questions: { ...state.questions, [question.id]: updated },
      attempts: [...state.attempts, attempt].slice(-MAX_ATTEMPT_LOG),
      streak: bumpStreak(state, now),
    };

    set({ progress });
    persist(progress);
  },

  toggleBookmark: (questionId) => {
    const state = get().progress;
    const existing = state.questions[questionId];
    const now = new Date().toISOString();

    const stat: QuestionStat = existing
      ? { ...existing, bookmarked: !existing.bookmarked }
      : {
          questionId,
          seen: 0,
          correct: 0,
          incorrect: 0,
          lastSeenAt: now,
          lastResult: 'incorrect',
          streak: 0,
          box: 0,
          dueAt: now,
          bookmarked: true,
          flaggedForReview: false,
        };

    const progress: Progress = {
      ...state,
      questions: { ...state.questions, [questionId]: stat },
    };
    set({ progress });
    persist(progress);
  },

  setFlaggedForReview: (questionId, flagged) => {
    const state = get().progress;
    const existing = state.questions[questionId];
    const now = new Date().toISOString();

    const stat: QuestionStat = existing
      ? { ...existing, flaggedForReview: flagged }
      : {
          questionId,
          seen: 0,
          correct: 0,
          incorrect: 0,
          lastSeenAt: now,
          lastResult: 'incorrect',
          streak: 0,
          box: 0,
          dueAt: now,
          bookmarked: false,
          flaggedForReview: flagged,
        };

    const progress: Progress = {
      ...state,
      questions: { ...state.questions, [questionId]: stat },
    };
    set({ progress });
    persist(progress);
  },

  recordMockTest: (record) => {
    const state = get().progress;
    const progress: Progress = {
      ...state,
      mockTests: [...state.mockTests, record].slice(-MAX_MOCK_TESTS),
      streak: bumpStreak(state, new Date()),
    };
    set({ progress });
    persist(progress);
  },

  resetAll: async () => {
    await clearProgress();
    clearMockSession();
    set({ progress: emptyProgress() });
  },
}));
