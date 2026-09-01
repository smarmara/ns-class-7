import { Link, useParams } from 'react-router-dom';
import { TOPIC_LABELS, activeQuestions } from '@/content';
import { RULES_TOPICS, type Topic } from '@/content/types';
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
              <Link to="/learn">Back to your learning path</Link>
            </p>
          </EmptyState>
        </Card>
      </>
    );
  }

  return (
    <QuizSession
      sessionKey={`topic:${topic}`}
      title={label}
      subtitle={`${pool.length} question${pool.length === 1 ? '' : 's'} in this topic`}
      pool={pool}
      count={Math.min(10, pool.length)}
      mode="topic"
      weighted
      // Only the Rules topics form the sequential Learn path; a sign topic
      // reached directly here has no "next section" in that sequence.
      section={
        (RULES_TOPICS as readonly string[]).includes(topic)
          ? { kind: 'rules', topic: topic as Topic }
          : undefined
      }
      emptyState={{
        emoji: '📘',
        title: 'No questions in this topic yet',
        body: (
          <p>
            <Link to="/learn">Choose another topic</Link>
          </p>
        ),
      }}
    />
  );
}
