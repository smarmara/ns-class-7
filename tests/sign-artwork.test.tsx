import { existsSync, readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import approvalsJson from '@data/signs/visual-approvals.json';
import fidelityJson from '@data/signs/sign-fidelity.json';
import learnerScopeJson from '@data/signs/learner-scope.json';
import signMetaJson from '@data/signs/sign-meta.json';
import { getSignArtwork, hasSignArtwork } from '@/signs/artwork';
import { SignArt } from '@/signs/SignArt';
import { OFFICIAL_CROPS, cropKeyFor, officialCropFor } from '@/signs/registry';

/**
 * Artwork resolution for the learner catalogue.
 *
 * The bug these tests exist to prevent: the catalogue listed all 155 Core and
 * Reference signs, but artwork resolved through sign-fidelity.json, which only
 * describes the 82 signs the question bank uses. The other 73 had approved
 * images and rendered a missing-artwork warning instead.
 */

const scope = learnerScopeJson as {
  classifications: Record<string, { scope: string; displayName: string }>;
};
const approvals = approvalsJson as { approvals: Record<string, { assetPath?: string }> };
const signMeta = signMetaJson as { signs: Record<string, { visualDescription: string }> };
const fidelity = fidelityJson as {
  signs: Record<string, { status: string; designation?: string; asset?: string }>;
};

const learnerEntries = Object.entries(scope.classifications).filter(
  ([, c]) => c.scope === 'core' || c.scope === 'reference',
);
const coreIds = learnerEntries.filter(([, c]) => c.scope === 'core').map(([id]) => id);
const referenceIds = learnerEntries.filter(([, c]) => c.scope === 'reference').map(([id]) => id);

/** Every sign id the question bank renders artwork for. */
const quizSignIds = (() => {
  const dir = join(process.cwd(), 'data/questions');
  const ids = new Set<string>();
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
    for (const q of JSON.parse(readFileSync(join(dir, file), 'utf8'))) {
      if (q.signId) ids.add(q.signId);
    }
  }
  return [...ids];
})();

