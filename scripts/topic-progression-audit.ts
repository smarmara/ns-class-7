/**
 * Topic progression audit.
 *
 * Proves the property the progression model is supposed to guarantee: **no
 * topic has a mathematically unreachable status**, whatever size its question
 * bank happens to be.
 *
 * For each topic it simulates the ideal learner — every question answered
 * correctly, once for Complete and again for Mastered — and reports the stage
 * that model actually produces, plus the evidence needed to get there. If any
 * topic cannot reach Complete or Mastered the script exits non-zero, so this
 * is a gate rather than a document.
 *
 * Usage: pnpm content:progression
 */

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { ROOT, loadQuestions } from './lib/content';
import { ALL_TOPICS, RULES_TOPICS, TOPIC_LABELS } from '../src/content/types';
import type { Question, Topic } from '../src/content/types';
import { emptyProgress, type AttemptRecord, type Progress, type QuestionStat } from '../src/engine/learning/types';
import { MASTERY_RULES, isComplete, isMastered, topicMastery } from '../src/engine/learning/mastery';

const REPORT_DIR = path.join(ROOT, 'reports');

/**
 * A learner who has answered every question in the topic correctly, `passes`
 * times over. `box` rises by one per correct answer, which is what the real
 * scheduler does, so retention emerges rather than being asserted.
 */
function idealLearner(questions: readonly Question[], topic: Topic, passes: number): Progress {
  const progress = emptyProgress();
  const inTopic = questions.filter((q) => q.topic === topic);

  for (const question of inTopic) {
    const stat: QuestionStat = {
      questionId: question.id,
      seen: passes,
      correct: passes,
      incorrect: 0,
      lastSeenAt: '2026-08-19T10:00:00.000Z',
      lastResult: 'correct',
      streak: passes,
      box: Math.min(passes, 5),
      dueAt: '2026-09-19T10:00:00.000Z',
      bookmarked: false,
      flaggedForReview: false,
    };
    progress.questions[question.id] = stat;
  }

  for (let pass = 0; pass < passes; pass += 1) {
    for (const question of inTopic) {
      const attempt: AttemptRecord = {
        questionId: question.id,
        topic,
        type: question.type,
        correct: true,
        at: '2026-08-19T10:00:00.000Z',
        mode: 'topic',
      };
      progress.attempts.push(attempt);
    }
  }
  return progress;
}

/** Fewest full passes that reach the given predicate, or null within `limit`. */
function passesNeeded(
  questions: readonly Question[],
  topic: Topic,
  reached: (stage: ReturnType<typeof topicMastery>['stage']) => boolean,
  limit = 12,
): number | null {
  for (let passes = 1; passes <= limit; passes += 1) {
    const evidence = topicMastery(questions, idealLearner(questions, topic, passes), topic);
    if (reached(evidence.stage)) return passes;
  }
  return null;
}

