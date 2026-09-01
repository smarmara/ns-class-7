import type { Engagement } from '@/engine/engagement/types';
import type { LearnerProfile } from '@/engine/profile/types';
import { normaliseProfile } from '@/engine/profile/types';
import { ENGAGEMENT_VERSION, emptyEngagement } from '@/engine/engagement/types';
import type { Progress } from '@/engine/learning/types';
import { PROGRESS_VERSION, emptyProgress } from '@/engine/learning/types';
import {
  clearMockSession,
  idbRead,
  idbRemove,
  idbWrite,
  lsRead,
  lsRemove,
  lsWrite,
} from './persistence';

/**
 * Learner-storage layer.
 *
 * This is the single abstraction through which learner progress is persisted.
 * UI components never call browser storage APIs directly — they mutate
 * application stores, which delegate here. The same interface is what a future
 * native iOS/Android build would re-implement without touching the learning
 * system.
 *
 * Everything is local to the device. There is no account, no server and no
 * telemetry; the only way progress leaves the device is a backup file the
 * learner explicitly downloads.
 */

export const LEARNER_FORMAT = 'ns-class7-progress';
export const LEARNER_SCHEMA_VERSION = 1;
export const LEARNER_KEY = 'ns-class7:learner:v1';
export const LEGACY_PROGRESS_KEY = 'ns-class7:progress:v1';
export const LEGACY_ENGAGEMENT_KEY = 'ns-class7:engagement:v1';
export const CORRUPT_KEY = 'ns-class7:corrupt:v1';

/** Everything needed to recreate the learner's state on another install. */
export interface PersistedLearnerState {
  format: 'ns-class7-progress';
  schemaVersion: number;
  /** ISO timestamp of the last save (or of the export, for backups). */
  savedAt: string;
  /** Provenance only — a mismatch with the running app never blocks restore. */
  contentVersion: string;
  progress: Progress;
  engagement: Engagement;
  /**
   * The learner's local profile, when they have made one. Optional so that
   * every save written before profiles existed still loads.
   */
  profile?: LearnerProfile;
}

/**
 * The device boundary. The web implementation stores a JSON string under a
 * single key (IndexedDB primary, localStorage mirror for close-safety). A
 * native implementation provides the same three methods.
 */
export interface LearnerStorage {
  load(): Promise<string | null>;
  save(json: string): Promise<void>;
  clear(): Promise<void>;
}

function webLearnerStorage(): LearnerStorage {
  return {
    async load() {
      const fromIdb = await idbRead<string>(LEARNER_KEY);
      if (typeof fromIdb === 'string' && fromIdb.length > 0) return fromIdb;
      return lsRead(LEARNER_KEY);
    },
    async save(json) {
      // IndexedDB is the durable store; the localStorage mirror is written
      // synchronously so a quick close right after an action still saves it.
      await idbWrite(LEARNER_KEY, json);
      lsWrite(LEARNER_KEY, json);
    },
    async clear() {
      await idbRemove(LEARNER_KEY);
      lsRemove(LEARNER_KEY);
    },
  };
}

let storage: LearnerStorage = webLearnerStorage();

/** Injectable for tests and for a future native adapter. */
export function setLearnerStorage(impl: LearnerStorage): void {
  storage = impl;
}

/**
 * Live accessors bound once at app startup. Binding avoids an import cycle
 * between the two application stores (each must read the other's state when
 * saving the combined envelope).
 */
type Sources = {
  getProgress: () => Progress;
  getEngagement: () => Engagement;
  getProfile: () => LearnerProfile | undefined;
  contentVersion: string;
};

let bound: Sources | null = null;

export function bindLearnerSources(sources: Sources): void {
  bound = sources;
}

let currentContentVersion = 'dev';

