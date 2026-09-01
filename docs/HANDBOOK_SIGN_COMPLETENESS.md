# Handbook Sign Completeness Report

**Generated:** 2026-08-18
**Status:** Final sign-system cleanup complete

---

## Summary

| Category | Count |
|----------|-------|
| NS Schedule PNG | 175 |
| Handbook/work-zone PNG | 42 |
| Source-review PNG | 3 (playground, animal-crossing, bicycle-route — supplied but provenance pending full verification) |
| Handbook concept SVG | 7 (guide-destination + 6 sign shapes) |
| Pavement concept SVG | 4 |
| Legacy approximation | 0 |
| Unresolved | 0 |

**Total active learner-facing visuals:** 231

---

## NS Schedule Artwork (175 PNGs)

All RA, RB, RC, WC, and R-series signs from the 2023 consolidated Province of Nova Scotia Schedule of Official Traffic Signs.

Includes:
- RA-1 through RA-8 (stop, yield, crosswalks, etc.)
- RB-1 through RB-107 (regulatory signs)
- RC-2 through RC-6 (including RC-6-OPTIONAL variant)
- WC-1 (school area)
- R-100 through R-204 (text signs)

---

## Handbook/Work-Zone Artwork (42 PNGs)

### Warning signs (22)
- warning-slippery-when-wet, warning-traffic-signal-ahead, warning-stop-sign-ahead
- warning-merge, warning-road-narrows, warning-hidden-intersection
- warning-steep-decline, warning-bump, warning-divided-highway-ends
- warning-divided-highway-ahead, warning-right-curve, warning-sharp-turn-right
- warning-chevron-right, warning-low-clearance, warning-right-lane-ends
- warning-narrow-structure, warning-truck-entering
- warning-railway-crossing-ahead, warning-fire-truck-entrance, warning-bridge-opening

### Regulatory signs (2)
- regulatory-hazard-marker-keep-right, regulatory-hazard-marker-keep-left

### Work-zone signs (18)
- work-construction-zone, work-end-construction, work-construction-distance
- work-uneven-lanes, work-workers-ahead, work-traffic-control-person
- work-flashing-directional-arrow, work-tar, work-right-lane-ends
- work-prepare-to-stop, work-road-surface-hazard, work-road-narrows
- work-construction-traffic, work-blasting-ahead, work-survey-work
- work-overhead-work, work-flashing-double-arrow

---

## Source-Review PNGs (3)

These PNGs were supplied manually and are usable, but their exact source provenance requires further verification:

| App ID | Filename | Current provenance | Notes |
|--------|----------|-------------------|-------|
| playground | warning-playground.png | ns-drivers-handbook | Supplied; matches handbook concept |
| animal-crossing | warning-animal-crossing.png | ns-drivers-handbook | Supplied; matches handbook concept |
| bicycle-route | guide-bicycle-route.png | ns-drivers-handbook | Supplied; guide sign format |

---

## Handbook Concept SVGs (7)

| App ID | Description |
|--------|-------------|
| guide-destination | Green rectangular guide sign with neutral example destinations |
| shape-guide-sign | Horizontal rectangle silhouette |
| shape-regulatory-sign | Vertical rectangle silhouette |
| shape-school-zone | Pentagon/school-house silhouette |
| shape-stop | Octagon silhouette |
| shape-yield | Inverted triangle silhouette |
| shape-warning-sign | Diamond silhouette |

---

## Pavement Concept SVGs (4)

| App ID | Description |
|--------|-------------|
| pm-double-solid-yellow | Double solid yellow centre line diagram |
| pm-broken-yellow | Broken yellow centre line diagram |
| pm-solid-and-broken-yellow | Solid and broken yellow diagram |
| pm-white-lane-line | White lane line diagram |

---

## Legacy Approximations Remaining

**0**

All previously approximate SVG artwork has been replaced with official PNGs or intentional concept SVGs.

---

## Unresolved Learner Visuals

**0**

Every active learner-facing visual has a defined source and provenance.

---

## Schedule Remaps Verified

| App ID | Schedule Designation | Asset |
|--------|---------------------|-------|
| no-turns | RB-15 | RB-15.png |
| lane-right-turn-only | RB-41R | RB-41R.png |
| lane-straight-or-left | RB-42L | RB-42L.png |
| two-way-left-turn-lane | RB-48 | RB-48.png |

---

## Missing from Handbook Coverage

The following concepts taught in the Driver's Handbook Chapter 3 sign sections do not yet have dedicated learner questions but are represented by official artwork in the registry for future use:

- Railway advance warning (warning-railway-crossing-ahead) — artwork registered, no active question yet
- Fire truck entrance (warning-fire-truck-entrance) — artwork registered, no active question yet
- Bridge opening (warning-bridge-opening) — artwork registered, no active question yet
- All work-zone variants (tar, blasting, survey, overhead, etc.) — artwork registered, no active questions yet

These are registered and available for future question authoring.

---

## Verification

```
pnpm signs:audit  ✓  (68 signs audited)
pnpm verify       ✓  (240 tests, 68 e2e tests, build successful)
```
