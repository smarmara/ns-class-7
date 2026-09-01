import { useId } from 'react';
import type { CSSProperties, SVGProps } from 'react';
import yieldSignSource from '@/assets/medals/yield-sign-base.svg?raw';
import { scopedSvgFragment } from './inlineSvg';

export interface YieldSignBadgeProps extends Omit<SVGProps<SVGSVGElement>, 'children'> {
  earned?: boolean;
  mastered?: boolean;
  premium?: boolean;
  label?: string;
}

const states = {
  neutral: { primary: '#8d98a5', light: '#c3cbd3', inner: '#e5e8eb', edge: '#586675' },
  blue: { primary: '#00558c', light: '#428bca', inner: '#dcecf7', edge: '#002b49' },
  gold: { primary: '#ffb500', light: '#ffe08a', inner: '#fff3c2', edge: '#725000' },
} as const;

/** Reusable yield-shaped Road Sign achievement family. */
export function YieldSignBadge({ earned = true, mastered = false, premium = false, label, className, style, ...props }: YieldSignBadgeProps) {
  const id = useId().replaceAll(':', '');
  const state = !earned ? states.neutral : mastered ? states.gold : states.blue;
  const cssVars = {
    '--yield-primary': state.primary,
    '--yield-primary-light': state.light,
    '--yield-inner': state.inner,
    '--yield-inner-edge': state.edge,
    ...style,
  } as CSSProperties;
  return (
    <svg
      {...props}
      className={['yield-sign-badge', premium && 'yield-sign-badge--premium', className].filter(Boolean).join(' ')}
      viewBox="0 0 512 512"
      style={cssVars}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      data-earned={earned}
      data-mastered={mastered}
    >
      {premium && (
        <svg
          x="0"
          y="0"
          width="512"
          height="512"
          viewBox="0 0 512 512"
          fill="none"
          transform="translate(-51 -51) scale(1.2)"
          style={{ '--yield-primary': '#ffb500', '--yield-primary-light': '#ffe08a', '--yield-inner': '#fff3c2', '--yield-inner-edge': '#725000' } as CSSProperties}
          dangerouslySetInnerHTML={{ __html: scopedSvgFragment(yieldSignSource, `${id}-premium`) }}
        />
      )}
      <svg x="0" y="0" width="512" height="512" viewBox="0 0 512 512" fill="none" transform={premium ? 'translate(-26 -26) scale(1.1)' : undefined} dangerouslySetInnerHTML={{ __html: scopedSvgFragment(yieldSignSource, id) }} />
    </svg>
  );
}
