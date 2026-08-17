/**
 * Question-bank coverage analysis.
 *
 * Produces a topic/subtopic coverage matrix (machine-readable JSON and a
 * readable report) so a maintainer can see at a glance where the bank is thin
 * and where it is saturated.
 *
 * Usage: pnpm content:coverage
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  EXAM_CONFIG_PATH,
  LEGAL_STATUS_PATH,
  MANIFEST_PATH,
  ROOT,
  loadQuestions,
  readJson,
} from './lib/content';
import { ALL_TOPICS, TOPIC_LABELS } from '../src/content/types';
import type { ExamConfig, LegalStatusConfig, SourceManifest } from '../src/content/types';

const REPORT_DIR = path.join(ROOT, 'reports');

interface Counts {
  total: number;
  active: number;
  rules: number;
  signs: number;
  easy: number;
  medium: number;
  hard: number;
  perSubtopic: Record<string, { total: number; active: number }>;
}

async function main() {
  const [raw, manifest, exam, legal] = await Promise.all([
    loadQuestions(),
    readJson<SourceManifest>(MANIFEST_PATH),
    readJson<ExamConfig>(EXAM_CONFIG_PATH),
    readJson<LegalStatusConfig>(LEGAL_STATUS_PATH),
  ]);

  const questions = raw as unknown as (typeof raw[number] & {
    id: string;
    type: 'rules' | 'sign';
    topic: string;
    subtopic?: string;
    difficulty: string;
    legalStatus: string;
    sourceRefs: { sourceId: string }[];
    lawVersion?: string;
  })[];
  const inForce = new Set(legal.lawVersions.filter((v) => v.inForce).map((v) => v.id));
  const active = (q: (typeof questions)[number]) =>
    q.legalStatus === 'current' && inForce.has(q.lawVersion ?? legal.activeLawVersion);

  const topicCounts = new Map<string, Counts>();
  for (const topic of ALL_TOPICS) {
    topicCounts.set(topic, { total: 0, active: 0, rules: 0, signs: 0, easy: 0, medium: 0, hard: 0, perSubtopic: {} });
  }

  const sourceUse = new Map<string, number>();
  const activeIds = new Set<string>();

  for (const q of questions) {
    const entry = topicCounts.get(q.topic);
    if (!entry) continue;
    entry.total++;
    if (active(q)) {
      entry.active++;
      activeIds.add(q.id);
      for (const ref of q.sourceRefs) sourceUse.set(ref.sourceId, (sourceUse.get(ref.sourceId) ?? 0) + 1);
    }
    if (q.type === 'rules') entry.rules++;
    else entry.signs++;
    if (q.difficulty === 'easy') entry.easy++;
    else if (q.difficulty === 'hard') entry.hard++;
    else entry.medium++;

    const sub = q.subtopic ?? '(none)';
    const subEntry = entry.perSubtopic[sub] ?? { total: 0, active: 0 };
    subEntry.total++;
    if (active(q)) subEntry.active++;
    entry.perSubtopic[sub] = subEntry;
  }

  const summary = {
    generatedAt: new Date().toISOString(),
    totalQuestions: questions.length,
    activeQuestions: activeIds.size,
    typeSplit: {
      rules: questions.filter((q) => q.type === 'rules').length,
      signs: questions.filter((q) => q.type === 'sign').length,
      activeRules: questions.filter((q) => q.type === 'rules' && active(q)).length,
      activeSigns: questions.filter((q) => q.type === 'sign' && active(q)).length,
    },
    difficultySplit: {
      easy: questions.filter((q) => q.difficulty === 'easy').length,
      medium: questions.filter((q) => q.difficulty === 'medium').length,
      hard: questions.filter((q) => q.difficulty === 'hard').length,
    },
    mockPools: exam.sections.map((s) => ({
      sectionId: s.id,
      questionType: s.questionType,
      needsPerTest: s.questionCount,
      available: questions.filter((q) => q.type === s.questionType && active(q)).length,
    })),
    topics: [...topicCounts.entries()].map(([topic, counts]) => ({
      topic,
      label: TOPIC_LABELS[topic as keyof typeof TOPIC_LABELS] ?? topic,
      counts,
    })),
    sourceCoverage: [...sourceUse.entries()]
      .map(([sourceId, count]) => ({
        sourceId,
        title: manifest.sources.find((s) => s.id === sourceId)?.title ?? '(unknown)',
        activeQuestionCount: count,
      }))
      .sort((a, b) => b.activeQuestionCount - a.activeQuestionCount),
  };

  await mkdir(REPORT_DIR, { recursive: true });
  const jsonPath = path.join(REPORT_DIR, 'question-coverage.json');
  await writeFile(jsonPath, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');

  /* -------------------------------------------------------- readable report */

  const lines: string[] = ['# Question-bank coverage matrix', ''];
  lines.push(
    `Total **${summary.totalQuestions}** questions, **${summary.activeQuestions}** active (servable to a learner).`,
  );
  lines.push('');
  lines.push(
    `Rules: ${summary.typeSplit.activeRules} active · Signs: ${summary.typeSplit.activeSigns} active.`,
  );
  lines.push('');
  lines.push(
    `Difficulty: ${summary.difficultySplit.easy} easy · ${summary.difficultySplit.medium} medium · ${summary.difficultySplit.hard} hard.`,
  );
  lines.push('');
  lines.push('## Mock-test pools', '');
  for (const pool of summary.mockPools) {
    const ratio = (pool.available / pool.needsPerTest).toFixed(1);
    lines.push(`- **${pool.sectionId}**: ${pool.available} available for ${pool.needsPerTest} per test (${ratio}× the test size).`);
  }
  lines.push('');
  lines.push('## By topic', '');
  lines.push('| Topic | Total | Active | Rules | Signs | Easy | Med | Hard | Subtopics |');
  lines.push('| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |');
  for (const t of summary.topics) {
    const subs = Object.entries(t.counts.perSubtopic).length;
    lines.push(
      `| ${t.label} | ${t.counts.total} | ${t.counts.active} | ${t.counts.rules} | ${t.counts.signs} | ${t.counts.easy} | ${t.counts.medium} | ${t.counts.hard} | ${subs} |`,
    );
  }

  lines.push('', '## By subtopic (active only)', '');
  for (const t of summary.topics) {
    const subs = Object.entries(t.counts.perSubtopic).filter(([, c]) => c.active > 0);
    if (subs.length === 0) continue;
    lines.push(`### ${t.label}`, '');
    lines.push('| Subtopic | Total | Active |', '| --- | ---: | ---: |');
    for (const [sub, c] of subs.sort((a, b) => b[1].active - a[1].active)) {
      lines.push(`| ${sub} | ${c.total} | ${c.active} |`);
    }
    lines.push('');
  }

  lines.push('## Source coverage (active questions citing each source)', '', '| Source | Active questions |', '| --- | ---: |');
  for (const s of summary.sourceCoverage) {
    lines.push(`| ${s.title} | ${s.activeQuestionCount} |`);
  }
  lines.push('');

  const reportPath = path.join(REPORT_DIR, 'question-coverage.md');
  await writeFile(reportPath, lines.join('\n'), 'utf8');

  console.log(`\nWrote ${path.relative(ROOT, jsonPath)} and ${path.relative(ROOT, reportPath)}`);

  const thin = summary.topics.filter(
    (t) => t.counts.active > 0 && t.counts.active < 3,
  );
  if (thin.length > 0) {
    console.log(`\nThin topics (<3 active): ${thin.map((t) => t.topic).join(', ')}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});