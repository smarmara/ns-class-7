import { del as idbDel, get as idbGet, set as idbSet } from 'idb-keyval';
import type { MockSession } from '@/engine/exam/mockTest';

/**
 * Raw device storage. No account, no server, no network.
 *
 * This module owns the lowest-level browser I/O used by the learner-storage
 * layer (see learnerStorage.ts). The in-flight mock exam additionally lives
 * here and is written synchronously to localStorage: an unexpected refresh
 * mid-test must not lose answers, and an IndexedDB write may not have flushed
 * in time.
 *
 * The learner-storage layer is the only consumer of these primitives — UI
 * components never touch storage APIs directly.
 */

export const MOCK_KEY = 'ns-class7:mock-session:v1';

export function hasLocalStorage(): boolean {
  try {
    return typeof localStorage !== 'undefined';
  } catch {
    return false;
  }
}

export async function idbRead<T>(key: string): Promise<T | null> {
  try {
    return (await idbGet<T>(key)) ?? null;
  } catch {
    // IndexedDB can be unavailable in private-browsing modes; fall through.
    return null;
  }
}

export async function idbWrite(key: string, value: unknown): Promise<void> {
  try {
    await idbSet(key, value);
  } catch {
    // Storage full or blocked. The session still works in memory.
  }
}

export async function idbRemove(key: string): Promise<void> {
  try {
    await idbDel(key);
  } catch {
    /* ignore */
  }
}

export function lsRead(key: string): string | null {
  if (!hasLocalStorage()) return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function lsWrite(key: string, value: string): void {
  if (!hasLocalStorage()) return;
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage full or blocked. The session still works in memory.
  }
}

export function lsRemove(key: string): void {
  if (!hasLocalStorage()) return;
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

/** Drop the in-flight mock exam (part of a full reset of learner data). */
export function clearMockSession(): void {
  lsRemove(MOCK_KEY);
}

/** Synchronous so an in-flight exam survives an abrupt reload. */
export function saveMockSession(session: MockSession | null): void {
  if (session === null) lsRemove(MOCK_KEY);
  else lsWrite(MOCK_KEY, JSON.stringify(session));
}

export function loadMockSession(): MockSession | null {
  const raw = lsRead(MOCK_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as MockSession;
    if (!Array.isArray(parsed.sections)) return null;
    return parsed;
  } catch {
    return null;
  }
}