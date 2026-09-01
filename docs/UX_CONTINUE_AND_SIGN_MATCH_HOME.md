# Continue Learning + Home Sign Match

Completed 2026-08-20. Two focused UX additions: a forward action after a strong
section, and a Sign Match promotion on Home carrying a persisted personal best.

No question content, source, sign taxonomy, artwork, exam configuration or
mastery threshold was changed.

## Completion flow

### Old actions

`src/ui/QuizSession.tsx` is the result screen for Topic Quiz, the Signs drill,
Quick Practice and the three review queues. It is **not** used by the practice
exam, which has its own result screen — so nothing here could reach that flow.

It previously offered:

- **Practise again** (primary)
- **Back to dashboard** (secondary)
- *See what to learn next* → `/learn`

### Strong-result criterion

The repository had no session-level notion of a strong result. Mastery's 0.8 /
0.9 and progression's 0.8 are computed over a topic's whole history, not one
sitting, so reusing them would have meant something different.

**≥ 90% accuracy for the just-finished session**, per the brief's fallback.
Compared as integers — `correct * 10 >= total * 9` — so 9/10 is strong, 89/100
is not, and there is no floating-point edge to argue about.

This is a **UX rule only**. It does not touch Complete, Mastered, retention or
any progression threshold, and the screen never claims a perfect short session
has mastered anything.

### Next-section resolution

`src/engine/learning/sections.ts` holds the whole thing; none of it lives in
JSX. There is no second recommendation engine — the order *is* the order Learn
presents, and the destinations *are* the ones a Learn card links to:

| | Order | Destination |
| --- | --- | --- |
| **Rules** | `RULES_TOPICS`, in declared order | `/study/<topic>` |
| **Road Signs** | the canonical 10-category learner taxonomy | `/signs/gallery?category=<id>` |

The sequence runs Rules first, then the sign categories, matching the Learn
page. Finishing the last Rules topic therefore continues into the first sign
category rather than dead-ending mid-course.

Sign sections use the canonical learner categories from Priority 6C/6E —
"Lane Use & Turns", "School, Pedestrian & Cyclist" — never the historical
sign-question-topic labels. A test asserts the old labels cannot appear.

**Skipping finished sections:** the resolver walks forward and takes the first
section the learner has not already completed, so someone who has worked ahead
is not sent back. If everything after this point is complete it still offers the
immediate next section, so the button never vanishes while sections remain.
Deliberately not adaptive — sequential continuation, nothing more.

### Final CTA hierarchy

Strong result with somewhere to go:

1. **Continue to <Next Section>** — primary, filled
2. **Practise again** — secondary
3. *Back to dashboard* — tertiary link

Weaker result, or a session with no single section:

1. **Practise again** — primary
2. **Back to dashboard** — secondary

The destination is always named ("Continue to Right of way"), never a bare
"Next", which also gives the button a self-describing accessible name.

### Final-section behaviour

`nextLearnSection` returns `null` after the last sign category, and the screen
falls back to the ordinary actions. There is no broken or dangling Continue.

The same happens for a session that spans no single section — Quick Practice and
the review queues pass no `section`, so continuing is never offered there.

## Sign Match Home card

### Placement

Between the stats bento and the Focus-next block: after the primary
continue-learning hero and the progress summary, before the lower-priority
follow-on links. The hero is untouched and stays at the top.

### Copy

```
[STOP]  Sign Match                          0
        Match signs to their names   BEST STREAK
```

Deliberately in Home's compact secondary-row vocabulary rather than a second
hero — flat surface, no accent fill, a stat instead of a progress bar — so it
never competes with the learning CTA or reads like the practice exam.

### Best-streak display

Always shown, including `0` for a learner who has never played, so the card does
not appear and disappear. The Sign Match screen itself also shows `Best N`
beside the live streak once a record exists.

### A note on size

> **Superseded.** The compact 44px treatment described here was replaced by a
> feature panel — see *Sign Match Feature Panel Refresh* at the end of this
> document. It is kept for the record because it explains why the first version
> looked the way it did.

Home fitting inside 390×844 and 375×812 **without scrolling** was a product
requirement enforced by `e2e/mobile-viewport.spec.ts`, and Home had only ~39px
of slack at 375. The card was therefore a 44px row with no top margin, which is
what that budget allowed.

## Persistence

| | |
| --- | --- |
| **Field** | `Engagement.signMatchBestStreak?: number` |
| **Location** | the existing engagement envelope in `learnerStorage` — no new key, no separate store |
| **Default** | `0` |
| **Written** | only when the current streak beats the stored record |
| **Schema version** | unchanged — the field is optional |

