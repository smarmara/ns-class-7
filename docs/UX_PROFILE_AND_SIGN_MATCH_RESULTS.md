# Profile + Sign Match Results UX

Completed 2026-08-20. Four connected changes: Sign Match became a streak run
with a result screen, its prompts stopped describing the answer, the Home panel
lost its decoration, and Progress became Profile.

No question content, sign scope, artwork, mastery threshold, current-law source
or Mock behaviour was changed.

## Sign Match run model

### Old behaviour

The game was endless: a wrong answer revealed the correct sign, the learner
pressed Next, and another round appeared. Score was `N correct · N missed`, and
there was no point at which a run was "over".

### New behaviour

A session is a **streak run**.

- **Correct** — the streak increments, the record updates if beaten, and Next
  continues the same run.
- **Wrong** — the chosen sign is marked, the correct sign is marked and named,
  and the run is over. There is no Next; the learner moves on with **See your
  run** when they have finished looking at the miss. The teaching moment is not
  cut short by an automatic transition.

### Result screen

```
SIGN MATCH
Streak ended
   3
correct in a row

[ NEW BEST 3 ]        ← or [ Best streak 7 ]

[ Try again ]
[ Close ]
```

No "failed", "game over" or "you lost". A new record is acknowledged with the
existing good tone and nothing louder — no confetti.

A run that dies on its first answer honestly reports **0 correct in a row**.

**Try again** clears the current streak and the round history, deals a fresh
round and stays on Sign Match. It never touches the persisted record.
**Close** goes to `/signs`, the game's parent, rather than relying on history.

### A bug the tests caught

The record is written the moment it is beaten, so that leaving mid-run keeps it.
That meant the stored best already included the current run by the time it
ended, and "new best" could never fire. The result now compares against the
record **as it stood when the run began** (`runStartBest`).

### Session stats

Simplified to `Streak N` and `Best N`. The correct/missed tally was removed: a
run ends on the first miss, so a missed count could only ever be 0 or 1.

Persistence is unchanged — `signMatchBestStreak` in engagement, written only on
a new record. Sign Match still mutates no formal progress.

## Prompt-name cleanup

### The audit

All 155 targets were audited. **55 carry an em-dash suffix**, and the obvious
rule — drop everything after `" — "` — is wrong: it would collide **48 targets
across 15 groups**.

| Collapsed prompt | Targets |
| --- | ---: |
| Roundabout Lane | 10 |
| Two-Lane Control | 11 |
| Restrictive Turn Control | 3 |
| Reserved Lane / Reserved Bicycle Lane / …Three or More Vehicle Types | 6 |
| Stop Line, Hazard Marker, Overhead Pedestrian Crosswalk, Shared Sidewalk Organization, No Lane Change | 10 |
| Pedestrian Crosswalk, School Crosswalk, No Parking, No Stopping | 8 |

More importantly, most of those suffixes **are the rule being tested**: "Keep
Left" against "Keep Right", "Left Exit Only" against "Through Only", "Times
Shown" against a plain prohibition. Removing them would not remove a hint, it
would remove the question.

### The rule

A suffix is only a giveaway when it names the artwork's *geometry* rather than
its meaning. `signMatchPromptLabel` strips the suffix only when it is one of
`octagon`, `diamond`, `pentagon`, `inverted triangle`, `vertical rectangle`,
`horizontal rectangle` — **and** the shortened label stays unique.

**Six labels shortened**, all Sign Shapes:

| Catalogue name | Sign Match prompt |
| --- | --- |
| Stop Sign Shape — Octagon | Stop Sign Shape |
| Yield Sign Shape — Inverted Triangle | Yield Sign Shape |
| Warning Sign Shape — Diamond | Warning Sign Shape |
| School Zone Sign Shape — Pentagon | School Zone Sign Shape |
| Regulatory Sign Shape — Vertical Rectangle | Regulatory Sign Shape |
| Guide Sign Shape — Horizontal Rectangle | Guide Sign Shape |

These stay entirely playable — §19's concern. "Warning Sign Shape" is answered
by knowing a warning sign is a diamond, which *is* the concept. What it no
longer does is print the answer in the prompt.

**Explicit overrides: none.** The map exists and is documented as the escape
hatch, but the audit found no target needing one. **Exclusions: none** — the
pool stays at 155.

Canonical names in `learner-scope.json` and `sign-names.json` are untouched. The
full catalogue name is still revealed after answering, via the round's
`answerName`.

## Home Sign Match

**Removed:** the white rounded-square plate behind each sign, and the large
decorative circle behind the warning sign.

**Now:** the two approved signs sit directly on the cream feature surface,
slightly overlapping and slightly rotated, lifted only by a `drop-shadow` that
follows each sign's own silhouette. The artwork itself carries `filter: none` —
nothing is tinted, recoloured or inverted.

**Best streak moved** off the artwork and into the action row, beside the CTA:

```
[ Play Sign Match ]   Best streak 12
```

Label and value share one horizontal line, vertically centred with the button.
On phones the illustration yields width (136 → 84 → 72 px) so the pair stays on
one line down to 375 px; below about 360 px it wraps gracefully, which §30
permits. The tap target is never reduced.

The eyebrow, headline, supporting copy and CTA are unchanged.

## Profile

