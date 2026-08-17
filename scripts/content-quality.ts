/**
 * Question-bank writing-quality heuristics.
 *
 * This is a decision-support report, not a pass/fail gate: it flags patterns
 * (choice-length tells, thin explanations, awkward phrasing, unrecognised
 * sign types) for a human maintainer to judge. It deliberately does not try
 * to convert subjective writing quality into brittle CI rules.
 *
 * Usage: pnpm content:quality
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { ROOT, loadQuestions, normaliseText, similarity } from './lib/content';
import type { LoadedQuestion } from './lib/content';

const REPORT_DIR = path.join(ROOT, 'reports');

interface Q {
  id: string;
  type: 'rules' | 'sign';
  topic: string;
  question: string;
  choices: string[];
  correctChoice: number;
  explanation: string;
  incorrectChoiceExplanations?: (string | null)[];
  signId?: string;
  choiceSignIds?: string[];
}

const toQ = (q: LoadedQuestion): Q => q as unknown as Q;

function mean(xs: number[]): number {
  if (xs.length === 0) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

function median(xs: number[]): number {
  if (xs.length === 0) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid]! : (s[mid - 1]! + s[mid]!) / 2;
}

const RESTATE = /(is|are) (the )?(correct|right) (answer|choice)|correct answer (is|would be)|the answer is/i;

interface QualityReport {
  generatedAt: string;
  totalQuestions: number;
  choiceCounts: Record<number, number>;
  authoredCorrectPosition: Record<number, number>;
  choiceLength: {
    meanCorrect: number;
    meanDistractor: number;
    medianCorrect: number;
    medianDistractor: number;
    correctLongest: string[];
    correctShortest: string[];
    correctMuchLonger: string[];
    correctMuchShorter: string[];
  };
  explanation: {
    minLength: number;
    meanLength: number;
    medianLength: number;
    tooShort: { id: string; length: number; explanation: string }[];
    restating: { id: string; explanation: string }[];
  };
  stem: {
    meanLength: number;
    longest: { id: string; length: number }[];
    longStems: { id: string; length: number }[];
  };
  missingDistractorExplanations: { id: string; missingIndices: number[] }[];
  signStyle: {
    application: { count: number; signIds: string[] };
    recognition: { count: number; signIds: string[] };
    unrecognised: { id: string; signId?: string; choiceSignIds?: string[] }[];
  };
  awkwardPhrasing: { id: string; question: string }[];
  nearDuplicateChoices: { id: string; pair: [string, string]; similarity: number }[];
}

async function main() {
  const raw = await loadQuestions();
  const questions = raw.map(toQ);

  const report: QualityReport = {
    generatedAt: new Date().toISOString(),
    totalQuestions: questions.length,
    choiceCounts: {},
    authoredCorrectPosition: {},
    choiceLength: {
      meanCorrect: 0,
      meanDistractor: 0,
      medianCorrect: 0,
      medianDistractor: 0,
      correctLongest: [],
      correctShortest: [],
      correctMuchLonger: [],
      correctMuchShorter: [],
    },
    explanation: { minLength: Infinity, meanLength: 0, medianLength: 0, tooShort: [], restating: [] },
    stem: { meanLength: 0, longest: [], longStems: [] },
    missingDistractorExplanations: [],
    signStyle: { application: { count: 0, signIds: [] }, recognition: { count: 0, signIds: [] }, unrecognised: [] },
    awkwardPhrasing: [],
    nearDuplicateChoices: [],
  };

  const correctLengths: number[] = [];
  const distractorLengths: number[] = [];
  const stemLengths: number[] = [];
  const explanationLengths: number[] = [];

  for (const q of questions) {
    const n = q.choices.length;
    report.choiceCounts[n] = (report.choiceCounts[n] ?? 0) + 1;
    report.authoredCorrectPosition[q.correctChoice] =
      (report.authoredCorrectPosition[q.correctChoice] ?? 0) + 1;

    const lengths = q.choices.map((c) => c.length);
    const correctLen = lengths[q.correctChoice] ?? 0;
    const distractors = q.choices.filter((_, i) => i !== q.correctChoice).map((c) => c.length);
    correctLengths.push(correctLen);
    distractorLengths.push(...distractors);
    stemLengths.push(q.question.length);
    explanationLengths.push(q.explanation.length);

    /* -------------------------------- choice-length tells --------------- */
    if (correctLen === Math.max(...lengths)) report.choiceLength.correctLongest.push(q.id);
    if (correctLen === Math.min(...lengths)) report.choiceLength.correctShortest.push(q.id);
    const meanDist = mean(distractors);
    if (meanDist > 0 && correctLen > meanDist * 1.5) report.choiceLength.correctMuchLonger.push(q.id);
    if (meanDist > 0 && correctLen * 1.5 < meanDist) report.choiceLength.correctMuchShorter.push(q.id);

    /* -------------------------------- explanations --------------------- */
    if (q.explanation.length < 80) {
      report.explanation.tooShort.push({ id: q.id, length: q.explanation.length, explanation: q.explanation });
    }
    if (RESTATE.test(q.explanation)) {
      report.explanation.restating.push({ id: q.id, explanation: q.explanation });
    }

    /* -------------------------------- stem length ---------------------- */
    if (q.question.length > 220) report.stem.longStems.push({ id: q.id, length: q.question.length });

    /* -------------------------------- distractor explanations ---------- */
    const missing: number[] = [];
    const ice = q.incorrectChoiceExplanations ?? [];
    for (let i = 0; i < n; i++) {
      if (i === q.correctChoice) continue;
      const note = ice[i];
      if (note === undefined || note === null || note.trim() === '') missing.push(i);
    }
    if (missing.length > 0) {
      report.missingDistractorExplanations.push({ id: q.id, missingIndices: missing });
    }

    /* -------------------------------- sign style ----------------------- */
    if (q.type === 'sign') {
      if (q.choiceSignIds && q.choiceSignIds.length > 0) {
        report.signStyle.recognition.count++;
        for (const id of q.choiceSignIds) report.signStyle.recognition.signIds.push(id);
      } else if (q.signId) {
        report.signStyle.application.count++;
        report.signStyle.application.signIds.push(q.signId);
      } else {
        report.signStyle.unrecognised.push({ id: q.id });
      }
    }

    /* -------------------------------- phrasing ------------------------- */
    const lower = q.question.toLowerCase();
    const nots = lower.split('not').length - 1;
    const excepts = lower.split('except').length - 1;
    if (nots >= 2 || (nots >= 1 && excepts >= 1) || /no t/i.test(q.question)) {
      report.awkwardPhrasing.push({ id: q.id, question: q.question });
    }

    /* -------------------------------- near-duplicate choices ----------- */
    const norm = q.choices.map((c) => normaliseText(c));
    for (let i = 0; i < norm.length; i++) {
      for (let j = i + 1; j < norm.length; j++) {
        const sim = similarity(norm[i]!, norm[j]!);
        if (sim >= 0.75) {
          report.nearDuplicateChoices.push({ id: q.id, pair: [q.choices[i]!, q.choices[j]!], similarity: Math.round(sim * 100) / 100 });
        }
      }
    }
  }

  report.choiceLength.meanCorrect = Math.round(mean(correctLengths) * 10) / 10;
  report.choiceLength.meanDistractor = Math.round(mean(distractorLengths) * 10) / 10;
  report.choiceLength.medianCorrect = median(correctLengths);
  report.choiceLength.medianDistractor = median(distractorLengths);
  report.explanation.minLength = Math.min(...explanationLengths);
  report.explanation.meanLength = Math.round(mean(explanationLengths) * 10) / 10;
  report.explanation.medianLength = median(explanationLengths);
  report.stem.meanLength = Math.round(mean(stemLengths) * 10) / 10;
  report.stem.longest = [...report.stem.longStems].sort((a, b) => b.length - a.length).slice(0, 5);

  await mkdir(REPORT_DIR, { recursive: true });
  const jsonPath = path.join(REPORT_DIR, 'question-quality.json');
  await writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

  /* -------------------------------------------------------- readable report */
  const lines: string[] = ['# Question-bank writing-quality heuristics', ''];
  lines.push(
    `Total **${report.totalQuestions}** questions analysed. These are heuristic flags for a maintainer to judge, not pass/fail tests.`,
  );
  lines.push('');
  lines.push('## Choice structure', '');
  lines.push(`- Choice count per question: ${Object.entries(report.choiceCounts).map(([k, v]) => `${k} choices × ${v}`).join(', ')}.`);
  lines.push(`- Authored correct-choice position: ${Object.entries(report.authoredCorrectPosition).map(([k, v]) => `${k} → ${v}`).join(', ')} (positions are shuffled in-app, so this is an authoring-balance metric only).`);
  lines.push(`- Mean choice length: correct ${report.choiceLength.meanCorrect} chars vs distractor ${report.choiceLength.meanDistractor} (median ${report.choiceLength.medianCorrect} vs ${report.choiceLength.medianDistractor}).`);
  lines.push('');
  lines.push('### Choice-length tells (correct choice identifiable by length alone)', '');
  lines.push(`- Correct is the longest option: ${report.choiceLength.correctLongest.length} question(s).`);
  lines.push(`- Correct is the shortest option: ${report.choiceLength.correctShortest.length} question(s).`);
  lines.push(`- Correct > 1.5× mean distractor length: ${report.choiceLength.correctMuchLonger.length} question(s).`);
  lines.push(`- Correct < 0.67× mean distractor length: ${report.choiceLength.correctMuchShorter.length} question(s).`);
  if (report.choiceLength.correctMuchLonger.length) {
    lines.push('');
    lines.push(`Much-longer list: ${report.choiceLength.correctMuchLonger.join(', ')}`);
  }
  if (report.choiceLength.correctMuchShorter.length) {
    lines.push('');
    lines.push(`Much-shorter list: ${report.choiceLength.correctMuchShorter.join(', ')}`);
  }

  lines.push('', '## Explanations', '');
  lines.push(
    `- Length: min ${report.explanation.minLength}, mean ${report.explanation.meanLength}, median ${report.explanation.medianLength} chars.`,
  );
  lines.push(`- Explanations under 80 chars: ${report.explanation.tooShort.length}.`);
  for (const t of report.explanation.tooShort) {
    lines.push(`  - \`${t.id}\` (${t.length}): "${t.explanation}"`);
  }
  lines.push(`- Explanations that merely restate the answer: ${report.explanation.restating.length}.`);
  for (const r of report.explanation.restating) {
    lines.push(`  - \`${r.id}\`: "${r.explanation}"`);
  }

  lines.push('', '## Stems', '');
  lines.push(`- Mean stem length ${report.stem.meanLength} chars.`);
  lines.push(`- Stems over 220 chars (long on a phone): ${report.stem.longStems.length}.`);
  for (const s of report.stem.longest) lines.push(`  - \`${s.id}\` (${s.length})`);
  for (const s of report.stem.longStems) {
    const q = questions.find((x) => x.id === s.id);
    if (q) lines.push(`  - \`${s.id}\`: "${q.question.slice(0, 140)}..."`);
  }

  lines.push('', '## Distractor explanations', '');
  lines.push(
    `- Questions with a distractor lacking an explanation: ${report.missingDistractorExplanations.length}.`,
  );
  for (const m of report.missingDistractorExplanations) {
    lines.push(`  - \`${m.id}\` indices ${m.missingIndices.join(', ')}`);
  }

  lines.push('', '## Sign questions by style', '');
  lines.push(
    `- Application (sign shown, "what does it mean / what must you do"): ${report.signStyle.application.count}.`,
  );
  lines.push(
    `- Recognition (choices are sign artworks): ${report.signStyle.recognition.count}.`,
  );
  lines.push(`- Sign questions with no sign artwork reference: ${report.signStyle.unrecognised.length}.`);
  for (const u of report.signStyle.unrecognised) lines.push(`  - \`${u.id}\``);

  lines.push('', '## Phrasing flags', '');
  lines.push(`- Double-negative / stacked-exception stems: ${report.awkwardPhrasing.length}.`);
  for (const a of report.awkwardPhrasing) lines.push(`  - \`${a.id}\`: "${a.question}"`);

  lines.push('', '## Near-duplicate choices within a question', '');
  lines.push(`- Pairs of choices with similarity ≥ 0.75: ${report.nearDuplicateChoices.length}.`);
  for (const d of report.nearDuplicateChoices) {
    lines.push(`  - \`${d.id}\` (${d.similarity}): "${d.pair[0]}" ~ "${d.pair[1]}"`);
  }

  lines.push('');
  const reportPath = path.join(REPORT_DIR, 'question-quality.md');
  await writeFile(reportPath, lines.join('\n'), 'utf8');

  console.log(`\nWrote ${path.relative(ROOT, jsonPath)} and ${path.relative(ROOT, reportPath)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
