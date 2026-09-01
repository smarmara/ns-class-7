import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Engagement } from '@/engine/engagement/types';
import { ENGAGEMENT_VERSION, emptyEngagement } from '@/engine/engagement/types';
import type { Progress } from '@/engine/learning/types';
import { PROGRESS_VERSION, emptyProgress } from '@/engine/learning/types';
import { loadMockSession, lsRead, lsWrite, saveMockSession } from '@/store/persistence';
import {
  CORRUPT_KEY,
  LEARNER_FORMAT,
  LEARNER_KEY,
  LEARNER_SCHEMA_VERSION,
  LEGACY_ENGAGEMENT_KEY,
  LEGACY_PROGRESS_KEY,
  bindLearnerSources,
  buildBackupJson,
  clearLearnerState,
  loadPersistedState,
  parseBackup,
  restoreBackup,
  saveLearnerState,
  schemaMigrations,
  setContentVersion,
} from '@/store/learnerStorage';

// The learner-storage layer talks to the browser through idb-keyval and
// localStorage; in jsdom we stub IndexedDB with an in-memory map so the
// layer's own logic (envelope, migration, backup/restore, corruption) is what
// is under test.
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

const { createMockSession } = await import('@/engine/exam/mockTest');
const { activeQuestions, examConfig } = await import('@/content');

/** The in-memory application state the bound sources serve. */
let live: { progress: Progress; engagement: Engagement; profile?: { displayName: string } };

function sampleProgress(): Progress {
  return {
    version: PROGRESS_VERSION,
    questions: {
      'q-a': {
        questionId: 'q-a',
        seen: 4,
        correct: 3,
        incorrect: 1,
        lastSeenAt: '2026-08-17T10:00:00.000Z',
        lastResult: 'correct',
        streak: 2,
        box: 2,
        dueAt: '2026-08-18T10:00:00.000Z',
        bookmarked: true,
        flaggedForReview: false,
      },
    },
    attempts: [
      {
        questionId: 'q-a',
        topic: 'traffic-signals',
        type: 'rules',
        correct: true,
        at: '2026-08-17T10:00:00.000Z',
        mode: 'quick',
      },
    ],
    mockTests: [
      {
        id: 'mock-1',
        startedAt: '2026-08-16T09:00:00.000Z',
        completedAt: '2026-08-16T09:20:00.000Z',
        passed: false,
        sections: [],
        missedQuestionIds: ['q-a'],
      },
    ],
    streak: { current: 3, longest: 5, lastStudyDate: '2026-08-17' },
  };
}

function sampleEngagement(): Engagement {
  return {
    version: ENGAGEMENT_VERSION,
    xp: 120,
    goalXp: 30,
    daily: [{ date: '2026-08-17', xp: 40 }],
    signMatchBestStreak: 0,
  };
}

/** Simulate an app restart: memory resets, storage survives. */
function restart(): void {
  live = { progress: emptyProgress(), engagement: emptyEngagement(), profile: undefined };
}

beforeEach(() => {
  store.clear();
  localStorage.clear();
  setContentVersion('test-content');
  restart();
  bindLearnerSources({
    getProgress: () => live.progress,
    getEngagement: () => live.engagement,
    getProfile: () => live.profile,
    contentVersion: 'test-content',
  });
});

