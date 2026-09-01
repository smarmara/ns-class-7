import { useId } from 'react';
import type { CSSProperties, SVGProps } from 'react';
import steeringWheelSource from '@/assets/medals/steering-wheel-base.svg?raw';
import { scopedSvgFragment } from './inlineSvg';

export type SteeringWheelBadgeKind = 'level' | 'topic' | 'section' | 'exam';
export type SteeringWheelBadgeTone =
  | 'novice'
  | 'learner'
  | 'competent'
  | 'proficient'
  | 'expert'
  | 'rules'
  | 'signs'
  | 'bronze'
  | 'silver'
  | 'gold'
  | 'platinum';

export interface SteeringWheelBadgeProps extends Omit<SVGProps<SVGSVGElement>, 'children'> {
  kind: SteeringWheelBadgeKind;
  tone: SteeringWheelBadgeTone;
  earned?: boolean;
  mastered?: boolean;
  tier?: 1 | 2 | 3 | 4;
  label?: string;
}

const toneDefaults: Record<SteeringWheelBadgeTone, Record<string, string>> = {
  novice: { primary: '#71839a', light: '#aab8c7', structure: '#35465a', hub: '#71839a' },
  learner: { primary: '#428bca', light: '#8fc1e7', structure: '#002b49', hub: '#428bca' },
  competent: { primary: '#00558c', light: '#428bca', structure: '#002b49', hub: '#428bca' },
  proficient: { primary: '#ffb500', light: '#ffe08a', structure: '#002b49', hub: '#ffb500' },
  expert: { primary: '#d99500', light: '#ffe49b', structure: '#002b49', hub: '#ffb500', accent: '#9b26b6' },
  rules: { primary: '#00558c', light: '#428bca', structure: '#002b49', hub: '#00558c' },
  signs: { primary: '#17694f', light: '#78b99f', structure: '#002b49', hub: '#428bca' },
  bronze: { primary: '#a96842', light: '#d6a27d', structure: '#4b3024', hub: '#a96842' },
  silver: { primary: '#9aa9b8', light: '#e1e8ee', structure: '#435363', hub: '#9aa9b8' },
  gold: { primary: '#d99500', light: '#ffe49b', structure: '#5b4100', hub: '#ffb500' },
  platinum: { primary: '#cbd8e4', light: '#ffffff', structure: '#465b70', hub: '#b9c9da', accent: '#9b26b6' },
};

const unearnedColors: Record<string, string> = { primary: '#8d98a5', light: '#c3cbd3', structure: '#586675', hub: '#8d98a5' };
const topicCompleteColors: Record<string, string> = { primary: '#00558c', light: '#428bca', structure: '#002b49', hub: '#00558c' };
const topicMasteredColors: Record<string, string> = { primary: '#ffb500', light: '#ffe08a', structure: '#725000', hub: '#ffb500' };


/** One reusable achievement treatment; the wheel geometry comes only from the master SVG. */
export function SteeringWheelBadge({
  kind,
  tone,
  earned = true,
  mastered = false,
  tier,
  label,
  className,
  style,
  ...props
}: SteeringWheelBadgeProps) {
  const reactId = useId().replaceAll(':', '');
  const shadeId = `sw-shade-${reactId}`;
  const colors = kind === 'topic'
    ? (earned ? (mastered ? topicMasteredColors : topicCompleteColors) : unearnedColors)
    : toneDefaults[tone];
  const cssVars = {
    '--wheel-primary': colors.primary,
    '--wheel-primary-light': colors.light,
    '--wheel-primary-dark': colors.structure,
    '--wheel-structure': colors.structure,
    '--wheel-hub': colors.hub,
    '--badge-accent': kind === 'section' ? '#ffb500' : colors.accent ?? colors.light,
    ...style,
  } as CSSProperties;
  const marks = kind === 'exam' ? Math.max(1, Math.min(4, tier ?? 1)) : 0;
  const decorative = label ? undefined : true;

  return (
    <svg
      {...props}
      className={['steering-wheel-badge', `steering-wheel-badge--${kind}`, `steering-wheel-badge--${tone}`, className].filter(Boolean).join(' ')}
      viewBox="0 0 512 512"
      style={cssVars}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={decorative}
      data-earned={earned}
      data-mastered={mastered}
      data-tier={tier}
    >
      {kind === 'section' && (
        <g className="steering-wheel-badge__laurel" fill="none" stroke="var(--badge-accent)" strokeWidth="12" strokeLinecap="round" opacity=".9">
          <path d="M72 344c-35-58-27-112 15-153" />
          <path d="M440 344c35-58 27-112-15-153" />
          <path d="M76 316l-26 4M66 276l-25-7M75 238l-20-16M436 316l26 4M446 276l25-7M437 238l20-16" />
        </g>
      )}
      {kind !== 'level' && <circle className="steering-wheel-badge__bezel" cx="256" cy="256" r="226" fill="none" stroke="var(--badge-accent)" strokeWidth={kind === 'section' ? 18 : 10} opacity={earned ? 0.9 : 0.25} />}
      {/* The steering wheel interior is intentionally transparent; do not place an opaque medal face above the spoke assembly. */}
      <svg x="0" y="0" width="512" height="512" viewBox="0 0 512 512" fill="none" dangerouslySetInnerHTML={{ __html: scopedSvgFragment(steeringWheelSource, shadeId) }} />
      {kind === 'section' && <circle cx="256" cy="256" r="78" fill="none" stroke="var(--badge-accent)" strokeWidth="5" opacity=".45" />}
      {marks > 0 && (
        <g className="steering-wheel-badge__marks" fill="var(--badge-accent)" opacity=".95">
          {Array.from({ length: marks }, (_, index) => <circle key={index} cx={238 + index * 12} cy="256" r="4" />)}
        </g>
      )}
      {mastered && earned && kind !== 'topic' && <circle className="steering-wheel-badge__mastery-ring" cx="256" cy="256" r="72" fill="none" stroke="var(--mastery, #9b26b6)" strokeWidth="4" opacity=".9" />}
    </svg>
  );
}

export function SteeringWheelBadgeGallery() {
  const examples: SteeringWheelBadgeProps[] = [
    ...(['novice', 'learner', 'competent', 'proficient', 'expert'] as const).map((tone) => ({ kind: 'level' as const, tone })),
    { kind: 'topic', tone: 'rules', earned: true }, { kind: 'topic', tone: 'rules', earned: false },
    { kind: 'topic', tone: 'signs', earned: true }, { kind: 'topic', tone: 'signs', earned: false },
    { kind: 'section', tone: 'rules', earned: true }, { kind: 'section', tone: 'signs', earned: true },
    ...([1, 2, 3, 4] as const).map((tier) => ({ kind: 'exam' as const, tone: (['bronze', 'silver', 'gold', 'platinum'] as const)[tier - 1]!, earned: true, tier })),
  ];
  return <div className="steering-wheel-badge-gallery" aria-label="Steering-wheel badge development gallery">{examples.map((example, index) => <SteeringWheelBadge key={index} {...example} />)}</div>;
}
