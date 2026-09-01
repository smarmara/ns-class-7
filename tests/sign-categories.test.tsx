import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import learnerCategoriesJson from '@data/signs/learner-categories.json';
import learnerScopeJson from '@data/signs/learner-scope.json';
import { activeQuestions } from '@/content';
import { getSignArtwork } from '@/signs/artwork';
import {
  representativeSignsFor,
  signCategorySummaries,
} from '@/engine/learning/signCategories';
import { emptyProgress } from '@/engine/learning/types';
import { Signs } from '@/routes/Signs';

/**
 * The Signs hub describes the study catalogue, not the question bank.
 *
 * The regression these guard: the hub used to label each category with the
 * question count of a same-named question topic, so Lane Use & Turns — 56
 * signs in the catalogue — displayed as "3 questions".
 */

const categoryData = learnerCategoriesJson as {
  taxonomy: { id: string; label: string }[];
  categories: Record<string, string>;
};
const scope = learnerScopeJson as {
  classifications: Record<string, { scope: string; inQuiz: boolean }>;
};

const summaries = signCategorySummaries(activeQuestions, emptyProgress());
const byId = (id: string) => {
  const s = summaries.find((x) => x.id === id);
  if (!s) throw new Error(`missing summary ${id}`);
  return s;
};

describe('category summaries reconcile with the canonical catalogue', () => {
  it('covers exactly the canonical taxonomy, in its declared order', () => {
    expect(summaries.map((s) => s.id)).toEqual(categoryData.taxonomy.map((t) => t.id));
    expect(summaries).toHaveLength(10);
  });

  it('sums catalogue counts to 155', () => {
    expect(summaries.reduce((n, s) => n + s.catalogueCount, 0)).toBe(155);
  });

  it('sums Core to 80 and Reference to 75', () => {
    expect(summaries.reduce((n, s) => n + s.coreCount, 0)).toBe(80);
    expect(summaries.reduce((n, s) => n + s.referenceCount, 0)).toBe(75);
  });

  it('keeps catalogue count equal to Core plus Reference in every category', () => {
    for (const s of summaries) {
      expect(s.coreCount + s.referenceCount, s.id).toBe(s.catalogueCount);
    }
  });

  it('matches the per-category counts in learner-categories.json', () => {
    for (const s of summaries) {
      const expected = Object.values(categoryData.categories).filter((c) => c === s.id).length;
      expect(s.catalogueCount, s.id).toBe(expected);
    }
  });

  it('excludes Variant and Developer-only visuals from the totals', () => {
    const topLevel = Object.values(scope.classifications).filter(
      (c) => c.scope === 'core' || c.scope === 'reference',
    ).length;
    expect(summaries.reduce((n, s) => n + s.catalogueCount, 0)).toBe(topLevel);
  });
});

describe('assessment metadata stays separate from catalogue size', () => {
  it('assesses every Core concept and no Reference concept', () => {
    expect(summaries.reduce((n, s) => n + s.assessedCount, 0)).toBe(80);
    for (const s of summaries) {
      expect(s.assessedCount, s.id).toBeLessThanOrEqual(s.coreCount);
    }
  });

  it('derives assessed counts live rather than from the stored inQuiz flag', () => {
    // That flag is generated and had already gone stale once for shape-yield.
    // If it drifts again, this fails instead of the count silently dropping.
    const assessedIds = new Set(activeQuestions.filter((q) => q.signId).map((q) => q.signId));
    for (const [id, entry] of Object.entries(scope.classifications)) {
      if (entry.scope !== 'core') continue;
      expect(entry.inQuiz, `${id}: stored inQuiz disagrees with the question bank`).toBe(
        assessedIds.has(id),
      );
    }
  });

  it('never reports fewer questions than assessed concepts', () => {
    // One sign may carry several questions, so questions >= assessed always.
    for (const s of summaries) {
      expect(s.questionCount, s.id).toBeGreaterThanOrEqual(s.assessedCount);
    }
  });

  it('reports no accuracy when nothing has been attempted', () => {
    for (const s of summaries) {
      expect(s.attempts, s.id).toBe(0);
      expect(s.accuracy, s.id).toBeNull();
    }
  });

  it('shows Lane Use & Turns as a large catalogue with light assessment', () => {
    const lane = byId('lane-use');
    expect(lane.catalogueCount).toBe(56);
    expect(lane.coreCount).toBe(6);
    expect(lane.referenceCount).toBe(50);
    expect(lane.assessedCount).toBe(6);
  });
});

