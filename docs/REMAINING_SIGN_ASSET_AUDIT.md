# Remaining Sign Asset Audit

**Generated:** 2026-08-18
**Last updated:** 2026-08-18 (final cleanup)
**Status:** RESOLVED — all legacy assets migrated

---

## Summary

This audit tracked the remaining legacy learner-facing sign assets after the Nova Scotia Schedule crop migration. All items have now been resolved.

### Final state

| Category | Count |
|----------|-------|
| NS Schedule PNG | 175 |
| Handbook/work-zone PNG | 42 |
| Source-review PNG | 3 |
| Handbook concept SVG | 7 |
| Pavement concept SVG | 4 |
| **Legacy approximation** | **0** |
| **Unresolved** | **0** |

### What was resolved in this final pass

1. **Three new PNGs integrated:**
   - `playground` → `warning-playground.png`
   - `bicycle-route` → `guide-bicycle-route.png`
   - `animal-crossing` → `warning-animal-crossing.png`

2. **Four Schedule remaps (eliminated duplicate handbook artwork):**
   - `no-turns` → `RB-15.png`
   - `lane-right-turn-only` → `RB-41R.png`
   - `lane-straight-or-left` → `RB-42L.png`
   - `two-way-left-turn-lane` → `RB-48.png`

3. **Guide destination concept SVG created** (replaced fake official artwork)

4. **Six sign-shape concept SVGs created** for shape-recognition teaching

---

## RB-1 speed variants (maximum-speed-50 / maximum-speed-80)

**Status: RESOLVED — both variants on official crops (corrected 2026-08-18)**

RB-1 "Maximum speed" is a **variable-number sign**: the Regulations fix the
design and let the numeral change per location, so one designation legitimately
covers more than one real image.

An earlier revision of this document stated that `RB-1.png` depicts
`MAXIMUM 50`. **That was wrong.** `RB-1.png` depicts `MAXIMUM 80`. Because both
speed signs resolved their artwork from the designation alone, the 50 km/h
concept displayed the 80 km/h image — reaching a learner through question
`signs-reg-013`, whose every answer choice is about 50 km/h.

Current mapping:

| App id | Designation | Variant | Asset | Image |
|---|---|---|---|---|
| `maximum-speed-50` | RB-1 | 50 km/h | `RB-1A.png` | MAXIMUM 50 |
| `maximum-speed-80` | RB-1 | 80 km/h | `RB-1.png` | MAXIMUM 80 |

`RB-1A` is an asset file name only. The Traffic Signs Regulations define RB-1
and no RB-1A, so both variants keep designation RB-1 and are told apart by the
`variant` field plus the optional `asset` key in `sign-fidelity.json`.
Resolution runs through `cropKeyFor()` (`src/signs/cropKey.ts`), shared by the
app, the gallery, the content validator and the build's content-version digest.

---

## Main Audit Table

