/**
 * Official source change detector.
 *
 * Fetches every source in the manifest, normalises it to comparable text,
 * hashes it, and compares against the recorded hash AND against the stored
 * normalized-content snapshot (data/sources/snapshots/<source-id>.txt).
 *
 * It deliberately does NOT rewrite any question. A government page changing is
 * a signal for a human to read a diff, not a licence for a crawler to edit
 * what a learner is taught. On a detected change the tool:
 *   1. renders a genuine old-versus-new diff of the normalized text;
 *   2. lists the questions that depend on the changed source so a maintainer
 *      can mark them under_review;
 *   3. writes a readable change report to .sources/reports/;
 *   4. records the new hash (keeping the old as previousHash) and the new
 *      snapshot — only when run with --accept.
 *
 * Snapshots are written automatically only for sources whose content is
 * UNCHANGED (the hash matches), where storing the snapshot simply records the
 * baseline. A changed or first-seen source is never snapshotted without
 * --accept, so the review artifact is never polluted by unreviewed bytes.
 *
 * Usage:
 *   pnpm sources:check              fetch, compare, report (read-only)
 *   pnpm sources:check --accept     also write the new hashes + snapshots
 *   pnpm sources:check --ci         exit non-zero when anything changed
 *   pnpm sources:check --only=<id>  restrict to one source
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import {
  MANIFEST_PATH,
  ROOT,
  fileExists,
  loadQuestions,
  readJson,
  snapshotPath,
} from './lib/content';
import { unifiedDiff } from './lib/diff';
import type { ManifestSource, Question, SourceManifest } from '../src/content/types';

const REPORT_DIR = path.join(ROOT, '.sources', 'reports');

const args = process.argv.slice(2);
const ACCEPT = args.includes('--accept');
const CI = args.includes('--ci');
const ONLY = args.find((a) => a.startsWith('--only='))?.slice('--only='.length);

const USER_AGENT =
  'Mozilla/5.0 (compatible; ns-class7-study source checker; +https://example.invalid/about)';

type Outcome = 'unchanged' | 'changed' | 'new' | 'error';

interface CheckResult {
  source: ManifestSource;
  outcome: Outcome;
  hash: string | null;
  previousHash: string | null;
  httpStatus: number | null;
  lastModified: string | null;
  etag: string | null;
  bytes: number;
  error?: string;
  /** Normalized text of the current content, used to maintain snapshots. */
  text: string | null;
  /** Rendered old-vs-new diff, when a previous snapshot exists. */
  diff: string | null;
  /** Whether a previous normalized snapshot was available to diff against. */
  hadSnapshot: boolean;
}

/**
 * Decide what a fetch means for the manifest + snapshot store.
 *
 * Pure so the tests can pin the snapshot lifecycle without making network
 * requests.
 */
export type SnapshotState =
  | { kind: 'unchanged' }
  | { kind: 'baseline-catchup' }
  | { kind: 'new' }
  | { kind: 'changed'; hasPrevious: boolean };

export function classifySnapshot(
  recordedHash: string | null,
  snapshotExists: boolean,
  fetchedHash: string,
): SnapshotState {
  if (recordedHash === null) return { kind: 'new' };
  if (snapshotExists) {
    return recordedHash === fetchedHash
      ? { kind: 'unchanged' }
      : { kind: 'changed', hasPrevious: true };
  }
  // Hash matches but no snapshot was ever stored (e.g. first run after this
  // feature shipped). The bytes are verified identical, so storing them is a
  // baseline capture, not an acceptance of anything new.
  return recordedHash === fetchedHash
    ? { kind: 'baseline-catchup' }
    : { kind: 'changed', hasPrevious: false };
}

/* -------------------------------------------------------------- fetching */

