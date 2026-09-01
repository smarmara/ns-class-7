/**
 * The icon layer's licensing boundary, enforced in code.
 *
 * Font Awesome Pro artwork is licensed per seat, so this repository may publish
 * icon *names* but never icon *artwork*. That distinction is invisible at a
 * glance — `fa-book-open-cover` and a path string look equally harmless in a
 * diff — so it is asserted here rather than left to reviewer memory.
 *
 * These tests also pin the rendering contract the hosted Kit depends on: the
 * class shape it scans for, and the marker class that must stay outside Font
 * Awesome's namespace.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { render, screen } from '@testing-library/react';
import { Icon, LearnIcon, SignsIcon, PracticeIcon } from '../src/ui/Icon';
import { KIT_ICON_NAMES } from '../src/ui/kitIcons';

const ICON_SOURCE = readFileSync(path.join(process.cwd(), 'src/ui/Icon.tsx'), 'utf8');

describe('no Pro artwork is committed', () => {
  it('the Pro icon module contains names, not glyph geometry', () => {
    /*
     * The signature of extracted artwork: a quoted string that is a moveto
     * followed by a long run of nothing but path commands and numbers. Prose,
     * class names and Kit URLs cannot match it — they contain letters outside
     * the SVG path alphabet.
     */
    const glyphPathData = /["'`][Mm]\s*-?[\d.][MmLlHhVvCcSsQqTtAaZz\d.,\s+-]{80,}["'`]/;
    expect(glyphPathData.test(ICON_SOURCE)).toBe(false);
  });

  it('renders no <svg> of its own', () => {
    // If the Kit is unavailable the element stays an <i>. Anything that drew
    // its own SVG here would mean the artwork had come back into the bundle.
    const { container } = render(<LearnIcon />);
    expect(container.querySelector('svg')).toBeNull();
    expect(container.querySelector('path')).toBeNull();
  });

  it('does not import the licensed Pro packages', () => {
    expect(ICON_SOURCE).not.toMatch(/@fortawesome\/(?:pro|sharp|kit)-/);
  });
});

describe('the class contract the Kit scans for', () => {
  it('emits a style class and an icon-name class', () => {
    const { container } = render(<Icon name="fire" />);
    const el = container.querySelector('i')!;
    expect(el.className.split(' ')).toEqual(
      expect.arrayContaining(['app-icon', 'fa-regular', 'fa-fire']),
    );
  });

  it('honours an explicit style', () => {
    const { container } = render(<Icon name="fire" iconStyle="fa-solid" />);
    expect(container.querySelector('i')!.className).toContain('fa-solid');
  });

  it('keeps its marker class outside the fa- namespace', () => {
    /*
     * Font Awesome resolves the icon name from the FIRST `fa-*` class it sees.
     * A marker called `fa-icon` therefore made every glyph resolve as an icon
     * named "icon" — a real bug this project hit. `app-icon` is deliberate.
     */
    const { container } = render(<Icon name="fire" />);
    const classes = container.querySelector('i')!.className.split(' ');
    const firstFa = classes.find((c) => c.startsWith('fa-') && c !== 'fa-regular' && c !== 'fa-solid');
    expect(firstFa).toBe('fa-fire');
    expect(classes).not.toContain('fa-icon');
  });

  it('appends caller classes without dropping its own', () => {
    const { container } = render(<Icon name="fire" className="metric-glyph" />);
    const classes = container.querySelector('i')!.className.split(' ');
    expect(classes).toContain('app-icon');
    expect(classes).toContain('metric-glyph');
  });
});

describe('accessibility', () => {
  it('hides an unlabelled icon, because its label is the text beside it', () => {
    const { container } = render(<SignsIcon />);
    const el = container.querySelector('i')!;
    expect(el.getAttribute('aria-hidden')).toBe('true');
    expect(el.getAttribute('role')).toBeNull();
  });

  it('exposes an icon that carries meaning on its own', () => {
    render(<PracticeIcon title="Practice" />);
    const el = screen.getByRole('img', { name: 'Practice' });
    expect(el.getAttribute('aria-hidden')).toBeNull();
  });
});

describe('the Kit icon inventory', () => {
  it('lists every name the app asks the Kit for', () => {
    // Keeps the documented inventory honest: a new Pro icon added to the app
    // has to be declared here too, so the Kit's contents stay reviewable.
    for (const name of KIT_ICON_NAMES) {
      expect(ICON_SOURCE, `${name} should be used by Icon.tsx`).toContain(`name="${name}"`);
    }
    const used = [...ICON_SOURCE.matchAll(/name="([a-z-]+)"/g)].map((m) => m[1]!);
    expect(new Set(used)).toEqual(new Set(KIT_ICON_NAMES));
  });
});
