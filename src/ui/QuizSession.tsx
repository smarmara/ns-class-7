import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Question } from '@/content/types';
import { TOPIC_LABELS, activeQuestions } from '@/content';
import { randomSeed } from '@/engine/random';
import { correctDisplayIndex, isCorrectDisplayChoice, selectQuestions } from '@/engine/quiz/selection';
import { practiceWeight } from '@/engine/learning/scheduler';
import { topicMastery } from '@/engine/learning/mastery';
import { isStrongSession, nextLearnSection, type LearnSection } from '@/engine/learning/sections';
import type { AttemptRecord } from '@/engine/learning/types';
import { XP_CORRECT_ANSWER } from '@/engine/engagement/types';
import { sessionXp } from '@/engine/engagement/xp';
import { getNewAchievementEvents } from '@/engine/engagement/achievementEvents';
import { useProgress } from '@/store/useProgress';
import { useEngagement } from '@/store/useEngagement';
import { QuestionView, questionTopicLabel } from './QuestionView';
import { Card, EmptyState, PageHead } from './components';
import { BackIcon, BookmarkIcon, FocusIcon, XpIcon } from './icons';
import { MasteryBar } from './progress';
import { AchievementAwardCard } from './AchievementAwardCard';

interface QuizSessionProps {
  /** Stable identity for one kind of session; changing it starts a new run. */
  sessionKey: string;
  title: string;
  /** Optional learner-facing label for sessions spanning legacy question topics. */
  sessionLabel?: string;
  subtitle?: string;
  /** Where the compact back control returns to. */
  backTo?: string;
  pool: readonly Question[];
  count: number;
  mode: AttemptRecord['mode'];
  /** Weight selection toward due and previously-missed questions. */
  weighted?: boolean;
  /** Shown when the pool is empty. */
  emptyState?: { emoji: string; title: string; body: React.ReactNode };
  /**
   * Which Learn section this session covers, when it covers exactly one.
   *
   * Supplying it lets a strong result offer to continue to the next section.
   * Mixed sessions — Quick Practice, the review queues, the all-signs drill —
   * leave it unset, because "the next section" means nothing after a session
   * that spanned several. The practice exam has its own result screen and does
   * not use this component at all.
   */
  section?: LearnSection;
}

