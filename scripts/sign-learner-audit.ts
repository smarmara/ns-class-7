import { existsSync, readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { getSignArtwork } from '../src/signs/artwork';

const ROOT = process.cwd();

interface Approval {
  displayName: string;
  designation?: string;
  assetPath?: string;
  fingerprint: string;
  approvedAt: string;
  status: string;
}

interface Classification {
  scope: 'core' | 'reference' | 'variant' | 'developer-only' | 'source-review';
  hasMeta: boolean;
  inQuiz: boolean;
  category: string;
  displayName: string;
}

interface ScopeData {
  schemaVersion: number;
  generatedAt: string;
  classifications: Record<string, Classification>;
}

interface ApprovalsData {
  schemaVersion: number;
  approvals: Record<string, Approval>;
}

// Load data
const approvalsData: ApprovalsData = JSON.parse(readFileSync(join(ROOT, 'data/signs/visual-approvals.json'), 'utf8'));
const approvals = approvalsData.approvals;
const approvedIds = Object.keys(approvals);

const scopeData: ScopeData = JSON.parse(readFileSync(join(ROOT, 'data/signs/learner-scope.json'), 'utf8'));
const classifications = scopeData.classifications;

interface CategoryData {
  schemaVersion: number;
  taxonomy: { id: string; label: string; blurb: string }[];
  categories: Record<string, string>;
}
const categoryData: CategoryData = JSON.parse(
  readFileSync(join(ROOT, 'data/signs/learner-categories.json'), 'utf8'),
);
const taxonomyIds = categoryData.taxonomy.map((t) => t.id);
const learnerIds = Object.entries(classifications)
  .filter(([, c]) => c.scope === 'core' || c.scope === 'reference')
  .map(([id]) => id);

/*
 * Artwork resolution, through the same resolver the app renders with, so a
 * learner sign that would show the missing-artwork fallback fails the audit
 * instead of quietly reaching the catalogue.
 */
const artworkProblems: string[] = [];
const artworkByKind: Record<string, number> = { crop: 0, shape: 0, svg: 0 };
for (const id of learnerIds) {
  const artwork = getSignArtwork(id);
  if (!artwork) {
    artworkProblems.push(`${id}: no approved artwork resolves`);
    continue;
  }
  artworkByKind[artwork.kind]++;
  if (artwork.kind === 'crop') {
    const file = join(ROOT, 'public', decodeURIComponent(artwork.src));
    if (!existsSync(file)) artworkProblems.push(`${id}: asset missing on disk (${artwork.src})`);
  }
}

// Category assignment: exactly one valid category per learner entry.
const uncategorised: string[] = [];
const unknownCategory: string[] = [];
const categoryCounts = new Map<string, number>(taxonomyIds.map((id) => [id, 0]));
for (const id of learnerIds) {
  const category = categoryData.categories[id];
  if (!category) {
    uncategorised.push(id);
    continue;
  }
  if (!categoryCounts.has(category)) {
    unknownCategory.push(`${id}: ${category}`);
    continue;
  }
  categoryCounts.set(category, categoryCounts.get(category)! + 1);
}
// A sign appears once in the mapping by construction (JSON keys are unique),
// so a duplicate primary assignment can only mean a non-learner id has crept in.
const nonLearnerCategorised = Object.keys(categoryData.categories).filter(
  (id) => !learnerIds.includes(id),
);

// Load questions
const questionDir = join(ROOT, 'data/questions');
const allSignSectionQuestions: string[] = []; // All questions in signs-* files
const questionsWithSignId: string[] = [];   // Questions with a primary signId
const signIdsInQuestions = new Set<string>(); // Distinct signId values

const files = readdirSync(questionDir).filter((f: string) => f.startsWith('signs-'));
for (const file of files) {
  const questions = JSON.parse(readFileSync(join(questionDir, file), 'utf8'));
  for (const q of questions) {
    if (q.type === 'sign') {
      allSignSectionQuestions.push(q.id);
      if (q.signId) {
        questionsWithSignId.push(q.id);
        signIdsInQuestions.add(q.signId);
      }
    }
  }
}

// Summary by scope
const byScope: Record<string, number> = {
  'core': 0,
  'reference': 0,
  'variant': 0,
  'developer-only': 0,
  'source-review': 0
};

for (const c of Object.values(classifications)) {
  byScope[c.scope]++;
}

const learnerCatalogue = byScope['core'] + byScope['reference'];
const coreQuizGaps = Object.entries(classifications)
  .filter(([id, c]) => c.scope === 'core' && !signIdsInQuestions.has(id))
  .map(([id]) => id);

console.log('Sign Learner Audit');
console.log('==================');
console.log('');
console.log('Developer gallery (approved visuals):');
console.log(`  Total approved: ${approvedIds.length}`);
console.log(`  Core Class 7: ${byScope['core']}`);
console.log(`  Reference only: ${byScope['reference']}`);
console.log(`  Variants/supplementary: ${byScope['variant']}`);
console.log(`  Developer only: ${byScope['developer-only']}`);
console.log(`  Source review: ${byScope['source-review']}`);
console.log('');
console.log('Learner catalogue:');
console.log(`  Top-level entries (Core + Reference): ${learnerCatalogue}`);
console.log(`  Grouped variants: ${byScope['variant']}`);
console.log('');
console.log('Sign question bank:');
console.log(`  Active Sign-section questions: ${allSignSectionQuestions.length}`);
console.log(`  Visual-recognition questions (with signId): ${questionsWithSignId.length}`);
console.log(`  Distinct quiz-linked visuals: ${signIdsInQuestions.size}`);
console.log('');
console.log('Artwork resolution:');
console.log(`  Artwork resolved: ${learnerIds.length - artworkProblems.length}/${learnerIds.length}`);
console.log(`    Official Schedule crops: ${artworkByKind.crop}`);
console.log(`    Sign-shape concepts: ${artworkByKind.shape}`);
console.log(`    Registry SVG concepts: ${artworkByKind.svg}`);
console.log(`  Missing learner artwork: ${artworkProblems.length}`);
console.log('');
console.log('Learner categories:');
console.log(`  Uncategorized learner entries: ${uncategorised.length}`);
console.log(`  Duplicate primary category assignments: ${nonLearnerCategorised.length}`);
for (const t of categoryData.taxonomy) {
  console.log(`  ${t.label}: ${categoryCounts.get(t.id)}`);
}
console.log(`  Total categorized: ${[...categoryCounts.values()].reduce((a, b) => a + b, 0)}/${learnerIds.length}`);
console.log('');
console.log('Core assessment:');
console.log(`  Core concepts: ${byScope['core']}`);
console.log(`  Core concepts assessed: ${byScope['core'] - coreQuizGaps.length}`);
console.log(`  Core quiz gaps: ${coreQuizGaps.length}`);
console.log('');
console.log(`Classification total: ${Object.keys(classifications).length}/${approvedIds.length}`);
console.log('');

// Validation checks
let hasErrors = false;

if (Object.keys(classifications).length !== approvedIds.length) {
  console.error('ERROR: Classification count does not match approved inventory');
  hasErrors = true;
}

for (const id of approvedIds) {
  if (!classifications[id]) {
    console.error(`ERROR: Approved visual ${id} lacks classification`);
    hasErrors = true;
  }
}

const validScopes = ['core', 'reference', 'variant', 'developer-only', 'source-review'];
for (const [id, c] of Object.entries(classifications)) {
  if (!validScopes.includes(c.scope)) {
    console.error(`ERROR: ${id} has invalid scope: ${c.scope}`);
    hasErrors = true;
  }
}

for (const problem of artworkProblems) {
  console.error(`ERROR: learner artwork unresolved — ${problem}`);
  hasErrors = true;
}

for (const id of uncategorised) {
  console.error(`ERROR: learner sign ${id} has no learner category`);
  hasErrors = true;
}

for (const entry of unknownCategory) {
  console.error(`ERROR: learner sign uses a category outside the taxonomy — ${entry}`);
  hasErrors = true;
}

for (const id of nonLearnerCategorised) {
  const scope = classifications[id]?.scope ?? 'unknown';
  console.error(`ERROR: ${id} (${scope}) is categorized but is not in the learner catalogue`);
  hasErrors = true;
}

const categorizedTotal = [...categoryCounts.values()].reduce((a, b) => a + b, 0);
if (categorizedTotal !== learnerIds.length) {
  console.error(
    `ERROR: category counts total ${categorizedTotal}, expected ${learnerIds.length}`,
  );
  hasErrors = true;
}

// Check if developer-only signs are in quiz
for (const [id, c] of Object.entries(classifications)) {
  if (c.scope === 'developer-only' && signIdsInQuestions.has(id)) {
    console.error(`ERROR: Developer-only sign ${id} is used in quiz`);
    hasErrors = true;
  }
}

if (hasErrors) {
  console.error('');
  console.error('Audit FAILED with errors');
  process.exit(1);
} else {
  console.log('Audit PASSED');
  console.log('');
  if (coreQuizGaps.length > 0) {
    console.log('Core quiz gaps:');
    for (const id of coreQuizGaps) {
      console.log(`  - ${id}`);
    }
  }
  process.exit(0);
}
