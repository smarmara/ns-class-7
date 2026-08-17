import type { ExamConfig, ExamSectionConfig, Question } from '@/content/types';

export interface AnsweredQuestion {
  questionId: string;
  /** Authored choice index the learner selected, or null if left blank. */
  authoredChoice: number | null;
}

export interface SectionResult {
  sectionId: string;
  name: string;
  shortName: string;
  questionCount: number;
  correct: number;
  incorrect: number;
  unanswered: number;
  /** Number correct needed to pass this section on its own. */
  required: number;
  passed: boolean;
  percentage: number;
  missedQuestionIds: string[];
}

export interface ExamResult {
  sections: SectionResult[];
  /**
   * Overall outcome. When the exam config says sections pass independently,
   * this is true only if EVERY section passed — an aggregate score can never
   * rescue a failed section.
   */
  passed: boolean;
  totalCorrect: number;
  totalQuestions: number;
  /** Sections that must be retaken. Empty when the whole test was passed. */
  sectionsToRetake: string[];
}

/**
 * Score one section.
 *
 * An unanswered question counts as incorrect for the purpose of the pass
 * threshold — it is not excluded from the denominator — because the real test
 * marks out of a fixed number of questions.
 */
export function scoreSection(
  section: ExamSectionConfig,
  questions: readonly Question[],
  answers: readonly AnsweredQuestion[],
): SectionResult {
  const byId = new Map(questions.map((q) => [q.id, q]));
  const answerById = new Map(answers.map((a) => [a.questionId, a.authoredChoice]));

  let correct = 0;
  let unanswered = 0;
  const missedQuestionIds: string[] = [];

  for (const question of questions) {
    const chosen = answerById.get(question.id) ?? null;
    if (chosen === null) {
      unanswered++;
      missedQuestionIds.push(question.id);
      continue;
    }
    if (chosen === question.correctChoice) {
      correct++;
    } else {
      missedQuestionIds.push(question.id);
    }
  }

  // Answers referring to questions not in this section are ignored rather than
  // silently inflating the score.
  for (const a of answers) {
    if (!byId.has(a.questionId)) continue;
  }

  const questionCount = questions.length;
  const incorrect = questionCount - correct - unanswered;

  return {
    sectionId: section.id,
    name: section.name,
    shortName: section.shortName,
    questionCount,
    correct,
    incorrect,
    unanswered,
    required: section.passingCorrect,
    passed: correct >= section.passingCorrect,
    percentage: questionCount === 0 ? 0 : Math.round((correct / questionCount) * 100),
    missedQuestionIds,
  };
}

export function scoreExam(
  config: ExamConfig,
  perSection: Record<string, { questions: readonly Question[]; answers: readonly AnsweredQuestion[] }>,
): ExamResult {
  const sections = config.sections.map((section) => {
    const entry = perSection[section.id] ?? { questions: [], answers: [] };
    return scoreSection(section, entry.questions, entry.answers);
  });

  const totalCorrect = sections.reduce((n, s) => n + s.correct, 0);
  const totalQuestions = sections.reduce((n, s) => n + s.questionCount, 0);

  const passed = config.sectionsPassIndependently
    ? sections.length > 0 && sections.every((s) => s.passed)
    : totalQuestions > 0 &&
      totalCorrect >= sections.reduce((n, s) => n + s.required, 0);

  return {
    sections,
    passed,
    totalCorrect,
    totalQuestions,
    sectionsToRetake: config.retakeRules.onlyRetakeFailedSections
      ? sections.filter((s) => !s.passed).map((s) => s.sectionId)
      : passed
        ? []
        : sections.map((s) => s.sectionId),
  };
}