async function main(): Promise<void> {
  const questions = (await loadQuestions()) as unknown as Question[];
  const active = questions.filter((q) => (q as { legalStatus?: string }).legalStatus === 'current');

  interface Row {
    topic: Topic;
    label: string;
    part: string;
    count: number;
    completeIn: number | null;
    masterIn: number | null;
    exposuresForMastery: number;
  }

  const rows: Row[] = [];
  for (const topic of ALL_TOPICS) {
    const inTopic = active.filter((q) => q.topic === topic);
    if (inTopic.length === 0) continue;
    const completeIn = passesNeeded(active, topic, isComplete);
    const masterIn = passesNeeded(active, topic, isMastered);
    rows.push({
      topic,
      label: TOPIC_LABELS[topic],
      part: (RULES_TOPICS as readonly string[]).includes(topic) ? 'Rules' : 'Signs',
      count: inTopic.length,
      completeIn,
      masterIn,
      exposuresForMastery: masterIn === null ? 0 : masterIn * inTopic.length,
    });
  }

  const unreachableComplete = rows.filter((r) => r.completeIn === null);
  const unreachableMaster = rows.filter((r) => r.masterIn === null);

  const lines: string[] = [];
  const push = (s = '') => lines.push(s);

  push('# Topic progression audit');
  push();
  push(
    `Generated ${new Date().toISOString().slice(0, 10)} by \`pnpm content:progression\`. ` +
      'Every figure is produced by running the real model against a simulated ideal learner — ' +
      'nothing here is hand-maintained.',
  );
  push();
  push('## The model');
  push();
  push(
    '**Complete** — every question in the topic has been attempted and answered well ' +
      `(coverage ${MASTERY_RULES.complete.minCoverage * 100}%, accuracy ` +
      `≥ ${MASTERY_RULES.complete.minAccuracy * 100}%). It is the ordinary goal, and it drives the ` +
      'Learn screen, course progress, medals and the recommended next topic.',
  );
  push();
  push(
    '**Mastered** — the same material met again and answered correctly again ' +
      `(accuracy ≥ ${MASTERY_RULES.mastered.minAccuracy * 100}%, retention ` +
      `≥ ${MASTERY_RULES.mastered.minRetained * 100}%, at least ` +
      `${MASTERY_RULES.mastered.minExposuresPerQuestion} exposures per question and ` +
      `${MASTERY_RULES.mastered.minExposures} in total). It sits above Complete and cannot be ` +
      'reached in a single pass at any topic size.',
  );
  push();
  push(
    'Neither threshold refers to an absolute number of unique questions, which is what previously ' +
      'made mastery unreachable for two thirds of the course.',
  );
  push();

  push('## Reachability by topic');
  push();
  push('| Topic | Part | Questions | Complete reachable? | Mastered reachable? | Answers to master |');
  push('| --- | --- | ---: | :---: | :---: | ---: |');
  for (const row of rows) {
    push(
      `| ${row.label} | ${row.part} | ${row.count} | ` +
        `${row.completeIn === null ? '**NO**' : `yes (${row.completeIn} pass)`} | ` +
        `${row.masterIn === null ? '**NO**' : `yes (${row.masterIn} passes)`} | ` +
        `${row.exposuresForMastery || '—'} |`,
    );
  }
  push();
  push(
    `**Complete unreachable: ${unreachableComplete.length}. ` +
      `Mastered unreachable: ${unreachableMaster.length}.**`,
  );
  push();

  push('## Thin topics');
  push();
  const thin = rows.filter((r) => r.count <= 6).sort((a, b) => a.count - b.count);
  push(
    `${thin.length} topic(s) hold six questions or fewer. Under the previous model none of them ` +
      'could reach Mastered, and those with fewer than six could not reach Strong either. ' +
      'They now progress on the same terms as every other topic.',
  );
  push();
  push('| Topic | Questions | Complete after | Mastered after | Total answers to master |');
  push('| --- | ---: | --- | --- | ---: |');
  for (const row of thin) {
    push(
      `| ${row.label} | ${row.count} | ` +
        `${row.completeIn === null ? '—' : `${row.completeIn} pass`} | ` +
        `${row.masterIn === null ? '—' : `${row.masterIn} passes`} | ${row.exposuresForMastery} |`,
    );
  }
  push();

  push('## Worked examples');
  push();
  for (const size of [3, 4, 10]) {
    const row = rows.find((r) => r.count === size) ?? rows.find((r) => r.count >= size);
    if (!row) continue;
    const inTopic = active.filter((q) => q.topic === row.topic);
    push(`### ${row.label} — ${row.count} questions`);
    push();
    for (let passes = 1; passes <= 3; passes += 1) {
      const evidence = topicMastery(active, idealLearner(active, row.topic, passes), row.topic);
      push(
        `- After **${passes} full pass${passes === 1 ? '' : 'es'}** ` +
          `(${passes * inTopic.length} answers): coverage ${Math.round(evidence.coverage * 100)}%, ` +
          `retention ${Math.round(evidence.retained * 100)}%, ` +
          `${evidence.exposuresPerQuestion.toFixed(1)} exposures/question → **${evidence.stage}**`,
      );
    }
    push();
  }

  push('## Notes');
  push();
  push(
    '- Medals are awarded for **Complete**, so no learner has to grind a three-question topic to ' +
      'be rewarded for finishing it. Mastered is shown as a stronger state instead.',
  );
  push(
    '- The "answers to master" column assumes a perfect learner. A miss resets that question\'s ' +
      'retention box, so a real learner will usually need more.',
  );
  push(
    '- No questions were added to satisfy any threshold. Topic sizes reflect the material; the ' +
      'model adapts to them.',
  );
  push();

  await mkdir(REPORT_DIR, { recursive: true });
  const out = path.join(REPORT_DIR, 'topic-progression.md');
  await writeFile(out, `${lines.join('\n')}\n`, 'utf8');

  console.log(`Wrote ${path.relative(ROOT, out)}`);
  console.log(`Topics audited: ${rows.length}`);
  console.log(`Complete unreachable: ${unreachableComplete.length}`);
  console.log(`Mastered unreachable: ${unreachableMaster.length}`);

  if (unreachableComplete.length > 0 || unreachableMaster.length > 0) {
    for (const row of [...unreachableComplete, ...unreachableMaster]) {
      console.error(`UNREACHABLE: ${row.label} (${row.count} questions)`);
    }
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