describe('learner catalogue artwork resolution', () => {
  it('resolves approved artwork for every Core entry', () => {
    const unresolved = coreIds.filter((id) => !hasSignArtwork(id));
    expect(unresolved).toEqual([]);
    expect(coreIds.length).toBe(80);
  });

  it('resolves approved artwork for every Reference entry', () => {
    const unresolved = referenceIds.filter((id) => !hasSignArtwork(id));
    expect(unresolved).toEqual([]);
    expect(referenceIds.length).toBe(75);
  });

  it('leaves no learner entry on the missing-artwork fallback', () => {
    expect(learnerEntries.length).toBe(155);
    const unresolved = learnerEntries.map(([id]) => id).filter((id) => !hasSignArtwork(id));
    expect(unresolved).toEqual([]);
  });

  it('resolves only visual types the renderer can draw', () => {
    const kinds = new Set(learnerEntries.map(([id]) => getSignArtwork(id)!.kind));
    expect([...kinds].sort()).toEqual(['crop', 'shape', 'svg']);
  });

  it('points every official crop at a file that exists', () => {
    const missing: string[] = [];
    for (const [id] of learnerEntries) {
      const artwork = getSignArtwork(id)!;
      if (artwork.kind !== 'crop') continue;
      if (!existsSync(join(process.cwd(), 'public', decodeURIComponent(artwork.src)))) {
        missing.push(`${id} -> ${artwork.src}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it('resolves artwork for every sign the question bank uses', () => {
    const unresolved = quizSignIds.filter((id) => !hasSignArtwork(id));
    expect(unresolved).toEqual([]);
  });

  it('serves the same image the fidelity path served, for every question-bank sign', () => {
    // Guards against a quiz artwork regression from moving the resolver onto
    // visual-approvals.json — including the RB-1/RB-1A variable-number pair.
    for (const id of Object.keys(signMeta.signs)) {
      const entry = fidelity.signs[id];
      const legacy =
        entry?.status === 'official-crop' ? OFFICIAL_CROPS[cropKeyFor(entry)!] : undefined;
      const resolved = getSignArtwork(id);
      const current = resolved?.kind === 'crop' ? resolved.src : undefined;
      expect(current, id).toBe(legacy);
    }
  });

  it('keeps the 50 and 80 speed signs on different images', () => {
    const fifty = getSignArtwork('maximum-speed-50');
    const eighty = getSignArtwork('maximum-speed-80');
    expect(fifty).toEqual({ kind: 'crop', src: '/signs/ns-official/RB-1A.png', designation: 'RB-1' });
    expect(eighty).toEqual({ kind: 'crop', src: '/signs/ns-official/RB-1.png', designation: 'RB-1' });
    expect(officialCropFor('maximum-speed-50')).toBe('/signs/ns-official/RB-1A.png');
  });

  it('refuses to resolve artwork for an unknown sign', () => {
    expect(getSignArtwork('not-a-real-sign')).toBeUndefined();
  });

  it('never resolves an official crop for a sign with no approved asset', () => {
    for (const [id] of learnerEntries) {
      const artwork = getSignArtwork(id)!;
      if (artwork.kind === 'crop') expect(approvals.approvals[id]!.assetPath, id).toBe(artwork.src);
      else expect(approvals.approvals[id]!.assetPath, id).toBeUndefined();
    }
  });
});

describe('SignArt rendering', () => {
  it('renders real artwork for a Reference sign that used to fall back', () => {
    // RB-42R "Straight or Right Turn" had approved artwork but no fidelity row.
    render(<SignArt signId="RB-42R" label="Straight or Right Turn" />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', '/signs/ns-official/RB-42R.png');
    expect(screen.queryByText('⚠️')).toBeNull();
  });

  it('renders no missing-artwork fallback anywhere in the learner catalogue', () => {
    for (const [id, entry] of learnerEntries) {
      const { container, unmount } = render(<SignArt signId={id} label={entry.displayName} />);
      expect(container.textContent, id).not.toContain('⚠️');
      unmount();
    }
  });

  it('names a question sign after its appearance, never its meaning', () => {
    // Quiz code passes no `label`, so the accessible name can only ever come
    // from sign-meta's visualDescription. Without this the catalogue's
    // displayName fallback would answer sign-recognition questions.
    const missingDescription = quizSignIds.filter((id) => !signMeta.signs[id]?.visualDescription);
    expect(missingDescription).toEqual([]);

    // The accessible name describes the picture, not the sign's name. (It may
    // still contain a word painted on the sign face — that leaks nothing,
    // because a sighted user reads the same word off the image.)
    for (const id of quizSignIds) {
      const { container, unmount } = render(<SignArt signId={id} />);
      const el = container.querySelector('[alt], [aria-label]')!;
      const name = el.getAttribute('alt') ?? el.getAttribute('aria-label');
      // Shape concepts are drawn by SignShapeArt, which describes its own
      // silhouette; every other sign is named by sign-meta's description.
      if (getSignArtwork(id)!.kind !== 'shape') {
        expect(name, id).toBe(signMeta.signs[id]!.visualDescription);
      }
      expect(name, id).not.toBe(scope.classifications[id]!.displayName);
      unmount();
    }
  });

  it('renders decorative artwork for a sign that has no sign-meta row', () => {
    // Hub thumbnails are decorative: the card carries its own label. A missing
    // description must not push an approved Reference sign to the fallback.
    const { container } = render(<SignArt signId="RB-102" size={44} decorative />);
    expect(container.textContent).not.toContain('⚠️');
    expect(container.querySelector('img')).toHaveAttribute(
      'src',
      '/signs/ns-official/RB-102.png',
    );
    expect(container.querySelector('img')).toHaveAttribute('alt', '');
  });

  it('still requires a name when the artwork is not decorative', () => {
    render(<SignArt signId="RB-102" />);
    expect(screen.getByRole('img')).toHaveAccessibleName(/Missing sign artwork/);
  });

  it('falls back visibly rather than crashing on a sign with no artwork', () => {
    render(<SignArt signId="not-a-real-sign" label="Nothing" />);
    expect(screen.getByRole('img')).toHaveAccessibleName(/Missing sign artwork/);
  });
});
