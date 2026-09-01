# Priority 6D — Signs Hub Refresh

Completed 2026-08-19. The Signs hub now describes the learner's **study
catalogue** first and the assessment system second.

No sign artwork, name, mapping, fingerprint or approval record was touched, no
questions were authored, and the learner scope split stays at 80 / 75 / 22 / 55.

## Problem

The hub's `BY CATEGORY` grid was built from the **question topics**
(`SIGNS_TOPICS`), not from the learner catalogue that Priority 6B and 6C
established. Each card showed the number of question records in a same-named
question topic, and drew its thumbnails from whatever signs those questions
happened to reference.

That was invisible while the gallery *was* the question bank. Once the catalogue
grew to 155 signs it became actively misleading: the top of the same screen said
"Browse 155 signs" while the grid underneath described a 105-question bank using
a taxonomy that no longer existed.

The worst case was Lane Use & Turns — the largest category in the catalogue at
56 signs — advertising itself as **"Lane use signs — 3 questions"**.

## Before

| Card shown | Metric shown | Actual catalogue |
| --- | --- | --- |
| Regulatory signs | 22 questions | 21 signs |
| Warning signs | 24 questions | 23 signs |
| School signs | 4 questions | *(merged into a 15-sign category)* |
| Pedestrian and cyclist signs | 3 questions | *(merged into a 15-sign category)* |
| Work zone signs | 20 questions | 17 signs |
| Guide and information signs | 5 questions | 3 signs |
| **Lane use signs** | **3 questions** | **56 signs** |
| Railway signs | 7 questions | 3 signs |
| Pavement markings | 10 questions | 4 signs |
| Sign shapes | 7 questions | 6 signs |
| *(absent)* | — | Parking & Stopping, 7 signs |

A `COMPLETE` badge also appeared per card, derived from `topicMastery` on the
question topic.

## New model

Three quantities that the old card conflated are now kept apart:

```
learner category  (learner-categories.json — canonical, from Priority 6C)
        │
        ├─ catalogue concepts ──▶ catalogueCount   ← the card's headline
        │        │
        │        ├─ Core ───────▶ coreCount
        │        └─ Reference ──▶ referenceCount    ← study material only
        │
        └─ Core concepts with questions ──▶ assessedCount   ← secondary metadata
                 │
                 └─ their questions ──▶ questionCount, attempts, accuracy
```

`src/engine/learning/signCategories.ts` derives all of it via
`signCategorySummaries(pool, progress)`. The component holds no category list,
no counts and no calculation — category identity, order and membership come
from the canonical taxonomy, so the hub cannot drift from the catalogue again.

**Reference signs contribute to `catalogueCount` and to nothing else.** They
never enter an assessment denominator, so a learner is never told they are
behind on material nothing tests.

## Categories

| Category | Catalogue Signs | Core | Reference | Assessed Core | Practice Questions |
| --- | ---: | ---: | ---: | ---: | ---: |
| Regulatory | 21 | 13 | 8 | 13 | 13 |
| Lane Use & Turns | 56 | 6 | 50 | 6 | 6 |
| Parking & Stopping | 7 | 2 | 5 | 2 | 2 |
| Warning | 23 | 23 | 0 | 23 | 23 |
| School, Pedestrian & Cyclist | 15 | 3 | 12 | 3 | 3 |
| Railway | 3 | 3 | 0 | 3 | 3 |
| Work Zones | 17 | 17 | 0 | 17 | 17 |
| Guide & Information | 3 | 3 | 0 | 3 | 4 |
| Pavement Markings | 4 | 4 | 0 | 4 | 4 |
| Sign Shapes | 6 | 6 | 0 | 6 | 6 |
| **Total** | **155** | **80** | **75** | **80** | **81** |

Practice questions total 81 rather than the 105 sign-section questions, because
24 sign questions are not tied to a single `signId` (comparison and
rule-application items). That is expected, and it is precisely why question
count is not shown on the card.

## UI changes

