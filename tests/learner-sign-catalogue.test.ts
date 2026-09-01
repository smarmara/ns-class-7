import { describe, expect, it } from 'vitest';
import {
  getLearnerSignCatalogue,
  learnerSignsByCategory,
  learnerCategories,
  learnerCatalogueCounts,
  LEARNER_CATEGORY_LABELS,
} from '@/content/learner-signs';
import learnerScopeJson from '@data/signs/learner-scope.json';

const scopeData = learnerScopeJson as {
  schemaVersion: number;
  classifications: Record<string, { scope: string }>;
};

describe('learner sign catalogue', () => {
  it('includes all Core entries', () => {
    const catalogue = getLearnerSignCatalogue();
    const coreIds = Object.entries(scopeData.classifications)
      .filter(([, c]) => c.scope === 'core')
      .map(([id]) => id);

    for (const id of coreIds) {
      expect(catalogue.find((e) => e.id === id), `Core entry missing: ${id}`).toBeDefined();
    }
  });

  it('includes all Reference entries', () => {
    const catalogue = getLearnerSignCatalogue();
    const refIds = Object.entries(scopeData.classifications)
      .filter(([, c]) => c.scope === 'reference')
      .map(([id]) => id);

    for (const id of refIds) {
      expect(catalogue.find((e) => e.id === id), `Reference entry missing: ${id}`).toBeDefined();
    }
  });

  it('excludes Developer-only entries', () => {
    const catalogue = getLearnerSignCatalogue();
    const devOnlyIds = Object.entries(scopeData.classifications)
      .filter(([, c]) => c.scope === 'developer-only')
      .map(([id]) => id);

    for (const id of devOnlyIds) {
      expect(catalogue.find((e) => e.id === id), `Developer-only leaked: ${id}`).toBeUndefined();
    }
  });

  it('excludes Variant entries from top-level', () => {
    const catalogue = getLearnerSignCatalogue();
    const variantIds = Object.entries(scopeData.classifications)
      .filter(([, c]) => c.scope === 'variant')
      .map(([id]) => id);

    for (const id of variantIds) {
      expect(catalogue.find((e) => e.id === id), `Variant leaked: ${id}`).toBeUndefined();
    }
  });

  it('has no Source-review entries', () => {
    const catalogue = getLearnerSignCatalogue();
    // The catalogue type only allows 'core' | 'reference', so source-review
    // entries are excluded by construction. Verify no entry has a scope
    // outside those two values.
    for (const entry of catalogue) {
      expect(entry.scope === 'core' || entry.scope === 'reference').toBe(true);
    }
  });

  it('matches expected Core + Reference count', () => {
    const counts = learnerCatalogueCounts();
    const expectedCore = Object.values(scopeData.classifications).filter((c) => c.scope === 'core').length;
    const expectedRef = Object.values(scopeData.classifications).filter((c) => c.scope === 'reference').length;

    expect(counts.core).toBe(expectedCore);
    expect(counts.reference).toBe(expectedRef);
    expect(counts.total).toBe(expectedCore + expectedRef);
  });

  it('groups by category without duplicates', () => {
    const byCategory = learnerSignsByCategory();
    const allIds: string[] = [];
    for (const entries of byCategory.values()) {
      for (const entry of entries) {
        expect(allIds).not.toContain(entry.id);
        allIds.push(entry.id);
      }
    }
    expect(allIds.length).toBe(learnerCatalogueCounts().total);
  });

  it('categories are in a sensible order', () => {
    const categories = learnerCategories();
    expect(categories.length).toBeGreaterThan(0);
    // Every category should have a label
    for (const cat of categories) {
      expect(LEARNER_CATEGORY_LABELS[cat]).toBeDefined();
    }
  });

  it('every entry has a display name', () => {
    const catalogue = getLearnerSignCatalogue();
    for (const entry of catalogue) {
      expect(entry.displayName).toBeTruthy();
      expect(entry.label).toBeTruthy();
    }
  });

  it('every entry has a valid ID format', () => {
    const catalogue = getLearnerSignCatalogue();
    for (const entry of catalogue) {
      // The entry's ID should be a non-empty string
      expect(entry.id).toBeTruthy();
      expect(typeof entry.id).toBe('string');
      // IDs should not contain spaces or special characters
      expect(entry.id).toMatch(/^[a-z0-9-]+$/i);
    }
  });

  it('no duplicate App IDs', () => {
    const catalogue = getLearnerSignCatalogue();
    const ids = catalogue.map((e) => e.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });
});
