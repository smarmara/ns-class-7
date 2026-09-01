/**
 * Content validator.
 *
 * Fails the build when the question bank would mislead a learner: a question
 * with no traceable source, a broken source id, an answer that cannot be
 * scored, content that is not current law, or a source that has not been
 * verified recently enough under the project's policy.
 *
 * Usage: pnpm content:validate
 */
import path from 'node:path';
import { cropKeyFor } from '../src/signs/cropKey';
import {
  EXAM_CONFIG_PATH,
  LEGAL_STATUS_PATH,
  MANIFEST_PATH,
  OFFICIAL_CROPS_DIR,
  SIGN_META_PATH,
  SIGN_FIDELITY_PATH,
  daysSince,
  fileExists,
  loadOfficialCropDesignations,
  loadQuestions,
  loadSignArtIds,
  normaliseText,
  readJson,
  similarity,
} from './lib/content';
import { ALL_TOPICS } from '../src/content/types';
import type {
  ExamConfig,
  LegalStatusConfig,
  Question,
  SourceManifest,
} from '../src/content/types';

export interface Finding {
  level: 'error' | 'warning';
  rule: string;
  where: string;
  message: string;
}

/**
 * Authoring-balance warnings.
 *
 * Neither of these is an error: in-app choice shuffling hides both patterns
 * from learners, so nothing here can mislead a test-taker today. They exist to
 * stop the patterns from quietly becoming habits as the bank grows, because
 * both make future content easier to author badly.
 */
export function choiceLengthFindings(q: Question & { file?: string }): Finding[] {
  const where = `${q.file ?? '(unknown)'} › ${q.id}`;
  if (!Array.isArray(q.choices) || q.choices.length < 2) return [];
  if (typeof q.correctChoice !== 'number' || q.correctChoice >= q.choices.length) return [];

  const lengths = q.choices.map((c) => String(c).length);
  const correct = lengths[q.correctChoice]!;
  const distractors = lengths.filter((_, i) => i !== q.correctChoice);
  const shortest = Math.min(...distractors);

  // Only the egregious cases: the correct answer at least 3× the shortest
  // distractor, with the shortest distractor long enough to be a real choice.
  if (shortest >= 10 && correct >= shortest * 3) {
    return [
      {
        level: 'warning',
        rule: 'choice-length-tell',
        where,
        message: `The correct answer (${correct} chars) is at least 3× the shortest distractor (${shortest} chars). A test-taker could identify it by length alone — consider rebalancing.`,
      },
    ];
  }
  return [];
}

export function authoringPositionFindings(questions: readonly Question[]): Finding[] {
  const byFile = new Map<string, Set<number>>();
  for (const q of questions) {
    if (typeof q.correctChoice !== 'number') continue;
    const file = (q as Question & { file?: string }).file ?? '(unknown)';
    const set = byFile.get(file) ?? new Set<number>();
    set.add(q.correctChoice);
    byFile.set(file, set);
  }

  const out: Finding[] = [];
  for (const [file, positions] of byFile) {
    if (positions.size === 1) {
      out.push({
        level: 'warning',
        rule: 'authoring-position',
        where: file,
        message: `Every question in this file puts the correct answer at position ${[...positions][0]}. In-app shuffling hides this from learners, but varying the position makes authoring less error-prone.`,
      });
    }
  }
  return out;
}

const findings: Finding[] = [];

