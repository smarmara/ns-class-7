import learnerCategoriesJson from '@data/signs/learner-categories.json';
import learnerScopeJson from '@data/signs/learner-scope.json';
import signMetaJson from '@data/signs/sign-meta.json';
import approvalsJson from '@data/signs/visual-approvals.json';

/**
 * Production learner sign catalogue.
 *
 * Derived from the Phase A learner-scope classification, this module exposes
 * the Core + Reference signs a Class 7 learner should be able to study.
 *
 * It is decoupled from the question bank: the catalogue defines what the
 * learner can study, while the question bank defines what is assessed.
 */

type LearnerScope = 'core' | 'reference' | 'variant' | 'developer-only' | 'source-review';

interface ScopeEntry {
  scope: LearnerScope;
  hasMeta: boolean;
  inQuiz: boolean;
  /** The source/official family this sign belongs to. Not the learner category. */
  category: string;
  displayName: string;
}

interface SignMetaEntry {
  label: string;
  category: string;
  visualDescription: string;
  basis: string;
}

interface ApprovalEntry {
  displayName: string;
  designation?: string;
  assetPath?: string;
}

const scopeData = learnerScopeJson as {
  schemaVersion: number;
  generatedAt: string;
  classifications: Record<string, ScopeEntry>;
};

const signMeta = signMetaJson as {
  description: string;
  signs: Record<string, SignMetaEntry>;
};

const approvals = approvalsJson as {
  schemaVersion: number;
  approvals: Record<string, ApprovalEntry>;
};

const learnerCategoryData = learnerCategoriesJson as {
  schemaVersion: number;
  taxonomy: { id: string; label: string; blurb: string }[];
  categories: Record<string, string>;
};

export type SignScope = 'core' | 'reference';

/** Placeholder category for a sign the mapping has missed. Never valid in production. */
export const UNCATEGORISED = '__uncategorised__';

export interface LearnerSignEntry {
  id: string;
  displayName: string;
  label: string;
  scope: SignScope;
  /**
   * Where the learner should look to find this sign. Navigation only — a sign
   * can be legally Regulatory and sit under Lane Use & Turns here.
   */
  category: string;
  /** How the source classifies the sign. Preserved, never overwritten by the above. */
  officialCategory: string;
  visualDescription?: string;
  basis?: string;
  inQuiz: boolean;
}

/** The learner-facing taxonomy, in the order the catalogue presents it. */
export const LEARNER_TAXONOMY: readonly { id: string; label: string; blurb: string }[] =
  Object.freeze(learnerCategoryData.taxonomy);

/** Every category id the catalogue is allowed to use. */
export const LEARNER_CATEGORY_IDS: readonly string[] = Object.freeze(
  LEARNER_TAXONOMY.map((entry) => entry.id),
);

/** Learner-facing section heading for each category. */
export const LEARNER_CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  LEARNER_TAXONOMY.map((entry) => [entry.id, entry.label]),
);

/** One-line explanation of what a category covers. */
export const LEARNER_CATEGORY_BLURBS: Record<string, string> = Object.fromEntries(
  LEARNER_TAXONOMY.map((entry) => [entry.id, entry.blurb]),
);

/**
 * The learner category for a sign, or undefined if it has none.
 *
 * Deliberately has no fallback. An uncategorised learner sign is a data defect
 * that `signs:learner-audit` and the catalogue tests both fail on, so guessing
 * a category here would only hide it.
 */
export function learnerCategoryFor(signId: string): string | undefined {
  return learnerCategoryData.categories[signId];
}

let _catalogue: readonly LearnerSignEntry[] | undefined;

/**
 * The full learner sign catalogue — Core + Reference entries only.
 *
 * Developer-only and variant signs are excluded. Source-review entries
 * are excluded (currently zero).
 */
export function getLearnerSignCatalogue(): readonly LearnerSignEntry[] {
  if (_catalogue) return _catalogue;

  const entries: LearnerSignEntry[] = [];

  for (const [id, scope] of Object.entries(scopeData.classifications)) {
    if (scope.scope !== 'core' && scope.scope !== 'reference') continue;

    const meta = signMeta.signs[id];
    const approval = approvals.approvals[id];

    entries.push({
      id,
      displayName: scope.displayName ?? approval?.displayName ?? id,
      label: meta?.label ?? scope.displayName ?? approval?.displayName ?? id,
      scope: scope.scope,
      category: learnerCategoryData.categories[id] ?? UNCATEGORISED,
      officialCategory: meta?.category ?? scope.category ?? 'other',
      visualDescription: meta?.visualDescription,
      basis: meta?.basis,
      inQuiz: scope.inQuiz,
    });
  }

  _catalogue = Object.freeze(entries);
  return _catalogue;
}

/**
 * Group learner catalogue entries by category.
 */
export function learnerSignsByCategory(): Map<string, LearnerSignEntry[]> {
  const catalogue = getLearnerSignCatalogue();
  const out = new Map<string, LearnerSignEntry[]>();

  for (const entry of catalogue) {
    const list = out.get(entry.category) ?? [];
    list.push(entry);
    out.set(entry.category, list);
  }

  return out;
}

/**
 * Get categories in display order, only including categories that have entries.
 */
export function learnerCategories(): string[] {
  const byCategory = learnerSignsByCategory();
  return LEARNER_CATEGORY_IDS.filter((cat) => byCategory.has(cat));
}

/** Sign ids in the learner catalogue that have no learner category. */
export function uncategorisedLearnerSigns(): string[] {
  return getLearnerSignCatalogue()
    .filter((entry) => entry.category === UNCATEGORISED)
    .map((entry) => entry.id);
}

/**
 * Count entries by scope.
 */
export function learnerCatalogueCounts(): { core: number; reference: number; total: number } {
  const catalogue = getLearnerSignCatalogue();
  let core = 0;
  let reference = 0;
  for (const entry of catalogue) {
    if (entry.scope === 'core') core++;
    else reference++;
  }
  return { core, reference, total: core + reference };
}
