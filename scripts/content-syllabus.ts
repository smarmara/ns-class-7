/**
 * Syllabus coverage audit.
 *
 * `content:coverage` answers "what is in the bank". This answers the harder
 * question: **does the bank cover what the official test actually examines?**
 *
 * The Province's Class 7 page names the Driver's Handbook as the study
 * material, so the Handbook is the syllabus. Every question in this project
 * cites the source it came from, down to a chapter and page, so that citation
 * trail can be inverted: enumerate the pages each Handbook chapter spans, mark
 * the ones some question cites, and the remainder is the uncovered syllabus.
 *
 * Nothing here is inferred from the question text. A page counts as covered
 * only when a question explicitly cites it.
 *
 * Usage: pnpm content:syllabus
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  EXAM_CONFIG_PATH,
  MANIFEST_PATH,
  ROOT,
  SIGN_FIDELITY_PATH,
  loadQuestions,
  readJson,
  snapshotPath,
} from './lib/content';
import { ALL_TOPICS, RULES_TOPICS, SIGNS_TOPICS, TOPIC_LABELS } from '../src/content/types';
import type { ExamConfig, SourceManifest, Topic } from '../src/content/types';

const REPORT_DIR = path.join(ROOT, 'reports');

/** Handbook chapters that make up the syllabus, in order. */
const HANDBOOK_CHAPTERS = [
  { id: 'ns-handbook-ch1', number: 1, title: 'Licensing and the Graduated Licence' },
  { id: 'ns-handbook-ch2', number: 2, title: 'Rules of the Road' },
  { id: 'ns-handbook-ch3', number: 3, title: 'Signs, Pavement Markings and Work Zones' },
  { id: 'ns-handbook-ch4', number: 4, title: 'Safe Driving' },
  { id: 'ns-handbook-ch5', number: 5, title: 'Adverse Driving Conditions' },
  { id: 'ns-handbook-ch6', number: 6, title: 'Driving and Impairment' },
  { id: 'ns-handbook-ch7', number: 7, title: 'Vehicle Registration and Insurance', scopeExcluded: true, scopeNote: 'Owner administration — not Class 7 driver knowledge' },
  { id: 'ns-handbook-ch8', number: 8, title: 'Motorcycles', scopeExcluded: true, scopeNote: 'Motorcycle-rider-specific — separate licence/test pathway' },
] as const;

/** A topic with fewer than this many questions is called out as thin. */
const THIN_TOPIC = 5;

interface ChapterPages {
  id: string;
  number: number;
  title: string;
  first: number;
  last: number;
  pages: number[];
  text: string;
  scopeExcluded?: boolean;
  scopeNote?: string;
}

/**
 * The page range a chapter spans.
 *
 * The snapshots are plain text with the printed page numbers left in, so the
 * chapter's range is the longest run of consecutive integers appearing in it.
 * Body text contains stray numbers ("16 correctly"), but those do not form
 * long consecutive runs, so the longest run is reliably the pagination.
 */
function pageRangeOf(text: string): { first: number; last: number } | null {
  const present = new Set<number>();
  for (const match of text.matchAll(/\b(\d{1,3})\b/g)) {
    const n = Number(match[1]);
    if (n > 0 && n < 250) present.add(n);
  }
  const sorted = [...present].sort((a, b) => a - b);
  let best: number[] = [];
  let run: number[] = [];
  for (const n of sorted) {
    run = run.length > 0 && n === run[run.length - 1]! + 1 ? [...run, n] : [n];
    if (run.length > best.length) best = run;
  }
  if (best.length < 5) return null;
  return { first: best[0]!, last: best[best.length - 1]! };
}

/**
 * A short preview of what sits on an uncited page.
 *
 * The snapshots have no reliable per-page delimiter — the running head differs
 * between chapters and is missing from some — so the position is estimated by
 * assuming pages are roughly even in length. It is a hint to help a maintainer
 * find the spot in the Handbook, never evidence on its own, and is labelled as
 * approximate in the report.
 */
function previewPage(chapter: ChapterPages, page: number): string {
  const span = chapter.last - chapter.first + 1;
  const index = page - chapter.first;
  if (span <= 0 || index < 0) return '';
  const start = Math.floor((index / span) * chapter.text.length);
  const slice = chapter.text.slice(start, start + 420).replace(/\s+/g, ' ').trim();
  const trimmed = slice.slice(slice.indexOf(' ') + 1, 200);
  return trimmed.length > 0 ? `${trimmed}…` : '';
}

function pct(part: number, whole: number): number {
  return whole === 0 ? 0 : Math.round((part / whole) * 100);
}

