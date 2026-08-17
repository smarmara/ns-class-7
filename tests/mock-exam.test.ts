import { describe, expect, it } from 'vitest';
import { activeQuestions, examConfig, getQuestion } from '@/content';
import type { Question } from '@/content/types';
import {
  NotEnoughQuestionsError,
  answeredCount,
  createMockSession,
  gradeSession,
  isSectionComplete,
  mayRevealAnswers,
  preparedFor,
  sectionAnswers,
} from '@/engine/exam/mockTest';
import { correctDisplayIndex, isCorrectDisplayChoice } from '@/engine/quiz/selection';

describe('mock session construction', () => {
  it('builds every section at the officially published size', () => {
    const session = createMockSession(examConfig, activeQuestions, 1234);
    expect(session.sections).toHaveLength(examConfig.sections.length);
    session.sections.forEach((section, i) => {
      expect(section.questionIds).toHaveLength(examConfig.sections[i]!.questionCount);
      expect(section.remainingMs).toBe(examConfig.sections[i]!.timeLimitMinutes * 60_000);
    });
  });

  it('draws each section from the right question type', () => {
    const session = createMockSession(examConfig, activeQuestions, 99);
    session.sections.forEach((section, i) => {
      const expected = examConfig.sections[i]!.questionType;
      for (const id of section.questionIds) {
        expect(getQuestion(id)!.type).toBe(expected);
      }
    });
  });

  it('never repeats a question, within a section OR across sections', () => {
    for (let seed = 0; seed < 25; seed++) {
      const session = createMockSession(examConfig, activeQuestions, seed);
      const all = session.sections.flatMap((s) => s.questionIds);
      expect(new Set(all).size, `seed ${seed}`).toBe(all.length);
    }
  });

  it('is reproducible from its seed', () => {
    const a = createMockSession(examConfig, activeQuestions, 777);
    const b = createMockSession(examConfig, activeQuestions, 777);
    expect(a.sections.map((s) => s.questionIds)).toEqual(b.sections.map((s) => s.questionIds));
    expect(a.sections.map((s) => s.displayOrders)).toEqual(b.sections.map((s) => s.displayOrders));
  });

  it('produces different papers on different seeds', () => {
    const papers = new Set(
      Array.from({ length: 12 }, (_, seed) =>
        createMockSession(examConfig, activeQuestions, seed)
          .sections.flatMap((s) => s.questionIds)
          .join(','),
      ),
    );
    expect(papers.size).toBeGreaterThan(1);
  });

  it('stores a complete choice order for every question drawn', () => {
    const session = createMockSession(examConfig, activeQuestions, 5);
    for (const section of session.sections) {
      for (const id of section.questionIds) {
        const question = getQuestion(id)!;
        const order = section.displayOrders[id]!;
        expect(order).toHaveLength(question.choices.length);
        expect([...order].sort((x, y) => x - y)).toEqual(question.choices.map((_, i) => i));
      }
    }
  });

  it('refuses to build a paper it cannot fill, rather than repeating questions', () => {
    const tiny = activeQuestions.filter((q) => q.type === 'rules').slice(0, 3);
    expect(() => createMockSession(examConfig, tiny, 1)).toThrow(NotEnoughQuestionsError);
  });

  it('starts unstarted, unsubmitted and in progress', () => {
    const session = createMockSession(examConfig, activeQuestions, 1);
    expect(session.status).toBe('in-progress');
    expect(session.currentSectionIndex).toBe(0);
    expect(session.currentQuestionIndex).toBe(0);
    for (const section of session.sections) {
      expect(section.startedAt).toBeNull();
      expect(section.submittedAt).toBeNull();
      expect(section.answers).toEqual({});
    }
  });
});

describe('answer disclosure', () => {
  it('withholds answers until the section is submitted', () => {
    const session = createMockSession(examConfig, activeQuestions, 2);
    const section = session.sections[0]!;
    expect(mayRevealAnswers(section)).toBe(false);
    expect(mayRevealAnswers({ ...section, submittedAt: new Date().toISOString() })).toBe(true);
  });
});