| | |
| --- | --- |
| **Nav label** | Progress → **Profile** |
| **Nav icon** | `faUser` (Font Awesome Classic Regular), bundled locally — no network |
| **Canonical route** | `/profile` |
| **Old route** | `/progress` redirects to `/profile`, so bookmarks keep working |
| **Heading** | "Profile"; the old "How far along you are…" subtitle is gone |

Page order: **Profile card → "Your progress" heading → existing progress
content**, unchanged below the card.

### Local learner profile

A display name and nothing else. A fresh learner sees an avatar placeholder,
"Create your profile", and a **Create profile** button. Once set, the name shows
with an **Edit** button — renaming never requires deleting anything.

The avatar is derived locally: one initial for a single name, two for more. No
photo upload, no avatar service.

**There is no account, no sign-in, no email, no password, no backend, no cloud
sync and no analytics.** The name is stored in the same on-device envelope as
progress.

## Appearance

Automatic / Light / Dark, as an accessible `radiogroup` — selection is carried
by `aria-checked`, never by colour alone.

The palette lives entirely in CSS. The choice writes `data-theme` on `<html>`;
**Automatic writes nothing**, leaving `prefers-color-scheme` in charge, which is
why the app follows a system change live with no listener and no reload.

`src/styles.css` now resolves the dark palette in three states:

```css
@media (prefers-color-scheme: dark) {
  :root:not([data-theme='light']) { … }   /* Automatic */
}
:root[data-theme='dark'] { … }            /* Explicit */
```

The two token lists are necessarily duplicated — CSS cannot share a declaration
block across at-rule contexts — so `tests/profile.test.tsx` asserts they stay
identical.

The preference is stored under its own key (`ns-class7:appearance`), not in the
learner envelope: it is a device setting, restoring a backup onto another device
should not change that device's appearance, and it must be readable before React
mounts to avoid a flash of the wrong theme.

## Achievements

Read from the **existing medal system** (`allMedals`) — nothing new is minted.
The card shows an earned count and up to six earned medals as chips. A fresh
learner sees "None yet — complete a topic to earn your first"; an unearned medal
is never rendered.

Detailed progress — course completion, mastery, strongest and weakest topics,
Recommended next, the full medal board — stays in the progress section below.

## Progress

Semantics untouched: the 31-topic denominator, Complete, Mastered, the
course-progress calculation and `recommendedNextTopic` are all unchanged.

### Spacing fix

`.progress-hero` had no bottom margin and `.focus-next` no top margin, so the
two cards' shadows touched. This was a parent-layout gap, not internal padding —
fixed with `margin-bottom: var(--space-4)` (16px) on the hero, the standard
section gap. An E2E test asserts the measured gap sits between 10 and 28 px.

## Compatibility

- `/progress` → `/profile` redirect, one rendered page.
- `profile` is optional in the envelope, so every older save loads untouched; a
  malformed value coerces to "no profile" rather than failing a restore.
- Backups include the profile automatically and round-trip; a backup written
  before profiles existed still restores.
- **Reset:** "Reset all progress" resets learning data. The profile is identity,
  not learning data, so it is stored alongside but is not what that control is
  about; no destructive "delete profile" control was added.

## Mobile QA

Screenshots in `test-results/profile-runs/`, inspected.

| Screen | 390 × 844 | 320 × 568 |
| --- | --- | --- |
| Sign Match run | Prompt, both signs, feedback, Next — no scrolling | Usable, artwork reduced |
| Sign Match result | Whole result above the fold | Clean, actions stacked, no horizontal scroll |
| Home panel | Full composition, CTA + record on one row | Simplified, record retained, full-size CTA |
| Profile | Card comfortable and scannable | Segmented control full width |

Desktop Home and Profile were also captured. Dark mode is deliberate throughout
and sign colours are never altered.

## Tests

**Unit — `tests/sign-match-runs.test.tsx` (14):** all 155 prompts non-empty and
unique; the six shape labels shortened and still playable; exactly six shortened;
meaning-carrying suffixes kept; the 48-collision guard; correct continues the
run; a miss reveals and ends it; the result shows the streak reached; an honest
0; a new best acknowledged; Try again resets the run but not the record; streak
and best shown with no missed tally.

**Unit — `tests/profile.test.tsx` (18):** name normalising and initials;
malformed profiles rejected; backup round-trip and pre-profile backups;
appearance default, application, storage and corrupt values; the dark palette's
three states and the two token lists staying identical; create, rename, the
appearance radiogroup, and the empty achievement state.

**Updated:** `sign-match-no-progress`, `sign-match`, `learner-storage` for the
run model and the new envelope field.

**E2E — `e2e/profile-and-runs.spec.ts` (17 × 2 viewports):** miss ends the run
after revealing; result contents and both actions; Try again keeps the record;
Close returns to Signs; no missed tally; result fits 320 px; Home has no plates
or circle and renders both signs; CTA and record share a row; Profile nav and
route; `/progress` redirect; create/edit/reload; appearance persistence;
Automatic following the system; profile above progress; the card gap; the empty
achievement state.

**Updated:** `sign-match.spec.ts`, `continue-and-home-match.spec.ts`,
`ux-shots.spec.ts`, `bundled-assets.spec.ts` and the viewport/journey specs for
the run model and the Profile rename. A pre-existing flake was fixed in the
answer-leak test, which waited 30 s for an `<img>` on SVG-rendered concept signs.

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
| `pnpm test` | 568 passed, 31 files |
| `pnpm test:e2e` | 286 passed |
| `pnpm verify` | **exit 0, green** |
