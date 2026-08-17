import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  TOPIC_LABELS,
  activeQuestions,
  examConfig,
  getQuestion,
} from '@/content';
import type { Question } from '@/content/types';
import {
  answeredCount,
  gradeSession,
  isSectionComplete,
  preparedFor,
  type MockSession,
} from '@/engine/exam/mockTest';
import { toAuthoredIndex } from '@/engine/quiz/selection';
import type { MockTestRecord } from '@/engine/learning/types';
import { useMockExam } from '@/store/useMockExam';
import { useProgress } from '@/store/useProgress';
import { Banner, Card, Disclaimer, Meter, PageHead } from '@/ui/components';
import { Explanation, QuestionView } from '@/ui/QuestionView';

export function MockTest() {
  const { session, restored, restore, start, abandon } = useMockExam();

  useEffect(() => {
    restore();
  }, [restore]);

  if (!restored) return <p className="muted">Loading…</p>;

  if (!session) return <MockIntro onStart={() => start(activeQuestions)} />;
  if (session.status === 'complete') {
    return <MockResults session={session} onRestart={() => start(activeQuestions)} onExit={abandon} />;
  }
  // Remounting the runner per part resets the submit confirmation, so a
  // freshly started part can never open on the "submit this part?" card.
  return <MockRunner key={session.currentSectionIndex} session={session} />;
}

/* ------------------------------------------------------------------ intro */

function MockIntro({ onStart }: { onStart: () => void }) {
  const shortfall = examConfig.sections
    .map((s) => ({
      section: s,
      available: activeQuestions.filter((q) => q.type === s.questionType).length,
    }))
    .filter((x) => x.available < x.section.questionCount);

  return (
    <>
      <PageHead title="Mock test">
        A full simulation of the official Class 7 knowledge test format
      </PageHead>

      <Card title="How this test is set up">
        <dl className="definition-list">
          {examConfig.sections.map((s) => (
            <div key={s.id}>
              <dt>{s.name}</dt>
              <dd>
                {s.questionCount} multiple-choice questions · {s.passingCorrect} correct to pass ·{' '}
                {s.timeLimitMinutes} minutes
              </dd>
            </div>
          ))}
        </dl>
        <p className="small muted section-gap" style={{ marginBottom: 0 }}>
          Each part is passed or failed on its own. A strong score on one part does not make up for
          a weak score on the other — exactly as on the real test, where you retake only the part
          you did not pass.
        </p>
      </Card>

      <Card className="section-gap" title="While the test is running">
        <ul className="small muted" style={{ paddingLeft: 20, margin: 0 }}>
          <li>Answers are recorded but nothing is marked until you submit the part.</li>
          <li>No explanations, no correct answers, no score until then.</li>
          <li>You can move freely between questions and change your answers.</li>
          <li>Your progress is saved continuously — a refresh will not lose the test.</li>
          <li>When the timer runs out, the part is submitted as it stands.</li>
        </ul>
      </Card>

      {shortfall.length > 0 && (
        <div className="section-gap">
          <Banner tone="warn" icon="⚠️">
            <p>
              The active question bank is short for:{' '}
              {shortfall.map((x) => `${x.section.shortName} (${x.available}/${x.section.questionCount})`).join(', ')}
              . The mock test cannot be started until more questions are verified.
            </p>
          </Banner>
        </div>
      )}

      <div className="section-gap">
        <button type="button" className="btn btn-block" onClick={onStart} disabled={shortfall.length > 0}>
          Start mock test
        </button>
      </div>

      <div className="section-gap">
        <Banner icon="ℹ️">
          <p>
            These are original practice questions written from official sources. This app does not
            have, and does not claim to have, the real examination's questions.
          </p>
        </Banner>
      </div>

      <Disclaimer />
    </>
  );
}

/* ----------------------------------------------------------------- runner */

