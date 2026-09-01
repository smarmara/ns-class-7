# Priority 6C — Sign Catalogue Cleanup

Completed 2026-08-19. Fixes the two defects in the learner sign catalogue that
Priority 6B left behind: Reference signs rendering a missing-artwork warning,
and lane-control signs buried in a catch-all Regulatory section.

No artwork, filename, sign name, designation, fingerprint or approval record
was modified. No questions were added or changed.

## Problems found

### Why Reference artwork showed ⚠️

The catalogue listed all 155 Core and Reference signs, but `SignArt` resolved
artwork through a completely different data path from the one that decides
which signs a learner sees:

```
learner-scope.json  (232 classified, 155 learner-visible)
        │
        ▼
learner-signs.ts ──▶ SignGallery ──▶ SignArt
                                       │
                                       ├─ officialCropFor() ─▶ sign-fidelity.json  ← only 82 signs
                                       └─ getSignMeta()     ─▶ sign-meta.json      ← only 82 signs
```

`sign-fidelity.json` and `sign-meta.json` each describe **82 signs** — exactly
the subset the question bank uses. They were never extended when the learner
catalogue grew to 155, because until Phase 6B the gallery was *built from the
question bank*, so the two sets were the same by construction.

`SignArt` bailed out to the ⚠️ placeholder when either lookup missed:

```ts
if ((!crop && !art && !isShape) || !meta) return <span>⚠️</span>;
```

**73 of the 155 learner entries hit that branch** — every Reference sign whose
App ID is its Schedule designation (`RB-42R`, `RB-40`, `R-201`, the roundabout
and lane-control families, and so on). Their images existed and were approved
the whole time; nothing in the render path knew how to find them.

So of the candidate causes in the brief, the real one was a combination of two:
*the renderer only handled the old question-linked registry subset*, and
*metadata carried the artwork relationship but the resolver did not read it*.
The images were never missing, and no mapping was wrong.

Measured before the fix:

| | |
| --- | ---: |
| Learner entries | 155 |
| Artwork resolved | 76 |
| Showing the ⚠️ fallback | **79** |

(79 rather than 73: the six sign-shape concepts also failed the `crop/art/isShape`
test in the audit harness, though they rendered in the app via `SIGN_SHAPE_IDS`.)

### Why learner categories were misassigned

The category shown for a sign was `meta?.category ?? scope.category ?? 'other'`
— that is, whichever of two *source* classifications happened to be present.
Neither field answers "where should a learner look for this?":

- `sign-meta.json.category` is the official family for the 82 question-bank signs.
- `learner-scope.json.category` was set to `regulatory` for all 73 Schedule-keyed
  Reference signs, because that is the Schedule they come from.

The result was a Regulatory section holding **83 of 155 signs**, including every
roundabout lane diagram, every two- and three-lane control diagram, the reserved
lanes and the whole no-lane-change family — while `Lane use` held three.

The catalogue had no concept of a learner-facing category at all. It was
inferring navigation from legal classification, which is what the brief
identifies as the underlying mistake.

## Artwork resolution

| | |
| --- | ---: |
| Learner catalogue entries | 155 |
| Artwork resolved **before** | 76 |
| Artwork resolved **after** | **155** |
| Remaining fallbacks | **0** |

Breakdown of what the 155 resolve to:

| Visual type | Count |
| --- | ---: |
| Official Nova Scotia Schedule crops | 144 |
| Sign-shape concept SVGs | 6 |
| Registry concept SVGs (pavement markings, guide sign) | 5 |

Every one of the 144 crop paths was verified to exist on disk.

## Learner taxonomy

Ten categories, declared in `data/signs/learner-categories.json` and presented
in this order:

| # | Category | What it covers |
| --- | --- | --- |
| 1 | Regulatory | Right-of-way commands, access prohibitions, blanket turn prohibitions, speed control |
| 2 | Lane Use & Turns | Lane designation, turn control, lane changes, reserved lanes, roundabout lane choice, passing |
| 3 | Parking & Stopping | Where and when you may park or stop, including accessible parking |
| 4 | Warning | Hazards and road conditions ahead, and markers guiding you past an obstruction |
| 5 | School, Pedestrian & Cyclist | Crossings, school areas, controls protecting people walking and cycling |
| 6 | Railway | Railway crossings and their advance warnings |
| 7 | Work Zones | Temporary traffic control where work is under way |
| 8 | Guide & Information | Routes, destinations and services |
| 9 | Pavement Markings | What the lines painted on the road mean |
| 10 | Sign Shapes | Reading a sign from its shape alone |

