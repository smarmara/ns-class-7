import { SteeringWheelBadge } from './SteeringWheelBadge';
import { YieldSignBadge } from './YieldSignBadge';
import type { AchievementEvent } from '@/engine/engagement/achievementEvents';

export function AchievementAwardCard({ event }: { event: AchievementEvent }) {
  const label = `${event.kind === 'exam' ? 'Medal earned' : event.state === 'mastered' ? 'Medal mastered' : event.kind === 'section' ? 'Section medal earned' : 'Medal earned'}. ${event.title}. ${event.subtitle}`;
  const visual =
    event.family === 'signs' ? (
      <YieldSignBadge
        premium={event.kind === 'section'}
        earned
        mastered={event.state === 'mastered'}
        width={event.kind === 'section' ? 112 : 92}
        height={event.kind === 'section' ? 112 : 92}
      />
    ) : (
      <SteeringWheelBadge
        kind={event.kind === 'exam' ? 'exam' : event.kind}
        tone={event.kind === 'exam' ? (['bronze', 'silver', 'gold', 'platinum'] as const)[event.tier - 1]! : 'rules'}
        earned
        mastered={event.state === 'mastered'}
        tier={event.kind === 'exam' ? event.tier : undefined}
        width={event.kind === 'section' ? 112 : event.kind === 'exam' ? 96 : 92}
        height={event.kind === 'section' ? 112 : event.kind === 'exam' ? 96 : 92}
      />
    );

  return (
    <section className="achievement-award" aria-label={label} data-kind={event.kind} data-state={event.state}>
      <div className="achievement-award__eyebrow">
        {event.kind === 'exam' ? 'Medal earned' : event.state === 'mastered' ? 'Medal mastered' : event.kind === 'section' ? 'Section medal earned' : 'Medal earned'}
      </div>
      <div className="achievement-award__visual">{visual}</div>
      <strong>{event.title}</strong>
      <span>{event.subtitle}</span>
    </section>
  );
}
