import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { YieldSignBadge } from '@/ui/YieldSignBadge';

describe('YieldSignBadge', () => {
  it('renders one reusable yield silhouette with shared state colours', () => {
    const { container } = render(<><YieldSignBadge earned={false} /><YieldSignBadge earned /><YieldSignBadge earned mastered /><YieldSignBadge premium earned /></>);
    const badges = [...container.querySelectorAll<SVGSVGElement>(':scope > svg')];
       expect(container.querySelectorAll('[id^="yield-frame"]').length).toBe(5);
    expect(badges[0]?.style.getPropertyValue('--yield-primary')).toBe('#8d98a5');
    expect(badges[1]?.style.getPropertyValue('--yield-primary')).toBe('#00558c');
    expect(badges[2]?.style.getPropertyValue('--yield-primary')).toBe('#ffb500');
    expect(badges[3]?.querySelectorAll(':scope > svg')).toHaveLength(2);
    const ids = [...container.querySelectorAll('[id]')].map((node) => node.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