describe('representative artwork', () => {
  it('gives every category one to three representatives', () => {
    for (const s of summaries) {
      expect(s.representativeSignIds.length, s.id).toBeGreaterThanOrEqual(1);
      expect(s.representativeSignIds.length, s.id).toBeLessThanOrEqual(3);
    }
  });

  it('only uses signs that belong to the category they represent', () => {
    for (const s of summaries) {
      for (const id of s.representativeSignIds) {
        expect(categoryData.categories[id], `${id} in ${s.id}`).toBe(s.id);
      }
    }
  });

  it('never uses a Developer-only or unknown sign', () => {
    for (const s of summaries) {
      for (const id of s.representativeSignIds) {
        const entry = scope.classifications[id];
        expect(entry, `${id} is not a classified sign`).toBeDefined();
        expect(['core', 'reference'], id).toContain(entry!.scope);
      }
    }
  });

  it('resolves every representative to approved artwork', () => {
    for (const s of summaries) {
      for (const id of s.representativeSignIds) {
        expect(getSignArtwork(id), `${id} has no approved artwork`).toBeDefined();
      }
    }
  });

  it('includes at least one Core sign wherever the category has one', () => {
    for (const s of summaries) {
      if (s.coreCount === 0) continue;
      const core = s.representativeSignIds.filter(
        (id) => scope.classifications[id]!.scope === 'core',
      );
      expect(core.length, `${s.id} should show a Core sign`).toBeGreaterThan(0);
    }
  });

  it('is deterministic across calls', () => {
    expect(representativeSignsFor('lane-use')).toEqual(representativeSignsFor('lane-use'));
    expect(signCategorySummaries(activeQuestions, emptyProgress()).map((s) => s.representativeSignIds))
      .toEqual(summaries.map((s) => s.representativeSignIds));
  });
});

describe('the Signs hub renders the catalogue taxonomy', () => {
  const renderHub = () =>
    render(
      <MemoryRouter initialEntries={['/signs']}>
        <Signs />
      </MemoryRouter>,
    );

  it('shows all ten canonical category cards', () => {
    renderHub();
    const grid = document.querySelector('.category-grid')!;
    expect(within(grid as HTMLElement).getAllByRole('link')).toHaveLength(10);
    for (const { label } of categoryData.taxonomy) {
      expect(within(grid as HTMLElement).getByText(label)).toBeInTheDocument();
    }
  });

  it('labels Lane Use & Turns by its catalogue size, not the old question count', () => {
    renderHub();
    const card = screen.getByRole('link', { name: /^Lane Use & Turns/ });
    expect(card).toHaveAccessibleName('Lane Use & Turns, 56 signs · 6 assessed');
    expect(within(card).getByText('56 signs · 6 assessed')).toBeInTheDocument();
    expect(card.textContent).not.toMatch(/3 questions/);
  });

  it('gives Parking & Stopping its own card', () => {
    renderHub();
    expect(screen.getByRole('link', { name: /^Parking & Stopping/ })).toHaveAccessibleName(
      'Parking & Stopping, 7 signs · 2 assessed',
    );
  });

  it('merges school and pedestrian signs into one card', () => {
    renderHub();
    expect(screen.getByRole('link', { name: /^School, Pedestrian & Cyclist/ })).toBeInTheDocument();
    expect(screen.queryByText('School signs')).toBeNull();
    expect(screen.queryByText('Pedestrian and cyclist signs')).toBeNull();
    expect(screen.queryByText('Lane use signs')).toBeNull();
  });

  it('never presents a question count as if it were a sign count', () => {
    renderHub();
    const grid = document.querySelector('.category-grid') as HTMLElement;
    for (const card of within(grid).getAllByRole('link')) {
      expect(card.textContent).toMatch(/\d+ signs? · \d+ assessed/);
      expect(card.textContent).not.toMatch(/question/i);
    }
  });

  it('links every card into the catalogue filtered to that category', () => {
    renderHub();
    const grid = document.querySelector('.category-grid') as HTMLElement;
    const links = within(grid).getAllByRole('link');
    expect(links.map((a) => a.getAttribute('href'))).toEqual(
      categoryData.taxonomy.map((t) => `/signs/gallery?category=${t.id}`),
    );
  });

  it('shows no accuracy for a learner who has attempted nothing', () => {
    renderHub();
    const grid = document.querySelector('.category-grid') as HTMLElement;
    expect(grid.textContent).not.toMatch(/% correct/);
  });

  it('agrees with the catalogue call-to-action about the total', () => {
    renderHub();
    const total = summaries.reduce((n, s) => n + s.catalogueCount, 0);
    expect(screen.getByText(new RegExp(`Browse ${total} signs`))).toBeInTheDocument();
  });
});