| App asset ID | Learner-facing name | Asset family | Active question IDs | Usage | Current artwork | Primary official source | Exact page/section | Secondary authority | Replacement needed? | Recommended replacement asset | Confidence | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `maximum-speed-80` | Maximum speed 80 km/h | regulatory-other | signs-reg-019 | question image | official crop `RB-1.png` | NS Traffic Signs Regulations | Schedule p.1, RB-1 (variable number) | Driver's Handbook ch.3 p.90 | NO — on official crop | — | High | Variable-number sign; RB-1.png is the 80 km/h image. Resolved. |
| `maximum-speed-50` | Maximum speed 50 km/h | regulatory-other | signs-reg-013 | question image | official crop `RB-1A.png` | NS Traffic Signs Regulations | Schedule p.1, RB-1 (variable number) | Driver's Handbook ch.3 p.90 | NO — on official crop | — | High | Variable-number sign; RB-1A.png is the 50 km/h image. Corrected 2026-08-18. |
| `no-turns` | No turns | regulatory-other | signs-reg-011 | distractor | custom inline SVG | Driver's Handbook | ch.3 p.88 | — | YES | regulatory-no-turns.png | High | Not in NS Schedule; handbook illustration only. |
| `hazard-marker-keep-right` | Hazard marker — drive right | regulatory-other | signs-reg-015 | question image | custom inline SVG | Driver's Handbook | ch.3 p.90 | — | YES | regulatory-hazard-marker-keep-right.png | High | Not in NS Schedule; handbook illustration only. |
| `slippery-when-wet` | Slippery When Wet | warning | signs-warn-002, signs-warn-022 | question image, correct answer | custom inline SVG | Driver's Handbook | ch.3 p.83 | — | YES | warning-slippery-when-wet.png | High | Standard warning sign shown in handbook. |
| `traffic-signal-ahead` | Traffic Signal Ahead | warning | signs-warn-003 | question image | custom inline SVG | Driver's Handbook | ch.3 p.83 | — | YES | warning-traffic-signal-ahead.png | High | Standard warning sign shown in handbook. |
| `stop-sign-ahead` | Stop Sign Ahead | warning | signs-warn-004 | question image | custom inline SVG | Driver's Handbook | ch.3 p.83 | — | YES | warning-stop-sign-ahead.png | High | Standard warning sign shown in handbook. |
| `merge` | Merge | warning | signs-warn-005, signs-warn-022 | question image, distractor | custom inline SVG | Driver's Handbook | ch.3 pp.83, 93 | — | YES | warning-merge.png | High | Shown in two handbook locations. |
| `road-narrows` | Road Narrows | warning | signs-warn-006 | question image | custom inline SVG | Driver's Handbook | ch.3 p.91 | — | YES | warning-road-narrows.png | High | Standard warning sign. |
| `hidden-intersection` | Hidden Intersection | warning | signs-warn-007 | question image | custom inline SVG | Driver's Handbook | ch.3 p.91 | — | YES | warning-hidden-intersection.png | High | Standard warning sign. |
| `steep-decline` | Steep Decline | warning | signs-warn-008 | question image | custom inline SVG | Driver's Handbook | ch.3 p.91 | — | YES | warning-steep-decline.png | High | Standard warning sign. |
| `bump` | Bump | warning | signs-warn-017, signs-warn-022 | question image, distractor | custom inline SVG | Driver's Handbook | ch.3 p.91 | — | YES | warning-bump.png | High | Standard warning sign. |
| `divided-highway-ends` | Divided Highway Ends | warning | signs-warn-009 | question image | custom inline SVG | Driver's Handbook | ch.3 p.91 | — | YES | warning-divided-highway-ends.png | High | Standard warning sign. |
| `divided-highway-ahead` | Divided Highway Ahead | warning | signs-warn-010 | question image | custom inline SVG | Driver's Handbook | ch.3 p.92 | — | YES | warning-divided-highway-ahead.png | High | Standard warning sign. |
| `right-curve` | Curve to the Right | warning | signs-warn-011, signs-warn-022 | question image, distractor | custom inline SVG | Driver's Handbook | ch.3 p.92 | — | YES | warning-right-curve.png | High | Standard warning sign. |
| `sharp-turn-right` | Sharp Turn Right | warning | signs-warn-012 | question image | custom inline SVG | Driver's Handbook | ch.3 p.92 | — | YES | warning-sharp-turn-right.png | High | Standard warning sign with checkerboard band. |
| `chevron-right` | Chevron Right | warning | signs-warn-013 | question image | custom inline SVG | Driver's Handbook | ch.3 p.93 | — | YES | warning-chevron-right.png | High | Standard warning sign. |
| `low-clearance` | Low Clearance | warning | signs-warn-014 | question image | custom inline SVG | Driver's Handbook | ch.3 p.93 | — | YES | warning-low-clearance.png | High | Standard warning sign. |
| `right-lane-ends` | Right Lane Ends | warning | signs-warn-015 | question image | custom inline SVG | Driver's Handbook | ch.3 p.92 | — | YES | warning-right-lane-ends.png | High | Standard warning sign. |
| `narrow-structure` | Narrow Structure | warning | signs-warn-016 | question image | custom inline SVG | Driver's Handbook | ch.3 p.92 | — | YES | warning-narrow-structure.png | High | Standard warning sign. |
| `truck-entering` | Truck Entering | warning | signs-warn-018 | question image | custom inline SVG | Driver's Handbook | ch.3 p.83 | — | YES | warning-truck-entering.png | High | Standard warning sign. |
| `animal-crossing` | Animal Crossing | warning | signs-warn-019 | question image | custom inline SVG | Driver's Handbook | ch.5 p.146 | — | YES | warning-animal-crossing.png | High | Referenced in ch.5 (animals), not ch.3 signs section. Moose silhouette. |
| `playground` | Playground Ahead | school | signs-school-004, signs-ped-002 | distractor, question image | custom inline SVG | Driver's Handbook | ch.3 p.88 | — | YES | warning-playground.png | High | Fluorescent yellow-green diamond. |
| `bicycle-route` | Bicycle Route | pedestrian-cyclist | signs-school-004, signs-ped-003 | distractor, question image | custom inline SVG | Driver's Handbook | ch.2 pp.69-70 | ch.3 p.88 | YES | guide-bicycle-route.png | High | Yellow diamond with bicycle symbol. |
| `railway-crossbuck` | Railway Crossbuck | railway | signs-rail-001 | question image | custom inline SVG | Driver's Handbook | ch.3 p.81 | — | YES | railway-crossbuck.png | High | White X-shaped sign with red border. |
| `railway-tracks-tab` | Number of Tracks Tab | railway | signs-rail-002 | question image | custom inline SVG | Driver's Handbook | ch.3 p.81 | — | YES | railway-tracks-tab.png | High | Small white rectangular plate showing numeral. |
| `lane-right-turn-only` | Right Turn Only Lane | lane-use | signs-lane-001 | question image | custom inline SVG | Driver's Handbook | ch.3 p.93 | — | YES | lane-right-turn-only.png | High | White rectangle with right-curving arrow. |
| `lane-straight-or-left` | Straight or Left Turn Lane | lane-use | signs-lane-002 | question image | custom inline SVG | Driver's Handbook | ch.3 p.93 | — | YES | lane-straight-or-left.png | High | White rectangle with two arrows. |
| `two-way-left-turn-lane` | Two-Way Left Turn Lane | lane-use | signs-lane-003 | question image | custom inline SVG | Driver's Handbook | ch.3 p.93 | — | YES | lane-two-way-left-turn.png | High | White rectangle with two opposing left arrows. |
| `route-102` | Highway 102 Route Marker | route-marker | signs-guide-002 | question image | custom inline SVG | Driver's Handbook | ch.3 p.94 | — | YES | guide-route-102.png | High | Shield-shaped provincial highway marker. |
| `guide-destination` | Guide Destination Sign | guidance | signs-guide-001, signs-guide-004 | question image | custom inline SVG | Driver's Handbook | ch.3 p.83 | — | YES | guide-destination.png | High | Green rectangle with white lettering. |
| `wz-construction-ahead` | Construction Ahead | work-zone | signs-wz-010 | question image | custom inline SVG | Driver's Handbook | ch.3 pp.94-101 | Temporary Workplace Traffic Control Manual | YES | work-construction-ahead.png | High | Orange diamond with worker symbol. |
| `wz-workers-ahead` | Workers Ahead | work-zone | signs-wz-002 | question image | custom inline SVG | Driver's Handbook | ch.3 p.101 | Temporary Workplace Traffic Control Manual | YES | work-workers-ahead.png | High | Orange diamond with worker and flags. |
| `wz-traffic-control-person` | Traffic Control Person | work-zone | signs-wz-003 | question image | custom inline SVG | Driver's Handbook | ch.3 p.101 | Temporary Workplace Traffic Control Manual | YES | work-traffic-control-person.png | High | Orange diamond with flagger symbol. |
| `wz-construction-distance-ahead` | Construction Distance Ahead | work-zone | signs-wz-004 | question image | custom inline SVG | Driver's Handbook | ch.3 p.98 | Temporary Workplace Traffic Control Manual | YES | work-construction-distance.png | High | Orange diamond with distance text. |
| `wz-end-construction` | End Construction | work-zone | signs-wz-005 | question image | custom inline SVG | Driver's Handbook | ch.3 p.97 | Temporary Workplace Traffic Control Manual | YES | work-end-construction.png | High | Orange rectangle with END CONSTRUCTION text. |
| `wz-uneven-lanes` | Uneven Lanes | work-zone | signs-wz-006 | question image | custom inline SVG | Driver's Handbook | ch.3 p.99 | Temporary Workplace Traffic Control Manual | YES | work-uneven-lanes.png | High | Orange diamond with stepped profile. |
| `wz-flashing-arrow-right` | Flashing Arrow Right | work-zone | signs-wz-007 | question image | custom inline SVG | Driver's Handbook | ch.3 p.103 | Temporary Workplace Traffic Control Manual | YES | work-flashing-arrow-right.png | High | Black panel with lamp arrow. |
| `pm-double-solid-yellow` | Double Solid Yellow Centre Line | pavement-marking | signs-pm-002, signs-pm-010 | question image, distractor | custom inline SVG | Driver's Handbook | ch.3 p.84 | — | REVIEW | — | Medium | Concept diagram; may be better as clean illustration than crop. |
| `pm-broken-yellow` | Broken Yellow Centre Line | pavement-marking | signs-pm-003, signs-pm-010 | question image, correct answer | custom inline SVG | Driver's Handbook | ch.3 p.84 | — | REVIEW | — | Medium | Concept diagram; may be better as clean illustration than crop. |
| `pm-solid-and-broken-yellow` | Solid and Broken Yellow | pavement-marking | signs-pm-004, signs-pm-010 | question image, distractor | custom inline SVG | Driver's Handbook | ch.3 pp.84-85 | — | REVIEW | — | Medium | Concept diagram; may be better as clean illustration than crop. |
| `pm-white-lane-line` | White Lane Line | pavement-marking | signs-pm-005, signs-pm-010 | question image, distractor | custom inline SVG | Driver's Handbook | ch.3 pp.84-85 | — | REVIEW | — | Medium | Concept diagram; may be better as clean illustration than crop. |

