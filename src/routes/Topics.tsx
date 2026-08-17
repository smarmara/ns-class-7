import { RULES_TOPICS, TOPIC_LABELS, activeQuestions } from '@/content';
import type { Topic } from '@/content/types';
import { topicPerformance } from '@/engine/learning/readiness';
import { useProgress } from '@/store/useProgress';
import { Card, Disclaimer, PageHead, Tile } from '@/ui/components';

const TOPIC_EMOJI: Partial<Record<Topic, string>> = {
  'traffic-signals': '🚦',
  'right-of-way': '↔️',
  intersections: '➕',
  'pedestrians-crosswalks': '🚶',
  'school-zones-and-buses': '🚌',
  'emergency-vehicles': '🚑',
  'transit-buses': '🚏',
  'speed-limits': '🎯',
  'following-and-stopping': '🛑',
  'lane-use': '🛣',
  turning: '↩️',
  passing: '⏩',
  'parking-and-stopping': '🅿️',
  roundabouts: '🔄',
  'highways-and-merging': '🛤',
  'adverse-conditions': '🌧',
  impairment: '🚫',
  'graduated-licensing': '🪪',
  'vehicle-and-driver-safety': '🔧',
  'sharing-the-road': '🚲',
  'collisions-and-emergencies': '⚠️',
};

export function Topics() {
  const progress = useProgress((s) => s.progress);
  const performance = new Map(topicPerformance(activeQuestions, progress).map((t) => [t.topic, t]));

  const available = RULES_TOPICS.filter((topic) =>
    activeQuestions.some((q) => q.topic === topic),
  );

  return (
    <>
      <PageHead title="Study by topic">
        Rules of the Road, broken into the areas the handbook covers
      </PageHead>

      <Card>
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
                to={`/study/${topic}`}
                emoji={TOPIC_EMOJI[topic] ?? '📘'}
                title={TOPIC_LABELS[topic]}
                sub={
                  perf && perf.questionsAttempted > 0
                    ? `${perf.questionsAttempted} of ${count} questions seen`
                    : `${count} question${count === 1 ? '' : 's'}`
                }
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