The order is deliberate rather than alphabetical: the things a learner is tested
on and meets constantly come first, the concept sections last.

Two changes from the starting taxonomy in the brief:

- **School was combined with Pedestrian & Cyclist**, not kept separate. On its
  own it holds five entries (`school-area`, `school-crosswalk`, `RA-3R`, `RA-8`,
  `R-102`) — below the threshold worth its own section, and a learner looking for
  "the crossing signs" does not distinguish a school crosswalk from any other.
- **`prohibition` and `other` were dropped.** `prohibition` was a second
  regulatory bucket holding six signs; `other` was not a category so much as an
  absence of one. Both are now resolved into real categories.

## Category migration

| Sign / Family | Old Category | New Learner Category | Reason |
| --- | --- | --- | --- |
| Turn control — `RB-42R`, `RB-41L`, `RB-43`, `RB-44`, `RB-14L/R`, `RB-15A`, `RB-18` | Regulatory | Lane Use & Turns | Tells you which movement a lane permits, not a blanket prohibition |
| Multi-lane control diagrams — `RB-46*` (4), `RB-47*` (7), `RB-49` | Regulatory | Lane Use & Turns | Pure lane-assignment diagrams; the reason the old section was unusable |
| Roundabout lane designation — `RB-97`–`RB-107` (11) | Regulatory | Lane Use & Turns | Learner function is choosing and holding the right roundabout lane |
| Reserved lanes — `RB-80`, `RB-80A`, `RB-81`, `RB-81A` | Regulatory | Lane Use & Turns | A rule about who may use a lane; side-mounted and overhead kept together |
| Reserved bicycle lanes — `RB-90`, `RB-91` | Regulatory | Lane Use & Turns | Primarily a lane rule for the driver, per brief §15 |
| No lane change — `R-200`–`R-203` | Regulatory | Lane Use & Turns | Directly controls lane changing |
| Positioning — `R-101`, `R-113`, `RB-34`, `RB-35`, `RB-36` | Regulatory | Lane Use & Turns | Where on the road to place the vehicle |
| Passing — `do-not-pass`, `passing-permitted`, `RB-33`, `R-129` | Regulatory / Prohibition | Lane Use & Turns | Overtaking is a lane-movement decision; keeps the family in one place |
| Stop-line arrows — `RC-4L`, `RC-4R` | Regulatory | Lane Use & Turns | Functions as lane guidance at the stop line, per brief §10 |
| `keep-right-of-island` | Regulatory | Lane Use & Turns | Which side of the island to take |
| Parking and stopping — `no-parking`, `no-stopping`, `accessible-parking`, `RB-52`, `RB-52A`, `RB-57`, `RB-57A` | Regulatory / Prohibition | Parking & Stopping | A distinct everyday task, previously scattered through 83 unrelated signs |
| Crossings — `RA-4R`, `RA-5L`, `RA-5R`, `RA-8`, `pedestrian-crosswalk` | Regulatory / Pedestrian-cyclist | School, Pedestrian & Cyclist | All crossing controls in one place |
| Cyclist yield controls — `RB-37`, `RB-38`, `RB-39`, `RB-40` | Regulatory | School, Pedestrian & Cyclist | Protects vulnerable road users; the driver's duty is to yield |
| Shared sidewalk — `RB-94L`, `RB-94R` | Regulatory | School, Pedestrian & Cyclist | Organises people walking and cycling |
| School — `school-area`, `school-crosswalk`, `RA-3R`, `R-102` | School / Regulatory | School, Pedestrian & Cyclist | School section merged, see above |
| Hazard markers — `hazard-marker-keep-left`, `hazard-marker-keep-right` | Regulatory | Warning | Purpose is guiding you past an obstruction; sits beside the chevron a learner compares it to (brief §18) |
| `playground` | Pedestrian-cyclist | Warning | A yellow warning diamond about what is ahead, not a crossing control |
| `railway-crossing-ahead` | Warning | Railway | Belongs with the crossbuck and tracks tab it is studied against |
| `bicycle-route` | Pedestrian-cyclist | Guide & Information | A route marker, not a traffic control (brief §15) |
| `truck-route` | Guide | Regulatory | `RB-61` is a regulatory command, not a destination guide |
| `two-way-traffic`, `speed-limit-change-ahead` | Warning | Regulatory | Both are `RB` regulatory signs stating the rule now in force |
| Work zone — `tar`, `blasting-ahead`, `prepare-to-stop`, `overhead-work`, `survey-work`, `road-surface-hazard`, `construction-traffic`, `flashing-double-arrow` | (already work-zone) | Work Zones | Unchanged; listed because all 17 work-zone signs now sit together |
| Sign shapes — 6 entries | `sign-shape` | Sign Shapes | Renamed only; the old key had no label and rendered as raw `sign-shape` |

