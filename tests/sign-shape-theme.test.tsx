/**
 * Sign-shape diagrams follow the interface theme; official signs never do.
 *
 * That single rule is the whole point of this file. The abstract silhouettes
 * that teach sign geometry are learner diagrams, so a near-black fill that
 * worked on a light page had to become pale on a dark one. The Province's real
 * artwork is the opposite case: a STOP sign is red in both themes, and tinting
 * or inverting it would teach the wrong thing.
 *
 * The approval fingerprint in data/signs/visual-approvals.json hashes the
 * rendered markup of each shape, so these tests also pin the boundary that
 * keeps those approvals valid: theming lives in CSS, and the SVG the approval
 * covers is unchanged.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { render } from '@testing-library/react';
import { SIGN_SHAPES, SIGN_SHAPE_IDS, SignShapeArt } from '../src/signs/SignShapeArt';
import { SignArt } from '../src/signs/SignArt';
import signMeta from '../data/signs/sign-meta.json';

const STYLES = readFileSync(path.join(process.cwd(), 'src/styles.css'), 'utf8');

const LIGHT = /:root \{[\s\S]*?\n\}/;
const DARK_AUTO = /@media \(prefers-color-scheme: dark\) \{[\s\S]*?\n {2}\}\n\}/;
const DARK_EXPLICIT = /:root\[data-theme='dark'\] \{[\s\S]*?\n\}/;
const SHAPE_RULE = /\.sign-shape [^{]*\{[\s\S]*?\}/;

/** The token block for one theme state, as written in styles.css. */
function tokensOf(selector: RegExp): string {
  const match = selector.exec(STYLES);
  expect(match, `theme block not found: ${selector}`).toBeTruthy();
  return match![0];
}

function luminance(hex: string): number {
  const channel = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const n = parseInt(hex.slice(1), 16);
  return (
    0.2126 * channel((n >> 16) & 255) +
    0.7152 * channel((n >> 8) & 255) +
    0.0722 * channel(n & 255)
  );
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
}

