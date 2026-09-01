import type {
  ExamConfig,
  LegalStatusConfig,
  Question,
  SourceManifest,
  ManifestSource,
  Topic,
} from './types';
import examConfigJson from '@data/exam-config/class7.json';
import legalStatusJson from '@data/exam-config/legal-status.json';
import manifestJson from '@data/sources/source-manifest.json';

export * from './types';
export * from './signs';
export * from './learner-signs';
export * from './sign-variants';

export const examConfig = examConfigJson as ExamConfig;
export const legalStatus = legalStatusJson as LegalStatusConfig;
export const sourceManifest = manifestJson as unknown as SourceManifest;

/**
 * Every question file in data/questions is picked up automatically, so adding
 * a topic file needs no code change.
 */
const modules = import.meta.glob<{ default: Question[] }>('@data/questions/*.json', {
  eager: true,
});

const allQuestionsRaw: Question[] = Object.keys(modules)
  .sort()
  .flatMap((path) => modules[path]!.default);

/**
 * The pool the learner is ever shown.
 *
 * Only `current` questions written against a law version that is actually in
 * force are served. `future` (enacted but not proclaimed), `superseded` and
 * `under_review` questions stay in the bank for the audit trail but never
 * reach a practice session or a mock test.
 */
function isServable(q: Question): boolean {
  if (q.legalStatus !== 'current') return false;
  const version = q.lawVersion ?? legalStatus.activeLawVersion;
  const lv = legalStatus.lawVersions.find((v) => v.id === version);
  if (!lv || !lv.inForce) return false;
  if (q.effectiveTo && new Date(q.effectiveTo) < new Date()) return false;
  return true;
}

export const allQuestions: readonly Question[] = Object.freeze(allQuestionsRaw);

export const activeQuestions: readonly Question[] = Object.freeze(
  allQuestionsRaw.filter(isServable),
);

export const questionsById: ReadonlyMap<string, Question> = new Map(
  allQuestionsRaw.map((q) => [q.id, q]),
);

export function getQuestion(id: string): Question | undefined {
  return questionsById.get(id);
}

export function questionsOfType(type: 'rules' | 'sign'): Question[] {
  return activeQuestions.filter((q) => q.type === type);
}

export function questionsInTopic(topic: Topic): Question[] {
  return activeQuestions.filter((q) => q.topic === topic);
}

/** Topics that actually have servable questions, in curriculum order. */
export function availableTopics(type?: 'rules' | 'sign'): Topic[] {
  const seen = new Set<Topic>();
  for (const q of activeQuestions) {
    if (type && q.type !== type) continue;
    seen.add(q.topic);
  }
  return [...seen];
}

export function getSource(id: string): ManifestSource | undefined {
  return sourceManifest.sources.find((s) => s.id === id);
}

/**
 * The date shown to the learner as "content last verified".
 *
 * This is the OLDEST verification date across the sources that the active
 * question bank actually relies on — not the newest — so the claim is never
 * more confident than the least recently checked source behind it.
 */
export function contentLastVerified(): string {
  const usedSourceIds = new Set<string>();
  for (const q of activeQuestions) {
    for (const ref of q.sourceRefs) usedSourceIds.add(ref.sourceId);
  }
  const dates = [...usedSourceIds]
    .map((id) => getSource(id)?.verifiedAt)
    .filter((d): d is string => Boolean(d))
    .sort();
  return dates[0] ?? examConfig.verifiedAt;
}

/** Sources the active bank depends on, most authoritative first. */
export function sourcesInUse(): ManifestSource[] {
  const used = new Set<string>();
  for (const q of activeQuestions) {
    for (const ref of q.sourceRefs) used.add(ref.sourceId);
  }
  return sourceManifest.sources
    .filter((s) => used.has(s.id))
    .sort((a, b) => a.precedence - b.precedence || a.title.localeCompare(b.title));
}

/** Counts by legal status — surfaced on the Sources page for transparency. */
export function legalStatusCounts(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const q of allQuestionsRaw) {
    counts[q.legalStatus] = (counts[q.legalStatus] ?? 0) + 1;
  }
  return counts;
}
