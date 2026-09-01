import { Link, useParams } from 'react-router-dom';
import { TOPIC_LABELS, activeQuestions } from '@/content';
import type { Topic } from '@/content/types';
import { signCategoryDrillQuestions } from '@/engine/learning/signCategories';
import { useProgress } from '@/store/useProgress';
import { LEARNER_CATEGORY_LABELS, LEARNER_CATEGORY_IDS } from '@/content/learner-signs';
import { type LearnSection } from '@/engine/learning/sections';
import { QuizSession } from '@/ui/QuizSession';
import { Card, EmptyState, PageHead } from '@/ui/components';

export function SignsDrill() {
  const { category } = useParams<{ category: string }>();

  const isAll = category === 'all';
  const label = isAll ? 'All road signs' : TOPIC_LABELS[category as Topic];
  const pool = isAll
    ? activeQuestions.filter((q) => q.type === 'sign')
    : activeQuestions.filter((q) => q.topic === category);

  if (!label) {
    return (
      <>
        <PageHead title="Category not found" />
        <Card>
          <EmptyState emoji="🚸" title="No such sign category">
            <p>
              <Link to="/signs">Back to road signs</Link>
            </p>
          </EmptyState>
        </Card>
      </>
    );
  }

  return (
    <QuizSession
      sessionKey={`signs:${category}`}
      title={label}
      subtitle={`${pool.length} question${pool.length === 1 ? '' : 's'} — recognition and what to do`}
      pool={pool}
      count={Math.min(12, pool.length)}
      mode="signs"
      weighted
      emptyState={{
        emoji: '🚸',
        title: 'No sign questions here yet',
        body: (
          <p>
            <Link to="/signs">Choose another category</Link>
          </p>
        ),
      }}
    />
  );
}

/** Formal Core-concept practice opened from Learn's Road Signs cards. */
export function SignCategoryQuiz() {
  const { category } = useParams<{ category: string }>();
  const progress = useProgress((s) => s.progress);
  const label = category ? LEARNER_CATEGORY_LABELS[category] : undefined;
  const validCategory = Boolean(category && LEARNER_CATEGORY_IDS.includes(category));
  const pool = category ? signCategoryDrillQuestions(category, activeQuestions, progress) : [];
  const section: LearnSection | undefined =
    category && validCategory ? { kind: 'signs', category } : undefined;

  if (!validCategory || !label) {
    return (
      <>
        <PageHead title="Category not found" />
        <Card>
          <EmptyState emoji="🚸" title="No such sign category">
            <p><Link to="/learn">Back to your learning path</Link></p>
          </EmptyState>
        </Card>
      </>
    );
  }

  return (
    <QuizSession
      sessionKey={`signs-category:${category}`}
      title={label}
      sessionLabel={label}
      subtitle={`${pool.length} assessed Core concept${pool.length === 1 ? '' : 's'}`}
      backTo="/learn"
      pool={pool}
      count={pool.length}
      mode="signs"
      weighted={false}
      section={section}
      emptyState={{
        emoji: '🚸',
        title: 'This sign category is not ready to practise',
        body: <p><Link to="/learn">Back to your learning path</Link></p>,
      }}
    />
  );
}
