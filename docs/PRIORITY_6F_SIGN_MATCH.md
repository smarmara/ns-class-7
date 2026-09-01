# Priority 6F — Sign Match

Completed 2026-08-19. Adds an endless two-choice sign recognition game, and
makes the 22 Variant visuals discoverable under the catalogue concepts they
belong to.

No artwork, sign name, mapping, fingerprint, approval record, question or
progression rule was changed.

## Product behavior

Read a sign's name, pick its artwork out of two, see the answer, keep going.

```
   "Keep Right Except to Pass"

   [ SIGN A ]      [ SIGN B ]
        ↓
   Correct. / Not quite. The correct sign is …
        ↓
      [ Next ]  →  new round, forever
```

There is no round limit, no timer, no lives and no losing state. The session
ends when the learner leaves the screen. Entering the route deals a playable
round immediately — the pool and category selectors sit above it as optional
controls, not a setup step.

## Inventory

| | Count |
| --- | ---: |
| Approved visuals | 232 |
| Core learner concepts | 80 |
| Reference learner concepts | 75 |
| Top-level learner catalogue | **155** |
| Variant visuals | 22 |
| Developer-only visuals | 55 |
| **Sign Match eligible targets** | **155** (80 Core + 75 Reference) |

`232 − 155 = 77 = 22 Variants + 55 Developer-only.` Nothing is missing; the 77
are grouped children and intentionally excluded specialist artwork.

## Pool policy

| Scope | In Sign Match | Why |
| --- | --- | --- |
| **Core** (80) | Yes | Assessed study concepts |
| **Reference** (75) | Yes, in the default pool | Learner-visible study material |
| **Variant** (22) | **No** | See below |
| **Developer-only** (55) | **Never** | Out of Class 7 scope since Priority 6A; not in the learner catalogue at all, so excluded by construction |

### Why no Variants in the game

All 22 Variant visuals turned out to be **supplementary tab plates** — "All
Way", "4-Way", "Except Bicycles", "Reserved Lane Begins", "Time Tab", "Ends
Tab". Their names do not identify a sign on their own: a prompt reading
*"Ends Tab"* has no single right answer, and several of them are visually near
identical to one another.

Brief §6 allows variants as targets "only where their learner-facing meaning is
uniquely identifiable". None of these 22 clears that bar, so the eligibility
rule is simply *top-level catalogue concepts only*, enforced by construction
rather than by an exception list.

Two selectable modes:

- **All study signs** (default) — 155 targets
- **Assessed signs** — the 80 Core concepts

Neither is called "On test" or "Exam signs": official test probability has not
been established at that granularity.

## Round generation

`src/engine/signmatch/rounds.ts` — all logic sits outside the route component.

1. Pick a target from the eligible pool, skipping the last 8 targets when
   alternatives exist.
2. Pick a distractor: **same learner category first**, falling back to the whole
   pool, and rejecting anything the ambiguity guard flags.
3. Randomise which side holds the target.
4. Return an immutable round.

If twelve attempts cannot produce a clean pair the generator returns `null` and
the screen says so, rather than relaxing the rules to fill the slot. A category
with only one usable sign disables itself instead of serving pairs where both
answers are right.

The RNG is injectable (`Rng` from `src/engine/random.ts`), so every test is
deterministic rather than probabilistic.

Measured across 200 seeded rounds, **over 90% of distractors come from the
target's own category**.

## Ambiguity prevention

`isAmbiguousPair(a, b)` rejects a pairing when:

| Rule | Catches |
| --- | --- |
| Same id, or identical artwork | Trivially unanswerable |
| One name contains the other as a whole phrase | "Pedestrian Crosswalk" vs "Pedestrian Crosswalk — Symbol Facing Right"; "No Left Turn" vs "No Left Turn on Red"; "School Crosswalk" vs its right-facing sibling |
| Same official designation | Numeric or lettered variants of one Schedule sign — "Maximum Speed 50" and "Maximum Speed 80" are both `RB-1` |
| Small documented exception list | Cases the data cannot express structurally |

