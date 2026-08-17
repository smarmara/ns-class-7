import { SIGNS_TOPICS, TOPIC_LABELS, activeQuestions } from '@/content';
import type { Topic } from '@/content/types';
import { topicPerformance } from '@/engine/learning/readiness';
import { useProgress } from '@/store/useProgress';
import { Card, Disclaimer, PageHead, Tile } from '@/ui/components';

const SIGN_EMOJI: Partial<Record<Topic, string>> = {
  'signs-regulatory': '🛑',
  'signs-warning': '⚠️',
  'signs-school': '🏫',
  'signs-work-zone': '🚧',
  'signs-guide': '🧭',
  'signs-lane-use': '↕️',
  'signs-railway': '🚂',
  'signs-pedestrian-and-cyclist': '🚶',
  'pavement-markings': '🛣',
};

export function Signs() {
  const progress = useProgress((s) => s.progress);
  const performance = new Map(topicPerformance(activeQuestions, progress).map((t) => [t.topic, t]));
  const signCount = activeQuestions.filter((q) => q.type === 'sign').length;

  const available = SIGNS_TOPICS.filter((topic) => activeQuestions.some((q) => q.topic === topic));

  return (
    <>
      <PageHead title="Road signs">
        Recognising the sign, and knowing what to do about it
      </PageHead>

      <Card>
        <ul className="tile-list">
          <Tile
            to="/signs/all"
            emoji="🔀"
            title="All road signs"
            sub={`Mixed drill across all ${signCount} sign questions`}
          />
          <Tile
            to="/signs/gallery"
            emoji="🖼"
            title="Sign gallery"
            sub="Browse every sign with its meaning — no quiz"
          />
        </ul>
      </Card>

      <Card className="section-gap" title="By category">
        <ul className="tile-list">
          {available.map((topic) => {
            const perf = performance.get(topic);
            const count = activeQuestions.filter((q) => q.topic === topic).length;
            const band =
              !perf || perf.attempts < 3
                ? 'neutral'
                : perf.accuracy <= 0.75
                  ? 'weak'
                  : perf.accuracy >= 0.9
                    ? 'strong'
                    : 'neutral';
            return (
              <Tile
                key={topic}
                to={`/signs/${topic}`}
                emoji={SIGN_EMOJI[topic] ?? '🚸'}
                title={TOPIC_LABELS[topic]}
                sub={`${count} question${count === 1 ? '' : 's'}`}
                {...(perf && perf.attempts >= 3
                  ? { accuracy: `${Math.round(perf.accuracy * 100)}%`, band }
                  : {})}
              />
            );
          })}
        </ul>
      </Card>

      <Disclaimer />
    </>
  );
}