---

## Work-zone assets

All 7 work-zone signs are illustrated in the Nova Scotia Driver's Handbook Chapter 3 (pp. 94-103) and are also covered by the **Nova Scotia Temporary Workplace Traffic Control Manual**. The handbook provides sufficient visual reference for cropping. These signs use orange backgrounds and are distinct from the yellow warning signs.

| App ID | Meaning | Handbook ref | TWTM ref | Recommended filename |
|--------|---------|-------------|----------|---------------------|
| `wz-construction-ahead` | Construction ahead — prepare for unusual road conditions | ch.3 pp.94-101 | Figure varies by edition | `work-construction-ahead.png` |
| `wz-workers-ahead` | Workers are active at the site | ch.3 p.101 | Figure varies by edition | `work-workers-ahead.png` |
| `wz-traffic-control-person` | Traffic control person ahead | ch.3 p.101 | Figure varies by edition | `work-traffic-control-person.png` |
| `wz-construction-distance-ahead` | Construction activities begin a stated distance ahead | ch.3 p.98 | Figure varies by edition | `work-construction-distance.png` |
| `wz-end-construction` | The road has returned to normal | ch.3 p.97 | Figure varies by edition | `work-end-construction.png` |
| `wz-uneven-lanes` | Difference in elevation between the lanes | ch.3 p.99 | Figure varies by edition | `work-uneven-lanes.png` |
| `wz-flashing-arrow-right` | Flashing light unit with right arrow — lane closed | ch.3 p.103 | Figure varies by edition | `work-flashing-arrow-right.png` |