The exception list currently holds **one** pair: `stop` against `RA-1B`
(bilingual Stop / Arrêt). Both are octagonal red stop faces, so a prompt of
"Stop" leaves both defensible — and the bilingual sign's name does not contain
"Stop" as a leading phrase, so the containment rule misses it.

A test generates 400 seeded rounds and asserts none of them is ambiguous.

Pairs the guard deliberately **allows**, because they are the point of the
game: No Parking against No Stopping, No Left Turn against No Right Turn,
Left Turn Only against Straight or Right Turn, and lane-control diagrams
against each other.

## Session model

Score is `N correct · N missed`, with a streak chip appearing from 2 onwards.
There is no health, no lives and no failure limit.

**Nothing is persisted.** Score, streak and the recent-target buffer live in
component state; a refresh or a remount starts a fresh session. No schema
change, no migration, no new storage key, no analytics.

The Sign Match streak is local to the game and is deliberately not wired to the
app's learner streak.

## Progression

**Sign Match writes nothing to the formal learner record.** It never calls
`recordAnswer`, never touches `progress.questions` or `progress.attempts`, and
derives its rounds from the learner sign catalogue rather than the question
bank.

`tests/sign-match-no-progress.test.tsx` proves it by playing full sessions
containing both correct and incorrect answers and then asserting:

- the whole progress object is deep-equal to a clone taken beforehand
- no question gained a `seen` entry and no attempt was logged
- `recordAnswer` was never called (spy)
- `topicMastery`, `allMedals`, `courseProgress` and `recommendedNextTopic` all
  return exactly what they returned before
- a remount resets the score, confirming nothing was persisted

An E2E test independently confirms the Signs hub's "N of M sign questions seen"
figure is unchanged after an eight-round session.

## Accessibility

**Before the answer**, a choice must not reveal the sign. Each choice is a real
`<button>` whose accessible name is the sign's `visualDescription` — shape,
colour and symbols — falling back to "Sign option 1 / 2" for the Reference signs
that have no description. The artwork itself is `decorative`, so nothing leaks
through `alt`. This is the same anti-leak pattern the quiz uses.

A unit test asserts no choice label equals any sign's semantic name, and an E2E
test asserts the prompt text appears in neither choice's label, text or `alt`
before selection.

**After the answer**, semantics are fine and useful: a `role="status"`
`aria-live="polite"` region announces *"Correct. This is Keep Right Except to
Pass."* or *"Not quite. The correct sign is …"*, the correct choice is marked in
place, and both buttons are disabled so a round cannot be re-answered.

Keyboard works through native button semantics. Transitions are wrapped in
`prefers-reduced-motion` and no animation is needed to understand the result.

## Variant visibility

Each catalogue card that has related tab plates gains a native `<details>`
disclosure headed **Related signs**, listing each variant's approved artwork and
label. Closed by default, so the grid stays scannable; keyboard-operable and
stateless.

The parent link is **derived from the official designation**, not invented:
Schedule tabs are numbered after the sign they attach to, so `RA-1S4` belongs to
`RA-1` and `RB-80S1` to `RB-80`.

| Parent | Related variants |
| --- | --- |
| `stop` | RA-1S1, RA-1S2, RA-1S3, RA-1S4, RA-1S5 |
| `RB-33` | RB-33S1, RB-33S2 |
| `RB-80` | RB-80S1, RB-80S2 |
| `RB-100` | RB-100S |
| `RB-102` | RB-102S |
| `RB-104` | RB-104S |
| `two-way-left-turn-lane` | RB-48S |
| `R-102` | R-102T |

**14 of the 22 are grouped under 8 parents.** The remaining 8 — `RB-11S1`,
`RB-9S`, `RB-92`, `RB-79T`, `R-103T`, `R-104T`, `R-107`, `R-108` — have no
learner-visible parent designation in the catalogue, so they are left ungrouped
rather than attached to a plausible-looking neighbour. Brief §50 is explicit
that relationships not present in the metadata must not be invented.

**The top-level catalogue count is unchanged at 155.** Variants create no
progression state, appear in no denominator, gain no completion status, and are
not category cards. Developer-only visuals are never surfaced as related signs.

