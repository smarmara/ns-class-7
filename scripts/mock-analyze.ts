/**
 * Mock-exam selection analysis.
 *
 * Simulates many seeded mock tests to measure how well the question pool is
 * exercised: does every question get a fair chance to appear, how long until
 * a learner has seen most of the bank, how much consecutive tests overlap,
 * and what topic/difficulty mix each test delivers.
 *
 * Usage: pnpm mock:analyze
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { EXAM_CONFIG_PATH, LEGAL_STATUS_PATH, ROOT, loadQuestions, readJson } from './lib/content';
import { createMockSession } from '../src/engine/exam/mockTest';
import type { ExamConfig, LegalStatusConfig, Question } from '../src/content/types';

const REPORT_DIR = path.join(ROOT, 'reports');
const SEEDS = 400;

async function main() {
  const [raw, exam, legal] = await Promise.all([
    loadQuestions(),
    readJson<ExamConfig>(EXAM_CONFIG_PATH),
    readJson<LegalStatusConfig>(LEGAL_STATUS_PATH),
  ]);

  const all = raw as unknown as Question[];
  const inForce = new Set(legal.lawVersions.filter((v) => v.inForce).map((v) => v.id));
  const pool = all.filter(
    (q) => q.legalStatus === 'current' && inForce.has(q.lawVersion ?? legal.activeLawVersion),
  );

  const rulesPool = pool.filter((q) => q.type === 'rules');
  const signsPool = pool.filter((q) => q.type === 'sign');
  const rulesIds = new Set(rulesPool.map((q) => q.id));
  const signsIds = new Set(signsPool.map((q) => q.id));

  const appearance = new Map<string, number>();
  const cumulativeSeen = new Map<string, number>(); // id -> first-seen mock index
  const perMock: {
    rulesTopics: Set<string>;
    signTopics: Set<string>;
    rulesDifficulty: { easy: number; medium: number; hard: number };
    signDifficulty: { easy: number; medium: number; hard: number };
  }[] = [];

  const rulesCoverageByMock: number[] = [];
  const signsCoverageByMock: number[] = [];

  const overlapPairs: { rules: number; signs: number }[] = [];
  let prevRules = new Set<string>();
  let prevSigns = new Set<string>();

  for (let seed = 0; seed < SEEDS; seed++) {
    const session = createMockSession(exam, pool, seed);
    const rulesSection = session.sections.find((s) => s.sectionId === 'rules');
    const signsSection = session.sections.find((s) => s.sectionId === 'signs');
    if (!rulesSection || !signsSection) throw new Error('Expected rules and signs sections');

    const ruleIds = new Set(rulesSection.questionIds);
    const signIds = new Set(signsSection.questionIds);
    for (const id of ruleIds) appearance.set(id, (appearance.get(id) ?? 0) + 1);
    for (const id of signIds) appearance.set(id, (appearance.get(id) ?? 0) + 1);
    for (const id of ruleIds) if (!cumulativeSeen.has(id)) cumulativeSeen.set(id, seed);
    for (const id of signIds) if (!cumulativeSeen.has(id)) cumulativeSeen.set(id, seed);

    const rulesQ = rulesSection.questionIds
      .map((id) => rulesPool.find((q) => q.id === id))
      .filter((q): q is Question => Boolean(q));
    const signsQ = signsSection.questionIds
      .map((id) => signsPool.find((q) => q.id === id))
      .filter((q): q is Question => Boolean(q));

    const rd = { easy: 0, medium: 0, hard: 0 };
    for (const q of rulesQ) rd[q.difficulty]++;
    const sd = { easy: 0, medium: 0, hard: 0 };
    for (const q of signsQ) sd[q.difficulty]++;

    perMock.push({
      rulesTopics: new Set(rulesQ.map((q) => q.topic)),
      signTopics: new Set(signsQ.map((q) => q.topic)),
      rulesDifficulty: rd,
      signDifficulty: sd,
    });

    rulesCoverageByMock.push(
      new Set([...cumulativeSeen.keys()].filter((id) => rulesIds.has(id))).size / rulesPool.length,
    );
    signsCoverageByMock.push(
      new Set([...cumulativeSeen.keys()].filter((id) => signsIds.has(id))).size / signsPool.length,
    );

    overlapPairs.push({
      rules: [...ruleIds].filter((id) => prevRules.has(id)).length,
      signs: [...signIds].filter((id) => prevSigns.has(id)).length,
    });
    prevRules = ruleIds;
    prevSigns = signIds;
  }

  const count = (set: Set<string>) => set.size;
  const rulesTopicSpread = perMock.map((m) => count(m.rulesTopics));
  const signTopicSpread = perMock.map((m) => count(m.signTopics));
  const ruleDiffs = perMock.map((m) => m.rulesDifficulty);

  const firstMockToFullCoverage = (cover: number[], target: number) =>
    cover.findIndex((c) => c >= target) === -1 ? null : cover.findIndex((c) => c >= target);

  const appearValues = [...appearance.values()];
  const rulesAppear = [...rulesPool.map((q) => appearance.get(q.id) ?? 0)];
  const signsAppear = [...signsPool.map((q) => appearance.get(q.id) ?? 0)];
  const minA = Math.min(...appearValues);
  const neverSeen = [...rulesIds, ...signsIds].filter((id) => (appearance.get(id) ?? 0) === 0);
  const lowSeen = [...rulesIds, ...signsIds].filter((id) => (appearance.get(id) ?? 0) < 2);

  const summary = {
    generatedAt: new Date().toISOString(),
    seeds: SEEDS,
    poolSizes: { rules: rulesPool.length, signs: signsPool.length },
    appearancePerQuestion: {
      min: minA,
      mean: Math.round((appearValues.reduce((a, b) => a + b, 0) / appearValues.length) * 10) / 10,
      max: Math.max(...appearValues),
      rulesMin: Math.min(...rulesAppear),
      rulesMean: Math.round((rulesAppear.reduce((a, b) => a + b, 0) / rulesAppear.length) * 10) / 10,
      signsMin: Math.min(...signsAppear),
      signsMean: Math.round((signsAppear.reduce((a, b) => a + b, 0) / signsAppear.length) * 10) / 10,
    },
    neverAppeared: neverSeen,
    appearedLessThanTwice: lowSeen,
    mockToCoverRules: {
      '50%': firstMockToFullCoverage(rulesCoverageByMock, 0.5),
      '90%': firstMockToFullCoverage(rulesCoverageByMock, 0.9),
      '100%': firstMockToFullCoverage(rulesCoverageByMock, 1),
    },
    mockToCoverSigns: {
      '50%': firstMockToFullCoverage(signsCoverageByMock, 0.5),
      '90%': firstMockToFullCoverage(signsCoverageByMock, 0.9),
      '100%': firstMockToFullCoverage(signsCoverageByMock, 1),
    },
    rulesTopicDiversityPerMock: {
      min: Math.min(...rulesTopicSpread),
      mean: Math.round(mean(rulesTopicSpread) * 10) / 10,
      max: Math.max(...rulesTopicSpread),
      ofTotalTopics: 20,
    },
    signTopicDiversityPerMock: {
      min: Math.min(...signTopicSpread),
      mean: Math.round(mean(signTopicSpread) * 10) / 10,
      max: Math.max(...signTopicSpread),
      ofTotalTopics: 9,
    },
    rulesDifficultyMixPerMock: {
      easy: { min: Math.min(...ruleDiffs.map((d) => d.easy)), mean: Math.round(mean(ruleDiffs.map((d) => d.easy)) * 10) / 10, max: Math.max(...ruleDiffs.map((d) => d.easy)) },
      medium: { min: Math.min(...ruleDiffs.map((d) => d.medium)), mean: Math.round(mean(ruleDiffs.map((d) => d.medium)) * 10) / 10, max: Math.max(...ruleDiffs.map((d) => d.medium)) },
      hard: { min: Math.min(...ruleDiffs.map((d) => d.hard)), mean: Math.round(mean(ruleDiffs.map((d) => d.hard)) * 10) / 10, max: Math.max(...ruleDiffs.map((d) => d.hard)) },
    },
    consecutiveTestOverlap: {
      rules: { min: Math.min(...overlapPairs.map((o) => o.rules)), mean: Math.round(mean(overlapPairs.map((o) => o.rules)) * 10) / 10, max: Math.max(...overlapPairs.map((o) => o.rules)) },
      signs: { min: Math.min(...overlapPairs.map((o) => o.signs)), mean: Math.round(mean(overlapPairs.map((o) => o.signs)) * 10) / 10, max: Math.max(...overlapPairs.map((o) => o.signs)) },
    },
  };

  await mkdir(REPORT_DIR, { recursive: true });
  const jsonPath = path.join(REPORT_DIR, 'mock-analyze.json');
  await writeFile(jsonPath, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');

  /* -------------------------------------------------------- readable report */
  const lines: string[] = ['# Mock-exam selection analysis', ''];
  lines.push(
    `Simulated **${SEEDS}** seeded mock tests (40 questions each: 20 rules + 20 signs) drawn from the active bank.`,
  );
  lines.push('');
  lines.push('## Question exposure', '');
  lines.push(
    `- Per-question appearances over ${SEEDS} tests: mean ${summary.appearancePerQuestion.mean}, range ${summary.appearancePerQuestion.min}–${summary.appearancePerQuestion.max}.`,
  );
  lines.push(
    `  - Rules: mean ${summary.appearancePerQuestion.rulesMean}, min ${summary.appearancePerQuestion.rulesMin}.`,
  );
  lines.push(
    `  - Signs: mean ${summary.appearancePerQuestion.signsMean}, min ${summary.appearancePerQuestion.signsMin}.`,
  );
  lines.push(`- Questions never drawn in ${SEEDS} tests: ${summary.neverAppeared.length}.`);
  for (const id of summary.neverAppeared) lines.push(`  - \`${id}\``);
  lines.push(`- Questions drawn fewer than twice: ${summary.appearedLessThanTwice.length}.`);
  for (const id of summary.appearedLessThanTwice) lines.push(`  - \`${id}\``);

  lines.push('', '## Coverage vs number of tests taken', '');
  lines.push('| Bank seen | Rules | Signs |');
  lines.push('| --- | ---: | ---: |');
  const rulesCov = summary.mockToCoverRules;
  const signsCov = summary.mockToCoverSigns;
  for (const target of ['50%', '90%', '100%']) {
    lines.push(
      `| ${target} | ${rulesCov[target as keyof typeof rulesCov] ?? 'never'} tests | ${signsCov[target as keyof typeof signsCov] ?? 'never'} tests |`,
    );
  }

  lines.push('', '## Composition of a single test', '');
  lines.push(
    `- Rules-section topic diversity: ${summary.rulesTopicDiversityPerMock.mean} distinct topics on average (min ${summary.rulesTopicDiversityPerMock.min}, max ${summary.rulesTopicDiversityPerMock.max}) of ${summary.rulesTopicDiversityPerMock.ofTotalTopics}.`,
  );
  lines.push(
    `- Signs-section topic diversity: ${summary.signTopicDiversityPerMock.mean} distinct topics on average (min ${summary.signTopicDiversityPerMock.min}, max ${summary.signTopicDiversityPerMock.max}) of ${summary.signTopicDiversityPerMock.ofTotalTopics}.`,
  );
  const rd = summary.rulesDifficultyMixPerMock;
  lines.push(
    `- Rules difficulty per test: easy ${rd.easy.mean} (${rd.easy.min}–${rd.easy.max}), medium ${rd.medium.mean} (${rd.medium.min}–${rd.medium.max}), hard ${rd.hard.mean} (${rd.hard.min}–${rd.hard.max}).`,
  );

  lines.push('', '## Consecutive-test overlap', '');
  lines.push(
    `- Two tests in a row share on average ${summary.consecutiveTestOverlap.rules.mean} rules questions (min ${summary.consecutiveTestOverlap.rules.min}, max ${summary.consecutiveTestOverlap.rules.max}) and ${summary.consecutiveTestOverlap.signs.mean} sign questions (min ${summary.consecutiveTestOverlap.signs.min}, max ${summary.consecutiveTestOverlap.signs.max}).`,
  );

  lines.push('');
  const reportPath = path.join(REPORT_DIR, 'mock-analyze.md');
  await writeFile(reportPath, lines.join('\n'), 'utf8');

  console.log(`\nWrote ${path.relative(ROOT, jsonPath)} and ${path.relative(ROOT, reportPath)}`);
}

function mean(xs: number[]): number {
  if (xs.length === 0) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
