import { Link, useParams } from 'react-router-dom';
import { TOPIC_LABELS, activeQuestions } from '@/content';
import type { Topic } from '@/content/types';
import { QuizSession } from '@/ui/QuizSession';
import { Card, EmptyState, PageHead } from '@/ui/components';

export function TopicQuiz() {
  const { topic } = useParams<{ topic: string }>();
  const label = topic ? TOPIC_LABELS[topic as Topic] : undefined;
  const pool = activeQuestions.filter((q) => q.topic === topic);

  if (!topic || !label) {
    return (
      <>
        <PageHead title="Topic not found" />
        <Card>
          <EmptyState emoji="🧭" title="No such topic">
            <p>
              <Link to="/study">Back to all topics</Link>
            </p>
          </EmptyState>
        </Card>
      </>
    );
  }

  return (
    <QuizSession
      title={label}
      subtitle={`${pool.length} question${pool.length === 1 ? '' : 's'} in this topic`}
      pool={pool}
      count={Math.min(10, pool.length)}
      mode="topic"
      weighted
      emptyState={{
        emoji: '📘',
        title: 'No questions in this topic yet',
        body: (
          <p>
            <Link to="/study">Choose another topic</Link>
          </p>
        ),
      }}
    />
  );
}
