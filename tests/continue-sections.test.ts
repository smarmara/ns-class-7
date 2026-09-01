import { describe, expect, it } from 'vitest';
import { RULES_TOPICS, type Topic } from '@/content/types';
import { activeQuestions } from '@/content';
import { LEARNER_TAXONOMY } from '@/content/learner-signs';
import { emptyProgress } from '@/engine/learning/types';
import {
  STRONG_SESSION_ACCURACY,
  isStrongSession,
  learnSectionSequence,
  nextLearnSection,
} from '@/engine/learning/sections';
import { isComplete, topicMastery } from '@/engine/learning/mastery';
import type { Progress } from '@/engine/learning/types';

/**
 * Continuing after a strong section.
 *
 * The threshold is a UX rule about one sitting; it must never be confused with
 * Complete or Mastered, which are computed over a topic's whole history.
 */

const progress = emptyProgress();

describe('strong-session threshold', () => {
  it('is 90% and is compared without floating-point drift', () => {
    expect(STRONG_SESSION_ACCURACY).toBe(0.9);
    expect(isStrongSession(9, 10)).toBe(true);
    expect(isStrongSession(89, 100)).toBe(false);
    expect(isStrongSession(90, 100)).toBe(true);
    expect(isStrongSession(10, 10)).toBe(true);
    // 8/9 is 88.9% — below the line; 9/9 is not.
    expect(isStrongSession(8, 9)).toBe(false);
    expect(isStrongSession(9, 9)).toBe(true);
  });

  it('treats an empty session as not strong', () => {
    expect(isStrongSession(0, 0)).toBe(false);
    expect(isStrongSession(0, 5)).toBe(false);
  });

  it('says nothing about mastery', () => {
    // A perfect short session does not make a topic Complete.
    const topic = RULES_TOPICS[0]!;
    expect(isStrongSession(6, 6)).toBe(true);
    expect(isComplete(topicMastery(activeQuestions, progress, topic).stage)).toBe(false);
  });
});

describe('canonical section sequence', () => {
  const sequence = learnSectionSequence();

  it('runs the Rules topics first, in their declared order', () => {
    const rules = sequence.filter((entry) => entry.section.kind === 'rules');
    expect(rules.map((entry) => (entry.section as { topic: Topic }).topic)).toEqual([
      ...RULES_TOPICS,
    ]);
    expect(sequence.slice(0, rules.length)).toEqual(rules);
  });

  it('then the sign categories, in canonical learner-taxonomy order', () => {
    const signs = sequence.filter((entry) => entry.section.kind === 'signs');
    expect(signs.map((entry) => (entry.section as { category: string }).category)).toEqual(
      LEARNER_TAXONOMY.map((entry) => entry.id),
    );
    // Canonical labels, never historical sign-question-topic names.
    expect(signs.map((entry) => entry.label)).toContain('Lane Use & Turns');
    expect(signs.map((entry) => entry.label)).toContain('School, Pedestrian & Cyclist');
    expect(signs.map((entry) => entry.label)).not.toContain('Pedestrian and cyclist signs');
  });

  it('sends each section to the destination its Learn card uses', () => {
    for (const entry of sequence) {
      if (entry.section.kind === 'rules') {
        expect(entry.to).toBe(`/study/${entry.section.topic}`);
      } else {
    expect(entry.to).toBe(`/study/signs/${entry.section.category}`);
      }
    }
  });
});

describe('next section resolution', () => {
  it('advances a Rules topic to the following Rules topic', () => {
    const first = RULES_TOPICS[0]!;
    const second = RULES_TOPICS[1]!;
    const next = nextLearnSection({ kind: 'rules', topic: first }, activeQuestions, progress);
    expect(next?.section).toEqual({ kind: 'rules', topic: second });
    expect(next?.to).toBe(`/study/${second}`);
    expect(next?.label).toBeTruthy();
  });

  it('carries the last Rules topic into the first sign category', () => {
    const last = RULES_TOPICS[RULES_TOPICS.length - 1]!;
    const next = nextLearnSection({ kind: 'rules', topic: last }, activeQuestions, progress);
    expect(next?.section).toEqual({ kind: 'signs', category: LEARNER_TAXONOMY[0]!.id });
  });

  it('advances a sign category to the next canonical category', () => {
    const next = nextLearnSection(
      { kind: 'signs', category: 'regulatory' },
      activeQuestions,
      progress,
    );
    expect(next?.section).toEqual({ kind: 'signs', category: 'lane-use' });
    expect(next?.label).toBe('Lane Use & Turns');
    expect(next?.to).toBe('/study/signs/lane-use');
  });

  it('has no target after the final section', () => {
    const last = LEARNER_TAXONOMY[LEARNER_TAXONOMY.length - 1]!.id;
    expect(nextLearnSection({ kind: 'signs', category: last }, activeQuestions, progress)).toBeNull();
  });

  it('returns nothing for a section outside the sequence', () => {
    expect(
      nextLearnSection({ kind: 'rules', topic: 'not-a-topic' as Topic }, activeQuestions, progress),
    ).toBeNull();
  });

  it('skips a following section the learner has already completed', () => {
    // Complete the second Rules topic, then finish the first.
    const [first, second, third] = RULES_TOPICS as readonly Topic[];
    const completed: Progress = structuredClone(progress);
    const now = new Date().toISOString();
    for (const question of activeQuestions.filter((q) => q.topic === second)) {
      completed.questions[question.id] = {
        questionId: question.id,
        seen: 3,
        correct: 3,
        incorrect: 0,
        lastSeenAt: now,
        lastResult: 'correct',
        streak: 3,
        box: 4,
        dueAt: now,
        bookmarked: false,
        flaggedForReview: false,
      };
      completed.attempts.push({
        questionId: question.id,
        topic: second!,
        type: question.type,
        correct: true,
        at: now,
        mode: 'topic',
      });
    }

    expect(isComplete(topicMastery(activeQuestions, completed, second!).stage)).toBe(true);
    const next = nextLearnSection({ kind: 'rules', topic: first! }, activeQuestions, completed);
    expect(next?.section).toEqual({ kind: 'rules', topic: third! });
  });

  it('still offers the immediate next section when everything ahead is done', () => {
    // Never leaves a mid-course learner with no forward action at all.
    const secondLast = LEARNER_TAXONOMY[LEARNER_TAXONOMY.length - 2]!.id;
    const next = nextLearnSection(
      { kind: 'signs', category: secondLast },
      activeQuestions,
      progress,
    );
    expect(next).not.toBeNull();
    expect(next!.section).toEqual({
      kind: 'signs',
      category: LEARNER_TAXONOMY[LEARNER_TAXONOMY.length - 1]!.id,
    });
  });
});