## Mobile QA

Screenshots in `test-results/sign-match/`, light and dark.

| Viewport | Result |
| --- | --- |
| 390 × 844 | Header, score, filters, prompt, both choices, feedback and Next all fit without scrolling |
| 320 × 568 | Artwork field and prompt reduce; touch targets stay ≥ 120px tall; no horizontal scrolling |
| 1280 × 900 | Same layout inside the app's reading column |

Two layout defects were found and fixed while testing:

- `.match-choices` used `1fr 1fr`, which will not shrink below content and
  pushed the pair 25px off a 320px screen. Now `minmax(0, 1fr)`.
- `.match-art` was a grid container, whose auto column sizes to the image's
  max-content — so the artwork kept its full inline width and overflowed by 4px
  on some signs. Now flex, which shrinks. The same latent bug was fixed in
  `.sign-variant-art`.

Both trace to `SignArt` writing an inline `max-width`, which outranks any class
rule; the fix is to give the image an explicit `width: 100%` so it tracks its
container while the inline cap still fixes its upper size.

Dark mode: signs sit on a fixed white plate in both schemes and are never
tinted, filtered or inverted.

## Offline

Every visual comes through the canonical resolver (`getSignArtwork` via
`SignArt`) from `public/signs/`. No image path is constructed by hand, no second
image map exists, and the game fetches nothing over the network. The PWA
precache strategy is unchanged.

## Tests

`tests/sign-match.test.tsx` — 36 tests:

- inventory reconciles: 80 / 75 / 22 / 55 = 232, and 232 − 155 = 22 + 55
- pool is exactly 155, Core-only is exactly 80, category filter narrows correctly
- **no Developer-only and no Variant id can enter the pool**
- every target resolves artwork and has a learner name
- ambiguity guard: rejects self, phrase-containment, shared designation and the
  bilingual stop; accepts genuinely discriminable pairs
- **400 seeded rounds produce no ambiguous pair**
- two distinct choices, exactly one correct, both sides used, artwork always
  resolves, >90% same-category distractors, thin-category fallback, Core-only
  mode honoured
- recent history prevents back-to-back repeats over 60 consecutive rounds
- score: correct increments and grows the streak, a miss resets it, and 50
  consecutive misses reach no losing state
- variant grouping: 8 parents, 14 variants, only Variant-scoped children, no
  Developer-only, all artwork resolves, catalogue still 155
- the screen starts playable with no setup step and leaks no answer

`tests/sign-match-no-progress.test.tsx` — 5 tests, described under *Progression*.

`e2e/sign-match.spec.ts` — 14 tests × 2 viewports: hub entry, no answer leak,
correct and incorrect paths, round locking, 25 consecutive rounds with no
game-over, artwork integrity, Core-only mode, category filter, formal progress
untouched, Back navigation, 320px layout, and the related-signs disclosure with
the catalogue still at 21 regulatory cards and a 155 headline.

`e2e/sign-match-shots.spec.ts` — visual evidence, `shots` project only.

## Verification

| Gate | Result |
| --- | --- |
| `pnpm content:validate` | 0 errors, 61 warnings — unchanged |
| `pnpm content:quality` | reports written |
| `pnpm content:syllabus` | 297 active questions — unchanged |
| `pnpm content:progression` | 31 topics, 0 Complete unreachable, 0 Mastered unreachable |
| `pnpm sources:check:ci` | 24 unchanged, 0 errors |
| `pnpm signs:approval:check` | 232 approved, 0 changed, 0 broken |
| `pnpm signs:audit` | pass |
| `pnpm signs:learner-audit` | 80 / 75 / 22 / 55, 155/155 artwork, 80/80 Core assessed, 0 gaps |
| `pnpm test` | 490 passed, 25 files |
| `pnpm test:e2e` | 200 passed |
| `pnpm verify` | **exit 0, green** |

Content Version is unchanged, correctly: Sign Match adds code, not learner
content data, and the digest covers the question bank and artwork inputs only.