### Borderline decisions, recorded so they can be overturned

- **Passing signs went to Lane Use & Turns.** `Do Not Pass` is a classic
  regulatory prohibition, but splitting it from `Keep Right Except to Pass` and
  `Motor Vehicle Passing Prohibited` would scatter one idea across two sections.
- **Blanket turn prohibitions stayed in Regulatory.** `No Left Turn`,
  `No Right Turn`, `No U-Turn`, `No Turns`, `No Left Turn on Red` forbid a
  movement outright rather than assigning it to a lane — the distinction the
  brief draws in §13.
- **`One Way` and `Two-Way Traffic` stayed in Regulatory.** They describe the
  road you are on rather than designating a lane. Moving them would make Lane
  Use & Turns mean "anything involving direction".
- **`R-129 Do Not Pass Here to Crosswalk` went to Lane Use & Turns** with the
  passing family, though its purpose is protecting a crosswalk. Arguable either
  way; it was filed by what the sign controls, not by who benefits.
- **`RB-66`/`RB-86` (pedestrians and motorcycles prohibited) stayed in
  Regulatory.** They restrict who may use a road, which is an access rule, not a
  crossing control.

## Category counts

| Category | Before | After |
| --- | ---: | ---: |
| Regulatory | 83 | **21** |
| Lane Use & Turns | 3 | **56** |
| Parking & Stopping | — | **7** |
| Warning | 23 | 23 |
| School, Pedestrian & Cyclist | 5 (School 2 + Ped/Cyc 3) | **15** |
| Railway | 2 | 3 |
| Work Zones | 17 | 17 |
| Guide & Information | 3 | 3 |
| Pavement Markings | 4 | 4 |
| Sign Shapes | 6 (unlabelled `sign-shape`) | 6 |
| Prohibition *(removed)* | 9 | — |
| **Total** | **155** | **155** |

## Lane Use & Turns

**3 → 56.** What now lives here:

- **Turn control** (9): `RB-42R`, `RB-41L`, `RB-43`, `RB-44`, `RB-14L`, `RB-14R`,
  `RB-15A`, `RB-18`, plus `lane-straight-or-left`, `lane-right-turn-only`
- **Multi-lane control diagrams** (12): `RB-46A/B/L/R`, `RB-47A/B/C/D/E/L/R`, `RB-49`
- **Roundabout lane designation** (11): `RB-97` … `RB-107`
- **Reserved lanes** (6): `RB-80`, `RB-80A`, `RB-81`, `RB-81A`, `RB-90`, `RB-91`
- **No lane change** (4): `R-200`, `R-201`, `R-202`, `R-203`
- **Positioning and passing** (9): `R-101`, `R-113`, `R-129`, `RB-33`, `RB-34`,
  `RB-35`, `RB-36`, `do-not-pass`, `passing-permitted`, `keep-right-of-island`
- **Centre lane** (2): `two-way-left-turn-lane`, `RB-36`
- **Stop-line guidance** (2): `RC-4L`, `RC-4R`

Lane-control signs are no longer in Regulatory. `tests/learner-sign-categories.test.ts`
asserts this explicitly for ten representative IDs, and the E2E spec asserts it
against the rendered page.

## Regulatory

**83 → 21.** What remains is general regulation, and nothing else:

- Right-of-way commands: `stop`, `yield`, `RA-1B` (bilingual stop)
- Direction of travel: `one-way`, `do-not-enter`, `two-way-traffic`
- Blanket turn prohibitions: `no-left-turn`, `no-right-turn`, `no-turns`,
  `no-u-turn`, `no-right-turn-on-red`, `RB-17L`
- Speed: `maximum-speed-50`, `maximum-speed-80`, `speed-limit-change-ahead`,
  `RB-4` (minimum), `RB-3` (night), `R-121` (over 12 tonnes)
- Access: `RB-66`, `RB-86`, `truck-route`

Every one states a rule that applies to the driver generally, rather than
assigning a movement to a lane or governing a specific task.

## Parking & Stopping

Yes — it became its own category, with seven entries. Four of them (`RB-52`,
`RB-52A`, `RB-57`, `RB-57A`) were previously indistinguishable inside the
83-sign Regulatory section, and the other three were split across Regulatory and
the old `prohibition` bucket. Seven is small but it is a self-contained everyday
task, and the time-plate and on-pavement variants only make sense next to the
plain signs.

## Pedestrian / Cyclist / School