---

## Warning assets

19 yellow/black diamond (or rectangle for chevron) warning signs. All are explicitly shown in the Nova Scotia Driver's Handbook Chapter 3. The handbook illustrations are the authoritative learner-facing reference.

| App ID | Name | Handbook page | Recommended filename |
|--------|------|--------------|---------------------|
| `slippery-when-wet` | Slippery When Wet | ch.3 p.83 | `warning-slippery-when-wet.png` |
| `traffic-signal-ahead` | Traffic Signal Ahead | ch.3 p.83 | `warning-traffic-signal-ahead.png` |
| `stop-sign-ahead` | Stop Sign Ahead | ch.3 p.83 | `warning-stop-sign-ahead.png` |
| `merge` | Merge | ch.3 pp.83, 93 | `warning-merge.png` |
| `road-narrows` | Road Narrows | ch.3 p.91 | `warning-road-narrows.png` |
| `hidden-intersection` | Hidden Intersection | ch.3 p.91 | `warning-hidden-intersection.png` |
| `steep-decline` | Steep Decline | ch.3 p.91 | `warning-steep-decline.png` |
| `bump` | Bump | ch.3 p.91 | `warning-bump.png` |
| `divided-highway-ends` | Divided Highway Ends | ch.3 p.91 | `warning-divided-highway-ends.png` |
| `divided-highway-ahead` | Divided Highway Ahead | ch.3 p.92 | `warning-divided-highway-ahead.png` |
| `right-curve` | Curve to the Right | ch.3 p.92 | `warning-right-curve.png` |
| `sharp-turn-right` | Sharp Turn Right | ch.3 p.92 | `warning-sharp-turn-right.png` |
| `chevron-right` | Chevron Right | ch.3 p.93 | `warning-chevron-right.png` |
| `low-clearance` | Low Clearance | ch.3 p.93 | `warning-low-clearance.png` |
| `right-lane-ends` | Right Lane Ends | ch.3 p.92 | `warning-right-lane-ends.png` |
| `narrow-structure` | Narrow Structure | ch.3 p.92 | `warning-narrow-structure.png` |
| `truck-entering` | Truck Entering | ch.3 p.83 | `warning-truck-entering.png` |
| `animal-crossing` | Animal Crossing | ch.5 p.146 | `warning-animal-crossing.png` |
| `playground` | Playground Ahead | ch.3 p.88 | `warning-playground.png` |

