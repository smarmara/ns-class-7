import type { QuestionType, Topic } from '@/content/types';

export interface QuestionStat {
  questionId: string;
  seen: number;
  correct: number;
  incorrect: number;
  /** ISO timestamp of the last time this question was answered. */
  lastSeenAt: string;
  lastResult: 'correct' | 'incorrect';
  /** Consecutive correct answers. Resets to 0 on a miss. */
  streak: number;
  /** Leitner box, 0 (new/just missed) to 5 (well known). */
  box: number;
  /** ISO timestamp before which this question should not be repeated. */
  dueAt: string;
  bookmarked: boolean;
  /** Set by the learner's "review this again" action. */
  flaggedForReview: boolean;
}

export interface AttemptRecord {
  questionId: string;
  topic: Topic;
  type: QuestionType;
  correct: boolean;
  at: string;
  /** Which surface the answer came from. Mock test answers are recorded too. */
  mode: 'quick' | 'topic' | 'signs' | 'weak' | 'mistakes' | 'saved' | 'mock';
}

export interface MockTestSectionRecord {
  sectionId: string;
  shortName: string;
  correct: number;
  questionCount: number;
  required: number;
  passed: boolean;
}

export interface MockTestRecord {
  id: string;
  startedAt: string;
  completedAt: string;
  passed: boolean;
  sections: MockTestSectionRecord[];
  missedQuestionIds: string[];
}

export interface StudyStreak {
  current: number;
  longest: number;
  /** Local calendar date (YYYY-MM-DD) of the last day with any activity. */
  lastStudyDate: string | null;
}

export interface Progress {
  version: number;
  questions: Record<string, QuestionStat>;
  /** Rolling log, newest last. Trimmed to keep storage small. */
  attempts: AttemptRecord[];
  mockTests: MockTestRecord[];
  streak: StudyStreak;
}

export const PROGRESS_VERSION = 1;
export const MAX_ATTEMPT_LOG = 800;
export const MAX_MOCK_TESTS = 40;

export function emptyProgress(): Progress {
  return {
    version: PROGRESS_VERSION,
    questions: {},
    attempts: [],
    mockTests: [],
    streak: { current: 0, longest: 0, lastStudyDate: null },
  };
}
