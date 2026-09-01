import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getSignMeta, learnerCategories, LEARNER_CATEGORY_LABELS } from '@/content';
import {
  EMPTY_HISTORY,
  EMPTY_SCORE,
  createRound,
  rememberRound,
  scoreAnswer,
  type RoundHistory,
  type SignMatchPool,
  type SignMatchRound,
} from '@/engine/signmatch/rounds';
import { createRng, randomSeed } from '@/engine/random';
import { signMatchBestStreak } from '@/engine/engagement/types';
import { useEngagement } from '@/store/useEngagement';
import { SignArt } from '@/signs/SignArt';
import { Disclaimer } from '@/ui/components';

/**
 * Sign Match — endless two-choice sign recognition.
 *
 * Read a sign's name, pick its artwork out of two, keep going while you are
 * right. A wrong answer reveals the correct sign and ends the run, and a result
 * screen shows how far the streak got. There is no timer and no lives — the
 * only thing that ends a run is a miss, and starting another is one tap.
 *
 * Nothing here writes to learner *progress*. Sign Match is supplementary visual
 * practice and carries no assessment evidence, so the score, current streak and
 * round history live in component state only and a refresh resets them. That is
 * deliberate: the formal `seen`/accuracy/mastery model is built from answered
 * questions, and quietly feeding a game into it would corrupt what Complete and
 * Mastered mean.
 *
 * The one exception is the all-time best streak, which is kept in engagement
 * state alongside XP — motivational data that never feeds assessment. Persist
 * the achievement, not the session.
 */

/** Answer-neutral label for a choice: appearance, never meaning. */
function choiceLabel(signId: string, position: number): string {
  return getSignMeta(signId)?.visualDescription ?? `Sign option ${position}`;
}

interface Session {
  round: SignMatchRound | null;
  history: RoundHistory;
}

function deal(
  rng: ReturnType<typeof createRng>,
  pool: SignMatchPool,
  category: string,
  history: RoundHistory,
): Session {
  const round = createRound({ pool, category: category || undefined, history, rng });
  return { round, history: round ? rememberRound(history, round) : history };
}

/** What a finished run achieved, kept only until the learner starts another. */
interface RunResult {
  streak: number;
  /** Best before this run, so a new record can be acknowledged honestly. */
  previousBest: number;
}

