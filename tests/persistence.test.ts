import { beforeEach, describe, expect, it, vi } from 'vitest';

// idb-keyval needs a real IndexedDB; in jsdom we stub it with an in-memory map
// so the raw device layer's own logic is what is under test.
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
  clearMockSession,
  idbRead,
  idbRemove,
  idbWrite,
  loadMockSession,
  lsRead,
  lsRemove,
  lsWrite,
  saveMockSession,
} = await import('@/store/persistence');

const { createMockSession } = await import('@/engine/exam/mockTest');
const { activeQuestions, examConfig } = await import('@/content');

beforeEach(() => {
  store.clear();
  localStorage.clear();
});

describe('raw device storage', () => {
  it('writes and reads IndexedDB values', async () => {
    await idbWrite('raw-key', { a: 1 });
    expect(await idbRead('raw-key')).toEqual({ a: 1 });
    await idbRemove('raw-key');
    expect(await idbRead('raw-key')).toBeNull();
  });

  it('reads and removes localStorage strings', () => {
    expect(lsRead('raw-key')).toBeNull();
    lsWrite('raw-key', 'v');
    expect(lsRead('raw-key')).toBe('v');
    lsRemove('raw-key');
    expect(lsRead('raw-key')).toBeNull();
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
    clearMockSession();
    expect(loadMockSession()).toBeNull();
  });

  it('returns null rather than throwing on a corrupt payload', () => {
    localStorage.setItem('ns-class7:mock-session:v1', '{not json');
    expect(loadMockSession()).toBeNull();

    localStorage.setItem('ns-class7:mock-session:v1', '{"sections":"nope"}');
    expect(loadMockSession()).toBeNull();
  });
});