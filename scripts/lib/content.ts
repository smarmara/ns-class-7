import { access, readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const QUESTIONS_DIR = path.join(ROOT, 'data', 'questions');
export const MANIFEST_PATH = path.join(ROOT, 'data', 'sources', 'source-manifest.json');
export const SNAPSHOT_DIR = path.join(ROOT, 'data', 'sources', 'snapshots');
export const EXAM_CONFIG_PATH = path.join(ROOT, 'data', 'exam-config', 'class7.json');
export const LEGAL_STATUS_PATH = path.join(ROOT, 'data', 'exam-config', 'legal-status.json');
export const SIGN_META_PATH = path.join(ROOT, 'data', 'signs', 'sign-meta.json');
export const SIGN_ART_PATH = path.join(ROOT, 'src', 'signs', 'registry.tsx');

export interface LoadedQuestion {
  /** Question file the record came from, for error messages. */
  file: string;
  [key: string]: unknown;
}

export async function readJson<T>(file: string): Promise<T> {
  return JSON.parse(await readFile(file, 'utf8')) as T;
}

export async function fileExists(file: string): Promise<boolean> {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

/** Path of the normalized-content snapshot for a source id. */
export function snapshotPath(sourceId: string): string {
  return path.join(SNAPSHOT_DIR, `${sourceId}.txt`);
}

export async function loadQuestions(): Promise<LoadedQuestion[]> {
  const files = (await readdir(QUESTIONS_DIR)).filter((f) => f.endsWith('.json')).sort();
  const out: LoadedQuestion[] = [];
  for (const file of files) {
    const parsed = await readJson<Record<string, unknown>[]>(path.join(QUESTIONS_DIR, file));
    if (!Array.isArray(parsed)) {
      throw new Error(`${file} must contain a JSON array of questions`);
    }
    for (const q of parsed) out.push({ ...q, file });
  }
  return out;
}

/**
 * Sign ids that actually have artwork.
 *
 * Read by regex rather than by importing the TSX, so the validator stays a
 * plain data check with no React or bundler involved.
 */
export async function loadSignArtIds(): Promise<Set<string>> {
  const src = await readFile(SIGN_ART_PATH, 'utf8');
  const body = src.slice(src.indexOf('SIGN_ART'));
  const ids = new Set<string>();
  // Matches both `'kebab-id':` and bare `identifier:` keys at object depth 1.
  for (const match of body.matchAll(/^\s{2}(?:'([a-z0-9-]+)'|([a-zA-Z][a-zA-Z0-9]*)):\s/gm)) {
    ids.add(match[1] ?? match[2]!);
  }
  return ids;
}

export function daysSince(isoDate: string, now = new Date()): number {
  const then = new Date(isoDate);
  return Math.floor((now.getTime() - then.getTime()) / 86_400_000);
}

/** Normalise question text for near-duplicate detection. */
export function normaliseText(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\b(a|an|the|you|your|is|are|of|to|in|on|at|and|or|what|which|does|do)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Dice coefficient over word bigrams: cheap and good enough for duplicates. */
export function similarity(a: string, b: string): number {
  const bigrams = (s: string) => {
    const words = s.split(' ').filter(Boolean);
    const out = new Set<string>();
    for (let i = 0; i < words.length - 1; i++) out.add(`${words[i]} ${words[i + 1]}`);
    return out;
  };
  const A = bigrams(a);
  const B = bigrams(b);
  if (A.size === 0 || B.size === 0) return a === b ? 1 : 0;
  let shared = 0;
  for (const x of A) if (B.has(x)) shared++;
  return (2 * shared) / (A.size + B.size);
}
