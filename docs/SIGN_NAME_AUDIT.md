# Sign Name Audit

Audit of the human-readable name shown for every visual in the developer sign
gallery (`pnpm signs:gallery`), completed 2026-08-18.

Canonical name data lives in **`data/signs/sign-names.json`**. It is keyed by
app sign id first and by official Schedule designation second, so a learner
sign wired to a Schedule crop inherits the Schedule name without a duplicate
entry. There is no second naming system: `sign-meta.json` keeps the
learner-facing label and the accessible visual description, and this file adds
only the reviewer-facing display name.

## Totals

| Measure | Count |
| --- | --- |
| Total gallery visuals | 232 |
| Names verified unchanged | 89 |
| Names corrected | 32 |
| Names newly resolved | 136 |
| `NAME REVIEW REQUIRED` remaining | **0** |

Every one of the 232 visuals was actively reviewed: artwork opened, designation
checked against the Schedule table, and the resulting name compared with the
picture. Nothing was derived from an id or a filename.

## Sources, in the order they were applied

1. **Nova Scotia Traffic Signs Regulations, Section 8** — the table of
   "Designations and Descriptions of Official Traffic Signs" (N.S. Reg.
   165/2012, amended to N.S. Reg. 178/2023). Repository snapshot:
   `data/sources/snapshots/ns-reg-traffic-signs.txt`. This table names almost
   every designation directly, in quotes: `R-100` is `"Wrong way" sign`,
   `RB-48S` is `"Centre lane" tab sign`, and so on. It is the source for the
   large majority of names here.
2. **Nova Scotia Driver's Handbook, Chapter 3** —
   `data/sources/snapshots/ns-handbook-ch3.txt`. Preferred where the Handbook
   names the same sign for learners in plainer words, e.g. "No Turns",
   "Right turn only lane", "Two-way left turn lane", "Through or right turn
   only".
3. **Work-zone metadata** in `data/signs/sign-fidelity.json`
   (`ns-work-zone-manual`) and the existing `sign-meta.json` labels, for the
   work-zone and Handbook-sourced PNGs that are not in the Schedule table.
4. **The artwork itself**, used only to narrow a name the Schedule gives to a
   group (see below) and never to invent a meaning.

No third-party sign websites were consulted.

## Narrowing grouped Schedule names

Section 8 assigns one name to several designations at a time. Approving a
visual means confirming the picture matches the name, so a shared name like
"Overhead lane control" would make eight different arrow signs indistinguishable.
For those groups the official group name was narrowed by the movement or
orientation actually drawn in the Schedule crop.

| Schedule group name | Designations | How the names were narrowed |
| --- | --- | --- |
| "Overhead lane control" | RB-41L/R, RB-42L/R, RB-43, RB-44, RB-45, RB-48 | By the arrow(s) drawn: Left Turn Only, Right Turn Only, Straight or Left Turn, Straight or Right Turn, Left or Right Turn Only, Straight/Left/Right, Straight Ahead Only, Two-Way Left Turn Lane |
| "Side-mounted lane control" | RB-46*, RB-47*, RB-49 | By the per-lane arrows, read left lane then right lane, e.g. RB-47C "Two-Lane Control — Left Lane Straight, Right Lane Straight or Right Turn" |
| "Restrictive turn control" | RB-14L/R, RB-15, RB-15A | By the green-circle arrow(s) |
| "Prohibitive turn control" | RB-11L/R, RB-16 | No Left Turn / No Right Turn / No U-Turn |
| "Roundabout lane designation" | RB-97 … RB-107 | By the permitted exits, plus whether the central-island dot is drawn ("(Island Symbol)") — that dot is the only visual difference between RB-99/RB-107, RB-100/RB-101 and RB-98/RB-106 |
| "School crosswalk" / "Pedestrian crosswalk" / "Overhead pedestrian crosswalk" | RA-3L/R, RA-4L/R, RA-5L/R | "Symbol Facing Left" / "Symbol Facing Right". Each pair was confirmed to be a true horizontal mirror of the other by pixel comparison, not assumed from the suffix |
| "No parking" / "No stopping" | RB-51, RB-52, RB-52A, RB-55, RB-57, RB-57A | Plain, "— Times Shown", "on Pavement" |
| "Reserved lane" | RB-80, RB-80A, RB-81, RB-81A | Overhead vs side-mounted (down arrow vs diagonal arrow), and whether three or more vehicle symbols are shown |
| "Truck route arrows" | RB-61SA/SB/SC | Plain, "— Times Shown", "— Times Shown (White on Black)" |
| "Cross other side" | RB-73L/R | By the direction pedestrians are sent |
| "Road closed detour" / "All traffic exit" | R-117/R-118, R-119/R-120 | By the arrow direction and the visible text |

