import { useState } from 'react';
import { safeExternalHref } from '@/safeUrl';
import { TOPIC_LABELS, getSource, getSignMeta } from '@/content';
import type { Question, SourceReference } from '@/content/types';
import {
  correctDisplayIndex,
  displayChoiceSignIds,
  displayChoices,
  type PreparedQuestion,
} from '@/engine/quiz/selection';
import { SignArt } from '@/signs/SignArt';
import { CorrectIcon, ExternalIcon, IncorrectIcon } from './icons';

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

export type RevealMode =
  /** Practice: mark the answer as soon as it is chosen. */
  | 'immediate'
  /** Exam: record the choice, disclose nothing. */
  | 'hidden'
  /** Review after submission: show the outcome without allowing changes. */
  | 'review';

interface QuestionViewProps {
  prepared: PreparedQuestion;
  /** Display index the learner selected, or null. */
  selected: number | null;
  reveal: RevealMode;
  onSelect: (displayIndex: number) => void;
  questionNumber?: number;
  questionTotal?: number;
  /** Practice: show a prominent Continue action inside the feedback panel. */
  onContinue?: () => void;
  continueLabel?: string;
  /** XP earned by this answer, shown in the feedback panel. Never negative. */
  xpEarned?: number;
  /**
   * Practice exams suppress XP and other reward chrome so an exam feels like an
   * exam. Progress is still recorded and reported after submission.
   */
  quiet?: boolean;
}

/**
 * The question itself: stem, optional artwork, answers, and — once answered —
 * a compact feedback panel.
 *
 * The layout is deliberately flat. A normal question has to fit a phone
 * viewport without scrolling, and every nested card costs ~32px of padding
 * that buys nothing. Sign artwork is sized against the *available height*
 * rather than a fixed canvas, so it gives way before answer text does.
 */
export function QuestionView({
  prepared,
  selected,
  reveal,
  onSelect,
  questionNumber,
  questionTotal,
  onContinue,
  continueLabel = 'Continue',
  xpEarned,
  quiet = false,
}: QuestionViewProps) {
  const { question } = prepared;
  const choices = displayChoices(prepared);
  const choiceSignIds = displayChoiceSignIds(prepared);
  const correctIndex = correctDisplayIndex(prepared);
  const marked = reveal !== 'hidden' && selected !== null;
  const gotItRight = marked && selected === correctIndex;
  const hasArtwork = Boolean(question.signId);

  const groupLabel =
    questionNumber && questionTotal
      ? `Question ${questionNumber} of ${questionTotal}: ${question.question}`
      : question.question;

  return (
    <div className="question" data-artwork={hasArtwork}>
      <p className="question-stem" id={`stem-${question.id}`}>
        {question.question}
      </p>

      {question.signId && (
        <div className="sign-stage">
          {/* Rendered at its natural aspect ratio and never filtered or
              recoloured — official artwork must appear exactly as issued. */}
          <SignArt signId={question.signId} size={220} />
        </div>
      )}

      <fieldset className="choices" aria-describedby={`stem-${question.id}`}>
        <legend className="sr-only">{groupLabel}</legend>
        {choices.map((choice, i) => {
          const state = choiceState(i, selected, correctIndex, reveal);
          const signId = choiceSignIds?.[i];
          const why = whyWrong(question, prepared, i, state);

          return (
            <button
              key={`${question.id}-${i}`}
              type="button"
              className="choice"
              data-state={state}
              aria-pressed={selected === i}
              disabled={reveal === 'review' || (reveal === 'immediate' && selected !== null)}
              onClick={() => onSelect(i)}
            >
              <span className="choice-marker" aria-hidden="true">
                {LETTERS[i]}
              </span>
              <span className="choice-text">
                {signId ? (
                  <>
                    <span className="choice-sign">
                      <SignArt signId={signId} size={96} decorative />
                    </span>
                    <span className="sr-only">{choice}</span>
                  </>
                ) : (
                  choice
                )}
                {/* State is never colour alone: an icon and a worded verdict
                    carry it too. */}
                {state === 'correct' && (
                  <span className="choice-verdict">
                    <CorrectIcon /> Correct answer
                  </span>
                )}
                {state === 'incorrect' && (
                  <span className="choice-verdict">
                    <IncorrectIcon /> Your answer — incorrect
                  </span>
                )}
                {why && <span className="choice-why">{why}</span>}
              </span>
            </button>
          );
        })}
      </fieldset>

      {marked && reveal === 'immediate' && (
        <FeedbackPanel
          question={question}
          correct={gotItRight}
          {...(quiet ? {} : { xpEarned: xpEarned ?? 0 })}
          {...(onContinue ? { onContinue, continueLabel } : {})}
        />
      )}

      {marked && reveal === 'review' && (
        <div className="feedback" data-correct={gotItRight}>
          <div className="feedback-head">
            <span className="feedback-verdict" data-correct={gotItRight}>
              {gotItRight ? <CorrectIcon /> : <IncorrectIcon />}
              {gotItRight ? 'Correct' : 'Not quite'}
            </span>
          </div>
          <p className="feedback-body">{question.explanation}</p>
          <SourceRefs refs={question.sourceRefs} />
        </div>
      )}
    </div>
  );
}