Combined into one section of 15. School kept its meaning — `school-area`,
`school-crosswalk`, `RA-3R` and `R-102 End School Area` are all present — but it
is not a separate heading, because five entries do not justify one and learners
browse crossings as a single idea.

Split by learner purpose rather than by subject matter, exactly as brief §15
asks:

- **Reserved bicycle lanes** (`RB-90`, `RB-91`) → Lane Use & Turns, because the
  driver's question is "may I drive in that lane?"
- **Bicycle route** (`bicycle-route`) → Guide & Information, because it marks
  where a route goes rather than controlling anything
- **Bicycle yield controls** (`RB-37`–`RB-40`) → here, because they impose a duty
  at the point of conflict

## Variants

The 22 Phase A Variant visuals are **not** top-level catalogue entries and are
not categorised. `learner-categories.json` contains exactly the 155 Core and
Reference IDs; the audit and `tests/learner-sign-categories.test.ts` both fail if
any other ID appears in it, which is what keeps Variants and the 55
Developer-only visuals out of learner navigation.

Category inheritance is therefore trivial by construction: a Variant has no
category of its own and is reached through its parent, so it can never
double-count or inflate a section. The 80/75/22/55 scope split is unchanged — no
classification defect was found.

## Architecture

Three separate concerns, three separate places:

| Question | Where it is answered |
| --- | --- |
| Should the learner study this sign? | `data/signs/learner-scope.json` (scope) |
| Where should the learner find it? | `data/signs/learner-categories.json` (learner category) |
| How does the source classify it? | `data/signs/sign-meta.json`, `learner-scope.json` (official category) |
| What does it look like? | `data/signs/visual-approvals.json` (approved artwork) |

### Artwork resolution — `src/signs/artwork.ts`

One function, `getSignArtwork(appId)`, is now the only answer to "what does this
sign render as". It resolves from **`visual-approvals.json`**, which is the
canonical App ID → approved artwork relationship: it is the record of the visual
a human actually approved, and its fingerprint covers the asset path, so it
cannot drift from the file on disk without `signs:approval:check` failing.

It returns a discriminated union rather than a string, so every approved visual
type is handled explicitly:

```ts
type SignArtwork =
  | { kind: 'crop'; src: string; designation?: string }
  | { kind: 'shape'; shapeId: string }
  | { kind: 'svg'; art: ReactNode };
```

Only `status: 'approved'` resolves, so nothing unreviewed can reach a learner.

No second image map was created. `OFFICIAL_CROPS`, `sign-fidelity.json` and
`officialCropFor()` still exist and are still used by the fidelity report and its
tests — they describe artwork *provenance*, which is a different question from
artwork *resolution*, and the fidelity report is the tool that answers it.

**Resolving from approvals is byte-identical to the old fidelity path for all 82
question-bank signs**, including the `RB-1`/`RB-1A` variable-number speed pair
whose approval records carry the same asset override `cropKeyFor` applied. This
was verified before the switch and is now locked in by a test, so quiz artwork
cannot regress.

### Learner category — `data/signs/learner-categories.json`

Holds the taxonomy (id, label, one-line blurb, display order) and an App ID →
category map. It stores **nothing else** — no names, no artwork paths, no
designations, no descriptions. Those stay canonical where they already live.

`learnerCategoryFor()` has deliberately **no fallback**. An uncategorised sign
surfaces as a validation failure rather than silently landing in an "other"
bucket, which is how the original problem stayed invisible.

### `SignGallery`

Consumes both and infers nothing. Category order comes from the taxonomy, not
from a switch statement in the component; membership comes from the map, not
from question topic or official classification. The component's only judgement
is layout.

### Accessible names

`SignArt` gained an optional `label`, used **only** when a sign has no
`visualDescription` in `sign-meta.json` — which is only ever true for the 73
catalogue-only Reference signs. Quiz code never passes it, and a test asserts
that every sign the question bank uses has a `visualDescription`, so the quiz
path can never reach the fallback. In a question the accessible name is still
the appearance of the sign and never its meaning.

## Tests

New — `tests/sign-artwork.test.tsx` (14 tests):

- every Core entry resolves to approved artwork (80/80)
- every Reference entry resolves to approved artwork (75/75)
- no learner entry lands on the missing-artwork fallback (155/155)
- resolved visual types are limited to what the renderer can draw
- every official crop points at a file that exists on disk
- every sign the question bank uses resolves
- **the resolver returns the same image the fidelity path returned, for all 82
  question-bank signs** — the quiz-artwork regression guard for the refactor
- the 50 and 80 speed signs stay on different images
- unknown signs and unapproved visuals resolve to nothing
- rendering every one of the 155 entries produces no ⚠️
- question signs are named after their appearance, never their meaning
- a sign with no artwork degrades visibly instead of crashing

