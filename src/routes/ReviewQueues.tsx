import { Link } from 'react-router-dom';
import { activeQuestions } from '@/content';
import { weakTopics } from '@/engine/learning/readiness';
import { bookmarkedQuestions, mistakeQueue } from '@/engine/learning/scheduler';
import { useProgress } from '@/store/useProgress';
import { QuizSession } from '@/ui/QuizSession';

export function Mistakes() {
  const progress = useProgress((s) => s.progress);
  const ids = new Set(mistakeQueue(progress));
  const pool = activeQuestions.filter((q) => ids.has(q.id));

  return (
    <QuizSession
      sessionKey="review:mistakes"
      title="Your mistakes"
      subtitle="Questions you last answered incorrectly, or flagged to review again"
      pool={pool}
      count={Math.min(15, pool.length)}
      mode="mistakes"
      weighted={false}
      emptyState={{
        emoji: '✅',
        title: 'No outstanding mistakes',
        body: (
          <p>
            Everything you have answered, you got right last time.{' '}
            <Link to="/practice/quick">Keep practising</Link>.
          </p>
        ),
      }}
    />
  );
}

export function Saved() {
  const progress = useProgress((s) => s.progress);
  const ids = new Set(bookmarkedQuestions(progress));
  const pool = activeQuestions.filter((q) => ids.has(q.id));

  return (
    <QuizSession
      sessionKey="review:saved"
      title="Saved questions"
      subtitle="The questions you bookmarked"
      pool={pool}
      count={Math.min(15, pool.length)}
      mode="saved"
      weighted={false}
      emptyState={{
        emoji: '★',
        title: 'Nothing saved yet',
        body: (
          <p>
            Tap <strong>Save</strong> on any question to keep it here.{' '}
            <Link to="/practice/quick">Start practising</Link>.
          </p>
        ),
      }}
    />
  );
}

export function WeakAreas() {
  const progress = useProgress((s) => s.progress);
  const weak = new Set(weakTopics(activeQuestions, progress).map((t) => t.topic));
  const pool = activeQuestions.filter((q) => weak.has(q.topic));

  return (
    <QuizSession
      sessionKey="review:weak"
      title="Weak areas"
      subtitle="Drawn only from the topics you are scoring lowest in"
      pool={pool}
      count={Math.min(15, pool.length)}
      mode="weak"
      weighted
      emptyState={{
        emoji: '🎯',
        title: 'No weak topics yet',
        body: (
          <p>
            A topic shows up here once you have answered at least 3 of its questions with 75%
            accuracy or below. <Link to="/practice/quick">Answer some questions</Link> and check back.
          </p>
        ),
      }}
    />
  );
}