/** Records which content version the running build serves (provenance only). */
export function setContentVersion(version: string): void {
  currentContentVersion = version;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/* ----------------------------------------------------------- normalisers */

/** Coerce an older/looser progress payload into the current shape. */
export function normaliseProgress(old: Partial<Progress>): Progress {
  const base = emptyProgress();
  return {
    ...base,
    ...old,
    version: PROGRESS_VERSION,
    questions: old.questions ?? base.questions,
    attempts: old.attempts ?? base.attempts,
    mockTests: old.mockTests ?? base.mockTests,
    streak: old.streak ?? base.streak,
  };
}

/** Coerce an older/looser engagement payload into the current shape. */
export function normaliseEngagement(old: Partial<Engagement>): Engagement {
  const base = emptyEngagement();
  return {
    ...base,
    ...old,
    version: ENGAGEMENT_VERSION,
    xp: old.xp ?? base.xp,
    goalXp: old.goalXp ?? base.goalXp,
    daily: old.daily ?? base.daily,
    // Absent in saves written before Sign Match had a personal best. Missing
    // or malformed values load as 0 rather than failing the restore.
    signMatchBestStreak:
      typeof old.signMatchBestStreak === 'number' && Number.isFinite(old.signMatchBestStreak)
        ? Math.max(0, Math.floor(old.signMatchBestStreak))
        : 0,
  };
}

/**
 * Simple migration chain: schema N -> current schema. The purpose is to make
 * future format changes possible without invalidating stored progress. Today
 * version 1 is current, so the chain is a single identity step.
 */
export const schemaMigrations: Record<
  number,
  (state: Record<string, unknown>) => Record<string, unknown>
> = {
  1: (state) => state,
};

function migrateEnvelope(raw: Record<string, unknown>): PersistedLearnerState {
  let current = raw;
  let version = typeof raw.schemaVersion === 'number' ? raw.schemaVersion : LEARNER_SCHEMA_VERSION;
  while (version < LEARNER_SCHEMA_VERSION) {
    const step = schemaMigrations[version];
    if (!step) break;
    current = step(current);
    version += 1;
  }
  return {
    format: LEARNER_FORMAT,
    schemaVersion: LEARNER_SCHEMA_VERSION,
    savedAt:
      typeof current.savedAt === 'string'
        ? current.savedAt
        : typeof current.exportedAt === 'string'
          ? current.exportedAt
          : new Date().toISOString(),
    contentVersion:
      typeof current.contentVersion === 'string' ? current.contentVersion : '',
    progress: normaliseProgress(current.progress as Partial<Progress>),
    engagement: normaliseEngagement(current.engagement as Partial<Engagement>),
    ...(normaliseProfile(current.profile) ? { profile: normaliseProfile(current.profile)! } : {}),
  };
}

/* -------------------------------------------------------------- parsing */

export type ParseResult =
  | { ok: true; state: PersistedLearnerState }
  | { ok: false; reason: string };

export function fail(reason: string): ParseResult {
  return { ok: false, reason };
}

/**
 * Validate a parsed envelope. The required learner-state structure must be
 * present: malformed values are never silently reinterpreted as legitimate
 * progress (a restore or a load of such data is rejected/corrupt).
 */
export function parseEnvelope(parsed: unknown): ParseResult {
  if (!isRecord(parsed)) return fail('not-an-object');
  if (parsed.format !== LEARNER_FORMAT) return fail('wrong-format');
  const schema = parsed.schemaVersion;
  if (typeof schema !== 'number' || !Number.isInteger(schema) || schema < 1) {
    return fail('missing-schema');
  }
  if (schema > LEARNER_SCHEMA_VERSION) return fail('unsupported-schema');

  const progress = parsed.progress;
  const engagement = parsed.engagement;
  if (!isRecord(progress) || !isRecord(engagement)) return fail('missing-state');
  if (
    !isRecord(progress.questions) ||
    !Array.isArray(progress.attempts) ||
    !Array.isArray(progress.mockTests) ||
    !isRecord(progress.streak)
  ) {
    return fail('bad-progress');
  }
  if (
    typeof engagement.xp !== 'number' ||
    typeof engagement.goalXp !== 'number' ||
    !Array.isArray(engagement.daily)
  ) {
    return fail('bad-engagement');
  }

  return { ok: true, state: migrateEnvelope(parsed) };
}

/** Parse and validate a backup/restore payload (JSON text). */
export function parseBackup(json: string): ParseResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return fail('not-json');
  }
  return parseEnvelope(parsed);
}

/* ----------------------------------------------------- load / save / clear */

export interface LoadOutcome {
  state: PersistedLearnerState | null;
  /** How the state on disk was obtained this launch. */
  status: 'ok' | 'migrated' | 'corrupt' | 'empty';
}

/**
 * Load persisted learner state on launch.
 *
 * Order of precedence: a valid envelope; else a valid envelope in the
 * localStorage mirror; else legacy flat keys (migrated once, idempotently);
 * else empty. A corrupt envelope is preserved verbatim under CORRUPT_KEY for
 * diagnostics and the learner starts from a clean, recoverable state.
 */
export async function loadPersistedState(): Promise<LoadOutcome> {
  const raw = await storage.load();
  if (raw !== null) {
    const result = parseBackup(raw);
    if (result.ok) return { state: result.state, status: 'ok' };
    await preserveCorrupt(raw);
    return { state: null, status: 'corrupt' };
  }

  const legacy = await loadLegacyState();
  if (legacy) {
    await storage.save(JSON.stringify(legacy));
    await removeLegacyKeys();
    return { state: legacy, status: 'migrated' };
  }

  return { state: null, status: 'empty' };
}

