import type { ExamConfig, Question } from '@/content/types';
import { createRng, randomSeed } from '../random';
import { prepareQuestion, type PreparedQuestion } from '../quiz/selection';
import { scoreExam, type AnsweredQuestion, type ExamResult } from '../quiz/scoring';

/**
 * A mock exam session.
 *
 * The session is a plain serialisable object so it can be written to storage
 * after every interaction. That is what lets an accidental refresh — or a
 * phone killing the tab — resume exactly where the learner was, rather than
 * losing a 40-question test.
 */
export interface MockSectionState {
  sectionId: string;
  /** Question ids in the order they are presented. No repeats, within or across sections. */
  questionIds: string[];
  /** questionId -> presentation order of its choices. */
  displayOrders: Record<string, number[]>;
  /** questionId -> authored choice index the learner picked. */
  answers: Record<string, number>;
  startedAt: string | null;
  submittedAt: string | null;
  /** Milliseconds remaining when the section was last saved. */
  remainingMs: number;
}

export interface MockSession {
  id: string;
  configId: string;
  seed: number;
  createdAt: string;
  sections: MockSectionState[];
  currentSectionIndex: number;
  currentQuestionIndex: number;
  status: 'in-progress' | 'complete';
  completedAt: string | null;
}

export class NotEnoughQuestionsError extends Error {
  constructor(
    readonly sectionId: string,
    readonly needed: number,
    readonly available: number,
  ) {
    super(
      `Section "${sectionId}" needs ${needed} questions but only ${available} are available in the active bank.`,
    );
    this.name = 'NotEnoughQuestionsError';
  }
}

/**
 * Build a fresh mock exam from the official configuration.
 *
 * Questions are drawn once from a single shared pool so that the same question
 * can never appear twice in a test, even across sections.
 */
export function createMockSession(
  config: ExamConfig,
  pool: readonly Question[],
  seed: number = randomSeed(),
): MockSession {
  const rng = createRng(seed);
  const used = new Set<string>();

  const sections: MockSectionState[] = config.sections.map((section) => {
    const candidates = pool.filter((q) => q.type === section.questionType && !used.has(q.id));
    if (candidates.length < section.questionCount) {
      throw new NotEnoughQuestionsError(section.id, section.questionCount, candidates.length);
    }

    // Draw without replacement from the remaining pool.
    const remaining = candidates.slice();
    const picked: Question[] = [];
    for (let i = 0; i < section.questionCount; i++) {
      const index = rng.int(remaining.length);
      const [q] = remaining.splice(index, 1);
      picked.push(q!);
      used.add(q!.id);
    }

    const displayOrders: Record<string, number[]> = {};
    for (const q of picked) {
      displayOrders[q.id] = prepareQuestion(q, rng).displayOrder;
    }

    return {
      sectionId: section.id,
      questionIds: picked.map((q) => q.id),
      displayOrders,
      answers: {},
      startedAt: null,
      submittedAt: null,
      remainingMs: section.timeLimitMinutes * 60_000,
    };
  });

  return {
    id: `mock-${Date.now()}-${seed.toString(36)}`,
    configId: config.id,
    seed,
    createdAt: new Date().toISOString(),
    sections,
    currentSectionIndex: 0,
    currentQuestionIndex: 0,
    status: 'in-progress',
    completedAt: null,
  };
}

/** Rebuild the prepared question (with its stored choice order) for rendering. */
export function preparedFor(
  section: MockSectionState,
  question: Question,
): PreparedQuestion {
  const displayOrder =
    section.displayOrders[question.id] ?? question.choices.map((_, i) => i);
  return { question, displayOrder };
}

export function sectionAnswers(section: MockSectionState): AnsweredQuestion[] {
  return section.questionIds.map((id) => ({
    questionId: id,
    authoredChoice: id in section.answers ? section.answers[id]! : null,
  }));
}

export function isSectionComplete(section: MockSectionState): boolean {
  return section.questionIds.every((id) => id in section.answers);
}

export function answeredCount(section: MockSectionState): number {
  return section.questionIds.filter((id) => id in section.answers).length;
}

export function gradeSession(
  config: ExamConfig,
  session: MockSession,
  lookup: (id: string) => Question | undefined,
): ExamResult {
  const perSection: Record<
    string,
    { questions: Question[]; answers: AnsweredQuestion[] }
  > = {};

  for (const section of session.sections) {
    const questions = section.questionIds
      .map(lookup)
      .filter((q): q is Question => Boolean(q));
    perSection[section.sectionId] = { questions, answers: sectionAnswers(section) };
  }

  return scoreExam(config, perSection);
}

/**
 * Whether explanations may be revealed for a section.
 *
 * During the exam nothing is disclosed — not whether an answer was right, not
 * the correct choice, not the explanation. Only after the section is submitted.
 */
export function mayRevealAnswers(section: MockSectionState): boolean {
  return section.submittedAt !== null;
}