describe('persistence', () => {
  it('starts empty on a fresh install', async () => {
    const outcome = await loadPersistedState();
    expect(outcome.status).toBe('empty');
    expect(outcome.state).toBeNull();
  });

  it('round-trips the combined envelope', async () => {
    live.progress = sampleProgress();
    live.engagement = sampleEngagement();
    await saveLearnerState();

    const envelope = JSON.parse(lsRead(LEARNER_KEY) ?? '{}');
    expect(envelope.format).toBe(LEARNER_FORMAT);
    expect(envelope.schemaVersion).toBe(LEARNER_SCHEMA_VERSION);
    expect(envelope.contentVersion).toBe('test-content');
    expect(typeof envelope.savedAt).toBe('string');
    expect(envelope.progress).toEqual(sampleProgress());
    expect(envelope.engagement).toEqual(sampleEngagement());
  });

  it('mirrors the envelope to IndexedDB and localStorage', async () => {
    live.progress = sampleProgress();
    live.engagement = sampleEngagement();
    await saveLearnerState();

    expect(typeof store.get(LEARNER_KEY)).toBe('string');
    expect(lsRead(LEARNER_KEY)).toBe(store.get(LEARNER_KEY));
  });

  it('restores an answered question across a reload', async () => {
    live.progress = sampleProgress();
    live.engagement = sampleEngagement();
    await saveLearnerState();

    restart();
    const { state } = await loadPersistedState();
    expect(state?.progress.questions['q-a']).toEqual(sampleProgress().questions['q-a']);
    expect(state?.progress.attempts).toHaveLength(1);
    expect(state?.progress.attempts[0]).toEqual(sampleProgress().attempts[0]);
  });

  it('restores XP and the daily goal across a reload', async () => {
    live.engagement = { ...sampleEngagement(), xp: 320, goalXp: 60 };
    live.progress = sampleProgress();
    await saveLearnerState();

    restart();
    const { state } = await loadPersistedState();
    expect(state?.engagement.xp).toBe(320);
    expect(state?.engagement.goalXp).toBe(60);
    expect(state?.engagement.daily).toEqual([{ date: '2026-08-17', xp: 40 }]);
  });

  it('restores the streak across a reload', async () => {
    live.progress = sampleProgress();
    live.engagement = sampleEngagement();
    await saveLearnerState();

    restart();
    const { state } = await loadPersistedState();
    expect(state?.progress.streak).toEqual({ current: 3, longest: 5, lastStudyDate: '2026-08-17' });
  });

  it('restores bookmarks and mastery-driving stats across a reload', async () => {
    live.progress = sampleProgress();
    live.engagement = sampleEngagement();
    await saveLearnerState();

    restart();
    const { state } = await loadPersistedState();
    const stat = state?.progress.questions['q-a'];
    expect(stat?.bookmarked).toBe(true);
    expect(stat?.seen).toBe(4);
    expect(stat?.correct).toBe(3);
    expect(stat?.box).toBe(2);
  });

  it('restores mock-test history across a reload', async () => {
    live.progress = sampleProgress();
    live.engagement = sampleEngagement();
    await saveLearnerState();

    restart();
    const { state } = await loadPersistedState();
    expect(state?.progress.mockTests).toHaveLength(1);
    expect(state?.progress.mockTests[0]).toMatchObject({ id: 'mock-1', passed: false });
  });
});

describe('migration from legacy flat keys', () => {
  it('migrates a legacy localStorage progress payload', async () => {
    localStorage.setItem(LEGACY_PROGRESS_KEY, JSON.stringify(sampleProgress()));

    const outcome = await loadPersistedState();
    expect(outcome.status).toBe('migrated');
    expect(outcome.state?.progress).toEqual(sampleProgress());
    expect(outcome.state?.engagement).toEqual(emptyEngagement());

    // New envelope written, old key retired.
    expect(lsRead(LEARNER_KEY)).not.toBeNull();
    expect(store.get(LEARNER_KEY)).not.toBeNull();
    expect(localStorage.getItem(LEGACY_PROGRESS_KEY)).toBeNull();
    expect(store.has(LEGACY_PROGRESS_KEY)).toBe(false);
  });

  it('migrates a legacy IndexedDB progress payload', async () => {
    store.set(LEGACY_PROGRESS_KEY, sampleProgress());

    const outcome = await loadPersistedState();
    expect(outcome.status).toBe('migrated');
    expect(outcome.state?.progress).toEqual(sampleProgress());
    expect(store.has(LEGACY_PROGRESS_KEY)).toBe(false);
  });

  it('migrates legacy engagement alongside progress', async () => {
    localStorage.setItem(LEGACY_PROGRESS_KEY, JSON.stringify(sampleProgress()));
    localStorage.setItem(LEGACY_ENGAGEMENT_KEY, JSON.stringify(sampleEngagement()));

    const outcome = await loadPersistedState();
    expect(outcome.state?.engagement).toEqual(sampleEngagement());
    expect(outcome.state?.progress).toEqual(sampleProgress());
  });

  it('runs the migration only once', async () => {
    localStorage.setItem(LEGACY_PROGRESS_KEY, JSON.stringify(sampleProgress()));
    await loadPersistedState();
    expect(localStorage.getItem(LEGACY_PROGRESS_KEY)).toBeNull();

    const second = await loadPersistedState();
    expect(second.status).toBe('ok');
    expect(second.state?.progress).toEqual(sampleProgress());
  });

  it('preserves a partially-present legacy state', async () => {
    localStorage.setItem(LEGACY_ENGAGEMENT_KEY, JSON.stringify(sampleEngagement()));

    const outcome = await loadPersistedState();
    expect(outcome.state?.engagement).toEqual(sampleEngagement());
    expect(outcome.state?.progress).toEqual(emptyProgress());
  });
});