/**
 * Save the combined learner state. The envelope always carries the full
 * progress + engagement snapshot, so writes are batched rather than being
 * made per store.
 */
export async function saveLearnerState(): Promise<void> {
  if (!bound) return;
  const progress = bound.getProgress();
  const engagement = bound.getEngagement();
  const profile = bound.getProfile();
  const state: PersistedLearnerState = {
    format: LEARNER_FORMAT,
    schemaVersion: LEARNER_SCHEMA_VERSION,
    savedAt: new Date().toISOString(),
    contentVersion: bound.contentVersion,
    progress,
    engagement,
    ...(profile ? { profile } : {}),
  };
  await storage.save(JSON.stringify(state));
}

/**
 * Erase everything learner-related: the envelope, the legacy flat keys, any
 * preserved corrupt copy, and the in-progress mock session.
 */
export async function clearLearnerState(): Promise<void> {
  await storage.clear();
  await idbRemove(CORRUPT_KEY);
  lsRemove(CORRUPT_KEY);
  await removeLegacyKeys();
  clearMockSession();
}

/* -------------------------------------------------------- legacy migration */

/**
 * Read the pre-abstraction flat keys (IndexedDB first, then localStorage, the
 * same fallback order the old code used) and build the current envelope.
 */
async function loadLegacyState(): Promise<PersistedLearnerState | null> {
  const [progress, engagement] = await Promise.all([
    readLegacyValue(LEGACY_PROGRESS_KEY),
    readLegacyValue(LEGACY_ENGAGEMENT_KEY),
  ]);
  if (!progress && !engagement) return null;
  return {
    format: LEARNER_FORMAT,
    schemaVersion: LEARNER_SCHEMA_VERSION,
    savedAt: new Date().toISOString(),
    contentVersion: currentContentVersion,
    progress: progress ? normaliseProgress(progress) : emptyProgress(),
    engagement: engagement ? normaliseEngagement(engagement) : emptyEngagement(),
  };
}

/** IndexedDB stored the object; localStorage stored its JSON. */
async function readLegacyValue(key: string): Promise<unknown | null> {
  const fromIdb = await idbRead<unknown>(key);
  if (fromIdb !== null) return fromIdb;
  const raw = lsRead(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** Only ever called after the new envelope has been written successfully. */
async function removeLegacyKeys(): Promise<void> {
  await Promise.all([
    idbRemove(LEGACY_PROGRESS_KEY),
    idbRemove(LEGACY_ENGAGEMENT_KEY),
  ]);
  lsRemove(LEGACY_PROGRESS_KEY);
  lsRemove(LEGACY_ENGAGEMENT_KEY);
}

/* ------------------------------------------------------------ corruption */

/**
 * Preserve the corrupt value for diagnostics. The learner starts fresh, but
 * the original bytes are kept until the next successful load or reset.
 */
async function preserveCorrupt(raw: string): Promise<void> {
  await idbWrite(CORRUPT_KEY, raw);
  lsWrite(CORRUPT_KEY, raw);
}

/** Whether a previously unreadable payload is still being kept. */
export function hasPreservedCorrupt(): boolean {
  return lsRead(CORRUPT_KEY) !== null;
}

/* -------------------------------------------------------- backup / restore */

/** Serialise the current state as a backup file body. */
export function buildBackupJson(
  progress: Progress,
  engagement: Engagement,
  contentVersionOverride?: string,
  profile?: LearnerProfile,
): string {
  const state: PersistedLearnerState = {
    format: LEARNER_FORMAT,
    schemaVersion: LEARNER_SCHEMA_VERSION,
    savedAt: new Date().toISOString(),
    contentVersion: contentVersionOverride ?? currentContentVersion,
    progress,
    engagement,
    ...(profile ? { profile } : {}),
  };
  return JSON.stringify(state, null, 2);
}

/**
 * Validate a backup file, then persist it, replacing the current state.
 * Returns the parsed state so the caller can hydrate the application stores.
 */
export async function restoreBackup(json: string): Promise<ParseResult> {
  const result = parseBackup(json);
  if (!result.ok) return result;
  await storage.save(JSON.stringify(result.state));
  return result;
}

/** Remove the corrupt copy once a valid state has been restored. */
export async function discardPreservedCorrupt(): Promise<void> {
  await idbRemove(CORRUPT_KEY);
  lsRemove(CORRUPT_KEY);
}