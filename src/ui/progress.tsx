import type { ReactNode } from 'react';
import { MASTERY_LABELS, masteryLevel, type MasteryStage } from '@/engine/learning/mastery';

/** Circular progress ring with a spoken equivalent for screen readers. */
export function ProgressRing({
  value,
  max = 100,
  size = 96,
  stroke = 8,
  label,
  tone = 'accent',
  children,
}: {
  value: number;
  max?: number;
  size?: number;
  stroke?: number;
  label: string;
  tone?: 'accent' | 'gold';
  children?: ReactNode;
}) {
  const clamped = Math.min(max, Math.max(0, value));
  const pct = max === 0 ? 0 : (clamped / max) * 100;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;

  return (
    <div
      className="ring"
      data-tone={tone}
      role="progressbar"
      aria-label={label}
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuetext={label}
      style={{ width: size, height: size }}
    >
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
        <circle className="ring-track" cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} />
        <circle
          className="ring-fill"
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          strokeDasharray={c}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      {children && <div className="ring-center">{children}</div>}
    </div>
  );
}

const STAGE_ORDER: MasteryStage[] = ['new', 'learning', 'developing', 'complete', 'mastered'];

/** Five-segment mastery indicator; segments fill to the learner's current stage. */
export function MasteryBar({ stage }: { stage: MasteryStage }) {
  const level = masteryLevel(stage);
  return (
    <span
      className="mastery-bar"
      role="img"
      aria-label={`Mastery: ${MASTERY_LABELS[stage]}`}
      title={MASTERY_LABELS[stage]}
    >
      {STAGE_ORDER.map((s) => (
        <span
          key={s}
          className="mastery-seg"
          data-filled={STAGE_ORDER.indexOf(s) <= level}
          data-stage={stage}
        />
      ))}
    </span>
  );
}

export function MasteryLabel({ stage }: { stage: MasteryStage }) {
  return (
    <span className="mastery-label" data-stage={stage}>
      {MASTERY_LABELS[stage]}
    </span>
  );
}