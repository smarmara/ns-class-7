import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Question } from '@/content/types';
import { TOPIC_LABELS } from '@/content';
import { randomSeed } from '@/engine/random';
import { isCorrectDisplayChoice, selectQuestions } from '@/engine/quiz/selection';
import { practiceWeight } from '@/engine/learning/scheduler';
import type { AttemptRecord } from '@/engine/learning/types';
import { useProgress } from '@/store/useProgress';
import { QuestionView } from './QuestionView';
import { Card, EmptyState, Meter, PageHead } from './components';

interface QuizSessionProps {
  title: string;
  subtitle?: string;
  pool: readonly Question[];
  count: number;
  mode: AttemptRecord['mode'];
  /** Weight selection toward due and previously-missed questions. */
  weighted?: boolean;
  /** Shown when the pool is empty. */
  emptyState?: { emoji: string; title: string; body: React.ReactNode };
}

export function QuizSession({
  title,
  subtitle,
  pool,
  count,
  mode,
  weighted = true,
  emptyState,
}: QuizSessionProps) {
  const progress = useProgress((s) => s.progress);
  const recordAnswer = useProgress((s) => s.recordAnswer);
  const toggleBookmark = useProgress((s) => s.toggleBookmark);
  const setFlagged = useProgress((s) => s.setFlaggedForReview);

  const [seed, setSeed] = useState(() => randomSeed());
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [results, setResults] = useState<{ questionId: string; correct: boolean }[]>([]);
  const headingRef = useRef<HTMLDivElement>(null);

  // The pool and weights are read once per session so that answering a
  // question mid-session cannot reshuffle the questions still to come.
  // Snapshotted into state (not a ref read during render) so the scheduler
  // sees the progress that existed when the session began.
  const [progressAtStart, setProgressAtStart] = useState(progress);
  const questions = useMemo(() => {
    if (pool.length === 0) return [];
    const now = new Date();
    return selectQuestions(pool, {
      count: Math.min(count, pool.length),
      seed,
      ...(weighted
        ? { weightOf: (q: Question) => practiceWeight(q, progressAtStart, now) }
        : {}),
    });
  }, [pool, count, seed, weighted, progressAtStart]);

  const current = questions[index];
  const finished = questions.length > 0 && index >= questions.length;

  const handleSelect = useCallback(
    (displayIndex: number) => {
      if (!current || selected !== null) return;
      const correct = isCorrectDisplayChoice(current, displayIndex);
      setSelected(displayIndex);
      setResults((r) => [...r, { questionId: current.question.id, correct }]);
      recordAnswer(current.question, correct, mode);
    },
    [current, selected, recordAnswer, mode],
  );

  const handleNext = useCallback(() => {
    setSelected(null);
    setIndex((i) => i + 1);
  }, []);

  const restart = useCallback(() => {
    setProgressAtStart(useProgress.getState().progress);
    setSeed(randomSeed());
    setIndex(0);
    setSelected(null);
    setResults([]);
  }, []);

  // Move focus to the top of the question on each advance so keyboard and
  // screen-reader users are not left at the bottom of the previous card.
  useEffect(() => {
    headingRef.current?.focus();
  }, [index]);

  if (pool.length === 0) {
    return (
      <>
        <PageHead title={title}>{subtitle}</PageHead>
        <Card>
          <EmptyState
            emoji={emptyState?.emoji ?? '📭'}
            title={emptyState?.title ?? 'Nothing to practise here yet'}
          >
            {emptyState?.body ?? (
              <p>
                Answer some questions elsewhere and this list will fill up.{' '}
                <Link to="/practice">Try Quick Practice</Link>.
              </p>
            )}
          </EmptyState>
        </Card>
      </>
    );
  }

  if (finished) {
    const correct = results.filter((r) => r.correct).length;
    const missed = results.filter((r) => !r.correct);
    return (
      <>
        <PageHead title="Session complete">{title}</PageHead>
        <Card>
          <div className="readiness">
            <div className="readiness-score">
              {correct}
              <span className="readiness-unit"> / {results.length}</span>
            </div>
            <p className="readiness-caption">
              {correct === results.length
                ? 'Every question correct.'
                : `${missed.length} to review. They will come back around sooner.`}
            </p>
          </div>
        </Card>
        <Card className="section-gap">
          <div className="btn-row">
            <button type="button" className="btn" onClick={restart}>
              Practise again
            </button>
            <Link className="btn btn-secondary" to="/">
              Back to dashboard
            </Link>
          </div>
          {missed.length > 0 && (
            <p className="small muted" style={{ marginTop: 12, marginBottom: 0 }}>
              Missed questions are waiting in{' '}
              <Link to="/review/mistakes">your mistakes queue</Link>.
            </p>
          )}
        </Card>
      </>
    );
  }

  if (!current) return null;

  const stat = progress.questions[current.question.id];
  const answered = selected !== null;

  return (
    <>
      <div ref={headingRef} tabIndex={-1} style={{ outline: 'none' }}>
        <PageHead title={title}>{subtitle}</PageHead>
      </div>

      <div className="quiz-progress">
        <Meter
          label="Session progress"
          value={index}
          max={questions.length}
          display={`${index + 1} of ${questions.length}`}
        />
      </div>

      <Card>
        <QuestionView
          prepared={current}
          selected={selected}
          reveal="immediate"
          onSelect={handleSelect}
          questionNumber={index + 1}
          questionTotal={questions.length}
        />

        <div className="quiz-actions">
          <button
            type="button"
            className="icon-toggle"
            aria-pressed={stat?.bookmarked ?? false}
            onClick={() => toggleBookmark(current.question.id)}
          >
            <span aria-hidden="true">{stat?.bookmarked ? '★' : '☆'}</span>
            {stat?.bookmarked ? 'Saved' : 'Save'}
          </button>

          {answered && (
            <button
              type="button"
              className="icon-toggle"
              aria-pressed={stat?.flaggedForReview ?? false}
              onClick={() => setFlagged(current.question.id, !(stat?.flaggedForReview ?? false))}
            >
              <span aria-hidden="true">↻</span>
              Review again
            </button>
          )}

          {answered && (
            <button type="button" className="btn" onClick={handleNext}>
              {index === questions.length - 1 ? 'Finish' : 'Next question'}
            </button>
          )}
        </div>
      </Card>

      {!answered && (
        <p className="tiny faint section-gap" style={{ textAlign: 'center' }}>
          Choose an answer to see the explanation and its official source.
        </p>
      )}
      {answered && current.question.topic && (
        <p className="tiny faint section-gap" style={{ textAlign: 'center' }}>
          Topic: {TOPIC_LABELS[current.question.topic]}
        </p>
      )}
    </>
  );
}