describe('backup', () => {
  it('produces a file with the required metadata', () => {
    const json = buildBackupJson(sampleProgress(), sampleEngagement());
    const parsed = JSON.parse(json);
    expect(parsed.format).toBe(LEARNER_FORMAT);
    expect(parsed.schemaVersion).toBe(LEARNER_SCHEMA_VERSION);
    expect(typeof parsed.savedAt).toBe('string');
    expect(parsed.contentVersion).toBe('test-content');
    expect(parsed.progress).toEqual(sampleProgress());
    expect(parsed.engagement).toEqual(sampleEngagement());
  });

  it('contains no personally identifying or tracking fields', () => {
    const json = buildBackupJson(sampleProgress(), sampleEngagement());
    const parsed = JSON.parse(json);
    expect(Object.keys(parsed).sort()).toEqual(
      ['contentVersion', 'engagement', 'format', 'progress', 'savedAt', 'schemaVersion'].sort(),
    );
    const body = JSON.stringify(parsed).toLowerCase();
    for (const forbidden of [
      '"name"',
      '"email"',
      '"ip"',
      '"account"',
      '"uuid"',
      '"device"',
      '"analytics"',
      '"telemetry"',
      '"advertiser"',
    ]) {
      expect(body).not.toContain(forbidden);
    }
  });

  it('parses back into the same state', () => {
    const result = parseBackup(buildBackupJson(sampleProgress(), sampleEngagement()));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.state.progress).toEqual(sampleProgress());
      expect(result.state.engagement).toEqual(sampleEngagement());
    }
  });
});

