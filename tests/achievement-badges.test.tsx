import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SteeringWheelBadge } from '@/ui/SteeringWheelBadge';

describe('SteeringWheelBadge geometry', () => {
  it('renders the canonical connected spoke assembly for every badge treatment', () => {
    const { container } = render(
      <>
        <SteeringWheelBadge kind="level" tone="learner" />
        <SteeringWheelBadge kind="topic" tone="rules" earned={false} />
        <SteeringWheelBadge kind="section" tone="signs" />
        <SteeringWheelBadge kind="exam" tone="gold" tier={3} />
      </>,
    );
    const paths = [...container.querySelectorAll('path')];
    const spoke = paths.find((path) => path.getAttribute('d')?.includes('M 88 224'));
    expect(spoke).toBeTruthy();
    expect(spoke?.closest('svg')?.querySelector('use[href*="spoke-assembly"]')).toBeTruthy();
    expect(spoke?.getAttribute('d')).toContain('Q 296 293 296 327');
    expect(spoke?.getAttribute('d')).toContain('L 224 424');
    const wheelSvg = spoke?.closest('svg');
    expect(wheelSvg).toHaveAttribute('fill', 'none');
    expect(wheelSvg?.querySelector('[id^="wheel-rim-base"]')).not.toHaveAttribute('fill');
    expect(container.querySelectorAll('path').length).toBeGreaterThanOrEqual(4);
  });

  it('scopes repeated SVG ids and their references', () => {
    const { container } = render(<><SteeringWheelBadge kind="topic" tone="rules" /><SteeringWheelBadge kind="exam" tone="platinum" tier={4} /></>);
    const ids = [...container.querySelectorAll('[id]')].map((node) => node.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const use of container.querySelectorAll('use')) {
      const href = use.getAttribute('href');
      expect(href).toBeTruthy();
      expect(container.querySelector(href!.replace(/^#/, '#'))).toBeTruthy();
    }
  });

  it('maps topic state to neutral grey, brand blue, and achievement gold', () => {
    const { container } = render(
      <>
        <SteeringWheelBadge kind="topic" tone="rules" earned />
        <SteeringWheelBadge kind="topic" tone="rules" earned mastered />
        <SteeringWheelBadge kind="topic" tone="signs" earned mastered />
        <SteeringWheelBadge kind="topic" tone="rules" earned={false} mastered={false} />
      </>,
    );
    const badges = [...container.querySelectorAll<SVGSVGElement>(':scope > svg')];
    expect(badges[0]?.style.getPropertyValue('--wheel-primary')).toBe('#00558c');
    expect(badges[1]?.style.getPropertyValue('--wheel-primary')).toBe('#ffb500');
    expect(badges[1]?.querySelector('.steering-wheel-badge__mastery-ring')).toBeNull();
    expect(badges[2]?.style.getPropertyValue('--wheel-primary')).toBe('#ffb500');
    expect(badges[2]?.querySelector('.steering-wheel-badge__mastery-ring')).toBeNull();
    expect(badges[3]?.style.getPropertyValue('--wheel-primary')).toBe('#8d98a5');
    expect(badges[3]?.querySelector('.steering-wheel-badge__mastery-ring')).toBeNull();
  });
});
