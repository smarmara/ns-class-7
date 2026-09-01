import { describe, expect, it } from 'vitest';
import learnerCategoriesJson from '@data/signs/learner-categories.json';
import learnerScopeJson from '@data/signs/learner-scope.json';
import signMetaJson from '@data/signs/sign-meta.json';
import {
  LEARNER_CATEGORY_IDS,
  LEARNER_CATEGORY_LABELS,
  getLearnerSignCatalogue,
  learnerCategories,
  learnerCategoryFor,
  learnerSignsByCategory,
  uncategorisedLearnerSigns,
} from '@/content';

/**
 * The learner category answers "where should the learner find this sign?".
 * It is deliberately separate from the official Schedule family, which answers
 * "how does the source classify it?", and from learner scope, which answers
 * "should the learner study it?".
 */

const scope = learnerScopeJson as {
  classifications: Record<string, { scope: string; category: string }>;
};
const categoryData = learnerCategoriesJson as {
  taxonomy: { id: string; label: string }[];
  categories: Record<string, string>;
};
const signMeta = signMetaJson as { signs: Record<string, { category: string }> };

const learnerIds = Object.entries(scope.classifications)
  .filter(([, c]) => c.scope === 'core' || c.scope === 'reference')
  .map(([id]) => id);

describe('learner category assignment', () => {
  it('gives every learner entry exactly one category', () => {
    expect(uncategorisedLearnerSigns()).toEqual([]);
    for (const id of learnerIds) expect(learnerCategoryFor(id), id).toBeTruthy();
  });

  it('uses only categories from the declared taxonomy', () => {
    const allowed = new Set(LEARNER_CATEGORY_IDS);
    for (const [id, category] of Object.entries(categoryData.categories)) {
      expect(allowed.has(category), `${id} -> ${category}`).toBe(true);
    }
  });

  it('keeps the taxonomy to a browsable size', () => {
    expect(LEARNER_CATEGORY_IDS.length).toBeGreaterThanOrEqual(8);
    expect(LEARNER_CATEGORY_IDS.length).toBeLessThanOrEqual(11);
    for (const id of LEARNER_CATEGORY_IDS) expect(LEARNER_CATEGORY_LABELS[id]).toBeTruthy();
  });

  it('places each sign in exactly one primary category', () => {
    const seen = new Map<string, string>();
    for (const [category, entries] of learnerSignsByCategory()) {
      for (const entry of entries) {
        expect(seen.has(entry.id), `${entry.id} appears twice`).toBe(false);
        seen.set(entry.id, category);
      }
    }
    expect(seen.size).toBe(155);
  });

  it('has category totals that reconcile with the catalogue', () => {
    const byCategory = learnerSignsByCategory();
    const total = [...byCategory.values()].reduce((sum, list) => sum + list.length, 0);
    expect(total).toBe(getLearnerSignCatalogue().length);
    expect(total).toBe(155);
  });

  it('categorises nothing outside the learner catalogue', () => {
    // Developer-only and Variant visuals must not leak into learner navigation.
    const strays = Object.keys(categoryData.categories).filter((id) => !learnerIds.includes(id));
    expect(strays).toEqual([]);
  });

  it('presents categories in the declared order, not alphabetically', () => {
    const shown = learnerCategories();
    expect(shown).toEqual(LEARNER_CATEGORY_IDS.filter((id) => shown.includes(id)));
    expect(shown[0]).toBe('regulatory');
    expect(shown[1]).toBe('lane-use');
    expect(shown).not.toEqual([...shown].sort());
  });
});

describe('category is independent of scope and of legal classification', () => {
  it('does not let Core or Reference status decide the category', () => {
    // If scope drove category, each category would hold a single scope.
    const mixed = [...learnerSignsByCategory().values()].filter(
      (entries) =>
        entries.some((e) => e.scope === 'core') && entries.some((e) => e.scope === 'reference'),
    );
    expect(mixed.length).toBeGreaterThan(0);

    // And neither scope is confined to one category.
    for (const scopeName of ['core', 'reference'] as const) {
      const categories = new Set(
        getLearnerSignCatalogue()
          .filter((e) => e.scope === scopeName)
          .map((e) => e.category),
      );
      expect(categories.size, scopeName).toBeGreaterThan(1);
    }
  });

  it('preserves the official classification alongside the learner category', () => {
    for (const entry of getLearnerSignCatalogue()) {
      expect(entry.officialCategory, entry.id).toBeTruthy();
      // The source record itself is untouched by the navigation layer.
      const official =
        signMeta.signs[entry.id]?.category ?? scope.classifications[entry.id]!.category;
      expect(entry.officialCategory, entry.id).toBe(official);
    }
  });

  it('lets a legally regulatory sign sit under a different learner category', () => {
    const moved = getLearnerSignCatalogue().filter(
      (e) => e.officialCategory === 'regulatory' && e.category !== 'regulatory',
    );
    expect(moved.length).toBeGreaterThan(20);
  });
});

