import type { Question } from '@/content/types';
import type { Progress } from '@/engine/learning/types';
import { achievementMedals, sectionPresentation } from './achievementPresentation';
import { mockMedals } from './progression';

export type AchievementEvent =
  | {
      id: string;
      kind: 'topic' | 'section';
      family: 'rules' | 'signs';
      state: 'complete' | 'mastered';
      title: string;
      subtitle: string;
    }
  | {
      id: string;
      kind: 'exam';
      family: 'exam';
      state: 'earned';
      title: string;
      subtitle: string;
      tier: 1 | 2 | 3 | 4;
    };

/**
 * Derive only achievement boundaries crossed by the current result.
 *
 * This is deliberately a pure comparison of the existing derived collection;
 * it adds no persistence or "already shown" flag. Mastered wins over Complete
 * for one identity, so a direct jump cannot produce two cards.
 */
export function getNewAchievementEvents(
  pool: readonly Question[],
  before: Progress,
  after: Progress,
  context: 'learning' | 'exam',
): AchievementEvent[] {
  if (context === 'exam') return examEvents(before, after);

  const beforeTopics = new Map(achievementMedals(pool, before).map((medal) => [medal.id, medal]));
  const afterTopics = achievementMedals(pool, after);
  const topicEvents: AchievementEvent[] = [];

  for (const medal of afterTopics) {
    const previous = beforeTopics.get(medal.id);
    if (medal.mastered && !previous?.mastered) {
      topicEvents.push({
        id: medal.id,
        kind: 'topic',
        family: medal.tone,
        state: 'mastered',
        title: medal.label,
        subtitle: "You've mastered this topic.",
      });
    } else if (medal.earned && !previous?.earned) {
      topicEvents.push({
        id: medal.id,
        kind: 'topic',
        family: medal.tone,
        state: 'complete',
        title: medal.label,
        subtitle: 'Topic complete',
      });
    }
  }

  const beforeSections = new Map(sectionPresentation(pool, before).map((medal) => [medal.id, medal]));
  const sectionEvents: AchievementEvent[] = sectionPresentation(pool, after)
    .filter((medal) => medal.earned && !beforeSections.get(medal.id)?.earned)
    .map((medal) => ({
      id: medal.id,
      kind: 'section' as const,
      family: medal.tone,
      state: 'complete' as const,
      title: medal.label,
      subtitle: medal.id === 'area:rules' ? 'All Rules topics complete' : 'All Road Sign sections complete',
    }));

  return [...topicEvents, ...sectionEvents];
}

function examEvents(before: Progress, after: Progress): AchievementEvent[] {
  const beforeMedals = new Map(mockMedals(before).map((medal) => [medal.id, medal]));
  return mockMedals(after)
    .filter((medal) => medal.earned && !beforeMedals.get(medal.id)?.earned)
    .sort((a, b) => (a.tier ?? 0) - (b.tier ?? 0))
    .map((medal) => ({
      id: medal.id,
      kind: 'exam' as const,
      family: 'exam' as const,
      state: 'earned' as const,
      title: medal.title,
      subtitle: medal.requirement,
      tier: medal.tier as 1 | 2 | 3 | 4,
    }));
}