## Text-based signs

Where the official message *is* the sign, the visible wording is the name:
Wrong Way, Through Traffic Keep Right, End School Area, Keep Off Median, Do Not
Cross Median, All Traffic Exit Left, Emergency Parking Only, Shut Off Your Radio
Transmitter, and the R-1xx family generally. Where the sign's text carries a
variable number ("NEXT 1 km", "MAXIMUM 10 tonnes"), the name uses the Schedule's
wording rather than the value on this particular crop, e.g. R-128 "Trucks Right
Lane Only Next Distance Shown".

## Names corrected

32 names that were already resolved were changed. The substantive ones:

| Key | Was | Now | Why |
| --- | --- | --- | --- |
| `RA-5L`, `RA-5R` | Pedestrian Crossing | Overhead Pedestrian Crosswalk — Symbol Facing Left/Right | Schedule calls these "overhead pedestrian crosswalk"; the artwork is white-on-black and internally illuminated, a different sign from RA-4 |
| `RB-5`, `speed-limit-change-ahead` | Speed Limit Change Ahead | Maximum Speed Ahead | Schedule name |
| `RA-3L/R`, `RA-4L/R` | School Crosswalk / Pedestrian Crosswalk | … — Symbol Facing Left/Right | L and R variants were sharing one name |
| `shape-*` (6) | e.g. Stop Sign Shape | e.g. Stop Sign Shape — Octagon | The geometry is the whole point of these concept SVGs; the shape is now named |
| `chevron-right` | Chevron Right | Chevron — Keep Right | "Chevron Right" reads as a direction of travel; the sign directs traffic around a curve |
| `pm-white-lane-line` | White Lane Line | Broken White Lane Line | The artwork is broken, not solid |
| `railway-crossbuck`, `railway-tracks-tab` | Railway Crossbuck / Railway Tracks Tab | Railway Crossing Crossbuck / Number of Railway Tracks Tab | The tab states how many tracks, which the old name did not convey |
| `R-102T`, `R-107` | "… (Tab)" / no suffix | "… Tab" | Consistent with the Schedule's "tab sign" wording |
| `work-right-lane-ends`, `work-road-narrows` | Right Lane Ends / Road Narrows | … (Work Zone) | Collided with the identically named permanent warning signs, which are different artwork |
| 11 work-zone names | e.g. Tar, Survey Work, Blasting Ahead | Fresh Tar, Survey Crew Ahead, Blasting Zone Ahead, … | Made the message rather than a topic label |

## `NAME REVIEW REQUIRED` remaining

**None.** Every visual resolved to a source-backed name.

The sentinel is still fully wired: `resolveDisplayName` returns it rather than
falling back to an id-shaped label, unresolved visuals are shown in the gallery
with a `NAME REVIEW REQUIRED` badge and a "Name Review" filter, and
`approveVisual` refuses to approve them at all. `tests/sign-names.test.ts`
asserts no name may equal its own app id or designation, so an id can never
quietly pass as a name.

## Potential name / mapping mismatches

Each of these is an artwork or mapping question rather than a naming question.
Item 1 has since been fixed; items 2–5 remain flagged for a human decision.

### 1. `maximum-speed-50` rendered the MAXIMUM 80 sign — FIXED 2026-08-18