Writes happen **as the streak grows**, not at the end of a session, because the
learner may leave via Back, the bottom navigation or by closing the app. By the
time they leave, the record is already safe. An answer that does not set a new
record performs no write at all — a test asserts the store object is
referentially unchanged in that case.

Everything else about the game stays ephemeral: current score, current streak,
missed count, recent-target history and the round in progress all reset on
reload. *Persist the achievement, not the session.*

**Backward compatibility:** `normaliseEngagement` already spreads a default
base, and now coerces the field explicitly — a save written before the field
existed, or one carrying a malformed value, loads as `0` rather than failing the
restore. No migration, no destructive change.

**Backup / restore:** engagement is already part of the backup envelope, so the
record is included automatically. Regression tests confirm a backup contains it,
a restore reinstates it, and a backup written without the field still restores.

**Reset:** the field lives in engagement, so the existing reset installs
`emptyEngagement()` and clears it along with XP. No second reset control was
added.

## Formal progress isolation

Sign Match still writes **nothing** to the formal learner record. The Priority
6F guarantee is intact and has been extended: the regression test now also
asserts that of the whole engagement object, **only** `signMatchBestStreak` may
change — XP, the daily log and the goal are untouched, so the game cannot feed
the motivational economy without earning it.

Unchanged by playing: question `seen` and attempt history, topic accuracy,
Complete, Mastered, medals, `recommendedNextTopic` and every Progress-page
metric.

Showing or using **Continue** likewise changes nothing by itself; only the
ordinary answer recording that already happened during the session does.

## Mobile QA

Screenshots in `test-results/continue-home/`.

| Screen | Viewport | Result |
| --- | --- | --- |
| Completion | 390 × 844 | All three actions visible, Continue dominant |
| Completion | 320 × 568 | Actions stack; Continue stays the filled primary |

Home's viewport behaviour changed with the panel refresh — see the table in
*Sign Match Feature Panel Refresh* below for current figures.

Dark mode: sign artwork sits on a fixed white plate in both schemes and is never
tinted, filtered or inverted.

## Tests

**`tests/continue-sections.test.ts`** (13):
threshold is 90% with integer comparison (89/100 out, 90/100 in, 8/9 out, 9/9
in); an empty session is not strong; a strong session implies nothing about
Mastered; Rules order then canonical sign-category order; canonical labels only;
each section's destination matches its Learn card; Rules → next Rules; last
Rules → first sign category; sign category → next canonical category; no target
after the final section; unknown section resolves to nothing; a completed
following section is skipped; the immediate next section is still offered when
everything ahead is done.

**`tests/sign-match-best-streak.test.ts`** (14):
starts at 0; takes a new record; keeps 8 when a later run reaches 6; raises 8 to
9; a wrong answer resets the current streak but not the record; an equal streak
performs no write; NaN/Infinity/negative ignored; a real run of answers tracks
correctly; a legacy payload loads as 0 without losing its other fields; a stored
record round-trips; malformed values are repaired; backup contains the record;
restore reinstates it; a backup without the field still restores.

**`tests/sign-match-no-progress.test.tsx`** (6, one added):
the existing isolation guarantees, plus the new assertion that only the record
changes in engagement.

**`e2e/continue-and-home-match.spec.ts`** (9 × 2 viewports):
Home shows the card and links to `/signs/match`; fresh state shows 0; a
deterministically-built streak appears on Home and survives a reload; the hero
stays above the card and above the fold; no overflow at 320; a strong section
offers a named primary Continue that opens the right destination; a weak session
withholds it and keeps Practise again plus Back to dashboard; a mixed Quick
Practice session offers no Continue; the completion screen reads cleanly at 320.

**`e2e/continue-home-shots.spec.ts`**: visual evidence, `shots` project only.

One existing fixture in `tests/learner-storage.test.ts` was updated: it
deep-equals a full engagement object, so it now carries the new field's default.
Legacy-payload behaviour is covered by the new tests above, so no coverage was
lost.

## Verification

| Gate | Result |
| --- | --- |
| `pnpm lint` | 0 errors (3 pre-existing warnings) |
| `pnpm typecheck` | clean |
| `pnpm content:validate` | 0 errors, 61 warnings — unchanged |
| `pnpm content:quality` | reports written |
| `pnpm content:syllabus` | unchanged |
| `pnpm content:progression` | 31 topics, 0 Complete unreachable, 0 Mastered unreachable |
| `pnpm sources:check:ci` | 0 errors |
| `pnpm signs:approval:check` | 232 approved, 0 changed, 0 broken |
| `pnpm signs:audit` | pass |
| `pnpm signs:learner-audit` | 80 / 75 / 22 / 55, 80/80 Core assessed, 0 gaps |
| `pnpm test` | 536 passed, 29 files |
| `pnpm test:e2e` | 228 passed |
| `pnpm verify` | **exit 0, green** |

