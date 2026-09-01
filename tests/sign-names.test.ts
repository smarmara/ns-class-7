/**
 * Canonical sign names.
 *
 * The gallery exists so a human can look at artwork and confirm it matches the
 * name printed under it. That only works if every visual carries a real,
 * source-backed name and if visually different signs never share one — these
 * tests hold both of those properties.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import {
  NAME_REVIEW_REQUIRED,
  buildVisualInventory,
  loadSignNames,
  normaliseSemanticName,
  resolveDisplayName,
  type GalleryVisual,
} from '../scripts/lib/sign-visuals';
import { generateGalleryHtml } from '../scripts/lib/sign-gallery-html';

let visuals: GalleryVisual[];
let names: Record<string, string>;

beforeAll(async () => {
  visuals = await buildVisualInventory();
  names = (await loadSignNames()).names;
}, 60_000);

describe('canonical sign names', () => {
  it('gives every gallery visual a resolved name or the review sentinel', () => {
    for (const visual of visuals) {
      expect(visual.displayName.length, `${visual.appId} has an empty name`).toBeGreaterThan(0);
      if (!visual.nameResolved) {
        expect(visual.displayName).toBe(NAME_REVIEW_REQUIRED);
      }
    }
  });

  it('never falls back to an id-shaped label', () => {
    // A name equal to the id would read like a real name on the card and
    // silently pass review, which is exactly what the sentinel prevents.
    for (const visual of visuals) {
      if (!visual.nameResolved) continue;
      expect(visual.displayName, `${visual.appId} is named after its id`).not.toBe(visual.appId);
      if (visual.designation) {
        expect(visual.displayName, `${visual.appId} is named after its designation`).not.toBe(
          visual.designation,
        );
      }
    }
  });

  it.each([
    ['R-100', 'Wrong Way'],
    ['R-101', 'Through Traffic Keep Right'],
    ['R-102', 'End School Area'],
    ['RB-15', 'No Turns'],
    ['RB-41R', 'Right Turn Only'],
    ['RB-41L', 'Left Turn Only'],
    ['RB-42L', 'Straight or Left Turn'],
    ['RB-42R', 'Straight or Right Turn'],
    ['RB-48', 'Two-Way Left Turn Lane'],
    ['RA-1', 'Stop'],
    ['RA-2', 'Yield'],
    ['RB-23', 'Do Not Enter'],
    ['RB-52B', 'Accessible Parking'],
    ['WC-1', 'School Area'],
  ])('maps designation %s to "%s"', (designation, expected) => {
    expect(names[designation]).toBe(expected);
  });

  it.each([
    ['shape-stop', 'Stop Sign Shape'],
    ['shape-yield', 'Yield Sign Shape'],
    ['shape-warning-sign', 'Warning Sign Shape'],
    ['shape-guide-sign', 'Guide Sign Shape'],
    ['shape-regulatory-sign', 'Regulatory Sign Shape'],
    ['shape-school-zone', 'School Zone Sign Shape'],
    ['pm-double-solid-yellow', 'Double Solid Yellow Centre Line'],
    ['pm-broken-yellow', 'Broken Yellow Centre Line'],
  ])('names concept visual %s using project terminology', (appId, expectedPrefix) => {
    expect(names[appId]).toBeDefined();
    expect(names[appId]).toContain(expectedPrefix);
  });

  it('has no orphan entries that no visual can reach', () => {
    const reachable = new Set<string>();
    for (const visual of visuals) {
      reachable.add(visual.appId);
      if (visual.designation) reachable.add(visual.designation);
    }
    const orphans = Object.keys(names).filter((key) => !reachable.has(key));
    expect(orphans).toEqual([]);
  });
});

describe('variant distinguishability', () => {
  const variantGroups: Array<[string, string[]]> = [
    ['directional turn control', ['RB-41L', 'RB-41R', 'RB-42L', 'RB-42R', 'RB-43', 'RB-44', 'RB-45']],
    ['restrictive turn control', ['RB-14L', 'RB-14R', 'RB-15', 'RB-15A']],
    ['prohibitive turn control', ['RB-11L', 'RB-11R', 'RB-16', 'RB-17L', 'RB-17R']],
    ['side-mounted lane control', [
      'RB-46L', 'RB-46R', 'RB-46A', 'RB-46B',
      'RB-47L', 'RB-47R', 'RB-47A', 'RB-47B', 'RB-47C', 'RB-47D', 'RB-47E', 'RB-49',
    ]],
    ['roundabout lane designation', [
      'RB-97', 'RB-98', 'RB-99', 'RB-100', 'RB-101',
      'RB-102', 'RB-103', 'RB-104', 'RB-105', 'RB-106', 'RB-107',
    ]],
    ['roundabout lane tabs', ['RB-100S', 'RB-102S', 'RB-104S']],
    ['crosswalk orientation', ['RA-3L', 'RA-3R', 'RA-4L', 'RA-4R', 'RA-5L', 'RA-5R']],
    ['parking prohibition', ['RB-51', 'RB-52', 'RB-52A', 'RB-52B', 'RB-53']],
    ['stopping prohibition', ['RB-55', 'RB-57', 'RB-57A']],
    ['reserved lane', ['RB-80', 'RB-80A', 'RB-81', 'RB-81A', 'RB-90', 'RB-91']],
    ['reserved lane tabs', ['RB-80S1', 'RB-80S2']],
    ['pedestrian/cyclist organisation', ['RB-73L', 'RB-73R', 'RB-94L', 'RB-94R']],
    ['stop line', ['RC-4L', 'RC-4R']],
    ['detour and exit', ['R-117', 'R-118', 'R-119', 'R-120']],
    ['school area speed tabs', ['R-102T', 'R-103T', 'R-104T']],
    ['truck route arrows', ['RB-61SA', 'RB-61SB', 'RB-61SC']],
    ['lane change', ['R-200', 'R-201', 'R-202', 'R-203']],
    ['seat belt', ['RC-6', 'RC-6-OPTIONAL']],
  ];

  it.each(variantGroups)('%s variants all have distinct names', (_group, designations) => {
    const seen = new Map<string, string>();
    for (const designation of designations) {
      const name = names[designation];
      expect(name, `${designation} has no name`).toBeDefined();
      expect(name).not.toBe(NAME_REVIEW_REQUIRED);
      const key = normaliseSemanticName(name!);
      expect(seen.has(key), `${designation} duplicates ${seen.get(key)}: "${name}"`).toBe(false);
      seen.set(key, designation);
    }
  });

  it('keeps left and right variants explicitly opposite', () => {
    expect(names['RB-41L']).toBe('Left Turn Only');
    expect(names['RB-41R']).toBe('Right Turn Only');
    expect(names['RB-11L']).toBe('No Left Turn');
    expect(names['RB-11R']).toBe('No Right Turn');
    expect(names['R-119']).toBe('All Traffic Exit Left');
    expect(names['R-120']).toBe('All Traffic Exit Right');
  });

  it('gives no two visuals in the whole gallery the same name by accident', () => {
    // Legitimate duplicates exist: a learner sign id and the Schedule crop it
    // is wired to are the same visual seen twice. Only distinct artwork counts.
    const byName = new Map<string, GalleryVisual[]>();
    for (const visual of visuals) {
      if (!visual.nameResolved) continue;
      const key = normaliseSemanticName(visual.displayName);
      byName.set(key, [...(byName.get(key) ?? []), visual]);
    }
    const collisions = [...byName.entries()]
      .filter(([, group]) => new Set(group.map((v) => v.assetPath ?? v.appId)).size > 1)
      .map(([name, group]) => `${name}: ${group.map((v) => v.appId).join(', ')}`);
    expect(collisions).toEqual([]);
  });
});

describe('semantic name normalisation', () => {
  it('ignores casing, padding and dash style', () => {
    expect(normaliseSemanticName('  Right   Turn Only ')).toBe(
      normaliseSemanticName('RIGHT TURN ONLY'),
    );
    expect(normaliseSemanticName('Stop Line — Arrow Pointing Right')).toBe(
      normaliseSemanticName('Stop Line - Arrow Pointing Right'),
    );
  });

  it('keeps a genuine meaning change distinct', () => {
    expect(normaliseSemanticName('Right Turn Only')).not.toBe(
      normaliseSemanticName('Left Turn Only'),
    );
  });
});

describe('name resolution', () => {
  it('falls back from app id to official designation', () => {
    const table = { 'RB-99X': 'Some Official Name' };
    expect(resolveDisplayName(table, 'some-app-id', 'RB-99X')).toEqual({
      displayName: 'Some Official Name',
      resolved: true,
    });
  });

  it('treats the sentinel as unresolved', () => {
    const table = { 'RB-99X': NAME_REVIEW_REQUIRED };
    expect(resolveDisplayName(table, 'RB-99X', undefined).resolved).toBe(false);
  });
});

describe('gallery card rendering', () => {
  it('shows name, designation and app id together on every card', () => {
    const html = generateGalleryHtml(visuals.slice(0, 12));
    for (const visual of visuals.slice(0, 12)) {
      expect(html).toContain(`data-app-id="${visual.appId}"`);
      if (visual.designation) expect(html).toContain(`<dd>${visual.designation}</dd>`);
    }
    expect(html).toContain('class="card-name"');
  });

  it('includes the display name in the searchable text', () => {
    const target = visuals.find((visual) => visual.appId === 'R-100');
    expect(target).toBeDefined();
    const html = generateGalleryHtml([target!]);
    const search = html.match(/data-search="([^"]*)"/)?.[1] ?? '';
    expect(search).toContain('wrong way');
    expect(search).toContain('r-100');
  });

  it('shows the variant alongside the designation for variable-number signs', () => {
    // RB-1 covers two real images. A reviewer approving these cards has to be
    // able to tell from the card which one they are looking at.
    const fifty = visuals.find((visual) => visual.appId === 'maximum-speed-50')!;
    const eighty = visuals.find((visual) => visual.appId === 'maximum-speed-80')!;

    expect(fifty.designation).toBe('RB-1');
    expect(fifty.variant).toBe('50 km/h');
    expect(fifty.assetFilename).toBe('RB-1A.png');
    expect(eighty.designation).toBe('RB-1');
    expect(eighty.variant).toBe('80 km/h');
    expect(eighty.assetFilename).toBe('RB-1.png');

    const html = generateGalleryHtml([fifty, eighty]);
    expect(html).toContain('<dt>Variant</dt><dd>50 km/h</dd>');
    expect(html).toContain('<dt>Variant</dt><dd>80 km/h</dd>');
    expect(html).toContain('RB-1A.png');
    expect(html).toMatch(/Maximum Speed 50 km\/h/);
    expect(html).toMatch(/Maximum Speed 80 km\/h/);
  });

  it('offers exactly one approval control and no bulk action', () => {
    const html = generateGalleryHtml(visuals.slice(0, 25));
    expect(html).not.toMatch(/approve all/i);
    expect(html).not.toMatch(/approve filtered/i);
    expect(html).not.toMatch(/approve family/i);
    // One deliberate click: no confirmation dialog anywhere in the page.
    expect(html).not.toContain('confirm(');
    expect(html).not.toMatch(/approve this exact visual/i);
  });
});
