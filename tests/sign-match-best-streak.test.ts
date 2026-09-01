import { beforeEach, describe, expect, it } from 'vitest';
import {
  EMPTY_SCORE,
  scoreAnswer,
} from '@/engine/signmatch/rounds';
import { emptyEngagement, signMatchBestStreak } from '@/engine/engagement/types';
import { emptyProgress } from '@/engine/learning/types';
import { buildBackupJson, normaliseEngagement, parseBackup } from '@/store/learnerStorage';
import { useEngagement } from '@/store/useEngagement';

/**
 * The one Sign Match datum that outlives a session.
 *
 * Everything else about the game stays ephemeral; only the record is kept, and
 * only in engagement state, which never feeds assessment.
 */

describe('best streak accounting', () => {
  beforeEach(() => {
    useEngagement.setState({ engagement: emptyEngagement(), hydrated: true });
  });

  const record = (n: number) => useEngagement.getState().recordSignMatchStreak(n);
  const best = () => signMatchBestStreak(useEngagement.getState().engagement);

  it('starts at zero', () => {
    expect(best()).toBe(0);
  });

  it('takes a new record', () => {
    record(4);
    expect(best()).toBe(4);
  });

  it('keeps the record when a later session falls short', () => {
    record(8);
    record(6);
    expect(best()).toBe(8);
  });

  it('raises the record when it is beaten', () => {
    record(8);
    record(9);
    expect(best()).toBe(9);
  });

  it('is unaffected by a streak reset', () => {
    record(9);
    // A wrong answer zeroes the current streak; the record stands.
    const afterMiss = scoreAnswer({ ...EMPTY_SCORE, streak: 9, bestStreak: 9 }, false);
    expect(afterMiss.streak).toBe(0);
    record(afterMiss.streak);
    expect(best()).toBe(9);
  });

  it('ignores an equal streak, so no write happens without a new record', () => {
    record(5);
    const before = useEngagement.getState().engagement;
    record(5);
    // Same object identity: the store was never written to.
    expect(useEngagement.getState().engagement).toBe(before);
  });

  it('ignores nonsense values', () => {
    record(7);
    record(Number.NaN);
    record(Number.POSITIVE_INFINITY);
    record(-3);
    expect(best()).toBe(7);
  });

  it('tracks a real run of answers', () => {
    let score = EMPTY_SCORE;
    for (const wasCorrect of [true, true, true, false, true, true, true, true]) {
      score = scoreAnswer(score, wasCorrect);
      record(score.streak);
    }
    expect(score.streak).toBe(4);
    expect(best()).toBe(4);
  });
});

describe('persistence shape', () => {
  it('defaults to zero for a save written before the field existed', () => {
    const legacy = { version: 1, xp: 120, goalXp: 30, daily: [{ date: '2026-08-01', xp: 40 }] };
    const loaded = normaliseEngagement(legacy);
    expect(loaded.signMatchBestStreak).toBe(0);
    // And nothing else about the old save is lost.
    expect(loaded.xp).toBe(120);
    expect(loaded.goalXp).toBe(30);
    expect(loaded.daily).toHaveLength(1);
  });

  it('round-trips a stored record', () => {
    const loaded = normaliseEngagement({ ...emptyEngagement(), signMatchBestStreak: 12 });
    expect(loaded.signMatchBestStreak).toBe(12);
    expect(signMatchBestStreak(loaded)).toBe(12);
  });

  it('repairs a malformed stored value rather than failing the restore', () => {
    for (const bad of [null, 'twelve', Number.NaN, -5, undefined]) {
      const loaded = normaliseEngagement({
        ...emptyEngagement(),
        signMatchBestStreak: bad as unknown as number,
      });
      expect(loaded.signMatchBestStreak, String(bad)).toBe(0);
    }
  });

  it('lives in engagement, so reset clears it with the rest', () => {
    // The field is part of the engagement envelope; emptyEngagement is what
    // reset installs, and it carries a zero record.
    expect(emptyEngagement().signMatchBestStreak).toBe(0);
  });
});

describe('backup and restore carry the record', () => {
  it('includes the best streak in a backup and reinstates it', () => {
    const engagement = { ...emptyEngagement(), xp: 250, signMatchBestStreak: 14 };
    const json = buildBackupJson(emptyProgress(), engagement);

    expect(JSON.parse(json).engagement.signMatchBestStreak).toBe(14);

    const restored = parseBackup(json);
    expect(restored.ok).toBe(true);
    if (!restored.ok) return;
    expect(restored.state.engagement.signMatchBestStreak).toBe(14);
    expect(restored.state.engagement.xp).toBe(250);
  });

  it('accepts a backup written before the field existed', () => {
    const json = buildBackupJson(emptyProgress(), emptyEngagement());
    const payload = JSON.parse(json);
    delete payload.engagement.signMatchBestStreak;

    const restored = parseBackup(JSON.stringify(payload));
    expect(restored.ok, 'an older backup must still restore').toBe(true);
    if (!restored.ok) return;
    expect(signMatchBestStreak(restored.state.engagement)).toBe(0);
  });
});