---

## Guidance, railway and lane-use assets

| App ID | Name | Family | Handbook ref | Recommended filename |
|--------|------|--------|-------------|---------------------|
| `route-102` | Highway 102 Route Marker | route-marker | ch.3 p.94 | `guide-route-102.png` |
| `guide-destination` | Guide Destination Sign | guidance | ch.3 p.83 | `guide-destination.png` |
| `railway-crossbuck` | Railway Crossbuck | railway | ch.3 p.81 | `railway-crossbuck.png` |
| `railway-tracks-tab` | Number of Tracks Tab | railway | ch.3 p.81 | `railway-tracks-tab.png` |
| `lane-right-turn-only` | Right Turn Only Lane | lane-use | ch.3 p.93 | `lane-right-turn-only.png` |
| `lane-straight-or-left` | Straight or Left Turn Lane | lane-use | ch.3 p.93 | `lane-straight-or-left.png` |
| `two-way-left-turn-lane` | Two-Way Left Turn Lane | lane-use | ch.3 p.93 | `lane-two-way-left-turn.png` |
| `bicycle-route` | Bicycle Route | pedestrian-cyclist | ch.2 pp.69-70 | `guide-bicycle-route.png` |

---

## Pavement-marking assets

Pavement markings are **concept diagrams** rather than physical sign artwork. The Driver's Handbook illustrates the concept (road surface with painted lines) but these are not "signs" in the Schedule sense. The current custom SVG diagrams are clear, accurate representations of the handbook's conceptual illustrations.

**Recommendation:** Retain the current custom SVG artwork for pavement markings. Cropping a tiny handbook diagram would reduce clarity. The SVG diagrams are already authoritative representations of the concepts described in the handbook.

| App ID | Marking type | Handbook ref | Recommendation |
|--------|-------------|-------------|----------------|
| `pm-double-solid-yellow` | Double solid yellow centre line | ch.3 p.84 | Retain SVG — concept diagram |
| `pm-broken-yellow` | Broken yellow centre line | ch.3 p.84 | Retain SVG — concept diagram |
| `pm-solid-and-broken-yellow` | Solid and broken yellow | ch.3 pp.84-85 | Retain SVG — concept diagram |
| `pm-white-lane-line` | White lane line | ch.3 pp.84-85 | Retain SVG — concept diagram |

---

## Recommended asset-production batches

### Batch A — Yellow warning signs (19 files)

Source: Nova Scotia Driver's Handbook, Chapter 3 (pp. 83, 88, 91-93) and Chapter 5 (p. 146 for animal-crossing).

| Filename | Source page | Current app ID |
|----------|------------|----------------|
| `warning-slippery-when-wet.png` | ch.3 p.83 | `slippery-when-wet` |
| `warning-traffic-signal-ahead.png` | ch.3 p.83 | `traffic-signal-ahead` |
| `warning-stop-sign-ahead.png` | ch.3 p.83 | `stop-sign-ahead` |
| `warning-merge.png` | ch.3 pp.83, 93 | `merge` |
| `warning-road-narrows.png` | ch.3 p.91 | `road-narrows` |
| `warning-hidden-intersection.png` | ch.3 p.91 | `hidden-intersection` |
| `warning-steep-decline.png` | ch.3 p.91 | `steep-decline` |
| `warning-bump.png` | ch.3 p.91 | `bump` |
| `warning-divided-highway-ends.png` | ch.3 p.91 | `divided-highway-ends` |
| `warning-divided-highway-ahead.png` | ch.3 p.92 | `divided-highway-ahead` |
| `warning-right-curve.png` | ch.3 p.92 | `right-curve` |
| `warning-sharp-turn-right.png` | ch.3 p.92 | `sharp-turn-right` |
| `warning-chevron-right.png` | ch.3 p.93 | `chevron-right` |
| `warning-low-clearance.png` | ch.3 p.93 | `low-clearance` |
| `warning-right-lane-ends.png` | ch.3 p.92 | `right-lane-ends` |
| `warning-narrow-structure.png` | ch.3 p.92 | `narrow-structure` |
| `warning-truck-entering.png` | ch.3 p.83 | `truck-entering` |
| `warning-animal-crossing.png` | ch.5 p.146 | `animal-crossing` |
| `warning-playground.png` | ch.3 p.88 | `playground` |