---

## Sign Match Feature Panel Refresh

Completed 2026-08-20. Sign Match is a feature worth discovering, so it now looks
like one.

### Old compact treatment

A 44px navigation-style row: a 30px sign thumbnail, the words "Sign Match", one
line of copy, and a small right-aligned number. It read as another menu entry
rather than an activity, and it was that size for one reason — Home was required
to fit entirely inside 390×844 and 375×812, and had ~39px of slack.

### Changed Home viewport philosophy

That requirement was the artificial constraint winning over the product, so it
has been deliberately replaced:

> The primary Home learning action and the essential progress context must be
> visible in the first viewport. Secondary feature content may extend below the
> fold. Home should stay compact and avoid unnecessary scrolling, and must never
> scroll horizontally.

The question screens keep the original whole-page no-scroll rule — nothing about
their guarantee changed.

### Updated E2E rule

`e2e/mobile-viewport.spec.ts`: Home left the whole-page height sweep (a
`FIT_ASSERTED` set now names the screens still held to it) and gained
`Home first viewport at <size>`, run at 390×844, 375×812 **and** 320×568. It is
a stronger test than the one it replaces, because it checks what the learner can
see and reach rather than a page height:

1. no horizontal scrolling;
2. the learning hero is **fully** inside the first viewport;
3. the progress bento starts above the fold;
4. the Sign Match panel is reachable and can be read clear of the bottom nav;
5. Home is still compact — total height under two viewports.

Home is still measured and written to the viewport report; only the height
assertion moved.

### New visual hierarchy

1. Continue / recommended learning (unchanged, still dominant)
2. Progress ring and stats (unchanged)
3. **Sign Match feature panel**
4. Focus next and lower-priority content

The panel is the strongest secondary feature and never competes with the study
path: it sits below both, and its CTA is a pill inside a card rather than a
full-width hero action.

### Final copy

```
SIGN MATCH
Think you know your road signs?
Choose the sign that matches the name.
[ Play Sign Match ]
```

Confident, not challenge-bait. The stat stays "Best streak" rather than "High
score", because the persisted metric is specifically consecutive correct
answers.

### Decorative artwork

Two approved Core signs through the canonical `SignArt` resolver — no new
assets, no duplicate mappings, no artwork changes:

| Role | Sign | Why |
| --- | --- | --- |
| Front, larger, rotated −5° | `stop` | The most recognisable shape and colour in the set |
| Behind, smaller, rotated +7° | `slippery-when-wet` | A warning diamond gives a second shape and colour |

They overlap on a soft tinted disc for depth. Both are fixed, not random, and
both are `aria-hidden` — they are scenery, not a quiz round. Plates stay white
in both colour schemes so the Province's images are never tinted, filtered or
inverted.

### Best Streak treatment

A small floating capsule at the bottom-right of the illustration, on the app's
own surface colour with a pill radius, overlapping the artwork block without
covering a sign face. A learner who has never played sees `0` — the app's
existing numeric-stat convention (medals and XP both show `0`), and no
achievement language is implied.

### Colour and depth

The panel uses the existing `--cat-warning-soft` token: a pale cream in light
mode and a deep warm brown in dark. These are separately authored token values,
not a darkened copy of the light one, so the artwork stays clean on both. Depth
comes from a restrained card shadow, a slightly stronger shadow under the CTA
and the sign plates, and the overlapping composition — no glassmorphism.

Radius is `--radius-lg` (22px), the established family's large step, one level
above ordinary cards.

### Interaction semantics

The whole panel is a single `<Link>` with an internal *visual* CTA — no nested
interactive controls. Its accessible name comes from the visible copy, so it
announces "Sign Match … Choose the sign that matches the name. Play Sign Match.
0 Best streak", and voice control users can say "click Play Sign Match". Only
the artwork and the disc are hidden from assistive technology.

### Mobile behaviour

| Viewport | Panel | Home scrolls |
| --- | --- | --- |
| 390 × 844 | Full composition: eyebrow, headline, supporting line, CTA, two signs, disc, record | ~115px below the fold |
| 375 × 812 | Same feature treatment, unchanged | ~145px |
| 320 × 568 | Simplified: supporting line and second sign dropped, record moved below the sign, **full-size CTA kept** | ~355px |
| Desktop | Illustration gains a little width (148px); the panel keeps Home's reading column | none |

In every case the hero and the progress bento remain fully inside the first
viewport, and there is no horizontal scrolling.

### What did not change

Best-streak persistence, write frequency, reset, backup/restore and the
engagement schema are all untouched. Sign Match gameplay — round generation, the
Core/Reference pool, distractor rules, session scoring and progression isolation
— is untouched. Formal progress remains unaffected.