Both `maximum-speed-50` and `maximum-speed-80` mapped to designation `RB-1`,
and `OFFICIAL_CROPS` held a single `RB-1` → `RB-1.png`, which shows
**MAXIMUM 80**. `officialCropFor()` resolved by designation alone, so the
50 km/h sign displayed an 80 sign — reaching a learner through question
`signs-reg-013`, whose every answer choice is about 50 km/h.

Resolved: a 50 km/h image (`RB-1A.png`) was supplied, and artwork now resolves
through `cropKeyFor()` (`src/signs/cropKey.ts`), shared by the app, the
gallery, the content validator and the content-version digest. Both variants
keep official designation RB-1 — the Regulations define RB-1 and no RB-1A — and
are told apart by `variant` plus the `asset` key. Pinned by
`tests/sign-fidelity.test.tsx`. See `docs/REMAINING_SIGN_ASSET_AUDIT.md`.

### 2. RC-6 and RC-6 (optional) artwork looks swapped

Section 8 describes `RC-6` as the symbol-only seat belt sign ("a green circle
circumscribing a black arrow symbol of a seated person wearing a seat belt")
and `RC-6 [(optional)]` as the version that additionally carries "block capital
black letters". The files are the other way round: `RC-6.png` is the
"PROVINCIAL LAW / SEAT BELT USE REQUIRED" lettered sign and
`RC-6 (OPTIONAL).png` is the symbol only. The names describe what each file
actually shows ("Seat Belt Use Required — Provincial Law" and "… — Symbol
Only"), so the gallery is honest either way, but the designation-to-file
mapping should be confirmed against the Schedule.

### 3. RC-4L / RC-4R — the suffix is the mounting side, not the arrow

`RC-4L.png` carries a **right**-pointing arrow and `RC-4R.png` a **left**-pointing
one, which is consistent with the Schedule requirement that the arrow "points
toward the roadway" — the suffix names the side the sign is mounted on. Named
by the visible arrow ("Stop Line — Arrow Pointing Right/Left") so the reviewer
can match picture to name; noted here because the names look inverted next to
the designations. Every other L/R pair in the Schedule follows the opposite
convention, where the suffix matches the depicted direction.

### 4. RB-15 "No Turns" sits inside the "Restrictive turn control" group

The Schedule groups RB-15 with RB-14L/R and RB-15A as "restrictive turn
control" signs, and the artwork is a green circle around a straight-ahead
arrow — literally "proceed straight only". The Handbook names this sign
**"No Turns"** for learners and the project already carries `no-turns` → RB-15,
so that name is kept and pinned by test. The sibling designations use the
Schedule group name to stay distinguishable from the black-and-white overhead
lane-control arrows, which take the plain "Left Turn Only" style names.

### 5. RB-1 is named "Maximum Speed" while two app ids name a speed

`RB-1` (the designation) is "Maximum Speed"; the app ids `maximum-speed-50` and
`maximum-speed-80` keep their specific values. That is deliberate — the numeral
is variable per the Regulations. Since the fix in item 1 the two app ids resolve
to different images, and each gallery card shows a `Variant` row (`50 km/h` /
`80 km/h`) next to the shared designation, so the pair is unambiguous to review.

## How the name participates in approval

The canonical display name is part of the approval fingerprint:

```
PNG:  sha256( appId | designation | assetPath | sha256(PNG bytes) | name:<normalised name> )
SVG:  sha256( appId | variant     | <rendered markup>             | name:<normalised name> )
```

`normaliseSemanticName()` (`scripts/lib/sign-visuals.ts`) applies NFKC, folds
every dash-like character to `-`, folds smart quotes, collapses whitespace runs,
trims and lowercases. So:

- re-capitalising, re-spacing or swapping an em dash for a hyphen **keeps** the
  approval valid;
- changing "Right Turn Only" to "Left Turn Only" **invalidates** it, and the
  visual returns as `CHANGED — RE-REVIEW REQUIRED`.

`pnpm signs:approval:check` reports the reason as "Canonical sign name changed
since approval" and prints the approved name next to the current one.

Approval records are schema v2. Any record written under v1 — which did not
cover the name — is treated as `changed` and must be reviewed again.