async function main(): Promise<void> {
  const [questions, manifest, exam, fidelity] = await Promise.all([
    loadQuestions(),
    readJson<SourceManifest>(MANIFEST_PATH),
    readJson<ExamConfig>(EXAM_CONFIG_PATH),
    readJson<{ signs: Record<string, { designation?: string; status: string }> }>(
      SIGN_FIDELITY_PATH,
    ),
  ]);

  type Q = {
    id: string;
    topic: Topic;
    type: string;
    subtopic?: string;
    difficulty?: string;
    legalStatus?: string;
    signId?: string;
    choiceSignIds?: string[];
    sourceRefs?: { sourceId: string; chapter?: string; page?: string }[];
  };
  const bank = questions as unknown as Q[];
  const active = bank.filter((q) => q.legalStatus === 'current');

  /* ------------------------------------------------ handbook page coverage */

  const chapters: ChapterPages[] = [];
  for (const chapter of HANDBOOK_CHAPTERS) {
    const text = await readFile(snapshotPath(chapter.id), 'utf8').catch(() => '');
    if (!text) continue;
    const range = pageRangeOf(text);
    if (!range) continue;
    chapters.push({
      ...chapter,
      first: range.first,
      last: range.last,
      pages: Array.from({ length: range.last - range.first + 1 }, (_, i) => range.first + i),
      text,
    });
  }

  /** Pages cited by at least one question, per chapter id. */
  const citedPages = new Map<string, Map<number, string[]>>();
  for (const question of bank) {
    for (const ref of question.sourceRefs ?? []) {
      if (!ref.page) continue;
      for (const page of ref.page.matchAll(/\d{1,3}/g)) {
        const n = Number(page[0]);
        const chapterMap = citedPages.get(ref.sourceId) ?? new Map<number, string[]>();
        chapterMap.set(n, [...(chapterMap.get(n) ?? []), question.id]);
        citedPages.set(ref.sourceId, chapterMap);
      }
    }
  }

  /* ------------------------------------------------------------- assemble */

  const lines: string[] = [];
  const push = (s = '') => lines.push(s);

  push('# Syllabus coverage audit');
  push();
  push(
    `Generated ${new Date().toISOString().slice(0, 10)} by \`pnpm content:syllabus\`. ` +
      'This checks the question bank against the official syllabus rather than against itself.',
  );
  push();
  push(
    'The Province\'s Class 7 knowledge-test page states that the Driver\'s Handbook is what the ' +
      'test is drawn from, so the Handbook is treated as the syllabus here. Coverage is measured ' +
      'from the citation each question already carries — a page counts as covered only when a ' +
      'question explicitly cites it, never because the wording looks similar.',
  );
  push();

  /* 1. Official format conformance */
  push('## 1. Official test format');
  push();
  push('| Part | Questions | To pass | This app |');
  push('| --- | ---: | ---: | --- |');
  for (const section of exam.sections) {
    const pool = active.filter((q) =>
      section.questionType === 'sign' ? q.type === 'sign' : q.type !== 'sign',
    );
    push(
      `| ${section.name} | ${section.questionCount} | ${section.passingCorrect} | ` +
        `${pool.length} in the pool (${(pool.length / section.questionCount).toFixed(1)}× a full test) |`,
    );
  }
  push();
  push(
    `Each part is passed independently (\`sectionsPassIndependently: ${exam.sectionsPassIndependently}\`), ` +
      'matching the official rule that only the failed part is retaken. These figures come from ' +
      '`data/exam-config/class7.json`, which is itself derived from the official page.',
  );
  push();

  /* 2. Handbook coverage */
  push('## 2. Handbook coverage, chapter by chapter');
  push();
  push('| Ch | Title | Pages | Cited | Coverage | Questions citing it | Scope |');
  push('| ---: | --- | :---: | ---: | ---: | ---: | --- |');

  let totalPages = 0;
  let totalCited = 0;
  for (const chapter of chapters) {
    const cited = citedPages.get(chapter.id) ?? new Map<number, string[]>();
    const within = [...cited.keys()].filter((p) => p >= chapter.first && p <= chapter.last);
    const citing = new Set<string>();
    for (const [page, ids] of cited) {
      if (page >= chapter.first && page <= chapter.last) ids.forEach((id) => citing.add(id));
    }
    // Only count pages for chapters that are in Class 7 scope
    if (!('scopeExcluded' in chapter && chapter.scopeExcluded)) {
      totalPages += chapter.pages.length;
      totalCited += within.length;
    }
    const scopeLabel = 'scopeExcluded' in chapter && chapter.scopeExcluded ? chapter.scopeNote : 'In Class 7 scope';
    push(
      `| ${chapter.number} | ${chapter.title} | ${chapter.first}–${chapter.last} | ` +
        `${within.length}/${chapter.pages.length} | ${pct(within.length, chapter.pages.length)}% | ${citing.size} | ${scopeLabel} |`,
    );
  }
  push();
  push(
    `Overall: **${totalCited} of ${totalPages} Handbook pages (${pct(totalCited, totalPages)}%)** are ` +
      'cited by at least one question. Chapters 7 and 8 are intentionally outside Class 7 assessment scope — see below.',
  );
  push();
  push(
    '### Scope exclusions\n\n' +
    'Chapters 7 (Vehicle Registration and Insurance) and 8 (Motorcycles) are part of the Driver\'s Handbook but are **not** part of the Class 7 knowledge test scope:\n\n' +
    '- **Chapter 7** covers vehicle registration, insurance, and ownership administration — these are owner responsibilities, not driver knowledge for operating a vehicle safely.\n' +
    '- **Chapter 8** covers motorcycle operation — Nova Scotia has a separate motorcycle learner licence and knowledge test pathway.\n\n' +
    'Motorist-facing motorcycle awareness (e.g., full-lane entitlement, visibility, following distance) is covered in Chapter 2 and assessed in the *Sharing the road* topic.',
  );
  push();

  // Chapter ranges are detected per snapshot, so consecutive chapters can
  // disagree at their shared boundary. Reporting that honestly is better than
  // presenting a page total that quietly double-counts.
  const boundaryNotes: string[] = [];
  for (let i = 1; i < chapters.length; i += 1) {
    const previous = chapters[i - 1]!;
    const current = chapters[i]!;
    if (current.first <= previous.last) {
      boundaryNotes.push(
        `chapters ${previous.number} and ${current.number} both claim pages ` +
          `${current.first}–${previous.last}`,
      );
    } else if (current.first > previous.last + 1) {
      boundaryNotes.push(
        `no chapter claims page(s) ${previous.last + 1}–${current.first - 1}`,
      );
    }
  }
  if (boundaryNotes.length > 0) {
    push(
      `Boundary detection is imperfect where chapters meet: ${boundaryNotes.join('; ')}. ` +
        'The page total is affected by a page or two as a result.',
    );
  }
  push();
  push(
    'A page with no citation is not automatically a gap — the Handbook contains contents pages, ' +
      'full-page illustrations and administrative material that carry nothing testable. The list ' +
      'below exists so a maintainer can judge each one rather than assume.',
  );
  push();

  /* 3. Uncited pages */
  push('## 3. Uncited pages');
  push();
  push(
    'Page previews are **approximate** — the snapshots have no reliable per-page delimiter, so the ' +
      'text is located by proportional position. Treat a preview as a pointer to the right part of ' +
      'the chapter, not as proof of what is on that page.',
  );
  push();
  for (const chapter of chapters) {
    const cited = citedPages.get(chapter.id) ?? new Map<number, string[]>();
    const uncited = chapter.pages.filter((p) => !cited.has(p));
    push(`### Chapter ${chapter.number} — ${chapter.title}`);
    push();
    if (uncited.length === 0) {
      push('Every page is cited by at least one question.');
      push();
      continue;
    }
    push(`${uncited.length} uncited page(s): ${uncited.join(', ')}`);
    push();
    for (const page of uncited) {
      const preview = previewPage(chapter, page);
      if (preview) push(`- **p. ${page}** — ${preview}`);
      else push(`- **p. ${page}**`);
    }
    push();
  }

  /* 4. Topic depth */
  push('## 4. Topic depth and sourcing');
  push();
  push('| Topic | Part | Questions | Subtopics | Difficulty (E/M/H) | Cites |');
  push('| --- | --- | ---: | ---: | :---: | --- |');
  const thin: string[] = [];
  for (const topic of ALL_TOPICS) {
    const inTopic = active.filter((q) => q.topic === topic);
    if (inTopic.length === 0) continue;
    const subtopics = new Set(inTopic.map((q) => q.subtopic).filter(Boolean));
    const easy = inTopic.filter((q) => q.difficulty === 'easy').length;
    const medium = inTopic.filter((q) => q.difficulty === 'medium').length;
    const hard = inTopic.filter((q) => q.difficulty === 'hard').length;
    const sources = new Set<string>();
    for (const q of inTopic) for (const r of q.sourceRefs ?? []) sources.add(r.sourceId);
    const part = (RULES_TOPICS as readonly string[]).includes(topic) ? 'Rules' : 'Signs';
    if (inTopic.length < THIN_TOPIC) thin.push(`${TOPIC_LABELS[topic]} (${inTopic.length})`);
    push(
      `| ${TOPIC_LABELS[topic]} | ${part} | ${inTopic.length} | ${subtopics.size} | ` +
        `${easy}/${medium}/${hard} | ${[...sources].sort().join(', ')} |`,
    );
  }
  push();
  if (thin.length > 0) {
    push(
      `**Thin topics** (fewer than ${THIN_TOPIC} questions): ${thin.join('; ')}. ` +
        'A thin topic is not necessarily wrong — some are genuinely small — but it limits how ' +
        'much a mock test can vary, and it is what keeps these topics off the mastery ladder.',
    );
    push();
  }

  /* 5. Road signs */
  push('## 5. Road-sign coverage');
  push();
  const signQuestions = active.filter((q) => q.type === 'sign');
  const signIdsUsed = new Set<string>();
  for (const q of signQuestions) {
    if (q.signId) signIdsUsed.add(q.signId);
    for (const id of q.choiceSignIds ?? []) signIdsUsed.add(id);
  }
  const fidelityIds = Object.keys(fidelity.signs);
  const withDesignation = fidelityIds.filter((id) => fidelity.signs[id]?.designation);
  const unusedArtwork = fidelityIds.filter((id) => !signIdsUsed.has(id));

  push(`- **${signQuestions.length}** active sign questions across ${SIGNS_TOPICS.length} sign topics.`);
  push(`- **${signIdsUsed.size}** distinct sign visuals are reachable from a question.`);
  push(
    `- The artwork registry holds **${fidelityIds.length}** wired signs ` +
      `(${withDesignation.length} on official Schedule crops).`,
  );
  if (unusedArtwork.length > 0) {
    push(
      `- **${unusedArtwork.length}** registered sign(s) are not used by any question: ` +
        `${unusedArtwork.join(', ')}.`,
    );
  }
  push();
  push('| Sign topic | Questions | Distinct signs shown |');
  push('| --- | ---: | ---: |');
  for (const topic of SIGNS_TOPICS) {
    const inTopic = signQuestions.filter((q) => q.topic === topic);
    if (inTopic.length === 0) continue;
    const ids = new Set<string>();
    for (const q of inTopic) {
      if (q.signId) ids.add(q.signId);
      for (const id of q.choiceSignIds ?? []) ids.add(id);
    }
    push(`| ${TOPIC_LABELS[topic]} | ${inTopic.length} | ${ids.size} |`);
  }
  push();

  /* 6. Source health */
  push('## 6. Source usage');
  push();
  const perSource = new Map<string, number>();
  for (const q of bank) {
    for (const r of q.sourceRefs ?? []) perSource.set(r.sourceId, (perSource.get(r.sourceId) ?? 0) + 1);
  }
  push('| Source | Citations | In manifest |');
  push('| --- | ---: | :---: |');
  const manifestIds = new Set(manifest.sources.map((s) => s.id));
  for (const [id, count] of [...perSource.entries()].sort((a, b) => b[1] - a[1])) {
    push(`| ${id} | ${count} | ${manifestIds.has(id) ? 'yes' : '**NO**'} |`);
  }
  const uncitedSources = manifest.sources.filter((s) => !perSource.has(s.id));
  push();
  if (uncitedSources.length > 0) {
    push(
      `**${uncitedSources.length} tracked source(s) are never cited by a question**: ` +
        `${uncitedSources.map((s) => s.id).join(', ')}. These are watched for legal change ` +
        'rather than quoted, which is expected for the Traffic Safety Act trackers.',
    );
    push();
  }

  /* 7. What to do next */
  push('## 7. What this audit does not prove');
  push();
  push(
    '- A cited page is not necessarily *well* covered — one question can cite a page that holds ' +
      'a dozen testable facts. Depth is judged by the topic table above, not by page coverage.',
  );
  push(
    '- The Handbook is the syllabus, but the official question bank is not public. Nothing here ' +
      'can show how closely this bank resembles the real test, and it should not be read that way.',
  );
  push(
    '- Question *quality* is a separate concern; see `pnpm content:quality` for authoring and ' +
      'choice-construction warnings.',
  );
  push();

  await mkdir(REPORT_DIR, { recursive: true });
  const out = path.join(REPORT_DIR, 'syllabus-coverage.md');
  await writeFile(out, `${lines.join('\n')}\n`, 'utf8');

  console.log(`Wrote ${path.relative(ROOT, out)}`);
  console.log(`Handbook pages cited: ${totalCited}/${totalPages} (${pct(totalCited, totalPages)}%)`);
  console.log(`Active questions: ${active.length} (${signQuestions.length} sign, ${active.length - signQuestions.length} rules)`);
  if (thin.length > 0) console.log(`Thin topics: ${thin.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
