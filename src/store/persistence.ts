import { get as idbGet, set as idbSet, del as idbDel } from 'idb-keyval';
import type { Progress } from '@/engine/learning/types';
import { PROGRESS_VERSION, emptyProgress } from '@/engine/learning/types';
import type { MockSession } from '@/engine/exam/mockTest';

/**
 * Local-only persistence. No account, no server, no network.
 *
 * Progress lives in IndexedDB (room to grow, survives large histories).
 * The in-flight mock exam additionally mirrors to localStorage because that
 * write is synchronous: an unexpected refresh mid-test must not lose answers,
 * and an IndexedDB write may not have flushed in time.
 */

const PROGRESS_KEY = 'ns-class7:progress:v1';
const MOCK_KEY = 'ns-class7:mock-session:v1';

function hasLocalStorage(): boolean {
  try {
    return typeof localStorage !== 'undefined';
  } catch {
    return false;
  }
}

export async function loadProgress(): Promise<Progress> {
  try {
    const stored = await idbGet<Progress>(PROGRESS_KEY);
    if (stored && stored.version === PROGRESS_VERSION) return stored;
    if (stored) return migrate(stored);
  } catch {
    // IndexedDB can be unavailable in private-browsing modes; fall through.
  }

  if (hasLocalStorage()) {
    try {
      const raw = localStorage.getItem(PROGRESS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Progress;
        return parsed.version === PROGRESS_VERSION ? parsed : migrate(parsed);
      }
    } catch {
      // Corrupt payload — start clean rather than crashing the app.
    }
  }
  return emptyProgress();
}

export async function saveProgress(progress: Progress): Promise<void> {
  try {
    await idbSet(PROGRESS_KEY, progress);
  } catch {
    if (hasLocalStorage()) {
      try {
        localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
      } catch {
        // Storage full or blocked. The session still works in memory.
      }
    }
  }
}

export async function clearProgress(): Promise<void> {
  try {
    await idbDel(PROGRESS_KEY);
  } catch {
    /* ignore */
  }
  if (hasLocalStorage()) {
    try {
      localStorage.removeItem(PROGRESS_KEY);
    } catch {
      /* ignore */
    }
  }
}

/** Drop the in-flight mock exam (part of a full reset of learner data). */
export function clearMockSession(): void {
  if (!hasLocalStorage()) return;
  try {
    localStorage.removeItem(MOCK_KEY);
  } catch {
    /* ignore */
  }
}

/** Synchronous so an in-flight exam survives an abrupt reload. */
export function saveMockSession(session: MockSession | null): void {
  if (!hasLocalStorage()) return;
  try {
    if (session === null) localStorage.removeItem(MOCK_KEY);
    else localStorage.setItem(MOCK_KEY, JSON.stringify(session));
  } catch {
    /* ignore */
  }
}

export function loadMockSession(): MockSession | null {
  if (!hasLocalStorage()) return null;
  try {
    const raw = localStorage.getItem(MOCK_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as MockSession;
    if (!Array.isArray(parsed.sections)) return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Forward-migration hook.
 *
 * Older payloads are accepted and normalised rather than discarded, so a
 * schema change does not silently wipe a learner's history.
 */
function migrate(old: Partial<Progress>): Progress {
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