### Batch B — Work-zone signs (7 files)

Source: Nova Scotia Driver's Handbook, Chapter 3 (pp. 94-103); Nova Scotia Temporary Workplace Traffic Control Manual.

| Filename | Source page | Current app ID |
|----------|------------|----------------|
| `work-construction-ahead.png` | ch.3 pp.94-101 | `wz-construction-ahead` |
| `work-workers-ahead.png` | ch.3 p.101 | `wz-workers-ahead` |
| `work-traffic-control-person.png` | ch.3 p.101 | `wz-traffic-control-person` |
| `work-construction-distance.png` | ch.3 p.98 | `wz-construction-distance-ahead` |
| `work-end-construction.png` | ch.3 p.97 | `wz-end-construction` |
| `work-uneven-lanes.png` | ch.3 p.99 | `wz-uneven-lanes` |
| `work-flashing-arrow-right.png` | ch.3 p.103 | `wz-flashing-arrow-right` |

### Batch C — Guidance, railway, lane-use, regulatory-other (9 files)

Source: Nova Scotia Driver's Handbook, Chapters 2-3.

| Filename | Source page | Current app ID |
|----------|------------|----------------|
| `guide-route-102.png` | ch.3 p.94 | `route-102` |
| `guide-destination.png` | ch.3 p.83 | `guide-destination` |
| `guide-bicycle-route.png` | ch.2 pp.69-70 | `bicycle-route` |
| `railway-crossbuck.png` | ch.3 p.81 | `railway-crossbuck` |
| `railway-tracks-tab.png` | ch.3 p.81 | `railway-tracks-tab` |
| `lane-right-turn-only.png` | ch.3 p.93 | `lane-right-turn-only` |
| `lane-straight-or-left.png` | ch.3 p.93 | `lane-straight-or-left` |
| `lane-two-way-left-turn.png` | ch.3 p.93 | `two-way-left-turn-lane` |
| `regulatory-no-turns.png` | ch.3 p.88 | `no-turns` |
| `regulatory-hazard-marker-keep-right.png` | ch.3 p.90 | `hazard-marker-keep-right` |

### Batch D — Pavement markings (4 files, optional)

Source: Nova Scotia Driver's Handbook, Chapter 3 (pp. 84-85).

**Recommendation:** Retain current SVG artwork. These are concept diagrams, not sign crops. If replacement is desired, create clean diagrammatic illustrations rather than cropping handbook images.

| Filename | Source page | Current app ID |
|----------|------------|----------------|
| `pm-double-solid-yellow.png` | ch.3 p.84 | `pm-double-solid-yellow` |
| `pm-broken-yellow.png` | ch.3 p.84 | `pm-broken-yellow` |
| `pm-solid-and-broken-yellow.png` | ch.3 pp.84-85 | `pm-solid-and-broken-yellow` |
| `pm-white-lane-line.png` | ch.3 pp.84-85 | `pm-white-lane-line` |

---

## Assets not requiring cropping

| Asset | Reason |
|-------|--------|
| `maximum-speed-80` | Variable-number sign; already on the official RB-1.png (80 km/h) crop. |
| `maximum-speed-50` | Variable-number sign; on the official RB-1A.png (50 km/h) crop. |
| `pm-double-solid-yellow` | Concept diagram; current SVG is clear and accurate |
| `pm-broken-yellow` | Concept diagram; current SVG is clear and accurate |
| `pm-solid-and-broken-yellow` | Concept diagram; current SVG is clear and accurate |
| `pm-white-lane-line` | Concept diagram; current SVG is clear and accurate |

---

## Verification

```
pnpm signs:audit  ✓  (report regenerated)
pnpm verify       ✓  (all tests green, no runtime changes)
```