function QuizSessionRun({
  onPractiseAgain,
  title,
  sessionLabel,
  subtitle,
  backTo = '/',
  pool,
  count,
  mode,
  weighted = true,
  emptyState,
  section,
}: QuizSessionProps & { onPractiseAgain: () => void }) {
  const progress = useProgress((s) => s.progress);
  const recordAnswer = useProgress((s) => s.recordAnswer);
  const toggleBookmark = useProgress((s) => s.toggleBookmark);
  const setFlagged = useProgress((s) => s.setFlaggedForReview);

  const [seed] = useState(() => randomSeed());
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [results, setResults] = useState<{ questionId: string; correct: boolean }[]>([]);
  const headingRef = useRef<HTMLDivElement>(null);
  const [sessionPool] = useState(pool);

  // The pool and weights are read once per session so that answering a
  // question mid-session cannot reshuffle the questions still to come.
  // Snapshotted into state (not a ref read during render) so the scheduler
  // sees the progress that existed when the session began.
  const [progressAtStart] = useState(progress);
  const questions = useMemo(() => {
    if (sessionPool.length === 0) return [];
    const now = new Date();
    return selectQuestions(sessionPool, {
      count: Math.min(count, sessionPool.length),
      seed,
      ...(weighted
        ? { weightOf: (q: Question) => practiceWeight(q, progressAtStart, now) }
        : {}),
    });
  }, [sessionPool, count, seed, weighted, progressAtStart]);

  const current = questions[index];
  const finished = questions.length > 0 && index >= questions.length;
  const correct = results.filter((r) => r.correct).length;
  const missed = results.filter((r) => !r.correct);

  const xpBreakdown = useMemo(
    () =>
      finished
        ? sessionXp(activeQuestions, progressAtStart, progress, correct)
        : null,
    [finished, progressAtStart, progress, correct],
  );

  // Award the session XP exactly once, on the screen that reports it.
  const xpAwarded = useRef(false);
  useEffect(() => {
    if (!finished || xpAwarded.current || !xpBreakdown) return;
    xpAwarded.current = true;
    useEngagement.getState().awardSession(xpBreakdown);
  }, [finished, xpBreakdown]);

  // Topics whose mastery improved during this session, for the summary.
  const improved = useMemo(() => {
    if (!finished) return [];
    const touched = [...new Set(results.map((r) => r.questionId))];
    const topics = [
      ...new Set(
        touched
          .map((id) => activeQuestions.find((q) => q.id === id)?.topic)
          .filter((t): t is Question['topic'] => t !== undefined),
      ),
    ];
    return topics
      .map((topic) => {
        const before = topicMastery(activeQuestions, progressAtStart, topic);
        const after = topicMastery(activeQuestions, progress, topic);
        return { topic, before, after };
      })
      .filter((t) => t.after.stage !== t.before.stage)
      .slice(0, 3);
  }, [finished, results, progressAtStart, progress]);

  const achievementEvents = useMemo(
    () => (finished ? getNewAchievementEvents(activeQuestions, progressAtStart, progress, 'learning') : []),
    [finished, progressAtStart, progress],
  );

  const handleSelect = useCallback(
    (displayIndex: number) => {
      if (!current || selected !== null) return;
      const isCorrect = isCorrectDisplayChoice(current, displayIndex);
      setSelected(displayIndex);
      setResults((r) => [...r, { questionId: current.question.id, correct: isCorrect }]);
      recordAnswer(current.question, isCorrect, mode);
      if (isCorrect) useEngagement.getState().awardCorrect();
    },
    [current, selected, recordAnswer, mode],
  );

  const handleNext = useCallback(() => {
    setSelected(null);
    setIndex((i) => i + 1);
  }, []);

  // Move focus to the top of the question on each advance so keyboard and
  // screen-reader users are not left at the bottom of the previous card.
  useEffect(() => {
    headingRef.current?.focus();
  }, [index]);

  if (sessionPool.length === 0) {
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
                <Link to="/practice/quick">Try Quick Practice</Link>.
              </p>
            )}
          </EmptyState>
        </Card>
      </>
    );
  }

  if (finished) {
    /*
     * Continuing is offered only for a single-section session that went well
     * and has somewhere to go. Showing it after a shaky attempt would be
     * encouraging the learner past material they have not got yet.
     */
    const strong = isStrongSession(correct, results.length);
    const continueTo =
      section && strong ? nextLearnSection(section, activeQuestions, progress) : null;

    return (
      <>
        <PageHead title="Session complete">{title}</PageHead>

        <Card className="session-result">
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

          {xpBreakdown && (
            <div className="xp-summary">
              <span className="xp-summary-total">
                <XpIcon /> {xpBreakdown.total} XP earned
              </span>
              <ul className="xp-summary-lines">
                <li>
                  {xpBreakdown.correct} XP · {correct} correct answer
                  {correct === 1 ? '' : 's'}
                </li>
                <li>{xpBreakdown.completion} XP · session complete</li>
                    {xpBreakdown.recovery > 0 && (
                      <li>
                        {xpBreakdown.recovery} XP ·{' '}
                        {xpBreakdown.recoveredTopics
                      .map((t) =>
                        section?.kind === 'signs'
                          ? title
                          : TOPIC_LABELS[t as Question['topic']] ?? t,
                      )
                      .join(', ')}{' '}
                    out of the weak zone
                  </li>
                )}
              </ul>
            </div>
          )}

          {improved.length > 0 && (
            <div className="topic-improved">
              <span className="eyebrow">Progress this session</span>
              <ul>
                {improved.map((t) => (
                  <li key={t.topic}>
                    <span>
                      {section?.kind === 'signs'
                        ? title
                        : TOPIC_LABELS[t.topic as Question['topic']] ?? t.topic}
                    </span>
                    <MasteryBar stage={t.after.stage} />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>

        {achievementEvents.length > 0 && (
          <div className="achievement-awards section-gap" aria-label="New achievements">
            {achievementEvents.map((event) => <AchievementAwardCard key={event.id} event={event} />)}
          </div>
        )}

        <Card className="section-gap">
          {/*
           * A strong result leads with continuing; a weaker one leads with
           * another attempt. The learner is never pushed forward off a session
           * that suggested more practice would help.
           */}
          <div className="btn-row">
            {continueTo ? (
              <>
                <Link className="btn btn-primary" to={continueTo.to}>
                  Continue to {continueTo.label}
                </Link>
                <button type="button" className="btn btn-secondary" onClick={onPractiseAgain}>
                  Practise again
                </button>
              </>
            ) : (
              <>
                <button type="button" className="btn" onClick={onPractiseAgain}>
                  Practise again
                </button>
                <Link className="btn btn-secondary" to="/">
                  Back to dashboard
                </Link>
              </>
            )}
          </div>
          {continueTo && (
            <p className="small muted result-tertiary">
              <Link to="/">Back to dashboard</Link>
            </p>
          )}
          {missed.length > 0 && (
            <p className="small muted" style={{ marginTop: 12, marginBottom: 0 }}>
              Missed questions are waiting in{' '}
              <Link to="/review/mistakes">your mistakes queue</Link>.
            </p>
          )}
          <Link className="continue-next" to="/learn">
            <FocusIcon /> See what to learn next
          </Link>
        </Card>
      </>
    );
  }

  if (!current) return null;

  const stat = progress.questions[current.question.id];
  const answered = selected !== null;
  const saved = stat?.bookmarked ?? false;

  return (
    <div className="screen quiz">
      {/* The screen still owns a level-1 heading for document structure and
          screen-reader navigation; it is visually replaced by the compact bar
          below, which shows the same context in far less vertical space. */}
      <h1 className="sr-only">{title}</h1>
      {/*
        One compact row carries everything the learner needs to orient: where
        they came from, what this is, how far through they are, and the save
        action. A full page header above every question is the single biggest
        cause of a question not fitting a phone screen.
      */}
      <div className="quiz-bar">
        <Link className="quiz-back" to={backTo} aria-label={`Leave ${title}`}>
          <BackIcon />
        </Link>
        <span className="quiz-topic">{sessionLabel ?? questionTopicLabel(current.question)}</span>
        <span className="quiz-count">
          {index + 1}
          <span className="quiz-count-sep">/</span>
          {questions.length}
        </span>
        <button
          type="button"
          className="quiz-save"
          aria-pressed={saved}
          onClick={() => toggleBookmark(current.question.id)}
        >
          <BookmarkIcon />
          <span className="sr-only">{saved ? 'Saved' : 'Save'}</span>
        </button>
      </div>

      <div
        className="quiz-rail"
        role="progressbar"
        aria-label="Session progress"
        aria-valuenow={index + 1}
        aria-valuemin={1}
        aria-valuemax={questions.length}
        aria-valuetext={`Question ${index + 1} of ${questions.length}`}
      >
        <span
          className="quiz-rail-fill"
          style={{ width: `${((index + 1) / questions.length) * 100}%` }}
        />
      </div>

      <div ref={headingRef} tabIndex={-1} className="quiz-focus">
        <QuestionView
          prepared={current}
          selected={selected}
          reveal="immediate"
          onSelect={handleSelect}
          questionNumber={index + 1}
          questionTotal={questions.length}
          onContinue={answered ? handleNext : undefined}
          continueLabel={index === questions.length - 1 ? 'Finish' : 'Next question'}
          xpEarned={answered && selected === correctDisplayIndex(current) ? XP_CORRECT_ANSWER : 0}
        />
      </div>

      {answered && (
        <div className="quiz-after">
          <button
            type="button"
            className="quiz-flag"
            aria-pressed={stat?.flaggedForReview ?? false}
            onClick={() => setFlagged(current.question.id, !(stat?.flaggedForReview ?? false))}
          >
            Review this again
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Owns the lifecycle boundary for an ephemeral quiz run. Route changes alter
 * sessionKey; Practise again increments the nonce. In both cases the run
 * component remounts and all session-local state starts from its initializer.
 */
export function QuizSession({ sessionKey, ...props }: QuizSessionProps) {
  const [run, setRun] = useState(0);
  return (
    <QuizSessionRun
      key={`${sessionKey}:${run}`}
      sessionKey={sessionKey}
      {...props}
      onPractiseAgain={() => setRun((current) => current + 1)}
    />
  );
}
