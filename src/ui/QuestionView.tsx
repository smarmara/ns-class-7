import { TOPIC_LABELS, getSource, getSignMeta } from '@/content';
import type { Question, SourceReference } from '@/content/types';
import {
  correctDisplayIndex,
  displayChoiceSignIds,
  displayChoices,
  type PreparedQuestion,
} from '@/engine/quiz/selection';
import { SignArt } from '@/signs/SignArt';

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
}

export function QuestionView({
  prepared,
  selected,
  reveal,
  onSelect,
  questionNumber,
  questionTotal,
}: QuestionViewProps) {
  const { question } = prepared;
  const choices = displayChoices(prepared);
  const choiceSignIds = displayChoiceSignIds(prepared);
  const correctIndex = correctDisplayIndex(prepared);
  const marked = reveal !== 'hidden' && selected !== null;
  const gotItRight = marked && selected === correctIndex;

  const groupLabel =
    questionNumber && questionTotal
      ? `Question ${questionNumber} of ${questionTotal}: ${question.question}`
      : question.question;

  return (
    <div>
      <div className="question-meta">
        <span className="chip chip-accent">{TOPIC_LABELS[question.topic] ?? question.topic}</span>
        <span className="chip">{question.difficulty}</span>
        {question.type === 'sign' && <span className="chip">Road sign</span>}
      </div>

      <p className="question-stem" id={`stem-${question.id}`}>
        {question.question}
      </p>

      {question.signId && (
        <div className="sign-stage">
          <SignArt signId={question.signId} size={168} />
        </div>
      )}

      <fieldset className="choices" aria-describedby={`stem-${question.id}`}>
        <legend>{groupLabel}</legend>
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
                      <SignArt signId={signId} size={104} decorative />
                    </span>
                    <span className="sr-only">{choice}</span>
                  </>
                ) : (
                  choice
                )}
                {state === 'correct' && (
                  <span className="choice-verdict">✓ Correct answer</span>
                )}
                {state === 'incorrect' && (
                  <span className="choice-verdict">✗ Your answer — incorrect</span>
                )}
                {why && <span className="choice-why">{why}</span>}
              </span>
            </button>
          );
        })}
      </fieldset>

      {marked && (
        <div className="section-gap">
          <p className="verdict" data-correct={gotItRight} role="status">
            <span className="verdict-icon" aria-hidden="true">
              {gotItRight ? '✓' : '✗'}
            </span>
            {gotItRight ? 'Correct' : 'Not quite'}
          </p>
          <Explanation question={question} />
        </div>
      )}
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

export function SourceRefs({ refs }: { refs: SourceReference[] }) {
  if (refs.length === 0) return null;
  return (
    <div className="sources">
      <h4>Official source</h4>
      <ul>
        {refs.map((ref, i) => {
          const source = getSource(ref.sourceId);
          const where = [ref.section, ref.chapter, ref.page].filter(Boolean).join(', ');
          return (
            <li key={`${ref.sourceId}-${i}`}>
              {source ? (
                <a href={ref.url ?? source.url} target="_blank" rel="noopener noreferrer">
                  {source.title}
                </a>
              ) : (
                <span>{ref.sourceId}</span>
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