/**
 * Compact feedback.
 *
 * Answering must not make the page lurch: the panel is sized for a normal
 * explanation, and anything longer collapses behind "More detail" rather than
 * pushing Continue off the bottom of the screen. Wording is factual either way
 * — a wrong answer gets an explanation, never a penalty.
 */
export function FeedbackPanel({
  question,
  correct,
  xpEarned,
  onContinue,
  continueLabel = 'Continue',
}: {
  question: Question;
  correct: boolean;
  xpEarned?: number;
  onContinue?: () => void;
  continueLabel?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const explanation = question.explanation;
  const isLong = explanation.length > 180;
  // Trim trailing punctuation before the ellipsis so the truncation does not
  // read as "speed...." where the cut lands after a full stop.
  const shown = isLong && !expanded
    ? `${explanation.slice(0, 165).replace(/[\s.,;:]+$/, '')}…`
    : explanation;

  return (
    <div className="feedback" data-correct={correct} role="status">
      <div className="feedback-head">
        <span className="feedback-verdict" data-correct={correct}>
          {correct ? <CorrectIcon /> : <IncorrectIcon />}
          {correct ? 'Correct' : 'Not quite'}
        </span>
        {typeof xpEarned === 'number' && xpEarned > 0 && (
          <span className="feedback-xp">+{xpEarned} XP</span>
        )}
      </div>

      <p className="feedback-body">{shown}</p>

      {isLong && !expanded && (
        <button type="button" className="feedback-more" onClick={() => setExpanded(true)}>
          More detail
        </button>
      )}

      <div className="feedback-actions">
        <SourceRefs refs={question.sourceRefs} compact />
        {onContinue && (
          <button type="button" className="btn feedback-continue" onClick={onContinue}>
            {continueLabel}
          </button>
        )}
      </div>
    </div>
  );
}

export function Explanation({ question }: { question: Question }) {
  return (
    <>
      <div className="explanation">
        <p>{question.explanation}</p>
      </div>
      <SourceRefs refs={question.sourceRefs} />
    </>
  );
}

/**
 * Official sources stay one tap away everywhere. In feedback they collapse to
 * a single compact link so transparency costs no vertical space on a phone.
 */
export function SourceRefs({ refs, compact = false }: { refs: SourceReference[]; compact?: boolean }) {
  if (refs.length === 0) return null;

  if (compact) {
    const first = refs[0]!;
    const source = getSource(first.sourceId);
    const where = [first.section, first.chapter, first.page].filter(Boolean).join(', ');
    const href = safeExternalHref(first.url ?? source?.url);
    if (!href) return null;
    return (
      <a
        className="source-link"
        href={href}
        target="_blank"
        rel="noopener noreferrer"
      >
        Official source
        {where && <span className="sr-only"> — {where}</span>}
        <ExternalIcon />
      </a>
    );
  }

  return (
    <div className="sources">
      <h4>Official source</h4>
      <ul>
        {refs.map((ref, i) => {
          const source = getSource(ref.sourceId);
          const where = [ref.section, ref.chapter, ref.page].filter(Boolean).join(', ');
          return (
            <li key={`${ref.sourceId}-${i}`}>
              {source && safeExternalHref(ref.url ?? source.url) ? (
                <a
                  href={safeExternalHref(ref.url ?? source.url)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {source.title}
                </a>
              ) : (
                // No link rather than an unusable one: the citation still names
                // its source, which is what the learner needs to verify it.
                <span>{source ? source.title : ref.sourceId}</span>
              )}
              {where && <span className="src-where"> — {where}</span>}
              {ref.note && <div className="tiny faint">{ref.note}</div>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Render the artwork label for a sign, used by the signs gallery. */
export function SignCaption({ signId }: { signId: string }) {
  const meta = getSignMeta(signId);
  return <>{meta?.label ?? signId}</>;
}

/** The topic label for a question, used by the compact quiz header. */
export function questionTopicLabel(question: Question): string {
  return TOPIC_LABELS[question.topic] ?? question.topic;
}

function choiceState(
  index: number,
  selected: number | null,
  correctIndex: number,
  reveal: RevealMode,
): 'idle' | 'selected' | 'correct' | 'incorrect' {
  if (reveal === 'hidden') return selected === index ? 'selected' : 'idle';
  if (selected === null) return 'idle';
  if (index === correctIndex) return 'correct';
  if (index === selected) return 'incorrect';
  return 'idle';
}

/**
 * Show the "why this is wrong" note only for the distractor the learner
 * actually picked. Dumping every note at once buries the one that matters.
 */
function whyWrong(
  question: Question,
  prepared: PreparedQuestion,
  displayIndex: number,
  state: string,
): string | null {
  if (state !== 'incorrect') return null;
  const authored = prepared.displayOrder[displayIndex];
  if (authored === undefined) return null;
  return question.incorrectChoiceExplanations?.[authored] ?? null;
}