New — `tests/learner-sign-categories.test.ts` (28 tests):

- every learner entry has exactly one category, drawn from the taxonomy
- taxonomy size stays browsable (8–11)
- no sign appears in two primary categories; totals reconcile to 155
- nothing outside the learner catalogue is categorised (keeps Variants and
  Developer-only visuals out)
- categories render in declared order, not alphabetical
- **Core/Reference status does not determine category** — categories hold both
  scopes, and neither scope is confined to one category
- the official classification is preserved alongside the learner category, and
  a legally regulatory sign may sit elsewhere
- **Lane Use & Turns regression** — 56 entries, with the lane-direction,
  multi-lane, roundabout, reserved-lane, no-lane-change and positioning families
  each asserted present
- **Regulatory regression** — 21 entries, with ten representative lane-control
  IDs asserted absent, and the general regulatory commands asserted present
- parking, crossings, hazard markers, work zones, railway, shapes and pavement
  markings each land where intended

New — `e2e/sign-catalogue.spec.ts` (8 tests × 2 viewports):

- catalogue loads with one card per learner entry
- **zero ⚠️ placeholders on the page**
- every official crop loads successfully with a non-zero natural width
- every category heading shows the count the data declares
- lane-control signs appear under Lane Use & Turns and *not* under Regulatory
- Regulatory holds only its 21 general commands
- parking and crossings have their own sections
- the Reference badge appears the right number of times, is not a heading, and
  sits inside topic sections alongside Core signs
- no horizontal overflow at 320 × 568, artwork stays ≥ 70 px tall

New — `e2e/sign-catalogue-shots.spec.ts`: visual evidence, `shots` project only.

Extended — `pnpm signs:learner-audit`: now runs the **production resolver** and
fails on unresolved artwork, an uncategorised entry, a category outside the
taxonomy, a non-learner ID in the category map, or counts that do not reconcile.

## Accessibility

Catalogue and quiz remain separate, as they must be:

- **Catalogue** — cards carry the sign's name in a `<figcaption>`, and the image
  is named by its `visualDescription` where one exists or by its display name
  otherwise. Semantic information is appropriate here; the learner is studying.
- **Quiz** — unchanged. The accessible name is the `visualDescription` only, and
  a test asserts every question-linked sign has one, so the catalogue's
  display-name fallback can never leak into a question.

Category sections are `<section>` elements with real `<h2>` headings and stable
`id`s; the jump-links at the top of the page are a labelled `<nav>`. Cards are a
`<ul>`/`<li>` list rather than loose `<div>`s. The Reference badge is a small
chip and never the sole carrier of meaning — scope is also stated in the page
summary and the closing note.

## Performance / PWA

- Catalogue images use `loading="lazy"` and `decoding="async"`, so 155 full-size
  PNGs are not decoded on entry — only the cards near the viewport.
- The route stays lazily code-split. No dependency was added; `artwork.ts` is
  ~30 lines over data the bundle already contained.
- The precache decision from Phase 6B is untouched. No new assets were
  introduced — all 144 crops were already in `public/signs/` and already
  precached, which is why the catalogue works offline with no external requests.

## Approval integrity

```
Checked 232 approved visual(s).
Gallery: 232 total, 232 approved, 0 pending, 0 changed, 0 broken, 0 unresolved names.
All approved visuals remain valid.
```

Unchanged, as expected: this task read the approval records and never wrote to
them.

## Verification

| Gate | Result |
| --- | --- |
| `pnpm content:validate` | 0 errors, 63 warnings |
| `pnpm content:quality` | reports written |
| `pnpm content:syllabus` | 286 active questions (105 sign, 181 rules) — unchanged by this task |
| `pnpm content:progression` | 31 topics, 0 Complete unreachable, 0 Mastered unreachable |
| `pnpm sources:check:ci` | pass |
| `pnpm signs:approval:check` | 232 approved, 0 changed, 0 broken |
| `pnpm signs:audit` | pass |
| `pnpm signs:learner-audit` | 155/155 artwork, 0 uncategorized, 0 duplicates |
| `pnpm test` | pass |
| `pnpm test:e2e` | pass |
| `pnpm verify` | green |

## A note on the desktop grid

The catalogue renders three columns at desktop width rather than filling the
screen. That is the app's global `--content-max: 720px` reading column, which
every screen shares — not a constraint of the catalogue grid, which is
`auto-fill / minmax(158px, 1fr)` and would widen immediately if that token
changed. Widening it is an app-wide design decision and was left alone.