function MockRunner({ session }: { session: MockSession }) {
  const { answer, goToQuestion, nextQuestion, previousQuestion, submitSection, startSection, tick } =
    useMockExam();

  const sectionIndex = session.currentSectionIndex;
  const section = session.sections[sectionIndex]!;
  const config = examConfig.sections[sectionIndex]!;
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const headingRef = useRef<HTMLDivElement>(null);

  const questions = useMemo(
    () => section.questionIds.map((id) => getQuestion(id)).filter((q): q is Question => Boolean(q)),
    [section.questionIds],
  );

  const started = section.startedAt !== null;

  // Countdown. Ticks once a second and persists, so the remaining time
  // survives a refresh instead of restarting at the full limit.
  useEffect(() => {
    if (!started) return;
    const id = window.setInterval(() => {
      const remaining = useMockExam.getState().session?.sections[sectionIndex]?.remainingMs ?? 0;
      const next = remaining - 1000;
      if (next <= 0) {
        tick(0);
        useMockExam.getState().submitSection();
      } else {
        tick(next);
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [started, sectionIndex, tick]);

  useEffect(() => {
    headingRef.current?.focus();
  }, [session.currentQuestionIndex, sectionIndex]);

  const handleSelect = useCallback(
    (displayIndex: number) => {
      const question = questions[session.currentQuestionIndex];
      if (!question) return;
      const prepared = preparedFor(section, question);
      answer(question.id, toAuthoredIndex(prepared, displayIndex));
    },
    [questions, session.currentQuestionIndex, section, answer],
  );

  if (!started) {
    return (
      <>
        <PageHead title={config.name}>
          Part {sectionIndex + 1} of {examConfig.sections.length}
        </PageHead>
        <Card>
          <p>{config.description}</p>
          <dl className="definition-list">
            <dt>Questions</dt>
            <dd>{config.questionCount} multiple choice</dd>
            <dt>To pass this part</dt>
            <dd>
              {config.passingCorrect} correct out of {config.questionCount}
            </dd>
            <dt>Time limit</dt>
            <dd>{config.timeLimitMinutes} minutes</dd>
          </dl>
          <div className="section-gap">
            <button type="button" className="btn btn-block" onClick={startSection}>
              Begin {config.shortName}
            </button>
          </div>
        </Card>
        <Disclaimer />
      </>
    );
  }

  const question = questions[session.currentQuestionIndex];
  if (!question) return null;

  const prepared = preparedFor(section, question);
  const authored = section.answers[question.id];
  const selectedDisplay =
    authored === undefined ? null : prepared.displayOrder.indexOf(authored);
  const answered = answeredCount(section);
  const complete = isSectionComplete(section);
  const isLastQuestion = session.currentQuestionIndex === questions.length - 1;

  return (
    <>
      <div className="exam-bar">
        <div>
          <div className="exam-section-name">{config.shortName}</div>
          <div className="tiny muted">
            Part {sectionIndex + 1} of {examConfig.sections.length}
          </div>
        </div>
        <Timer remainingMs={section.remainingMs} />
      </div>

      <div className="quiz-progress">
        <Meter
          label="Questions answered"
          value={answered}
          max={questions.length}
          display={`${answered} of ${questions.length} answered`}
        />
      </div>

      <div ref={headingRef} tabIndex={-1} style={{ outline: 'none' }}>
        <Card>
          <QuestionView
            prepared={prepared}
            selected={selectedDisplay}
            reveal="hidden"
            onSelect={handleSelect}
            questionNumber={session.currentQuestionIndex + 1}
            questionTotal={questions.length}
          />

          <div className="quiz-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={previousQuestion}
              disabled={session.currentQuestionIndex === 0}
            >
              Previous
            </button>
            {!isLastQuestion && (
              <button type="button" className="btn" onClick={nextQuestion}>
                Next
              </button>
            )}
          </div>
        </Card>
      </div>

      <Card className="section-gap" title="Jump to a question">
        <div className="exam-grid">
          {questions.map((q, i) => (
            <button
              key={q.id}
              type="button"
              data-answered={q.id in section.answers}
              aria-current={i === session.currentQuestionIndex}
              aria-label={`Question ${i + 1}${q.id in section.answers ? ', answered' : ', not answered'}`}
              onClick={() => goToQuestion(i)}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </Card>

      <div className="section-gap">
        {!confirmSubmit ? (
          <button
            type="button"
            className="btn btn-block"
            onClick={() => setConfirmSubmit(true)}
          >
            Submit {config.shortName}
          </button>
        ) : (
          <Card>
            <p style={{ marginBottom: 12 }}>
              {complete
                ? `Submit this part? You cannot change your answers afterwards.`
                : `You have ${questions.length - answered} unanswered question${questions.length - answered === 1 ? '' : 's'}. Unanswered questions are marked incorrect.`}
            </p>
            <div className="btn-row">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setConfirmSubmit(false)}
              >
                Keep working
              </button>
              <button type="button" className="btn" onClick={submitSection}>
                Submit part
              </button>
            </div>
          </Card>
        )}
      </div>
    </>
  );
}

function Timer({ remainingMs }: { remainingMs: number }) {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const low = totalSeconds <= 120;

  return (
    <div>
      <div className="exam-timer" data-low={low} role="timer" aria-live="off">
        {minutes}:{String(seconds).padStart(2, '0')}
      </div>
      <div className="tiny muted" style={{ textAlign: 'right' }}>
        remaining
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- results */

function MockResults({
  session,
  onRestart,
  onExit,
}: {
  session: MockSession;
  onRestart: () => void;
  onExit: () => void;
}) {
  const recordMockTest = useProgress((s) => s.recordMockTest);
  const recordAnswer = useProgress((s) => s.recordAnswer);
  const recordedRef = useRef(false);

  const result = useMemo(
    () => gradeSession(examConfig, session, getQuestion),
    [session],
  );

  // Fold the exam into the learner's history exactly once, even under
  // StrictMode's double-invoked effects.
  useEffect(() => {
    if (recordedRef.current) return;
    recordedRef.current = true;

    const alreadyRecorded = useProgress
      .getState()
      .progress.mockTests.some((m) => m.id === session.id);
    if (alreadyRecorded) return;

    for (const section of session.sections) {
      for (const id of section.questionIds) {
        const question = getQuestion(id);
        if (!question) continue;
        const chosen = section.answers[id];
        recordAnswer(question, chosen === question.correctChoice, 'mock');
      }
    }

    const record: MockTestRecord = {
      id: session.id,
      startedAt: session.createdAt,
      completedAt: session.completedAt ?? new Date().toISOString(),
      passed: result.passed,
      sections: result.sections.map((s) => ({
        sectionId: s.sectionId,
        shortName: s.shortName,
        correct: s.correct,
        questionCount: s.questionCount,
        required: s.required,
        passed: s.passed,
      })),
      missedQuestionIds: result.sections.flatMap((s) => s.missedQuestionIds),
    };
    recordMockTest(record);
  }, [session, result, recordAnswer, recordMockTest]);

  const missed = result.sections
    .flatMap((s) => s.missedQuestionIds)
    .map((id) => getQuestion(id))
    .filter((q): q is Question => Boolean(q));

  const missedTopics = countBy(missed.map((q) => q.topic));

  return (
    <>
      <PageHead title="Mock test results" />

      <div className="big-verdict" data-passed={result.passed}>
        <h2>{result.passed ? 'Passed' : 'Not passed'}</h2>
        <p>
          {result.passed
            ? 'You met the threshold on both parts of this practice test.'
            : `You would need to retake: ${result.sectionsToRetake
                .map((id) => examConfig.sections.find((s) => s.id === id)?.shortName ?? id)
                .join(' and ')}.`}
        </p>
      </div>

      <Card title="By section">
        {result.sections.map((s) => (
          <div key={s.sectionId} className="result-section" data-passed={s.passed}>
            <span className="result-badge">{s.passed ? 'Pass' : 'Fail'}</span>
            <div className="tile-body">
              <div className="tile-title">{s.name}</div>
              <div className="tile-sub">
                {s.required} of {s.questionCount} needed to pass
                {s.unanswered > 0 && ` · ${s.unanswered} left blank`}
              </div>
            </div>
            <div className="result-score">
              {s.correct}
              <span className="muted" style={{ fontSize: '0.9rem' }}>
                /{s.questionCount}
              </span>
            </div>
          </div>
        ))}
        <p className="tiny faint" style={{ marginTop: 12, marginBottom: 0 }}>
          Each part is scored on its own, as on the official test. Overall pass requires passing
          every part.
        </p>
      </Card>

      {missedTopics.length > 0 && (
        <Card className="section-gap" title="Suggested study areas">
          <ul className="tile-list">
            {missedTopics.slice(0, 5).map(([topic, count]) => (
              <li key={topic}>
                <Link className="tile" to={`/study/${topic}`}>
                  <span className="tile-body">
                    <span className="tile-title">{TOPIC_LABELS[topic] ?? topic}</span>
                    <span className="tile-sub">
                      {count} missed question{count === 1 ? '' : 's'}
                    </span>
                  </span>
                  <span className="tile-chevron" aria-hidden="true">
                    ›
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {missed.length > 0 && (
        <Card className="section-gap" title={`Questions you missed (${missed.length})`}>
          {missed.map((question) => {
            const section = session.sections.find((s) => s.questionIds.includes(question.id))!;
            const chosen = section.answers[question.id];
            return (
              <div
                key={question.id}
                style={{ paddingTop: 14, borderTop: '1px solid var(--border)', marginTop: 14 }}
              >
                <p className="question-stem">{question.question}</p>
                <p className="small">
                  <strong>Correct answer:</strong> {question.choices[question.correctChoice]}
                </p>
                <p className="small muted">
                  <strong>You answered:</strong>{' '}
                  {chosen === undefined ? 'Left blank' : question.choices[chosen]}
                </p>
                <Explanation question={question} />
              </div>
            );
          })}
        </Card>
      )}

      <div className="section-gap btn-row">
        <button type="button" className="btn" onClick={onRestart}>
          Take another mock test
        </button>
        <button type="button" className="btn btn-secondary" onClick={onExit}>
          Back to dashboard
        </button>
      </div>

      <Disclaimer />
    </>
  );
}

function countBy<T extends string>(values: T[]): [T, number][] {
  const map = new Map<T, number>();
  for (const v of values) map.set(v, (map.get(v) ?? 0) + 1);
  return [...map.entries()].sort((a, b) => b[1] - a[1]);
}