async function fetchSource(source: ManifestSource): Promise<{
  text: string;
  status: number;
  lastModified: string | null;
  etag: string | null;
  bytes: number;
}> {
  const url = source.documentUrl ?? source.url;
  const response = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
      Accept: 'text/html,application/xhtml+xml,application/pdf,*/*',
      'Accept-Language': 'en-CA,en;q=0.9',
    },
    redirect: 'follow',
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText}`);
  }

  const contentType = response.headers.get('content-type') ?? '';
  const buffer = Buffer.from(await response.arrayBuffer());

  const text = contentType.includes('pdf')
    ? await normalisePdf(buffer)
    : normaliseHtml(buffer.toString('utf8'));

  return {
    text,
    status: response.status,
    lastModified: response.headers.get('last-modified'),
    etag: response.headers.get('etag'),
    bytes: buffer.byteLength,
  };
}

/**
 * Reduce an HTML page to the text a reader would see.
 *
 * Scripts, styles, comments and markup are dropped so that a CSS rebuild or a
 * changed analytics tag does not masquerade as a change in the law.
 */
export function normaliseHtml(html: string): string {
  return html
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<\/(p|div|li|tr|h[1-6]|section|article|br)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)))
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n');
}

async function normalisePdf(buffer: Buffer): Promise<string> {
  const { createRequire } = await import('node:module');
  const require = createRequire(import.meta.url);
  const pdfjs = require('pdfjs-dist/legacy/build/pdf.mjs');
  const doc = await pdfjs.getDocument({ data: new Uint8Array(buffer), useSystemFonts: true })
    .promise;

  const pages: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const content = await (await doc.getPage(i)).getTextContent();
    const text = (content.items as { str?: string }[])
      .map((item) => item.str ?? '')
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (text) pages.push(text);
  }
  return pages.join('\n');
}

export function hashText(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}

/* --------------------------------------------------------------- reporting */

function dependentQuestions(sourceId: string, questions: Question[]): Question[] {
  return questions.filter((q) => q.sourceRefs?.some((r) => r.sourceId === sourceId));
}

function outcomeLabel(outcome: Outcome, state: SnapshotState): string {
  if (outcome === 'new') return 'new — first baseline';
  if (outcome === 'changed') return 'CHANGED — review required';
  return state.kind === 'baseline-catchup' ? 'unchanged (snapshot recorded)' : 'unchanged';
}

/* -------------------------------------------------------------------- main */

async function main() {
  const manifest = await readJson<SourceManifest>(MANIFEST_PATH);
  const questions = (await loadQuestions()) as unknown as Question[];

  const sources = ONLY ? manifest.sources.filter((s) => s.id === ONLY) : manifest.sources;
  if (sources.length === 0) {
    console.error(ONLY ? `No source with id "${ONLY}".` : 'No sources in the manifest.');
    process.exit(1);
  }

  console.log(`\nChecking ${sources.length} official source(s)…\n`);

  const results: CheckResult[] = [];

  for (const source of sources) {
    process.stdout.write(`  ${source.id} … `);
    try {
      const fetched = await fetchSource(source);
      const hash = hashText(fetched.text);
      const snapPath = snapshotPath(source.id);
      const hadSnapshot = await fileExists(snapPath);
      const previousText = hadSnapshot ? await readFile(snapPath, 'utf8') : null;

      const state = classifySnapshot(source.contentHash, hadSnapshot, hash);
      const outcome: Outcome = state.kind === 'new' ? 'new' : state.kind === 'changed' ? 'changed' : 'unchanged';

      const diff =
        outcome === 'changed' && previousText !== null ? unifiedDiff(previousText, fetched.text) : null;

      results.push({
        source,
        outcome,
        hash,
        previousHash: source.contentHash,
        httpStatus: fetched.status,
        lastModified: fetched.lastModified,
        etag: fetched.etag,
        bytes: fetched.bytes,
        text: fetched.text,
        diff,
        hadSnapshot,
      });

      console.log(outcomeLabel(outcome, state));
    } catch (err) {
      results.push({
        source,
        outcome: 'error',
        hash: null,
        previousHash: source.contentHash,
        httpStatus: null,
        lastModified: null,
        etag: null,
        bytes: 0,
        text: null,
        diff: null,
        hadSnapshot: false,
        error: err instanceof Error ? err.message : String(err),
      });
      console.log(`ERROR (${err instanceof Error ? err.message : String(err)})`);
    }
  }

  const changed = results.filter((r) => r.outcome === 'changed');
  const brandNew = results.filter((r) => r.outcome === 'new');
  const errors = results.filter((r) => r.outcome === 'error');

  /* -------------------------------------------------- maintain snapshots */

  await mkdir(path.join(ROOT, 'data', 'sources', 'snapshots'), { recursive: true });
  for (const r of results) {
    if (r.outcome === 'error' || r.text === null) continue;
    const shouldWrite = ACCEPT || r.outcome === 'unchanged';
    if (shouldWrite) await writeFile(snapshotPath(r.source.id), r.text, 'utf8');
  }

  /* ---------------------------------------------------------- write report */

  const now = new Date();
  const stamp = now.toISOString().replace(/[:.]/g, '-');
  await mkdir(REPORT_DIR, { recursive: true });
  const reportPath = path.join(REPORT_DIR, `source-check-${stamp}.md`);

  const lines: string[] = [
    `# Source check — ${now.toISOString()}`,
    '',
    `Checked ${results.length} source(s): ${changed.length} changed, ${brandNew.length} new, ${errors.length} error(s).`,
    '',
  ];

  if (changed.length > 0) {
    lines.push('## Changed sources — review required', '');
    for (const r of changed) {
      const dependents = dependentQuestions(r.source.id, questions);
      lines.push(
        `### ${r.source.title}`,
        '',
        `- **id:** \`${r.source.id}\``,
        `- **url:** ${r.source.documentUrl ?? r.source.url}`,
        `- **precedence:** ${r.source.precedence}`,
        `- **previous hash:** \`${r.previousHash ?? '(none)'}\``,
        `- **new hash:** \`${r.hash}\``,
        `- **HTTP Last-Modified:** ${r.lastModified ?? '(not sent)'}`,
        `- **ETag:** ${r.etag ?? '(not sent)'}`,
        '',
        `**${dependents.length} question(s) depend on this source.**`,
        '',
      );
      if (dependents.length > 0) {
        lines.push('| Question | Topic | Status |', '| --- | --- | --- |');
        for (const q of dependents) {
          lines.push(`| \`${q.id}\` | ${q.topic} | ${q.legalStatus} |`);
        }
        lines.push('');
      }
      if (r.diff) {
        lines.push('**Old versus new (normalized content):**', '', '```diff', r.diff, '```', '');
      } else if (!r.hadSnapshot) {
        lines.push(
          'No previous normalized snapshot is stored for this source, so no textual diff can be shown yet.',
          'Accepting this change will record the new snapshot; a future change will then be diffable.',
          '',
        );
      }
      lines.push(
        '**Required action:**',
        '',
        '1. Read the current source and identify what actually changed.',
        '2. If a rule taught by this app changed, set the affected questions above to `legalStatus: "under_review"` with a `reviewReason`, and re-verify each one against the new text.',
        '3. If the change is cosmetic, bump `verifiedAt` on the source only.',
        '4. Re-run `pnpm sources:check --accept` to record the new baseline hash and snapshot.',
        '5. Run `pnpm content:validate` and `pnpm test`.',
        '',
        '---',
        '',
      );
    }
  }

  if (brandNew.length > 0) {
    lines.push(
      '## New baselines',
      '',
      ...brandNew.map((r) => `- \`${r.source.id}\` — first hash recorded: \`${r.hash}\``),
      '',
    );
  }

  if (errors.length > 0) {
    lines.push(
      '## Errors',
      '',
      ...errors.map((r) => `- \`${r.source.id}\` — ${r.error}`),
      '',
      'A source that cannot be fetched is not evidence that it is unchanged. Re-run before relying on this report.',
      '',
    );
  }

  if (changed.length === 0 && errors.length === 0 && brandNew.length === 0) {
    lines.push('All monitored sources are unchanged.', '');
  }

  await writeFile(reportPath, lines.join('\n'), 'utf8');

  /* ------------------------------------------------------ update manifest */

  if (ACCEPT) {
    for (const r of results) {
      if (r.outcome === 'error' || r.hash === null) continue;
      const source = manifest.sources.find((s) => s.id === r.source.id)!;
      if (r.outcome === 'changed') source.previousHash = source.contentHash;
      source.contentHash = r.hash;
      source.http = { lastModified: r.lastModified, etag: r.etag };
      // verifiedAt is deliberately NOT touched: a hash matching proves the
      // bytes are the same, not that a human has re-read the rule.
    }
    await writeFile(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
    console.log('\nManifest updated with new hashes.');
  }

  /* ------------------------------------------------------------- summary */

  console.log('\n' + '='.repeat(64));
  console.log(`Changed:   ${changed.length}`);
  console.log(`New:       ${brandNew.length}`);
  console.log(`Unchanged: ${results.length - changed.length - brandNew.length - errors.length}`);
  console.log(`Errors:    ${errors.length}`);
  console.log(`\nReport written to ${path.relative(ROOT, reportPath)}`);

  if (changed.length > 0) {
    console.log('\nSources changed. Questions that depend on them:');
    for (const r of changed) {
      const dependents = dependentQuestions(r.source.id, questions);
      console.log(`  ${r.source.id}: ${dependents.map((q) => q.id).join(', ') || '(none)'}`);
    }
    console.log('\nNo question has been modified. Review the diff in the report before changing content.');
  }

  if (!ACCEPT && (changed.length > 0 || brandNew.length > 0)) {
    console.log('\nRe-run with --accept to record the new hashes and snapshots once you have reviewed them.');
  }

  if (CI && (changed.length > 0 || errors.length > 0)) process.exit(2);
}

/**
 * Only fetch when this file is the process entry point. The normalisation,
 * hashing and snapshot-classification helpers above are imported by the test
 * suite, which must never make a network request.
 */
const isEntryPoint =
  typeof process !== 'undefined' &&
  Boolean(process.argv[1]) &&
  /sources-check\.(ts|js|mjs)$/.test(process.argv[1]!);

if (isEntryPoint) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}