describe('theme tokens', () => {
  it('defines the shape colours in every theme state', () => {
    // Automatic, Light and Dark are three separate states in this app. A token
    // defined in only one of them is the bug that produces an unstyled shape
    // for whichever learners are in the state that was missed.
    for (const [name, selector] of [
      ['light', LIGHT],
      ['dark (system)', DARK_AUTO],
      ['dark (explicit)', DARK_EXPLICIT],
    ] as const) {
      const block = tokensOf(selector);
      expect(block, `${name}: --sign-shape-fill`).toContain('--sign-shape-fill:');
      expect(block, `${name}: --sign-shape-stroke`).toContain('--sign-shape-stroke:');
    }
  });

  it('gives the two dark states identical shape colours', () => {
    // Automatic-on-a-dark-system and an explicit Dark choice must look the
    // same; they are separate CSS blocks, so they can silently drift.
    const read = (block: string, token: string) =>
      new RegExp(`${token}:\\s*(#[0-9a-f]{3,8})`, 'i').exec(block)?.[1]?.toLowerCase();

    const auto = tokensOf(DARK_AUTO);
    const explicit = tokensOf(DARK_EXPLICIT);
    for (const token of ['--sign-shape-fill', '--sign-shape-stroke']) {
      expect(read(auto, token), token).toBe(read(explicit, token));
    }
  });

  it('inverts the light/dark relationship rather than nudging it', () => {
    const fillOf = (block: string) => /--sign-shape-fill:\s*(#[0-9a-f]{6})/i.exec(block)![1]!;
    const lightFill = fillOf(tokensOf(LIGHT));
    const darkFill = fillOf(tokensOf(DARK_AUTO));

    // Dark mode must go lighter, not merely different.
    expect(luminance(darkFill)).toBeGreaterThan(luminance(lightFill));

    /*
     * WCAG 1.4.11 asks 3:1 for a graphical object against what is adjacent to
     * it. Checked against the extremes of each theme's surfaces, because a
     * shape appears on the page, on a card and on an elevated card.
     */
    for (const surface of ['#f7f6f4', '#ffffff', '#f1f0ed', '#e5e4e0']) {
      expect(contrast(lightFill, surface), `light on ${surface}`).toBeGreaterThanOrEqual(3);
    }
    for (const surface of ['#0e1014', '#181b21', '#1f232a', '#212630', '#2b313c']) {
      expect(contrast(darkFill, surface), `dark on ${surface}`).toBeGreaterThanOrEqual(3);
    }
  });
});

describe('the shape diagrams are styled semantically', () => {
  it('paints shape geometry from the theme variables', () => {
    const rule = SHAPE_RULE.exec(STYLES);
    expect(rule, 'a .sign-shape rule exists').toBeTruthy();
    expect(rule![0]).toContain('fill: var(--sign-shape-fill)');
    expect(rule![0]).toContain('stroke: var(--sign-shape-stroke)');
  });

  it('marks every rendered shape with the themed class', () => {
    for (const shapeId of SIGN_SHAPE_IDS) {
      const { container, unmount } = render(<SignShapeArt shapeId={shapeId} />);
      expect(container.querySelector('svg')!.getAttribute('class'), shapeId).toContain(
        'sign-shape',
      );
      unmount();
    }
  });

  it('keeps a caller className alongside the themed class', () => {
    const { container } = render(<SignShapeArt shapeId="shape-stop" className="sign-thumb" />);
    const classes = container.querySelector('svg')!.getAttribute('class')!.split(' ');
    expect(classes).toContain('sign-shape');
    expect(classes).toContain('sign-thumb');
  });

  it('never uses a filter, invert or blend to achieve the theme', () => {
    /*
     * The rejected shortcut. `filter: invert()` would flip a shape for free —
     * and would flip an official sign too the moment the selector drifted, or
     * the moment someone reached for the same trick one element up the tree.
     */
    const rule = SHAPE_RULE.exec(STYLES)![0];
    expect(rule).not.toMatch(/filter|invert|brightness|mix-blend-mode/);
  });
});

describe('official artwork is untouched', () => {
  it('applies no filter, invert or blend to any sign surface', () => {
    // Deliberately wider than the shape rule: any sign-adjacent selector that
    // acquired a filter would recolour the Province's artwork.
    for (const match of STYLES.matchAll(/\.sign[a-z-]*[^{}]*\{[^}]*\}/g)) {
      expect(match[0], match[0].slice(0, 60)).not.toMatch(
        /filter:\s*(?!none)|invert\(|mix-blend-mode/,
      );
    }
  });

  it('does not put the themed class on an official crop', () => {
    // `stop` is the Province's real octagon, and the near-twin of the abstract
    // `shape-stop` diagram — the one pair most at risk of being themed together.
    const { container } = render(<SignArt signId="stop" />);
    const img = container.querySelector('img');
    expect(img, 'the official STOP sign renders as a crop').toBeTruthy();
    expect(img!.getAttribute('class') ?? '').not.toContain('sign-shape');
    expect(img!.getAttribute('src')).toContain('/signs/ns-official/');
  });
});

describe('the approval fingerprint still covers what was reviewed', () => {
  it('renders the shape markup unchanged when called the way the fingerprint calls it', () => {
    /*
     * scripts/lib/sign-visuals.ts hashes `SIGN_SHAPES[id]({ size: 120 })`. The
     * theming had to leave that markup alone, or all six shape approvals would
     * have gone stale and needed a human to re-review a change that altered no
     * geometry. This is why the class and the label are added by the wrapper.
     */
    for (const shapeId of SIGN_SHAPE_IDS) {
      const markup = renderToStaticMarkup(SIGN_SHAPES[shapeId]!({ size: 120 }) as never);
      expect(markup, shapeId).toContain('fill="#16181d"');
      expect(markup, shapeId).not.toContain('sign-shape');
      expect(markup, shapeId).not.toContain('var(--');
    }
  });
});

describe('accessible naming', () => {
  it('describes a shape by its canonical description, with no colour word', () => {
    /*
     * The description must not name a colour now that the shape is near-black
     * in one theme and pale in the other — a screen-reader user would be told
     * something a sighted user cannot confirm.
     */
    const shapeSignIds = Object.entries(
      signMeta.signs as Record<string, { visualDescription?: string }>,
    ).filter(([id]) => id.startsWith('shape-'));
    expect(shapeSignIds.length).toBeGreaterThan(0);

    for (const [signId, meta] of shapeSignIds) {
      const { container, unmount } = render(<SignArt signId={signId} />);
      const name = container.querySelector('svg')!.getAttribute('aria-label');
      expect(name, signId).toBe(meta.visualDescription);
      expect(name!.toLowerCase(), signId).not.toMatch(/black|white|grey|gray|pale/);
      unmount();
    }
  });

  it('still hides a decorative shape from assistive technology', () => {
    const { container } = render(<SignShapeArt shapeId="shape-stop" decorative />);
    const svg = container.querySelector('svg')!;
    expect(svg.getAttribute('aria-hidden')).toBe('true');
    expect(svg.querySelector('title')).toBeNull();
  });
});
