import { beforeEach, describe, expect, it, vi } from 'vitest';
import { emptyProgress, PROGRESS_VERSION, type Progress } from '@/engine/learning/types';

// idb-keyval needs a real IndexedDB; in jsdom we stub it with an in-memory map
// so the persistence layer's own logic is what is under test.
const store = new Map<string, unknown>();
vi.mock('idb-keyval', () => ({
  get: vi.fn(async (key: string) => store.get(key)),
  set: vi.fn(async (key: string, value: unknown) => {
    store.set(key, value);
  }),
  del: vi.fn(async (key: string) => {
    store.delete(key);
  }),
}));

const {
  clearProgress,
  clearMockSession,
  loadMockSession,
  loadProgress,
  saveMockSession,
  saveProgress,
} = await import('@/store/persistence');

const { createMockSession } = await import('@/engine/exam/mockTest');
const { activeQuestions, examConfig } = await import('@/content');

beforeEach(() => {
  store.clear();
  localStorage.clear();
});

describe('progress persistence', () => {
  it('returns empty progress when nothing has been stored', async () => {
    const progress = await loadProgress();
    expect(progress.version).toBe(PROGRESS_VERSION);
    expect(progress.attempts).toEqual([]);
    expect(progress.questions).toEqual({});
  });

  it('round trips a saved progress record', async () => {
    const progress: Progress = {
      ...emptyProgress(),
      questions: {
        'rules-signals-001': {
          questionId: 'rules-signals-001',
          seen: 3,
          correct: 2,
          incorrect: 1,
          lastSeenAt: '2026-08-17T10:00:00.000Z',
          lastResult: 'correct',
          streak: 1,
          box: 2,
          dueAt: '2026-08-18T10:00:00.000Z',
          bookmarked: true,
          flaggedForReview: false,
        },
      },
      attempts: [
        {
          questionId: 'rules-signals-001',
          topic: 'traffic-signals',
          type: 'rules',
          correct: true,
          at: '2026-08-17T10:00:00.000Z',
          mode: 'quick',
        },
      ],
      streak: { current: 4, longest: 9, lastStudyDate: '2026-08-17' },
    };

    await saveProgress(progress);
    expect(await loadProgress()).toEqual(progress);
  });

  it('migrates an older payload instead of discarding the learner history', async () => {
    store.set('ns-class7:progress:v1', {
      version: 0,
      questions: { a: { questionId: 'a', seen: 5 } },
    });

    const loaded = await loadProgress();
    expect(loaded.version).toBe(PROGRESS_VERSION);
    expect(loaded.questions['a']).toBeDefined();
    expect(loaded.attempts).toEqual([]);
    expect(loaded.mockTests).toEqual([]);
    expect(loaded.streak).toEqual({ current: 0, longest: 0, lastStudyDate: null });
  });

  it('clears everything on reset', async () => {
    await saveProgress({ ...emptyProgress(), streak: { current: 3, longest: 3, lastStudyDate: 'x' } });
    await clearProgress();
    expect((await loadProgress()).streak.current).toBe(0);
  });
});

describe('mock session persistence', () => {
  it('writes synchronously so an abrupt refresh cannot lose the paper', () => {
    const session = createMockSession(examConfig, activeQuestions, 1);
    saveMockSession(session);
    // Readable immediately, without awaiting anything.
    expect(loadMockSession()).toEqual(session);
  });

  it('preserves answers and the remaining clock across a reload', () => {
    const session = createMockSession(examConfig, activeQuestions, 2);
    const first = session.sections[0]!.questionIds[0]!;
    session.sections[0]!.answers[first] = 3;
    session.sections[0]!.remainingMs = 1_234_000;
    session.currentQuestionIndex = 7;
    saveMockSession(session);

    const restored = loadMockSession()!;
    expect(restored.sections[0]!.answers[first]).toBe(3);
    expect(restored.sections[0]!.remainingMs).toBe(1_234_000);
    expect(restored.currentQuestionIndex).toBe(7);
    expect(restored.sections[0]!.questionIds).toEqual(session.sections[0]!.questionIds);
    expect(restored.sections[0]!.displayOrders).toEqual(session.sections[0]!.displayOrders);
  });

  it('clears the stored session when passed null', () => {
    saveMockSession(createMockSession(examConfig, activeQuestions, 3));
    saveMockSession(null);
    expect(loadMockSession()).toBeNull();
  });

  it('clears the stored session when a full reset happens', async () => {
    saveMockSession(createMockSession(examConfig, activeQuestions, 3));
    await clearProgress();
    clearMockSession();
    expect(loadMockSession()).toBeNull();
    expect(loadProgress()).resolves.toMatchObject({ streak: { current: 0 } });
  });

  it('returns null rather than throwing on a corrupt payload', () => {
    localStorage.setItem('ns-class7:mock-session:v1', '{not json');
    expect(loadMockSession()).toBeNull();

    localStorage.setItem('ns-class7:mock-session:v1', '{"sections":"nope"}');
    expect(loadMockSession()).toBeNull();
  });
});