describe('restore', () => {
  it('restores a valid backup and persists it', async () => {
    const result = await restoreBackup(buildBackupJson(sampleProgress(), sampleEngagement()));
    expect(result.ok).toBe(true);

    restart();
    const { state } = await loadPersistedState();
    expect(state?.progress).toEqual(sampleProgress());
    expect(state?.engagement).toEqual(sampleEngagement());
  });

  it('rejects malformed JSON', () => {
    const result = parseBackup('{not json');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('not-json');
  });

  it('rejects a wrong application format', () => {
    const result = parseBackup(
      JSON.stringify({ format: 'other-app', schemaVersion: 1, progress: {}, engagement: {} }),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('wrong-format');
  });

  it('rejects an unsupported future schema version', () => {
    const result = parseBackup(
      JSON.stringify({
        format: LEARNER_FORMAT,
        schemaVersion: LEARNER_SCHEMA_VERSION + 1,
        progress: sampleProgress(),
        engagement: sampleEngagement(),
      }),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('unsupported-schema');
  });

  it('rejects a missing learner-state structure', () => {
    expect(parseBackup(JSON.stringify({ format: LEARNER_FORMAT, schemaVersion: 1 })).ok).toBe(false);
    expect(
      parseBackup(
        JSON.stringify({ format: LEARNER_FORMAT, schemaVersion: 1, progress: {}, engagement: {} }),
      ).ok,
    ).toBe(false);
    expect(
      parseBackup(
        JSON.stringify({
          format: LEARNER_FORMAT,
          schemaVersion: 1,
          progress: { questions: {} },
          engagement: { xp: 0, goalXp: 0 },
        }),
      ).ok,
    ).toBe(false);
  });

  it('leaves current progress untouched when a backup is invalid', async () => {
    live.progress = sampleProgress();
    live.engagement = sampleEngagement();
    await saveLearnerState();
    const before = lsRead(LEARNER_KEY);

    const result = await restoreBackup('{nope');
    expect(result.ok).toBe(false);
    expect(lsRead(LEARNER_KEY)).toBe(before);
  });

  it('replaces rather than merges the current progress', async () => {
    const first = {
      ...sampleProgress(),
      questions: { 'q-first': sampleProgress().questions['q-a']! },
      streak: { current: 9, longest: 9, lastStudyDate: '2026-08-01' },
    };
    const backupJson = buildBackupJson(first, { ...sampleEngagement(), xp: 999 });

    // Simulate a learner who has studied more since the backup was made.
    live.progress = sampleProgress();
    live.engagement = sampleEngagement();
    await saveLearnerState();

    const result = await restoreBackup(backupJson);
    expect(result.ok).toBe(true);

    restart();
    const { state } = await loadPersistedState();
    expect(state?.progress).toEqual(first);
    expect(state?.engagement.xp).toBe(999);
    expect(state?.progress.questions['q-a']).toBeUndefined();
  });
});

describe('content-version compatibility', () => {
  it('restores a backup from an older content version safely', async () => {
    const oldBackup = JSON.stringify({
      format: LEARNER_FORMAT,
      schemaVersion: LEARNER_SCHEMA_VERSION,
      exportedAt: '2026-01-01T00:00:00.000Z',
      contentVersion: 'ancient-content',
      progress: sampleProgress(),
      engagement: sampleEngagement(),
    });

    const result = await restoreBackup(oldBackup);
    expect(result.ok).toBe(true);

    restart();
    const { state } = await loadPersistedState();
    expect(state?.contentVersion).toBe('ancient-content');
    // Learner history (including the stale-id stat) is kept verbatim.
    expect(state?.progress.questions['q-a']?.bookmarked).toBe(true);
  });

  it('stamps the running content version on the next save', async () => {
    await restoreBackup(
      JSON.stringify({
        format: LEARNER_FORMAT,
        schemaVersion: LEARNER_SCHEMA_VERSION,
        contentVersion: 'ancient-content',
        progress: sampleProgress(),
        engagement: sampleEngagement(),
      }),
    );
    live.progress = sampleProgress();
    live.engagement = sampleEngagement();
    await saveLearnerState();

    const saved = JSON.parse(lsRead(LEARNER_KEY) ?? '{}');
    expect(saved.contentVersion).toBe('test-content');
  });
});

describe('corrupt-state recovery', () => {
  it('preserves the corrupt value and starts clean', async () => {
    lsWrite(LEARNER_KEY, '{definitely not json');

    const outcome = await loadPersistedState();
    expect(outcome.status).toBe('corrupt');
    expect(outcome.state).toBeNull();
    expect(lsRead(CORRUPT_KEY)).toBe('{definitely not json');
  });

  it('starts clean when the envelope is structurally invalid', async () => {
    lsWrite(LEARNER_KEY, JSON.stringify({ format: LEARNER_FORMAT, schemaVersion: 1, progress: {}, engagement: {} }));

    const outcome = await loadPersistedState();
    expect(outcome.status).toBe('corrupt');
    expect(outcome.state).toBeNull();
    expect(lsRead(CORRUPT_KEY)).not.toBeNull();
  });

  it('remains usable after corruption', async () => {
    lsWrite(LEARNER_KEY, '{bad');
    await loadPersistedState();

    live.progress = sampleProgress();
    live.engagement = sampleEngagement();
    await saveLearnerState();

    restart();
    const { state } = await loadPersistedState();
    expect(state?.progress).toEqual(sampleProgress());
  });

  it('clears the preserved copy on reset', async () => {
    lsWrite(LEARNER_KEY, '{bad');
    lsWrite(CORRUPT_KEY, '{bad');
    await clearLearnerState();
    expect(lsRead(CORRUPT_KEY)).toBeNull();
  });
});

describe('reset', () => {
  it('clears the envelope, legacy keys, corrupt copy and in-progress mock', async () => {
    live.progress = sampleProgress();
    live.engagement = sampleEngagement();
    await saveLearnerState();
    saveMockSession(createMockSession(examConfig, activeQuestions, 7));
    lsWrite(CORRUPT_KEY, 'preserved');
    localStorage.setItem(LEGACY_PROGRESS_KEY, JSON.stringify(sampleProgress()));

    await clearLearnerState();

    expect(lsRead(LEARNER_KEY)).toBeNull();
    expect(store.has(LEARNER_KEY)).toBe(false);
    expect(lsRead(CORRUPT_KEY)).toBeNull();
    expect(store.has(CORRUPT_KEY)).toBe(false);
    expect(localStorage.getItem(LEGACY_PROGRESS_KEY)).toBeNull();
    expect(store.has(LEGACY_PROGRESS_KEY)).toBe(false);
    expect(loadMockSession()).toBeNull();

    restart();
    expect((await loadPersistedState()).status).toBe('empty');
  });
});

describe('schema migrations', () => {
  it('has a migration entry for the current schema', () => {
    expect(schemaMigrations[LEARNER_SCHEMA_VERSION]).toBeDefined();
  });

  it('normalises a bare version-1 envelope', () => {
    const result = parseBackup(
      JSON.stringify({
        format: LEARNER_FORMAT,
        schemaVersion: LEARNER_SCHEMA_VERSION,
        progress: sampleProgress(),
        engagement: sampleEngagement(),
      }),
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.state.savedAt).toBeTypeOf('string');
      expect(result.state.progress).toEqual(sampleProgress());
    }
  });
});