import { describe, expect, it } from 'vitest';
import { scoreExam, scoreSection, type AnsweredQuestion } from '@/engine/quiz/scoring';
import type { ExamConfig, ExamSectionConfig, Question } from '@/content/types';
import { examConfig } from '@/content';

function q(id: string, correctChoice: number, type: 'rules' | 'sign' = 'rules'): Question {
  return {
    id,
    type,
    topic: 'right-of-way',
    question: `Question ${id}?`,
    choices: ['a', 'b', 'c', 'd'],
    correctChoice,
    explanation: 'because',
    difficulty: 'easy',
    tags: [],
    sourceRefs: [{ sourceId: 'ns-handbook-ch2' }],
    legalStatus: 'current',
    verifiedAt: '2026-08-17',
    lawVersion: 'mva',
  };
}

const section: ExamSectionConfig = {
  id: 'rules',
  name: 'Rules of the Road Test',
  shortName: 'Rules',
  questionType: 'rules',
  description: '',
  questionCount: 20,
  passingCorrect: 16,
  timeLimitMinutes: 30,
  format: 'multiple-choice',
};

function answersFor(questions: Question[], correctCount: number): AnsweredQuestion[] {
  return questions.map((question, i) => ({
    questionId: question.id,
    // Deliberately pick a wrong index for the tail.
    authoredChoice: i < correctCount ? question.correctChoice : (question.correctChoice + 1) % 4,
  }));
}

describe('scoreSection', () => {
  const questions = Array.from({ length: 20 }, (_, i) => q(`q${i}`, i % 4));

  it('counts correct answers and applies the section threshold', () => {
    const result = scoreSection(section, questions, answersFor(questions, 16));
    expect(result.correct).toBe(16);
    expect(result.incorrect).toBe(4);
    expect(result.required).toBe(16);
    expect(result.passed).toBe(true);
  });

  it('fails one mark below the threshold', () => {
    const result = scoreSection(section, questions, answersFor(questions, 15));
    expect(result.correct).toBe(15);
    expect(result.passed).toBe(false);
  });

  it('passes exactly at the threshold and not below — boundary is inclusive', () => {
    expect(scoreSection(section, questions, answersFor(questions, 16)).passed).toBe(true);
    expect(scoreSection(section, questions, answersFor(questions, 15)).passed).toBe(false);
    expect(scoreSection(section, questions, answersFor(questions, 20)).passed).toBe(true);
  });

  it('treats unanswered questions as incorrect without dropping them from the denominator', () => {
    const answers: AnsweredQuestion[] = questions.map((question, i) => ({
      questionId: question.id,
      authoredChoice: i < 18 ? question.correctChoice : null,
    }));
    const result = scoreSection(section, questions, answers);
    expect(result.correct).toBe(18);
    expect(result.unanswered).toBe(2);
    expect(result.incorrect).toBe(0);
    expect(result.questionCount).toBe(20);
    expect(result.passed).toBe(true);
  });

  it('treats a completely blank section as zero, not as a pass', () => {
    const result = scoreSection(section, questions, []);
    expect(result.correct).toBe(0);
    expect(result.unanswered).toBe(20);
    expect(result.passed).toBe(false);
  });

  it('ignores answers for questions that are not in the section', () => {
    const answers = [
      ...answersFor(questions, 20),
      { questionId: 'not-in-section', authoredChoice: 0 },
    ];
    const result = scoreSection(section, questions, answers);
    expect(result.correct).toBe(20);
    expect(result.questionCount).toBe(20);
  });

  it('reports every missed question id', () => {
    const result = scoreSection(section, questions, answersFor(questions, 17));
    expect(result.missedQuestionIds).toHaveLength(3);
    expect(result.missedQuestionIds).toEqual(['q17', 'q18', 'q19']);
  });
});

describe('scoreExam — sections pass independently', () => {
  const rules = Array.from({ length: 20 }, (_, i) => q(`r${i}`, i % 4));
  const signs = Array.from({ length: 20 }, (_, i) => q(`s${i}`, i % 4, 'sign'));

  function run(rulesCorrect: number, signsCorrect: number) {
    return scoreExam(examConfig, {
      rules: { questions: rules, answers: answersFor(rules, rulesCorrect) },
      signs: { questions: signs, answers: answersFor(signs, signsCorrect) },
    });
  }

  it('passes only when every section passes', () => {
    expect(run(16, 16).passed).toBe(true);
    expect(run(20, 20).passed).toBe(true);
  });

  it('a strong section CANNOT rescue a failed section', () => {
    // 20/20 + 15/20 = 35/40 overall, comfortably above any aggregate
    // threshold — but the signs section is one mark short, so it is a fail.
    const result = run(20, 15);
    expect(result.totalCorrect).toBe(35);
    expect(result.passed).toBe(false);
    expect(result.sections.find((s) => s.sectionId === 'signs')!.passed).toBe(false);
    expect(result.sections.find((s) => s.sectionId === 'rules')!.passed).toBe(true);
  });

  it('names only the failed sections for retaking', () => {
    expect(run(20, 15).sectionsToRetake).toEqual(['signs']);
    expect(run(15, 20).sectionsToRetake).toEqual(['rules']);
    expect(run(10, 10).sectionsToRetake).toEqual(['rules', 'signs']);
    expect(run(16, 16).sectionsToRetake).toEqual([]);
  });

  it('uses the thresholds from the official exam config, not hard-coded numbers', () => {
    expect(examConfig.sectionsPassIndependently).toBe(true);
    expect(examConfig.aggregateScoreDecidesOutcome).toBe(false);
    for (const s of examConfig.sections) {
      expect(s.questionCount).toBe(20);
      expect(s.passingCorrect).toBe(16);
    }
  });

  it('falls back to an aggregate rule only when the config says sections are not independent', () => {
    const aggregate: ExamConfig = {
      ...examConfig,
      sectionsPassIndependently: false,
    };
    const result = scoreExam(aggregate, {
      rules: { questions: rules, answers: answersFor(rules, 20) },
      signs: { questions: signs, answers: answersFor(signs, 15) },
    });
    // 35 >= 16 + 16 = 32
    expect(result.passed).toBe(true);
  });
});
