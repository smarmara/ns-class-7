import { activeQuestions } from '@/content';
import { weakTopics } from '@/engine/learning/readiness';
import { bookmarkedQuestions, mistakeQueue } from '@/engine/learning/scheduler';
import { useProgress } from '@/store/useProgress';
import { Card, Disclaimer, PageHead, Tile } from '@/ui/components';

export function Review() {
  const progress = useProgress((s) => s.progress);
  const mistakes = mistakeQueue(progress);
  const saved = bookmarkedQuestions(progress);
  const weak = weakTopics(activeQuestions, progress);

  return (
    <>
      <PageHead title="Review">Go back over what you have not locked in yet</PageHead>

      <Card>
        <ul className="tile-list">
          <Tile
            to="/review/mistakes"
            emoji="🔁"
            title="Mistakes"
            sub={
              mistakes.length === 0
                ? 'Nothing outstanding — nice'
                : `${mistakes.length} question${mistakes.length === 1 ? '' : 's'} you last got wrong or flagged`
            }
          />
          <Tile
            to="/review/weak"
            emoji="🎯"
            title="Weak areas"
            sub={
              weak.length === 0
                ? 'No weak topics identified yet'
                : `${weak.length} topic${weak.length === 1 ? '' : 's'} below 75% accuracy`
            }
          />
          <Tile
            to="/review/saved"
            emoji="★"
            title="Saved questions"
            sub={
              saved.length === 0
                ? 'Tap Save on a question to keep it here'
                : `${saved.length} bookmarked`
            }
          />
        </ul>
      </Card>

      <Disclaimer />
    </>
  );
}