**New cards.** All ten canonical categories, in taxonomy order. Parking &
Stopping appears for the first time.

**Removed stale cards.** `School signs` and `Pedestrian and cyclist signs` are
replaced by the unified `School, Pedestrian & Cyclist`. `Lane use signs — 3
questions` is gone.

**Retired presentation config.** The hub's own `CATEGORY_TONE` map keyed by
question topic, and `thumbnailsFor()`, which mined thumbnails out of the
question bank. The unused `.category-badge` CSS rule went with the badge. The
question topics themselves (`SIGNS_TOPICS`, `TOPIC_LABELS`) are untouched —
progression, the learning path and the Learn screen still use them.

**Metadata hierarchy.** Card copy is now `21 signs · 13 assessed`, with
`· 72% correct` appended only once that category's questions have at least three
recorded attempts. A short standing note under the grid explains what the two
numbers mean.

**Representative artwork.** Three per category, curated explicitly in
`REPRESENTATIVE_SIGNS`. This is the one thing the UI chooses rather than
derives: automatic selection produced strips of three near-identical arrow
variants. Selection favours recognisable signs, prefers Core where that still
represents the category, and avoids visual repetition. Lane Use & Turns
deliberately includes one Reference roundabout sign (`RB-102`), because the
roundabout family is 11 of that category's 56 signs and none of them is Core —
a Core-only strip would misrepresent what is in there.

**Navigation.** A card opens the catalogue filtered to its category:
`/signs/gallery?category=lane-use`. No separate practice action was added — the
app cannot generate practice by learner category without engine work, and §16
is explicit that this task should not expand into that.

**Section heading.** `By category` → `Browse the catalogue`, so the grid reads
as the way into the 155-sign catalogue rather than a list of quiz topics.

## Progress

**The `COMPLETE` badge was removed rather than transplanted.**

It previously came from `topicMastery` on a question topic. A learner category
spans several question topics and, in the Lane Use case, contains 50 signs that
no question assesses — so a badge derived from question-topic mastery would have
claimed a 56-sign category was "complete" on the strength of six questions.
Deriving an honest category-level completion would have meant inventing a new
notion of completeness over Core concepts, which §18 warns against and which
would need persisted state this task must not add.

What the card shows instead:

| Metadata | Meaning |
| --- | --- |
| `N signs` | Study concepts in the catalogue for this category — Core plus Reference |
| `N assessed` | Core concepts in this category that practice questions cover |
| `N% correct` | Accuracy over recorded attempts on those questions, shown only at ≥ 3 attempts |

Unattempted questions are never counted as incorrect, and a category with no
attempts shows no percentage at all. Reference signs affect none of it.

The header block keeps its existing question-based progress but its sub-line now
reads `N of M practice topics complete` rather than "categories", so it cannot be
read as a count of the ten catalogue categories below it.

## Data-integrity defect found

`learner-scope.json` records a generated `inQuiz` flag per sign. It had gone
stale: **`shape-yield` was marked `inQuiz: false` despite having a question**,
added after the file was generated. The catalogue page consequently reported
"79 of 155 signs are assessed" when the true figure is 80.

Two things were done:

1. The flag was corrected (`false` → `true`). The 80 / 75 / 22 / 55 scope split
   is unchanged — `inQuiz` is a derived field, not a scope classification, and
   `signs:learner-audit` already computed assessment coverage live, which is why
   it kept reporting 80/80 correctly throughout.
2. `signCategorySummaries` derives assessed counts from the **live question
   bank**, never from the stored flag, so this cannot silently recur. A test now
   asserts the stored flag agrees with the question bank for every Core sign.

## Artwork defect found

Two hub thumbnails rendered the ⚠️ fallback: `RB-102` and `RB-37`, both approved
Reference signs whose App ID is a Schedule designation and which therefore have
no `sign-meta` row.

The cause was in the Priority 6C guard in `SignArt`, which required *both*
artwork and an accessible name before rendering. A decorative sign is rendered
with `alt=""` and hidden from assistive technology, so it needs artwork but no
name — and a decorative caller has no reason to pass a label it will never
render. The guard now only demands a name when the artwork is not decorative.
Two regression tests cover both directions.