export function SignMatch() {
  const engagement = useEngagement((s) => s.engagement);
  const recordStreak = useEngagement((s) => s.recordSignMatchStreak);
  const best = signMatchBestStreak(engagement);
  const [result, setResult] = useState<RunResult | null>(null);
  const [endedRun, setEndedRun] = useState<RunResult | null>(null);
  /*
   * The record as it stood when this run began. The live best is written the
   * moment it is beaten — which is what keeps it safe if the learner leaves
   * mid-run — so by the time a run ends the stored value already includes it.
   * Comparing against that would never report a new best.
   */
  const [runStartBest, setRunStartBest] = useState(best);

  const [pool, setPool] = useState<SignMatchPool>('all');
  const [category, setCategory] = useState<string>('');
  const [score, setScore] = useState(EMPTY_SCORE);
  const [picked, setPicked] = useState<0 | 1 | null>(null);

  // One RNG for the whole session, created once.
  const [rng] = useState(() => createRng(randomSeed()));
  const [session, setSession] = useState<Session>(() => deal(rng, 'all', '', EMPTY_HISTORY));
  const round = session.round;

  const categories = useMemo(() => learnerCategories(), []);

  const answered = picked !== null;
  const wasCorrect = answered && picked === round?.correctIndex;

  const choose = (index: 0 | 1) => {
    if (answered || !round) return;
    setPicked(index);
    // `score` is current here: a round accepts exactly one answer.
    const wasCorrectPick = index === round.correctIndex;
    const next = scoreAnswer(score, wasCorrectPick);
    setScore(next);
    if (wasCorrectPick) {
      // Saved the moment the record is beaten, so leaving mid-run keeps it.
      recordStreak(next.streak);
    } else {
      // The run is over. Capture what it reached, and what the record was
      // before it, while the correct sign stays on screen.
      setEndedRun({ streak: score.streak, previousBest: runStartBest });
    }
  };

  /** Move from the revealed miss to the run result. */
  const endRun = () => {
    setResult(endedRun ?? { streak: score.streak, previousBest: runStartBest });
    setEndedRun(null);
  };

  const tryAgain = () => {
    setResult(null);
    setPicked(null);
    setScore(EMPTY_SCORE);
    setRunStartBest(best);
    setSession(deal(rng, pool, category, EMPTY_HISTORY));
  };

  const advance = () => {
    setPicked(null);
    setSession((current) => deal(rng, pool, category, current.history));
  };

  const changeFilters = (nextPool: SignMatchPool, nextCategory: string) => {
    setPool(nextPool);
    setCategory(nextCategory);
    setPicked(null);
    setResult(null);
    setEndedRun(null);
    setScore(EMPTY_SCORE);
    setRunStartBest(best);
    setSession(deal(rng, nextPool, nextCategory, EMPTY_HISTORY));
  };

  if (result) {
    const isNewBest = result.streak > 0 && result.streak > result.previousBest;
    return (
      <div className="match match-result-screen">
        <header className="match-head">
          <Link className="match-back" to="/signs">
            ← Signs
          </Link>
        </header>

        <div className="match-result" role="status">
          <p className="match-result-eyebrow">Sign Match</p>
          <h1 className="match-result-title">Streak ended</h1>
          <p className="match-result-score">
            <strong>{result.streak}</strong> correct in a row
          </p>

          {isNewBest ? (
            <p className="match-result-best" data-state="new">
              <span className="match-result-best-label">New best</span>
              <span className="match-result-best-value">{result.streak}</span>
            </p>
          ) : (
            <p className="match-result-best">
              <span className="match-result-best-label">Best streak</span>
              <span className="match-result-best-value">{Math.max(best, result.streak)}</span>
            </p>
          )}

          <div className="match-result-actions">
            <button type="button" className="btn btn-primary" onClick={tryAgain}>
              Try again
            </button>
            <Link className="btn btn-secondary" to="/signs">
              Close
            </Link>
          </div>
        </div>

        <div className="match-foot">
          <p className="tiny faint">
            Practice only — Sign Match does not count towards your topic progress or mastery.
          </p>
          <Disclaimer />
        </div>
      </div>
    );
  }

  return (
    <div className="match">
      <header className="match-head">
        <Link className="match-back" to="/signs">
          ← Signs
        </Link>
        <span className="match-score">
          <span className="match-streak">Streak {score.streak}</span>
          {best > 0 && <span className="match-best">Best {best}</span>}
        </span>
      </header>

      <div className="match-filters">
        <label className="match-filter">
          <span className="sr-only">Sign pool</span>
          <select
            value={pool}
            onChange={(e) => changeFilters(e.target.value as SignMatchPool, category)}
          >
            <option value="all">All study signs</option>
            <option value="core">Assessed signs</option>
          </select>
        </label>
        <label className="match-filter">
          <span className="sr-only">Category</span>
          <select value={category} onChange={(e) => changeFilters(pool, e.target.value)}>
            <option value="">All categories</option>
            {categories.map((id) => (
              <option key={id} value={id}>
                {LEARNER_CATEGORY_LABELS[id] ?? id}
              </option>
            ))}
          </select>
        </label>
      </div>

      {!round ? (
        <p className="match-empty">
          There are not enough distinct signs in that selection to build a round. Choose another
          category.
        </p>
      ) : (
        <>
          <p className="match-lead">Which sign is</p>
          <h1 className="match-prompt">{round.prompt}</h1>

          <div className="match-choices">
            {round.choices.map((signId, index) => {
              const isTarget = index === round.correctIndex;
              const state = !answered
                ? undefined
                : isTarget
                  ? 'correct'
                  : index === picked
                    ? 'wrong'
                    : 'muted';
              return (
                <button
                  key={signId}
                  type="button"
                  className="match-choice"
                  data-state={state}
                  disabled={answered}
                  aria-label={choiceLabel(signId, index + 1)}
                  onClick={() => choose(index as 0 | 1)}
                >
                  <span className="match-art">
                    <SignArt signId={signId} size={140} decorative />
                  </span>
                </button>
              );
            })}
          </div>

          <div className="match-feedback" role="status" aria-live="polite">
            {answered && (
              <>
                <p className="match-verdict" data-state={wasCorrect ? 'correct' : 'wrong'}>
                  {wasCorrect ? 'Correct.' : 'Not quite.'}{' '}
                  <span className="match-reveal">
                    {wasCorrect ? 'This is' : 'The correct sign is'} {round.answerName}.
                  </span>
                </p>
                {wasCorrect ? (
                  <button type="button" className="btn btn-primary match-next" onClick={advance}>
                    Next
                  </button>
                ) : (
                  /*
                   * The miss is the teaching moment, so the correct sign stays
                   * on screen and the learner moves on when they are ready
                   * rather than being thrown straight to a result card.
                   */
                  <button type="button" className="btn btn-primary match-next" onClick={endRun}>
                    See your run
                  </button>
                )}
              </>
            )}
          </div>
        </>
      )}

      <div className="match-foot">
        <p className="tiny faint">
          Practice only — Sign Match does not count towards your topic progress or mastery.
        </p>
        <Disclaimer />
      </div>
    </div>
  );
}
