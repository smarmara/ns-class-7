import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { activeQuestions, getSignMeta } from '@/content';
import { OFFICIAL_CROP_IDS, OFFICIAL_CROPS, SIGN_ART, cropKeyFor, officialCropFor } from '@/signs/registry';
import fidelityJson from '@data/signs/sign-fidelity.json';

type FidelityEntry = {
  designation?: string;
  variant?: string;
  asset?: string;
  schedulePage?: number;
  dimensions?: string;
  sourceId: string;
  status: string;
};

const registry = fidelityJson.signs as Record<string, FidelityEntry>;
const activeSignIds = new Set(
  activeQuestions.flatMap((q) => [...(q.signId ? [q.signId] : []), ...(q.choiceSignIds ?? [])]),
);

/** A sign is servable when it has SVG artwork, is wired to an official crop, or is a sign-shape concept. */
function hasArt(id: string): boolean {
  return Boolean(SIGN_ART[id] || officialCropFor(id) || id.startsWith('shape-'));
}

describe('sign fidelity registry', () => {
  it('registers every artwork reachable by an active question', () => {
    expect(activeSignIds.size).toBe(82);
    for (const id of activeSignIds) {
      expect(registry[id], id).toBeDefined();
      expect(hasArt(id), `${id} artwork`).toBe(true);
      expect(getSignMeta(id)?.visualDescription, `${id} accessibility description`).toBeTruthy();
    }
  });

  it('keeps blocked fidelity states out of the active learner pool', () => {
    for (const id of activeSignIds) {
      expect(['unresolved', 'incorrect', 'needs-rebuild'], id).not.toContain(registry[id]!.status);
    }
  });

  it('gives prescribed signs traceable Schedule metadata', () => {
    for (const [id, entry] of Object.entries(registry)) {
      if (entry.sourceId !== 'ns-traffic-signs-regulations') continue;
      expect(entry.designation, id).toBeTruthy();
      expect(entry.schedulePage, id).toBeGreaterThanOrEqual(1);
      expect(entry.dimensions, id).toBeTruthy();
    }
  });

  it('does not map the same designation and variant to multiple assets', () => {
    const seen = new Set<string>();
    for (const [id, entry] of Object.entries(registry)) {
      if (!entry.designation) continue;
      const key = `${entry.designation}::${entry.variant ?? ''}`;
      expect(seen.has(key), `${id} duplicates ${key}`).toBe(false);
      seen.add(key);
    }
  });

  it('maps the known corrected parking controls to RB-55 and RB-52B', () => {
    expect(registry['no-stopping']!.designation).toBe('RB-55');
    expect(registry['accessible-parking']!.designation).toBe('RB-52B');
    expect(getSignMeta('no-stopping')!.visualDescription).toMatch(/black octagon/i);
    expect(getSignMeta('accessible-parking')!.visualDescription).toMatch(/permit only/i);
  });

  it('resolves every official-crop sign to a registered crop file', () => {
    for (const [id, entry] of Object.entries(registry)) {
      if (entry.status !== 'official-crop') continue;
      const crop = officialCropFor(id);
      const cropKey = cropKeyFor(entry);
      expect(crop, id).toBeTruthy();
      expect(entry.designation, id).toBeTruthy();
      expect(crop, id).toBe(OFFICIAL_CROPS[cropKey!]);
      expect(OFFICIAL_CROP_IDS, id).toContain(cropKey!);
    }
  });

  it('pins every official-crop sign to the correct Schedule image (L/R variants and limits)', () => {
    const pinned: Record<string, string> = {
      stop: 'RA-1.png',
      yield: 'RA-2.png',
      'maximum-speed-50': 'RB-1A.png',
      'maximum-speed-80': 'RB-1.png',
      'speed-limit-change-ahead': 'RB-5.png',
      'one-way': 'RB-21.png',
      'do-not-enter': 'RB-23.png',
      'no-left-turn': 'RB-11L.png',
      'no-right-turn': 'RB-11R.png',
      'no-right-turn-on-red': 'RB-17R.png',
      'no-u-turn': 'RB-16.png',
      'school-crosswalk': 'RA-3L.png',
      'pedestrian-crosswalk': 'RA-4L.png',
    };
    for (const [id, file] of Object.entries(pinned)) {
      expect(officialCropFor(id), id).toBe(`/signs/ns-official/${file}`);
    }
  });

  it('keeps maximum-speed-80 SVG as variable-number sign representation', () => {
    expect(registry['maximum-speed-80']!.designation).toBe('RB-1');
    expect(registry['maximum-speed-80']!.status).toBe('official-crop');
    expect(SIGN_ART['maximum-speed-80'], 'maximum-speed-80 keeps SVG for variable-number rendering').toBeDefined();
  });

  /**
   * RB-1 "Maximum speed" is a variable-number Schedule sign: the Regulations
   * fix the design and let the numeral change per location, so one designation
   * legitimately covers two real images. RB-1.png reads MAXIMUM 80 and
   * RB-1A.png reads MAXIMUM 50.
   *
   * These pins exist because the 50 km/h concept previously resolved, through
   * the designation alone, to the 80 km/h artwork — and a learner was shown an
   * 80 sign under a question whose every answer was about 50.
   */
  describe('RB-1 variable-number speed variants', () => {
    it('maps maximum-speed-50 to the 50 km/h image', () => {
      const entry = registry['maximum-speed-50']!;
      expect(entry.variant).toBe('50 km/h');
      expect(entry.asset).toBe('RB-1A');
      expect(officialCropFor('maximum-speed-50')).toBe('/signs/ns-official/RB-1A.png');
    });

    it('maps maximum-speed-80 to the 80 km/h image', () => {
      const entry = registry['maximum-speed-80']!;
      expect(entry.variant).toBe('80 km/h');
      expect(entry.asset).toBeUndefined();
      expect(officialCropFor('maximum-speed-80')).toBe('/signs/ns-official/RB-1.png');
    });

    it('never lets the 50 km/h concept resolve back to the 80 km/h artwork', () => {
      const fifty = officialCropFor('maximum-speed-50');
      const eighty = officialCropFor('maximum-speed-80');
      expect(fifty).not.toBe(eighty);
      expect(fifty).not.toBe('/signs/ns-official/RB-1.png');
      expect(fifty).not.toBe(OFFICIAL_CROPS['RB-1']);
    });

    it('keeps both variants on official designation RB-1 and invents no RB-1A designation', () => {
      // The Traffic Signs Regulations define RB-1 and no RB-1A; RB-1A is only
      // this project's asset file name for the 50 km/h image.
      expect(registry['maximum-speed-50']!.designation).toBe('RB-1');
      expect(registry['maximum-speed-80']!.designation).toBe('RB-1');
      for (const entry of Object.values(registry)) {
        expect(entry.designation, 'RB-1A is an asset name, not a designation').not.toBe('RB-1A');
      }
    });

    it('keeps the two variants distinguishable in the fidelity registry', () => {
      const fifty = registry['maximum-speed-50']!;
      const eighty = registry['maximum-speed-80']!;
      expect(fifty.variant).not.toBe(eighty.variant);
      expect(cropKeyFor(fifty)).not.toBe(cropKeyFor(eighty));
      // Same Schedule provenance either way.
      expect(fifty.schedulePage).toBe(eighty.schedulePage);
      expect(fifty.sourceId).toBe(eighty.sourceId);
    });
  });

  it('does not silently fall back: an official-crop sign has no legacy SVG (except variable-number signs)', () => {
    for (const id of Object.keys(registry)) {
      if (registry[id]!.status !== 'official-crop') continue;
      if (id === 'maximum-speed-80') continue;
      expect(SIGN_ART[id], `${id} has a crop and must not keep an SVG fallback`).toBeUndefined();
    }
  });

  it('uses fixed sign colours rather than theme-inherited currentColor', () => {
    for (const id of activeSignIds) {
      if (officialCropFor(id)) continue;
      const markup = renderToStaticMarkup(<svg viewBox="0 0 120 120">{SIGN_ART[id]}</svg>);
      expect(markup, id).not.toContain('currentColor');
      expect(markup, id).not.toContain('var(--');
    }
  });

  it('registers every expected crop from the RB-24 through RB-48S batch', () => {
    const expectedBatch = [
      'RB-24', 'RB-25',
      'RB-31', 'RB-32', 'RB-33', 'RB-33S1', 'RB-33S2',
      'RB-34', 'RB-35', 'RB-36', 'RB-37', 'RB-38', 'RB-39', 'RB-40',
      'RB-41L', 'RB-41R',
      'RB-42L', 'RB-42R',
      'RB-43', 'RB-44', 'RB-45',
      'RB-46L', 'RB-46R', 'RB-46A', 'RB-46B',
      'RB-47L', 'RB-47R', 'RB-47A', 'RB-47B', 'RB-47C', 'RB-47D', 'RB-47E',
      'RB-48', 'RB-48S',
    ];
    for (const id of expectedBatch) {
      expect(OFFICIAL_CROPS[id], id).toBe(`/signs/ns-official/${id}.png`);
      expect(OFFICIAL_CROP_IDS, id).toContain(id);
    }
  });

  it('pins traffic-direction signs RB-24 and RB-25 independently', () => {
    expect(OFFICIAL_CROPS['RB-24']).toBe('/signs/ns-official/RB-24.png');
    expect(OFFICIAL_CROPS['RB-25']).toBe('/signs/ns-official/RB-25.png');
    expect(OFFICIAL_CROPS['RB-24']).not.toBe(OFFICIAL_CROPS['RB-25']);
  });

  it('pins passing-restriction signs RB-31, RB-32, RB-33 independently', () => {
    expect(OFFICIAL_CROPS['RB-31']).toBe('/signs/ns-official/RB-31.png');
    expect(OFFICIAL_CROPS['RB-32']).toBe('/signs/ns-official/RB-32.png');
    expect(OFFICIAL_CROPS['RB-33']).toBe('/signs/ns-official/RB-33.png');
    expect(OFFICIAL_CROPS['RB-31']).not.toBe(OFFICIAL_CROPS['RB-32']);
    expect(OFFICIAL_CROPS['RB-31']).not.toBe(OFFICIAL_CROPS['RB-33']);
    expect(OFFICIAL_CROPS['RB-32']).not.toBe(OFFICIAL_CROPS['RB-33']);
  });

  it('pins supplementary text plates RB-33S1 and RB-33S2 independently', () => {
    expect(OFFICIAL_CROPS['RB-33S1']).toBe('/signs/ns-official/RB-33S1.png');
    expect(OFFICIAL_CROPS['RB-33S2']).toBe('/signs/ns-official/RB-33S2.png');
    expect(OFFICIAL_CROPS['RB-33S1']).not.toBe(OFFICIAL_CROPS['RB-33S2']);
    expect(OFFICIAL_CROPS['RB-33S1']).not.toBe(OFFICIAL_CROPS['RB-33']);
  });

  it('pins lane-use signs RB-34 through RB-40 independently', () => {
    const laneUse = ['RB-34', 'RB-35', 'RB-36', 'RB-37', 'RB-38', 'RB-39', 'RB-40'];
    for (const id of laneUse) {
      expect(OFFICIAL_CROPS[id]).toBe(`/signs/ns-official/${id}.png`);
    }
    const paths = laneUse.map((id) => OFFICIAL_CROPS[id]);
    expect(new Set(paths).size).toBe(laneUse.length);
  });

  it('pins RB-41 left/right variants without swapping', () => {
    expect(OFFICIAL_CROPS['RB-41L']).toBe('/signs/ns-official/RB-41L.png');
    expect(OFFICIAL_CROPS['RB-41R']).toBe('/signs/ns-official/RB-41R.png');
    expect(OFFICIAL_CROPS['RB-41L']).not.toBe(OFFICIAL_CROPS['RB-41R']);
  });

  it('pins RB-42 left/right variants without swapping', () => {
    expect(OFFICIAL_CROPS['RB-42L']).toBe('/signs/ns-official/RB-42L.png');
    expect(OFFICIAL_CROPS['RB-42R']).toBe('/signs/ns-official/RB-42R.png');
    expect(OFFICIAL_CROPS['RB-42L']).not.toBe(OFFICIAL_CROPS['RB-42R']);
  });

  it('pins RB-46 family variants independently', () => {
    const family = ['RB-46L', 'RB-46R', 'RB-46A', 'RB-46B'];
    for (const id of family) {
      expect(OFFICIAL_CROPS[id]).toBe(`/signs/ns-official/${id}.png`);
    }
    const paths = family.map((id) => OFFICIAL_CROPS[id]);
    expect(new Set(paths).size).toBe(family.length);
  });

  it('pins RB-47 family variants independently', () => {
    const family = ['RB-47L', 'RB-47R', 'RB-47A', 'RB-47B', 'RB-47C', 'RB-47D', 'RB-47E'];
    for (const id of family) {
      expect(OFFICIAL_CROPS[id]).toBe(`/signs/ns-official/${id}.png`);
    }
    const paths = family.map((id) => OFFICIAL_CROPS[id]);
    expect(new Set(paths).size).toBe(family.length);
  });

  it('pins RB-48 and supplementary RB-48S as distinct assets', () => {
    expect(OFFICIAL_CROPS['RB-48']).toBe('/signs/ns-official/RB-48.png');
    expect(OFFICIAL_CROPS['RB-48S']).toBe('/signs/ns-official/RB-48S.png');
    expect(OFFICIAL_CROPS['RB-48']).not.toBe(OFFICIAL_CROPS['RB-48S']);
  });

  it('does not invent designations for numeric gaps (RB-26 through RB-30)', () => {
    const invented = ['RB-26', 'RB-27', 'RB-28', 'RB-29', 'RB-30'];
    for (const id of invented) {
      expect(OFFICIAL_CROPS[id], `${id} must not be registered`).toBeUndefined();
      expect(OFFICIAL_CROP_IDS, `${id} must not be in crop IDs`).not.toContain(id);
    }
  });

  it('registers every expected crop from the final batch (RB-49 through R-204)', () => {
    const expectedFinal = [
      'RB-49',
      'RB-51', 'RB-52', 'RB-52A', 'RB-52B', 'RB-53', 'RB-55', 'RB-57', 'RB-57A',
      'RB-61', 'RB-61SA', 'RB-61SB', 'RB-61SC', 'RB-62',
      'RB-63', 'RB-63A', 'RB-63B',
      'RB-64', 'RB-65', 'RB-66', 'RB-67', 'RB-68', 'RB-69', 'RB-70',
      'RB-73L', 'RB-73R',
      'RB-76', 'RB-77',
      'RB-78', 'RB-79', 'RB-79T',
      'RB-80', 'RB-80A', 'RB-80S1', 'RB-80S2', 'RB-81', 'RB-81A',
      'RB-84', 'RB-85', 'RB-86', 'RB-87', 'RB-88', 'RB-89',
      'RB-90', 'RB-91', 'RB-92', 'RB-93',
      'RB-94L', 'RB-94R',
      'RB-96',
      'RB-97', 'RB-98', 'RB-99', 'RB-100', 'RB-100S', 'RB-101', 'RB-102', 'RB-102S',
      'RB-103', 'RB-104', 'RB-104S', 'RB-105', 'RB-106', 'RB-107',
      'RC-2', 'RC-4L', 'RC-4R', 'RC-5', 'RC-6', 'RC-6-OPTIONAL',
      'WC-1',
      'R-100', 'R-101', 'R-102', 'R-102T', 'R-103T', 'R-104T', 'R-105',
      'R-107', 'R-108', 'R-109', 'R-110', 'R-112', 'R-113',
      'R-114', 'R-115', 'R-116', 'R-117', 'R-118', 'R-119', 'R-120',
      'R-121', 'R-122', 'R-123', 'R-124',
      'R-125', 'R-126', 'R-127', 'R-128', 'R-129', 'R-130',
      'R-200', 'R-201', 'R-202', 'R-203', 'R-204',
    ];
    for (const id of expectedFinal) {
      expect(OFFICIAL_CROPS[id], id).toBeDefined();
      expect(OFFICIAL_CROP_IDS, id).toContain(id);
    }
  });

  it('pins parking/stopping family independently', () => {
    const family = ['RB-51', 'RB-52', 'RB-52A', 'RB-52B', 'RB-53', 'RB-55', 'RB-57', 'RB-57A'];
    for (const id of family) {
      expect(OFFICIAL_CROPS[id]).toBe(`/signs/ns-official/${id}.png`);
    }
    const paths = family.map((id) => OFFICIAL_CROPS[id]);
    expect(new Set(paths).size).toBe(family.length);
  });

  it('pins RB-73 left/right variants without swapping', () => {
    expect(OFFICIAL_CROPS['RB-73L']).toBe('/signs/ns-official/RB-73L.png');
    expect(OFFICIAL_CROPS['RB-73R']).toBe('/signs/ns-official/RB-73R.png');
    expect(OFFICIAL_CROPS['RB-73L']).not.toBe(OFFICIAL_CROPS['RB-73R']);
  });

  it('pins RB-94 left/right variants without swapping', () => {
    expect(OFFICIAL_CROPS['RB-94L']).toBe('/signs/ns-official/RB-94L.png');
    expect(OFFICIAL_CROPS['RB-94R']).toBe('/signs/ns-official/RB-94R.png');
    expect(OFFICIAL_CROPS['RB-94L']).not.toBe(OFFICIAL_CROPS['RB-94R']);
  });

  it('pins RC-4 left/right stop-line variants without swapping', () => {
    expect(OFFICIAL_CROPS['RC-4L']).toBe('/signs/ns-official/RC-4L.png');
    expect(OFFICIAL_CROPS['RC-4R']).toBe('/signs/ns-official/RC-4R.png');
    expect(OFFICIAL_CROPS['RC-4L']).not.toBe(OFFICIAL_CROPS['RC-4R']);
  });

  it('pins transit/reserved-lane variants independently', () => {
    const transit = ['RB-80', 'RB-80A', 'RB-80S1', 'RB-80S2', 'RB-81', 'RB-81A'];
    for (const id of transit) {
      expect(OFFICIAL_CROPS[id]).toBe(`/signs/ns-official/${id}.png`);
    }
    const paths = transit.map((id) => OFFICIAL_CROPS[id]);
    expect(new Set(paths).size).toBe(transit.length);
  });

  it('pins lane-control supplementary plates RB-61SA, RB-61SB, RB-61SC independently', () => {
    const plates = ['RB-61', 'RB-61SA', 'RB-61SB', 'RB-61SC'];
    for (const id of plates) {
      expect(OFFICIAL_CROPS[id]).toBe(`/signs/ns-official/${id}.png`);
    }
    const paths = plates.map((id) => OFFICIAL_CROPS[id]);
    expect(new Set(paths).size).toBe(plates.length);
  });

  it('pins roundabout/lane-direction family RB-97 through RB-107 independently', () => {
    const family = [
      'RB-97', 'RB-98', 'RB-99', 'RB-100', 'RB-100S',
      'RB-101', 'RB-102', 'RB-102S', 'RB-103',
      'RB-104', 'RB-104S', 'RB-105', 'RB-106', 'RB-107',
    ];
    for (const id of family) {
      expect(OFFICIAL_CROPS[id]).toBe(`/signs/ns-official/${id}.png`);
    }
    const paths = family.map((id) => OFFICIAL_CROPS[id]);
    expect(new Set(paths).size).toBe(family.length);
  });

  it('pins supplementary signs RB-79T, RB-80S1, RB-80S2, RB-100S, RB-102S, RB-104S independently', () => {
    const supplementary = ['RB-79T', 'RB-80S1', 'RB-80S2', 'RB-100S', 'RB-102S', 'RB-104S'];
    for (const id of supplementary) {
      expect(OFFICIAL_CROPS[id]).toBe(`/signs/ns-official/${id}.png`);
    }
    const paths = supplementary.map((id) => OFFICIAL_CROPS[id]);
    expect(new Set(paths).size).toBe(supplementary.length);
  });

  it('pins RC-6 standard and RC-6-OPTIONAL as distinct assets', () => {
    expect(OFFICIAL_CROPS['RC-6']).toBe('/signs/ns-official/RC-6.png');
    expect(OFFICIAL_CROPS['RC-6-OPTIONAL']).toBe('/signs/ns-official/RC-6%20(OPTIONAL).png');
    expect(OFFICIAL_CROPS['RC-6']).not.toBe(OFFICIAL_CROPS['RC-6-OPTIONAL']);
  });

  it('pins WC-1 school-area sign', () => {
    expect(OFFICIAL_CROPS['WC-1']).toBe('/signs/ns-official/WC-1.png');
  });

  it('pins R-series text signs independently', () => {
    const rSeries = [
      'R-100', 'R-101', 'R-102', 'R-102T', 'R-103T', 'R-104T', 'R-105',
      'R-107', 'R-108', 'R-109', 'R-110', 'R-112', 'R-113',
      'R-114', 'R-115', 'R-116', 'R-117', 'R-118', 'R-119', 'R-120',
      'R-121', 'R-122', 'R-123', 'R-124',
      'R-125', 'R-126', 'R-127', 'R-128', 'R-129', 'R-130',
      'R-200', 'R-201', 'R-202', 'R-203', 'R-204',
    ];
    for (const id of rSeries) {
      expect(OFFICIAL_CROPS[id]).toBe(`/signs/ns-official/${id}.png`);
    }
    const paths = rSeries.map((id) => OFFICIAL_CROPS[id]);
    expect(new Set(paths).size).toBe(rSeries.length);
  });

  it('does not invent designations for numeric gaps in the final batch', () => {
    const invented = ['RB-50', 'RB-54', 'RB-56', 'RB-58', 'RB-59', 'RB-60', 'RB-71', 'RB-72', 'RB-74', 'RB-75', 'RB-82', 'RB-83', 'RB-95'];
    for (const id of invented) {
      expect(OFFICIAL_CROPS[id], `${id} must not be registered`).toBeUndefined();
    }
  });

  it('migrates no-parking to official RB-51 crop', () => {
    expect(registry['no-parking']!.status).toBe('official-crop');
    expect(registry['no-parking']!.designation).toBe('RB-51');
    expect(officialCropFor('no-parking')).toBe('/signs/ns-official/RB-51.png');
    expect(SIGN_ART['no-parking'], 'no-parking must not keep SVG fallback').toBeUndefined();
  });

  it('migrates no-stopping to official RB-55 crop', () => {
    expect(registry['no-stopping']!.status).toBe('official-crop');
    expect(registry['no-stopping']!.designation).toBe('RB-55');
    expect(officialCropFor('no-stopping')).toBe('/signs/ns-official/RB-55.png');
    expect(SIGN_ART['no-stopping'], 'no-stopping must not keep SVG fallback').toBeUndefined();
  });

  it('migrates accessible-parking to official RB-52B crop', () => {
    expect(registry['accessible-parking']!.status).toBe('official-crop');
    expect(registry['accessible-parking']!.designation).toBe('RB-52B');
    expect(officialCropFor('accessible-parking')).toBe('/signs/ns-official/RB-52B.png');
    expect(SIGN_ART['accessible-parking'], 'accessible-parking must not keep SVG fallback').toBeUndefined();
  });

  it('migrates truck-route to official RB-61 crop', () => {
    expect(registry['truck-route']!.status).toBe('official-crop');
    expect(registry['truck-route']!.designation).toBe('RB-61');
    expect(officialCropFor('truck-route')).toBe('/signs/ns-official/RB-61.png');
    expect(SIGN_ART['truck-route'], 'truck-route must not keep SVG fallback').toBeUndefined();
  });

  it('migrates school-area to official WC-1 crop', () => {
    expect(registry['school-area']!.status).toBe('official-crop');
    expect(registry['school-area']!.designation).toBe('WC-1');
    expect(officialCropFor('school-area')).toBe('/signs/ns-official/WC-1.png');
    expect(SIGN_ART['school-area'], 'school-area must not keep SVG fallback').toBeUndefined();
  });
});