describe('grading a session', () => {
  function answerSession(seed: number, correctPerSection: number[]) {
    const session = createMockSession(examConfig, activeQuestions, seed);
    session.sections.forEach((section, sectionIndex) => {
      section.questionIds.forEach((id, i) => {
        const question = getQuestion(id)!;
        const wanted = correctPerSection[sectionIndex]!;
        section.answers[id] =
          i < wanted
            ? question.correctChoice
            : (question.correctChoice + 1) % question.choices.length;
      });
    });
    return session;
  }

  it('scores a perfect paper as a pass', () => {
    const session = answerSession(3, [20, 20]);
    const result = gradeSession(examConfig, session, getQuestion);
    expect(result.passed).toBe(true);
    expect(result.totalCorrect).toBe(40);
    expect(result.sections.every((s) => s.passed)).toBe(true);
  });

  it('fails the whole test when one section falls one mark short', () => {
    const session = answerSession(4, [20, 15]);
    const result = gradeSession(examConfig, session, getQuestion);
    expect(result.passed).toBe(false);
    expect(result.sectionsToRetake).toEqual(['signs']);
  });

  it('counts blanks as incorrect', () => {
    const session = createMockSession(examConfig, activeQuestions, 6);
    const result = gradeSession(examConfig, session, getQuestion);
    expect(result.totalCorrect).toBe(0);
    expect(result.passed).toBe(false);
    for (const s of result.sections) expect(s.unanswered).toBe(s.questionCount);
  });

  it('scores against the authored answer regardless of the shuffled order shown', () => {
    const session = createMockSession(examConfig, activeQuestions, 8);
    const section = session.sections[0]!;

    // Answer by clicking the position the correct answer is displayed at.
    for (const id of section.questionIds) {
      const question = getQuestion(id)!;
      const prepared = preparedFor(section, question);
      const displayIndex = correctDisplayIndex(prepared);
      expect(isCorrectDisplayChoice(prepared, displayIndex)).toBe(true);
      section.answers[id] = prepared.displayOrder[displayIndex]!;
    }

    const result = gradeSession(examConfig, session, getQuestion);
    const rules = result.sections.find((s) => s.sectionId === 'rules')!;
    expect(rules.correct).toBe(rules.questionCount);
    expect(rules.passed).toBe(true);
  });

  it('lists the questions that were missed', () => {
    const session = answerSession(9, [18, 20]);
    const result = gradeSession(examConfig, session, getQuestion);
    const rules = result.sections.find((s) => s.sectionId === 'rules')!;
    expect(rules.missedQuestionIds).toHaveLength(2);
    for (const id of rules.missedQuestionIds) {
      expect(session.sections[0]!.questionIds).toContain(id);
    }
  });
});

describe('section progress helpers', () => {
  it('tracks how many questions are answered', () => {
    const session = createMockSession(examConfig, activeQuestions, 11);
    const section = session.sections[0]!;
    expect(answeredCount(section)).toBe(0);
    expect(isSectionComplete(section)).toBe(false);

    section.answers[section.questionIds[0]!] = 0;
    expect(answeredCount(section)).toBe(1);

    for (const id of section.questionIds) section.answers[id] = 0;
    expect(isSectionComplete(section)).toBe(true);
  });

  it('reports unanswered questions as null rather than omitting them', () => {
    const session = createMockSession(examConfig, activeQuestions, 12);
    const section = session.sections[0]!;
    section.answers[section.questionIds[0]!] = 1;

    const answers = sectionAnswers(section);
    expect(answers).toHaveLength(section.questionIds.length);
    expect(answers[0]!.authoredChoice).toBe(1);
    expect(answers[1]!.authoredChoice).toBeNull();
  });
});

describe('session serialisation', () => {
  it('survives a JSON round trip, so a refresh restores the exact paper', () => {
    const session = createMockSession(examConfig, activeQuestions, 42);
    session.sections[0]!.answers[session.sections[0]!.questionIds[0]!] = 2;
    session.sections[0]!.remainingMs = 987_000;

    const restored = JSON.parse(JSON.stringify(session)) as typeof session;

    expect(restored).toEqual(session);
    expect(restored.sections[0]!.remainingMs).toBe(987_000);

    // The restored paper grades identically.
    const before = gradeSession(examConfig, session, getQuestion);
    const after = gradeSession(examConfig, restored, getQuestion);
    expect(after).toEqual(before);
  });

  it('rebuilds the same choice order after a round trip', () => {
    const session = createMockSession(examConfig, activeQuestions, 43);
    const restored = JSON.parse(JSON.stringify(session)) as typeof session;

    const id = session.sections[0]!.questionIds[0]!;
    const question = getQuestion(id) as Question;
    expect(preparedFor(restored.sections[0]!, question).displayOrder).toEqual(
      preparedFor(session.sections[0]!, question).displayOrder,
    );
  });
});