describe('Lane Use & Turns regression', () => {
  // Before this cleanup the section held three signs while 83 sat in a generic
  // Regulatory bucket, including every lane-control diagram in the catalogue.
  const laneUse = learnerSignsByCategory().get('lane-use') ?? [];
  const ids = laneUse.map((e) => e.id);

  it('is no longer the three-sign legacy stub', () => {
    expect(laneUse.length).toBe(56);
  });

  it('keeps the three original lane-use signs', () => {
    expect(ids).toEqual(
      expect.arrayContaining(['two-way-left-turn-lane', 'lane-straight-or-left', 'lane-right-turn-only']),
    );
  });

  it('holds the lane-direction and turn-control signs', () => {
    expect(ids).toEqual(
      expect.arrayContaining(['RB-42R', 'RB-41L', 'RB-43', 'RB-44', 'RB-14L', 'RB-14R', 'RB-15A']),
    );
  });

  it('holds the multi-lane control diagrams', () => {
    const laneControl = ids.filter((id) => /^RB-(46|47|49)/.test(id));
    expect(laneControl.length).toBe(12);
  });

  it('holds the roundabout lane-designation family', () => {
    const roundabout = ids.filter((id) => /^RB-(9[789]|10[0-7])$/.test(id));
    expect(roundabout.length).toBe(11);
  });

  it('holds the reserved-lane family, side-mounted and overhead', () => {
    expect(ids).toEqual(
      expect.arrayContaining(['RB-80', 'RB-80A', 'RB-81', 'RB-81A', 'RB-90', 'RB-91']),
    );
  });

  it('holds the no-lane-change family', () => {
    expect(ids).toEqual(expect.arrayContaining(['R-200', 'R-201', 'R-202', 'R-203']));
  });

  it('holds the traffic-positioning and passing signs', () => {
    expect(ids).toEqual(
      expect.arrayContaining(['R-101', 'RB-34', 'RB-35', 'RB-36', 'do-not-pass', 'passing-permitted']),
    );
  });
});

describe('Regulatory is no longer the catch-all', () => {
  const regulatory = (learnerSignsByCategory().get('regulatory') ?? []).map((e) => e.id);

  it('holds a fraction of what it used to', () => {
    // 83 before the cleanup.
    expect(regulatory.length).toBe(21);
  });

  it('no longer contains lane-control concepts', () => {
    for (const id of [
      'RB-42R',
      'RB-41L',
      'RB-49',
      'RB-47A',
      'RB-105',
      'RB-80',
      'RB-90',
      'R-201',
      'R-101',
      'RC-4L',
    ]) {
      expect(regulatory, id).not.toContain(id);
      // Learner navigation moved; the official classification did not.
      expect(scope.classifications[id]!.scope).toMatch(/^(core|reference)$/);
    }
  });

  it('no longer contains parking, crossing or work-zone concepts', () => {
    for (const id of ['no-parking', 'no-stopping', 'RB-52', 'RB-57', 'RA-8', 'RA-5L', 'RB-37', 'tar']) {
      expect(regulatory, id).not.toContain(id);
    }
  });

  it('still holds the general regulatory commands', () => {
    expect(regulatory).toEqual(
      expect.arrayContaining([
        'stop',
        'yield',
        'do-not-enter',
        'one-way',
        'no-left-turn',
        'no-u-turn',
        'maximum-speed-50',
        'maximum-speed-80',
        'RB-4',
        'RB-3',
      ]),
    );
  });
});

describe('other category cleanup', () => {
  const byCategory = learnerSignsByCategory();
  const idsIn = (category: string) => (byCategory.get(category) ?? []).map((e) => e.id);

  it('gives parking and stopping its own home', () => {
    expect(idsIn('parking-stopping').sort()).toEqual(
      ['RB-52', 'RB-52A', 'RB-57', 'RB-57A', 'accessible-parking', 'no-parking', 'no-stopping'].sort(),
    );
  });

  it('collects crossings, school and cyclist controls together', () => {
    const ids = idsIn('pedestrian-cyclist-school');
    expect(ids.length).toBe(15);
    expect(ids).toEqual(
      expect.arrayContaining([
        'school-area',
        'school-crosswalk',
        'R-102',
        'RA-3R',
        'RA-8',
        'pedestrian-crosswalk',
        'RA-4R',
        'RA-5L',
        'RA-5R',
        'RB-37',
        'RB-38',
        'RB-39',
        'RB-40',
        'RB-94L',
        'RB-94R',
      ]),
    );
  });

  it('routes bicycle guidance to Guide rather than to the cyclist section', () => {
    // A route marker tells you where a bike route goes; it is not a control.
    expect(idsIn('guide')).toContain('bicycle-route');
    expect(idsIn('pedestrian-cyclist-school')).not.toContain('bicycle-route');
    // A reserved bicycle lane is a lane rule.
    expect(idsIn('lane-use')).toEqual(expect.arrayContaining(['RB-90', 'RB-91']));
  });

  it('files hazard markers as obstruction guidance beside the chevron', () => {
    expect(idsIn('warning')).toEqual(
      expect.arrayContaining(['hazard-marker-keep-left', 'hazard-marker-keep-right', 'chevron-right']),
    );
    // Their official family is still regulatory — only navigation changed.
    expect(signMeta.signs['hazard-marker-keep-left']!.category).not.toBe('warning');
  });

  it('keeps every work-zone sign in one section', () => {
    expect(idsIn('work-zone').length).toBe(17);
    expect(idsIn('work-zone')).toEqual(
      expect.arrayContaining(['tar', 'blasting-ahead', 'prepare-to-stop', 'wz-workers-ahead']),
    );
  });

  it('keeps railway, shapes and pavement markings intact', () => {
    expect(idsIn('railway').length).toBe(3);
    expect(idsIn('shape').length).toBe(6);
    expect(idsIn('pavement-marking').length).toBe(4);
  });
});