function error(rule: string, where: string, message: string) {
  findings.push({ level: 'error', rule, where, message });
}
function warn(rule: string, where: string, message: string) {
  findings.push({ level: 'warning', rule, where, message });
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const REQUIRED_FIELDS = [
  'id',
  'type',
  'topic',
  'question',
  'choices',
  'correctChoice',
  'explanation',
  'difficulty',
  'tags',
  'sourceRefs',
  'legalStatus',
  'verifiedAt',
] as const;

/**
 * A statement carrying a number, a distance, an age, a fine or a limit is a
 * legal fact, and must point at a locatable place in a source — not merely
 * name a document.
 */
const NUMERIC_FACT =
  /\b\d+(?:[.,]\d+)?\s*(?:km\/h|km|metres?|m\b|centimetres?|cm|millimetres?|mm|kg|hours?|minutes?|days?|weeks?|months?|years?|per cent|%|\$)/i;

async function main() {
  const [questionsRaw, manifest, examConfig, legal, signMeta, signFidelity, signArtIds, officialCropDesignations] = await Promise.all([
    loadQuestions(),
    readJson<SourceManifest>(MANIFEST_PATH),
    readJson<ExamConfig>(EXAM_CONFIG_PATH),
    readJson<LegalStatusConfig>(LEGAL_STATUS_PATH),
    readJson<{ signs: Record<string, { label: string; visualDescription: string }> }>(
      SIGN_META_PATH,
    ),
    readJson<{
      verifiedAt: string;
      sources: Record<string, string>;
      signs: Record<string, {
        designation?: string;
        variant?: string;
        /** Crop key for this variant's image on variable-number signs. */
        asset?: string;
        schedulePage?: number;
        dimensions?: string;
        sourceId: string;
        status: 'official-crop' | 'legacy-pending-crop' | 'needs-rebuild' | 'incorrect' | 'ambiguous' | 'unresolved' | 'handbook-concept-svg' | 'pavement-concept-svg';
      }>;
    }>(SIGN_FIDELITY_PATH),
    loadSignArtIds(),
    loadOfficialCropDesignations(),
  ]);

  const questions = questionsRaw as unknown as (Question & { file: string })[];
  const sourceIds = new Set(manifest.sources.map((s) => s.id));
  const knownTopics = new Set<string>(ALL_TOPICS);
  const signIds = new Set(Object.keys(signMeta.signs));
  const fidelityIds = new Set(Object.keys(signFidelity.signs));
  const lawById = new Map(legal.lawVersions.map((v) => [v.id, v]));
  const today = new Date();

  /* ------------------------------- sign artwork resolution (SVG or crop) -- */

  const officialCropSignIds = new Set(
    Object.entries(signFidelity.signs)
      .filter(([, entry]) => entry.status === 'official-crop')
      .map(([id]) => id),
  );
  const conceptSvgSignIds = new Set(
    Object.entries(signFidelity.signs)
      .filter(([, entry]) => entry.status === 'handbook-concept-svg' || entry.status === 'pavement-concept-svg')
      .map(([id]) => id),
  );
  // A sign is servable if it has SVG artwork, is wired to an official crop, or is a concept SVG.
  const hasArt = (id: string) => signArtIds.has(id) || officialCropSignIds.has(id) || conceptSvgSignIds.has(id);

  /* --------------------------------------------------- per-question checks */

  const seenIds = new Map<string, string>();

  for (const q of questions) {
    const where = `${q.file} › ${q.id ?? '(no id)'}`;

    // Required metadata.
    for (const field of REQUIRED_FIELDS) {
      const value = (q as unknown as Record<string, unknown>)[field];
      if (value === undefined || value === null || value === '') {
        error('required-metadata', where, `Missing required field "${field}".`);
      }
    }
    if (!q.id) continue;

    // Duplicate ids.
    const previous = seenIds.get(q.id);
    if (previous) {
      error('duplicate-id', where, `Question id "${q.id}" is already used in ${previous}.`);
    }
    seenIds.set(q.id, q.file);

    // Topic taxonomy.
    if (q.topic && !knownTopics.has(q.topic)) {
      error('unknown-topic', where, `Topic "${q.topic}" is not in the curriculum taxonomy.`);
    }

    // Answerability.
    if (!Array.isArray(q.choices) || q.choices.length < 2) {
      error('choices', where, 'A question needs at least two choices.');
    } else {
      if (
        typeof q.correctChoice !== 'number' ||
        q.correctChoice < 0 ||
        q.correctChoice >= q.choices.length
      ) {
        error(
          'no-correct-answer',
          where,
          `correctChoice ${String(q.correctChoice)} does not point at a choice (0..${q.choices.length - 1}).`,
        );
      }
      // Two identical choices means two correct answers in practice.
      const normalised = q.choices.map((c) => normaliseText(String(c)));
      const dupes = normalised.filter((c, i) => normalised.indexOf(c) !== i);
      if (dupes.length > 0) {
        error(
          'multiple-correct-answers',
          where,
          'Two or more choices are the same, so more than one option would be correct.',
        );
      }
      if (
        q.incorrectChoiceExplanations &&
        q.incorrectChoiceExplanations.length !== q.choices.length
      ) {
        error(
          'choice-explanations',
          where,
          `incorrectChoiceExplanations has ${q.incorrectChoiceExplanations.length} entries for ${q.choices.length} choices.`,
        );
      }
    }

    // Sources.
    if (!Array.isArray(q.sourceRefs) || q.sourceRefs.length === 0) {
      error('no-source', where, 'Every question must cite at least one official source.');
    } else {
      for (const ref of q.sourceRefs) {
        if (!ref.sourceId) {
          error('no-source', where, 'A source reference has no sourceId.');
        } else if (!sourceIds.has(ref.sourceId)) {
          error(
            'unknown-source',
            where,
            `Source id "${ref.sourceId}" is not in the source manifest.`,
          );
        }
      }

      // Numeric facts need a locator, not just a document name.
      const text = `${q.question} ${q.explanation}`;
      if (NUMERIC_FACT.test(text)) {
        const hasLocator = q.sourceRefs.some((r) => r.section || r.page || r.chapter || r.note);
        if (!hasLocator) {
          error(
            'unlocatable-numeric-fact',
            where,
            'This question states a numeric or legal fact but no source reference gives a section, chapter, page or note to locate it.',
          );
        }
      }
    }

    // Legal status and law version.
    if (!['current', 'future', 'superseded', 'under_review'].includes(q.legalStatus)) {
      error('legal-status', where, `Unknown legalStatus "${q.legalStatus}".`);
    }
    if (q.legalStatus === 'under_review' && !q.reviewReason) {
      error(
        'review-reason',
        where,
        'A question marked under_review must record a reviewReason so the next maintainer knows what to check.',
      );
    }
    if (q.legalStatus === 'current') {
      const versionId = q.lawVersion ?? legal.activeLawVersion;
      const version = lawById.get(versionId);
      if (!version) {
        error('law-version', where, `Unknown lawVersion "${versionId}".`);
      } else if (!version.inForce) {
        error(
          'not-in-force',
          where,
          `Marked "current" but written against ${version.title}, which is not in force. It must be "future" until proclamation is confirmed.`,
        );
      }
    }

    // Expiry.
    if (q.effectiveTo && ISO_DATE.test(q.effectiveTo)) {
      const expired = new Date(q.effectiveTo) < today;
      if (expired && q.legalStatus === 'current') {
        error(
          'expired-question',
          where,
          `effectiveTo (${q.effectiveTo}) has passed but the question is still marked current.`,
        );
      }
    }

    // Dates.
    if (q.verifiedAt && !ISO_DATE.test(q.verifiedAt)) {
      error('date-format', where, `verifiedAt "${q.verifiedAt}" is not YYYY-MM-DD.`);
    } else if (q.verifiedAt && new Date(q.verifiedAt) > today) {
      error('date-format', where, `verifiedAt "${q.verifiedAt}" is in the future.`);
    }

    // Sign artwork.
    if (q.signId) {
      if (!signIds.has(q.signId)) {
        error('unknown-sign', where, `signId "${q.signId}" is not in data/signs/sign-meta.json.`);
      }
      if (!hasArt(q.signId)) {
        error('missing-sign-art', where, `No artwork registered for sign "${q.signId}" (no SVG and no official crop).`);
      }
      const fidelity = signFidelity.signs[q.signId];
      if (!fidelity) error('missing-sign-fidelity', where, `signId "${q.signId}" is absent from sign-fidelity.json.`);
      else if (fidelity.status === 'unresolved' || fidelity.status === 'incorrect' || fidelity.status === 'needs-rebuild') {
        error('unverified-active-sign', where, `signId "${q.signId}" has blocked fidelity status "${fidelity.status}".`);
      }
    }
    if (q.choiceSignIds) {
      if (q.choiceSignIds.length !== q.choices.length) {
        error(
          'choice-signs',
          where,
          `choiceSignIds has ${q.choiceSignIds.length} entries for ${q.choices.length} choices.`,
        );
      }
      for (const id of q.choiceSignIds) {
        if (!signIds.has(id)) {
          error('unknown-sign', where, `choiceSignIds refers to unknown sign "${id}".`);
        }
        if (!hasArt(id)) {
          error('missing-sign-art', where, `No artwork registered for sign "${id}" (no SVG and no official crop).`);
        }
        const fidelity = signFidelity.signs[id];
        if (!fidelity) error('missing-sign-fidelity', where, `choiceSignIds sign "${id}" is absent from sign-fidelity.json.`);
        else if (fidelity.status === 'unresolved' || fidelity.status === 'incorrect' || fidelity.status === 'needs-rebuild') {
          error('unverified-active-sign', where, `choice sign "${id}" has blocked fidelity status "${fidelity.status}".`);
        }
      }
      // The visible choice text is the accessible name for a sign option, so
      // it must match the registry's visual description exactly.
      q.choiceSignIds.forEach((id, i) => {
        const expected = signMeta.signs[id]?.visualDescription;
        if (expected && q.choices[i] !== expected) {
          error(
            'sign-choice-label',
            where,
            `Choice ${i} must be the sign's visualDescription verbatim (it is the accessible name). Expected: "${expected}"`,
          );
        }
      });
    }
    // A stem that points at a picture must actually have one.
    if (/\bthis sign\b|\bthese (?:signs|pavement markings|markings)\b/i.test(q.question ?? '')) {
      if (!q.signId && !q.choiceSignIds) {
        error(
          'missing-sign-art',
          where,
          'The question refers to "this sign" but no signId or choiceSignIds is set, so nothing is shown.',
        );
      }
    }

    // Authoring-balance warnings (advisory only).
    for (const finding of choiceLengthFindings(q)) findings.push(finding);
  }

  for (const finding of authoringPositionFindings(questions)) findings.push(finding);

  /* -------------------------------------------------- near-duplicate check */

  /*
   * Two questions are duplicates when they ask the same thing about the same
   * subject and want the same answer. The stem alone is not enough: a dozen
   * sign questions legitimately share the stem "What does this sign mean?"
   * and are distinguished only by which sign is displayed. So the fingerprint
   * combines the stem, the subject (any sign artwork involved) and the
   * correct answer.
   */
  const normalised = questions
    .filter((q) => q.id && q.question)
    .map((q) => ({
      id: q.id,
      file: q.file,
      text: normaliseText(
        [
          q.question,
          q.signId ?? '',
          (q.choiceSignIds ?? []).join(' '),
          q.choices?.[q.correctChoice] ?? '',
        ].join(' '),
      ),
    }));

  for (let i = 0; i < normalised.length; i++) {
    for (let j = i + 1; j < normalised.length; j++) {
      const a = normalised[i]!;
      const b = normalised[j]!;
      const score = similarity(a.text, b.text);
      if (score >= 0.85) {
        error(
          'near-duplicate',
          `${a.file} › ${a.id}`,
          `Is a near-duplicate of ${b.id} (${Math.round(score * 100)}% similar).`,
        );
      } else if (score >= 0.7) {
        warn(
          'near-duplicate',
          `${a.file} › ${a.id}`,
          `Closely resembles ${b.id} (${Math.round(score * 100)}% similar).`,
        );
      }
    }
  }

  /* ------------------------------------------------------ source freshness */

  const activeQuestions = questions.filter((q) => {
    if (q.legalStatus !== 'current') return false;
    const version = lawById.get(q.lawVersion ?? legal.activeLawVersion);
    return Boolean(version?.inForce);
  });

  const usedSources = new Set<string>();
  for (const q of activeQuestions) {
    for (const ref of q.sourceRefs ?? []) usedSources.add(ref.sourceId);
  }

  for (const source of manifest.sources) {
    if (!usedSources.has(source.id)) continue;
    if (!ISO_DATE.test(source.verifiedAt)) {
      error('date-format', source.id, `verifiedAt "${source.verifiedAt}" is not YYYY-MM-DD.`);
      continue;
    }
    const age = daysSince(source.verifiedAt, today);
    if (age > manifest.policy.verificationMaxAgeDays) {
      error(
        'stale-source',
        source.id,
        `Last verified ${age} days ago, over the ${manifest.policy.verificationMaxAgeDays}-day policy limit. Re-check it and update verifiedAt, or move the questions that depend on it to under_review.`,
      );
    } else if (age > manifest.policy.staleWarnDays) {
      warn('stale-source', source.id, `Last verified ${age} days ago — due for a re-check.`);
    }
    if (source.status !== 'current') {
      error(
        'non-current-source',
        source.id,
        `Active questions depend on this source, but its status is "${source.status}".`,
      );
    }
  }

  /* ------------------------------------------------------ mock test pooling */

  for (const section of examConfig.sections) {
    const available = activeQuestions.filter((q) => q.type === section.questionType);
    if (available.length < section.questionCount) {
      error(
        'insufficient-pool',
        `exam-config › ${section.id}`,
        `Needs ${section.questionCount} questions but only ${available.length} are active.`,
      );
    } else if (available.length < section.questionCount * 2) {
      warn(
        'thin-pool',
        `exam-config › ${section.id}`,
        `Only ${available.length} active questions for a ${section.questionCount}-question section — repeat mock tests will feel samey.`,
      );
    }

    // A future/superseded question must never be reachable by the mock test.
    const leaked = questions.filter(
      (q) =>
        q.type === section.questionType &&
        q.legalStatus !== 'current' &&
        activeQuestions.some((a) => a.id === q.id),
    );
    for (const q of leaked) {
      error(
        'non-current-in-pool',
        `${q.file} › ${q.id}`,
        `A "${q.legalStatus}" question is reachable by the ${section.id} mock-test pool.`,
      );
    }
  }

  /* ------------------------------------------------------- coverage matrix */

  const coverage = new Map<string, number>();
  for (const q of activeQuestions) coverage.set(q.topic, (coverage.get(q.topic) ?? 0) + 1);
  for (const topic of ALL_TOPICS) {
    const n = coverage.get(topic) ?? 0;
    if (n === 0) warn('coverage', topic, 'No active questions in this topic.');
    else if (n < 3) warn('coverage', topic, `Only ${n} active question(s) — thin coverage.`);
  }

  /* ------------------------------------------------------------ orphan art */

  if (!ISO_DATE.test(signFidelity.verifiedAt)) {
    error('sign-verification-date', 'sign-fidelity.json', 'verifiedAt must be a YYYY-MM-DD date.');
  }
  const designations = new Map<string, string>();
  for (const [id, entry] of Object.entries(signFidelity.signs)) {
    if (!signIds.has(id)) error('orphan-sign-fidelity', id, 'Fidelity entry has no sign-meta entry.');
    if (!hasArt(id)) error('missing-sign-art', id, 'Fidelity entry has no registered artwork (no SVG and no official crop).');
    if (!signFidelity.sources[entry.sourceId]) error('missing-sign-source', id, `Unknown sourceId "${entry.sourceId}".`);
    if (entry.sourceId === 'ns-traffic-signs-regulations') {
      if (!entry.designation || !entry.schedulePage || !entry.dimensions) {
        error('incomplete-official-sign', id, 'Schedule signs require designation, schedulePage and dimensions.');
      }
      if (entry.designation) {
        const key = `${entry.designation}::${entry.variant ?? ''}`;
        const prior = designations.get(key);
        if (prior) error('duplicate-sign-designation', id, `${key} is already mapped to "${prior}".`);
        designations.set(key, id);
      }
    }
  }

  // An official-crop sign is servable only if the Province's image is actually
  // present on disk. No silent fallback: a missing crop is a hard error naming
  // the sign, the missing file, and the questions that would display it.
  for (const [id, entry] of Object.entries(signFidelity.signs)) {
    if (entry.status !== 'official-crop') continue;
    // Variable-number signs name their variant image with `asset`; everything
    // else draws from `<designation>.png`.
    const cropKey = cropKeyFor(entry);
    const filename = cropKey ? `${cropKey}.png` : null;
    if (!filename || !cropKey) {
      error('missing-official-crop', id, 'Status is official-crop but no designation is recorded.');
      continue;
    }
    if (!officialCropDesignations.has(cropKey)) {
      error('missing-official-crop', id, `Crop for "${cropKey}" is not registered in the artwork registry.`);
      continue;
    }
    if (!(await fileExists(path.join(OFFICIAL_CROPS_DIR, filename)))) {
      const usedBy = questions
        .filter((q) => q.signId === id || (q.choiceSignIds ?? []).includes(id))
        .map((q) => q.id);
      const where = usedBy.length > 0 ? `question(s): ${usedBy.join(', ')}` : 'no question references';
      error('missing-official-crop', id, `Crop file "${filename}" is missing but "${id}" is wired to it. Affected ${where}.`);
    }
  }

  for (const id of signIds) {
    if (!hasArt(id)) {
      error('missing-sign-art', id, 'Declared in sign-meta.json but has no artwork (no SVG and no official crop).');
    }
    if (!fidelityIds.has(id)) {
      error('missing-sign-fidelity', id, 'Declared in sign-meta.json but absent from sign-fidelity.json.');
    }
  }
  for (const id of signArtIds) {
    if (!signIds.has(id)) {
      warn('orphan-sign-art', id, 'Artwork exists but the sign is not described in sign-meta.json.');
    }
  }

  /* ----------------------------------------------------------------- report */

  report(questions.length, activeQuestions.length, coverage);
}

function report(total: number, active: number, coverage: Map<string, number>) {
  const errors = findings.filter((f) => f.level === 'error');
  const warnings = findings.filter((f) => f.level === 'warning');

  console.log('\nContent validation');
  console.log('='.repeat(64));
  console.log(`Questions:  ${total} total, ${active} active (servable to a learner)`);
  console.log(`Topics:     ${coverage.size} with at least one active question`);
  console.log('');

  const byRule = new Map<string, Finding[]>();
  for (const f of findings) {
    const list = byRule.get(f.rule) ?? [];
    list.push(f);
    byRule.set(f.rule, list);
  }

  for (const [rule, items] of [...byRule.entries()].sort()) {
    const hasError = items.some((i) => i.level === 'error');
    console.log(`${hasError ? '✗' : '!'} ${rule} (${items.length})`);
    for (const item of items.slice(0, 12)) {
      console.log(`    ${item.level === 'error' ? 'ERROR  ' : 'warning'} ${item.where}`);
      console.log(`             ${item.message}`);
    }
    if (items.length > 12) console.log(`    … and ${items.length - 12} more`);
    console.log('');
  }

  console.log('-'.repeat(64));
  console.log(`${errors.length} error(s), ${warnings.length} warning(s)`);

  if (errors.length > 0) {
    console.log('\nValidation FAILED. Fix the errors above before shipping.');
    process.exit(1);
  }
  console.log('\nValidation passed.');
}

// Only run as a script. Tests import the pure helpers above without
// triggering a full validation run (which would exit the process on error).
if (Boolean(process.argv[1]) && /content-validate\.(ts|js|mjs)$/.test(process.argv[1]!)) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
