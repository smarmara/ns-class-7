import { Link, useParams } from 'react-router-dom';
import { TOPIC_LABELS, activeQuestions } from '@/content';
import type { Topic } from '@/content/types';
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