## Mobile / desktop QA

Screenshots in `test-results/signs-hub/`, light and dark at every required
width.

| Viewport | Result |
| --- | --- |
| 1280 × 900 | Two columns, cards comfortable, hub stays within the 720 px reading column |
| 390 × 844 | Single column, full-width cards, 56 px thumbnails, labels on one or two lines |
| 375 × 812 | As above, no overflow |
| 320 × 568 | Single column, `School, Pedestrian & Cyclist` still fits, thumbnails ≥ 40 px |

Horizontal overflow is asserted ≤ 1 px at every width by the shots spec, and
again at 320 px by the gating spec. Bottom-navigation clearance is unchanged —
no page padding was altered.

Dark mode: card tints use the existing `--cat-*-soft` tokens; sign artwork sits
on a fixed white plate in both schemes and is never filtered, tinted or
inverted.

## Accessibility

Each card is a single link with an accessible name that carries the navigation
context — for example `Lane Use & Turns, 56 signs · 6 assessed`. The visible
title and metadata inside the card are `aria-hidden`, so the name is announced
once rather than three times, and the three thumbnails are decorative
(`decorative`, `alt=""`) so a screen-reader user is not read three sign
descriptions before reaching the category name.

## Tests

`tests/sign-categories.test.tsx` — 25 tests:

- summaries cover exactly the canonical taxonomy, in declared order
- **catalogue counts sum to 155; Core to 80; Reference to 75**
- catalogue count equals Core + Reference in every category
- per-category counts match `learner-categories.json`
- Variants and Developer-only visuals are excluded from the totals
- assessed counts sum to 80 and never exceed Core
- **the stored `inQuiz` flag agrees with the live question bank**
- question count is never below assessed count
- no accuracy is reported when nothing has been attempted
- Lane Use & Turns is 56 signs / 6 Core / 50 Reference / 6 assessed
- every category has 1–3 representatives, each in the right category, none
  Developer-only or unknown, all resolving to approved artwork, at least one
  Core where available, and deterministic across calls
- the hub renders ten cards, labels Lane Use & Turns `56 signs · 6 assessed`,
  gives Parking & Stopping its own card, shows no `School signs` /
  `Pedestrian and cyclist signs` / `Lane use signs`, never prints "question" in
  a card, links every card to its filtered catalogue URL, and agrees with the
  catalogue call-to-action about the total

`tests/sign-artwork.test.tsx` — 2 added: decorative artwork renders for a sign
with no `sign-meta` row; a non-decorative one still falls back.

`e2e/signs-hub.spec.ts` — 9 tests × 2 viewports: ten cards, catalogue-size copy,
the Lane Use regression, Parking & Stopping plus the merged card, stale cards
absent, headline total reconciles with the sum of the cards, 30 thumbnails
render with no broken images and no ⚠️, deep link filters the catalogue and
Back returns to the hub, and no overflow at 320 px.

`e2e/signs-hub-shots.spec.ts` — visual evidence, `shots` project only.

## Verification

| Gate | Result |
| --- | --- |
| `pnpm content:validate` | 0 errors, 62 warnings |
| `pnpm content:quality` | reports written |
| `pnpm content:syllabus` | 297 active questions — unchanged |
| `pnpm content:progression` | 31 topics, 0 Complete unreachable, 0 Mastered unreachable |
| `pnpm sources:check:ci` | 21 unchanged, 0 errors |
| `pnpm signs:approval:check` | 232 approved, 0 changed, 0 broken |
| `pnpm signs:audit` | pass |
| `pnpm signs:learner-audit` | 80 / 75 / 22 / 55, 155/155 artwork, 80/80 Core assessed, 0 gaps |
| `pnpm test` | 440 passed, 24 files |
| `pnpm test:e2e` | 165 passed |
| `pnpm verify` | **exit 0, green** |
