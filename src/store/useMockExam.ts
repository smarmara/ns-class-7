import { create } from 'zustand';
import type { Question } from '@/content/types';
import {
  createMockSession,
  type MockSession,
  type MockSectionState,
} from '@/engine/exam/mockTest';
import { examConfig } from '@/content';
import { loadMockSession, saveMockSession } from './persistence';

interface MockExamState {
  session: MockSession | null;
  /** True once the stored session has been read back after a page load. */
  restored: boolean;

  restore: () => void;
  start: (pool: readonly Question[], seed?: number) => void;
  abandon: () => void;

  answer: (questionId: string, authoredChoice: number) => void;
  goToQuestion: (index: number) => void;
  nextQuestion: () => void;
  previousQuestion: () => void;
  /** Persist the countdown so a refresh does not reset the clock. */
  tick: (remainingMs: number) => void;
  submitSection: () => void;
  startSection: () => void;
}

function update(session: MockSession, patch: Partial<MockSession>): MockSession {
  const next = { ...session, ...patch };
  saveMockSession(next);
  return next;
}

function patchSection(
  session: MockSession,
  index: number,
  patch: Partial<MockSectionState>,
): MockSession {
  const sections = session.sections.map((s, i) => (i === index ? { ...s, ...patch } : s));
  return update(session, { sections });
}

export const useMockExam = create<MockExamState>((set, get) => ({
  session: null,
  restored: false,

  restore: () => {
    if (get().restored) return;
    set({ session: loadMockSession(), restored: true });
  },

  start: (pool, seed) => {
    const session = createMockSession(examConfig, pool, seed);
    saveMockSession(session);
    set({ session, restored: true });
  },

  abandon: () => {
    saveMockSession(null);
    set({ session: null });
  },

  startSection: () => {
    const session = get().session;
    if (!session) return;
    const index = session.currentSectionIndex;
    const section = session.sections[index];
    if (!section || section.startedAt) return;
    set({
      session: patchSection(session, index, { startedAt: new Date().toISOString() }),
    });
  },

  answer: (questionId, authoredChoice) => {
    const session = get().session;
    if (!session || session.status === 'complete') return;
    const index = session.currentSectionIndex;
    const section = session.sections[index];
    if (!section || section.submittedAt) return;

    set({
      session: patchSection(session, index, {
        answers: { ...section.answers, [questionId]: authoredChoice },
      }),
    });
  },

  goToQuestion: (index) => {
    const session = get().session;
    if (!session) return;
    const section = session.sections[session.currentSectionIndex];
    if (!section) return;
    const clamped = Math.min(Math.max(index, 0), section.questionIds.length - 1);
    set({ session: update(session, { currentQuestionIndex: clamped }) });
  },

  nextQuestion: () => get().goToQuestion((get().session?.currentQuestionIndex ?? 0) + 1),
  previousQuestion: () => get().goToQuestion((get().session?.currentQuestionIndex ?? 0) - 1),

  tick: (remainingMs) => {
    const session = get().session;
    if (!session) return;
    const index = session.currentSectionIndex;
    const section = session.sections[index];
    if (!section || section.submittedAt) return;
    set({ session: patchSection(session, index, { remainingMs: Math.max(0, remainingMs) }) });
  },

  submitSection: () => {
    const session = get().session;
    if (!session) return;
    const index = session.currentSectionIndex;
    const section = session.sections[index];
    if (!section || section.submittedAt) return;

    let next = patchSection(session, index, { submittedAt: new Date().toISOString() });

    const isLast = index >= session.sections.length - 1;
    next = update(next, {
      currentSectionIndex: isLast ? index : index + 1,
      currentQuestionIndex: 0,
      status: isLast ? 'complete' : 'in-progress',
      completedAt: isLast ? new Date().toISOString() : null,
    });

    set({ session: next });
  },
}));
