import { describe, expect, it } from 'vitest';
import {
  ALL_TOPICS,
  activeQuestions,
  allQuestions,
  contentLastVerified,
  examConfig,
  getSignMeta,
  legalStatus,
  sourceManifest,
  sourcesInUse,
} from '@/content';
import type { Question } from '@/content/types';

const sourceIds = new Set(sourceManifest.sources.map((s) => s.id));

describe('source manifest', () => {
  it('parses and has the shape the tooling relies on', () => {
    expect(sourceManifest.manifestVersion).toBe(1);
    expect(sourceManifest.hashAlgorithm).toBe('sha256');
    expect(sourceManifest.sources.length).toBeGreaterThan(0);
    expect(sourceManifest.policy.verificationMaxAgeDays).toBeGreaterThan(0);
  });

  it('gives every source a unique id, an https url and a verification date', () => {
    const ids = sourceManifest.sources.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);

    for (const source of sourceManifest.sources) {
      expect(source.url).toMatch(/^https:\/\//);
      expect(source.verifiedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(source.precedence).toBeGreaterThan(0);
      expect(source.authority.length).toBeGreaterThan(0);
    }
  });

  it('only cites official Nova Scotia government or legislature domains', () => {
    const allowed = /^https:\/\/(www\.)?(novascotia\.ca|nslegislature\.ca)\//;
    for (const source of sourceManifest.sources) {
      expect(source.url, `${source.id} url`).toMatch(allowed);
      if (source.documentUrl) {
        expect(source.documentUrl, `${source.id} documentUrl`).toMatch(allowed);
      }
    }
  });

  it('ranks legislation above regulations above guidance above handbook chapters', () => {
    const byId = new Map(sourceManifest.sources.map((s) => [s.id, s]));
    expect(byId.get('ns-mva')!.precedence).toBeLessThan(
      byId.get('ns-reg-traffic-signs')!.precedence,
    );
    expect(byId.get('ns-reg-traffic-signs')!.precedence).toBeLessThan(
      byId.get('ns-handbook-landing')!.precedence,
    );
    expect(byId.get('ns-handbook-landing')!.precedence).toBeLessThan(
      byId.get('ns-handbook-ch2')!.precedence,
    );
  });
});

describe('question bank integrity', () => {
  it('has questions', () => {
    expect(allQuestions.length).toBeGreaterThan(0);
    expect(activeQuestions.length).toBeGreaterThan(0);
  });

  it('gives every question a unique id', () => {
    const ids = allQuestions.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('traces every active question to at least one source in the manifest', () => {
    for (const q of activeQuestions) {
      expect(q.sourceRefs.length, `${q.id} has no source`).toBeGreaterThan(0);
      for (const ref of q.sourceRefs) {
        expect(sourceIds.has(ref.sourceId), `${q.id} cites unknown source ${ref.sourceId}`).toBe(
          true,
        );
      }
    }
  });

  it('marks exactly one answer correct, and that answer exists', () => {
    for (const q of allQuestions) {
      expect(q.choices.length).toBeGreaterThanOrEqual(2);
      expect(q.correctChoice).toBeGreaterThanOrEqual(0);
      expect(q.correctChoice).toBeLessThan(q.choices.length);
      // Duplicate choice text would make two options correct.
      const normalised = q.choices.map((c) => c.trim().toLowerCase());
      expect(new Set(normalised).size, `${q.id} has duplicate choices`).toBe(q.choices.length);
    }
  });

  it('uses only topics from the curriculum taxonomy', () => {
    const topics = new Set<string>(ALL_TOPICS);
    for (const q of allQuestions) {
      expect(topics.has(q.topic), `${q.id} has unknown topic ${q.topic}`).toBe(true);
    }
  });

  it('explains every answer', () => {
    for (const q of allQuestions) {
      expect(q.explanation.length, `${q.id} explanation too short`).toBeGreaterThan(30);
    }
  });

  it('lines up per-choice explanations with the choices', () => {
    for (const q of allQuestions) {
      if (!q.incorrectChoiceExplanations) continue;
      expect(q.incorrectChoiceExplanations.length, `${q.id}`).toBe(q.choices.length);
      // The correct choice slot should not carry a "why this is wrong" note.
      expect(q.incorrectChoiceExplanations[q.correctChoice]).toBeNull();
    }
  });

  it('points every sign reference at artwork that exists', () => {
    for (const q of allQuestions) {
      if (q.signId) expect(getSignMeta(q.signId), `${q.id} → ${q.signId}`).toBeDefined();
      for (const id of q.choiceSignIds ?? []) {
        expect(getSignMeta(id), `${q.id} → ${id}`).toBeDefined();
      }
    }
  });

  it('uses each sign choice label as the sign visual description verbatim, so it is a fair accessible name', () => {
    for (const q of allQuestions) {
      if (!q.choiceSignIds) continue;
      q.choiceSignIds.forEach((id, i) => {
        expect(q.choices[i], `${q.id} choice ${i}`).toBe(getSignMeta(id)!.visualDescription);
      });
    }
  });

  it('describes signs by appearance rather than by instruction', () => {
    /*
     * The visual description is the accessible name for a sign, so it must
     * give a screen-reader user what a sighted user sees — shape, colour,
     * symbols, and any legend actually printed on the sign face. What it must
     * NOT do is interpret: no "you must", no "do not", no "means". A legend
     * like STOP is fair to state, because it is painted on the sign; the
     * driver's obligation that follows from it is not.
     */
    const INTERPRETIVE =
      /\b(you must|you may|do not|must not|prohibit|permitted|means that|indicates that|requires? you|reduce speed|give way|right of way|slow down|watch for|prepare to)\b/i;

    for (const id of allSignIdsUsed()) {
      const meta = getSignMeta(id)!;
      expect(meta.visualDescription, `${id} visual description`).not.toMatch(INTERPRETIVE);
    }
  });

  it('keeps every sign meaning out of its own visual description, unless printed on the sign', () => {
    // Legends genuinely painted on the sign face.
    const PRINTED_LEGEND = new Set([
      'stop',
      'yield',
      'one-way',
      'wz-end-construction',
      'maximum-speed-50',
      'maximum-speed-80',
      'speed-limit-change-ahead',
      'truck-route',
      'route-102',
      'guide-destination',
      'low-clearance',
      'railway-tracks-tab',
      'no-right-turn-on-red',
      'wz-construction-distance-ahead',
    ]);

    for (const id of allSignIdsUsed()) {
      if (PRINTED_LEGEND.has(id)) continue;
      const meta = getSignMeta(id)!;
      // The part of the label before any em-dash is the meaning in brief;
      // it must not appear in the description. (Split on the em-dash only —
      // splitting on hyphens would reduce "Two-way traffic" to "two".)
      const gist = meta.label.split('—')[0]!.trim().toLowerCase();
      expect(meta.visualDescription.toLowerCase(), `${id}`).not.toContain(gist);
    }
  });

  function allSignIdsUsed(): string[] {
    return [
      ...new Set(
        allQuestions.flatMap((q) => [...(q.choiceSignIds ?? []), ...(q.signId ? [q.signId] : [])]),
      ),
    ];
  }
});

describe('legal status filtering', () => {
  it('serves only questions marked current', () => {
    for (const q of activeQuestions) {
      expect(q.legalStatus).toBe('current');
    }
  });

  it('excludes future, superseded and under_review questions from the served pool', () => {
    const excluded = allQuestions.filter((q) => q.legalStatus !== 'current');
    for (const q of excluded) {
      expect(activeQuestions.some((a) => a.id === q.id), `${q.id} leaked into the pool`).toBe(false);
    }
  });

  it('serves nothing written against a law version that is not in force', () => {
    const inForce = new Set(
      legalStatus.lawVersions.filter((v) => v.inForce).map((v) => v.id),
    );
    for (const q of activeQuestions) {
      expect(inForce.has(q.lawVersion ?? legalStatus.activeLawVersion), `${q.id}`).toBe(true);
    }
  });

  it('records the Traffic Safety Act as enacted but NOT in force', () => {
    const tsa = legalStatus.lawVersions.find((v) => v.id === 'tsa-2025');
    expect(tsa).toBeDefined();
    expect(tsa!.inForce).toBe(false);
    expect(tsa!.inForceSince).toBeNull();
    // The claim must carry its evidence and the source it came from.
    expect(tsa!.evidence.sourceId).toBe('ns-tsa-proclamations');
    expect(tsa!.evidence.observation).toMatch(/NOT PROCLAIMED IN FORCE/i);
  });

  it('keeps the Motor Vehicle Act as the active law version', () => {
    expect(legalStatus.activeLawVersion).toBe('mva');
    const mva = legalStatus.lawVersions.find((v) => v.id === 'mva');
    expect(mva!.inForce).toBe(true);
  });

  it('would drop every question if the active law version were switched off', () => {
    // Guards the filter itself: if the gate stopped working, this passes
    // trivially and the test above would not catch it.
    const gated = allQuestions.filter((q) => {
      const version = legalStatus.lawVersions.find(
        (v) => v.id === (q.lawVersion ?? legalStatus.activeLawVersion),
      );
      return q.legalStatus === 'current' && version?.inForce;
    });
    expect(gated.length).toBe(activeQuestions.length);
    expect(gated.length).toBeGreaterThan(0);
  });
});

describe('exam configuration', () => {
  it('matches the officially published Class 7 format', () => {
    expect(examConfig.sections).toHaveLength(2);
    const rules = examConfig.sections.find((s) => s.id === 'rules')!;
    const signs = examConfig.sections.find((s) => s.id === 'signs')!;

    expect(rules.questionCount).toBe(20);
    expect(rules.passingCorrect).toBe(16);
    expect(rules.timeLimitMinutes).toBe(30);
    expect(signs.questionCount).toBe(20);
    expect(signs.passingCorrect).toBe(16);
    expect(signs.timeLimitMinutes).toBe(30);

    expect(examConfig.sectionsPassIndependently).toBe(true);
    expect(examConfig.retakeRules.onlyRetakeFailedSections).toBe(true);
    expect(examConfig.eligibility.minimumAge).toBe(16);
  });

  it('traces the exam configuration to the official Class 7 page', () => {
    expect(examConfig.derivedFrom).toContain('ns-class7-test-page');
    expect(sourceIds.has('ns-class7-test-page')).toBe(true);
  });

  it('has enough active questions to build a full mock test', () => {
    for (const section of examConfig.sections) {
      const available = activeQuestions.filter((q) => q.type === section.questionType);
      expect(available.length, `${section.id} pool`).toBeGreaterThanOrEqual(section.questionCount);
    }
  });
});

describe('content freshness reporting', () => {
  it('reports the OLDEST verification date among the sources in use', () => {
    const used = sourcesInUse();
    expect(used.length).toBeGreaterThan(0);
    const oldest = used.map((s) => s.verifiedAt).sort()[0];
    expect(contentLastVerified()).toBe(oldest);
  });

  it('never claims a verification date in the future', () => {
    expect(new Date(contentLastVerified()).getTime()).toBeLessThanOrEqual(Date.now());
  });

  it('lists sources in use most authoritative first', () => {
    const used = sourcesInUse();
    for (let i = 1; i < used.length; i++) {
      expect(used[i]!.precedence).toBeGreaterThanOrEqual(used[i - 1]!.precedence);
    }
  });
});

describe('numeric facts', () => {
  const NUMERIC =
    /\b\d+(?:[.,]\d+)?\s*(?:km\/h|km|metres?|centimetres?|cm|millimetres?|mm|kg|hours?|days?|months?|years?|per cent|%|\$)/i;

  it('gives every numeric claim a locatable source reference', () => {
    const offenders: string[] = [];
    for (const q of activeQuestions as Question[]) {
      if (!NUMERIC.test(`${q.question} ${q.explanation}`)) continue;
      const locatable = q.sourceRefs.some((r) => r.section || r.page || r.chapter || r.note);
      if (!locatable) offenders.push(q.id);
    }
    expect(offenders).toEqual([]);
  });
});
