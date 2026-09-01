# Achievement design system

Visual foundation for study levels, topic medals, section-expertise medals and
practice-exam medals. The visual system is presentation-only: existing
progression, mastery, exam and sign-artwork models remain authoritative.

## Simplified app palette

Halifax-inspired, deliberately small. Declared in `:root` in `src/styles.css`,
strictly additive — no existing token was redefined.

| Role | Token | Hex |
| --- | --- | --- |
| Brand dark | `--brand-deep` | `#002b49` |
| Primary | `--brand` | `#00558c` |
| Primary light | `--brand-light` | `#428bca` |
| Soft surface | `--brand-soft` | `#e9f3f9` |
| On brand | `--on-brand` | `#ffffff` |
| Achievement accent | `--achievement` | `#ffb500` |
| Mastery / special | `--mastery` | `#9b26b6` |

### What was deliberately *not* imported

Halifax's success, warning and danger values were left out rather than added
beside the app's own. The app already has those slots filled:

| Halifax | Value | Existing app token | Value | Why the app's is kept |
| --- | --- | --- | --- | --- |
| Success | `#198754` | `--good` | `#146b45` | Chosen to clear 4.5:1 as body text |
| Warning | `#ef6924` | `--warn` | `#825408` | Same; the orange fails as text |
| Danger | `#d0021b` | `--bad` | `#a12727` | Same |
| Neutral text | `#333333` | `--text` | `#14161c` | Already the neutral text ramp |
| Muted | `#767676` | `--text-muted` | `#575d6b` | Already the muted ramp |
| White | `#ffffff` | `--surface` | `#ffffff` | Identical concept, already present |

Importing both sets would have produced near-duplicate colours where the newer
one fails contrast. Achievement work should use `--good` / `--warn` / `--bad`
for meaning, and reach for `--achievement` only for emphasis.

`--achievement` (`#ffb500`) is **not** a duplicate of `--xp` (`#8a5a00`): `--xp`
is the text-safe gold used for numerals and never fills an area, while
`#ffb500` is a fill and would fail as text on a light surface.

### Dark mode

The brand and wheel tokens are declared in `:root` only. The dark theme keeps
its existing neutral charcoal surfaces (`--bg: #0e1014`) — **Halifax Navy is an
accent inside dark mode, never the page background.** Both dark blocks are
unchanged, so `tests/profile.test.tsx`'s "keeps the two token lists identical"
assertion is unaffected.

A medal is also theme-independent on purpose: one earned in light mode is the
same colour in dark mode.

## Steering-wheel SVG

`src/assets/medals/steering-wheel-base.svg` — 512 × 512, `viewBox="0 0 512 512"`,
transparent, fully vector.

### The connected T-shaped spoke assembly

The spoke frame is **one closed path**, `#spoke-assembly`, not three overlapping
paddles.

The previous version had three independent quadrilaterals (`spoke-left`,
`spoke-right`, `spoke-bottom`) that relied on the hub to hide their meeting
point. Because the hub circle is round and the spoke corners were square, small
uncovered notches appeared just outside the hub at roughly (200, 218) and
(312, 218) — the shape read as three paddles attached to a circle.

The path now runs clockwise from the left rim end:

| Run | What it does |
| --- | --- |
| `M 88 224` → two cubics → `424 224` | one smooth top edge across the full width, gently waisted so the bar is thicker where it leaves the hub |
| `L 424 288` | right end cap, hidden under the rim |
| cubic back to `330 293` | underside of the right arm |
| `Q 296 293 296 327` | **right cove**: the control point sits exactly on the sharp corner it replaces, so the curve leaves horizontal and arrives vertical |
| `Q 294 376 288 424` | the leg, tapering gently toward the rim |
| `L 224 424` | foot, hidden under the rim |
| `Q 218 376 216 327` | leg's left edge |
| `Q 216 293 182 293` | **left cove**, mirrored |
| cubic to `88 288`, `Z` | underside of the left arm and the left end cap |

Because both fillet control points land on the corner being removed, the
tangents match on entry and exit and there is no seam, notch, doubled edge or
hard corner. The leg is 80 wide where it leaves the bar — exactly the bar's
thickness at centre — and tapers to 64, matching the arms at the rim.

**Verified geometry**

- **Symmetry:** mirroring the sampled outline through `x → 512 − x` gives a
  maximum deviation of **0.000 units**.
- **Centring:** the leg spans 216–296 at the top and 224–288 at the foot; both
  centre on 256.
- **Rim joins:** all three end caps lie in the band `168 ≤ r ≤ 171`. The rim's
  inner edge is `r = 160` and its outer edge `r = 210`, so every arm is buried
  8 units under the rim and 39 clear of its outer edge. No join can gap.

### Layer order

Document order is back to front:

1. `#wheel-structure` → `#spoke-assembly` — the connected T
2. `#spoke-assembly-shade` — a `<use>` of the same path for the light/shadow pass
3. `#wheel-rim` — base circle then its shade, drawn **after** the frame so it
   covers the three spoke ends
4. `#hub` — dark ring, then the cap, each with its shade
5. `#highlights` — one arc on the upper-left shoulder

The rim is drawn after the frame rather than before it: the arms extend 8 units
past the rim's inner edge, so drawing the rim last is what makes the joins
seamless. Drawing it first would leave dark tabs sitting on top of the rim.

The hub then caps the middle of the T. The frame underneath stays continuous —
**the hub finishes the shape rather than holding three loose spokes together.**

### Recolour tokens

| Token | Paints | Default |
| --- | --- | --- |
| `--wheel-primary` | rim, and the cap unless overridden | `#428bca` |
| `--wheel-primary-light` | shoulder highlight arc | `#7ab5e3` |
| `--wheel-primary-dark` | *reserved* — deep accent for tiers that want one | `#00558c` |
| `--wheel-structure` | spoke assembly and hub ring | `#2e3f52` |
| `--wheel-hub` | centre cap, when it should differ from the rim | falls back to `--wheel-primary` |

Every value has an inline fallback, so the file renders correctly opened on its
own and takes app tokens when inlined.

Shading carries **no colour of its own**: the single gradient `#sw-shade` runs
white → transparent → black and is laid over flat token fills. A recolour
therefore needs no gradient edits, and several differently coloured copies can
be inlined on one page without their gradient ids fighting. (An earlier version
put the token colours inside the gradient stops; inlining several copies made
every `url(#…)` resolve to the first gradient in the document and all copies
rendered the same colour.)

## Implemented achievement treatments

The developer-only visual review page is available at `/dev/achievements` in
development builds. The learner collection is available at
`/profile/achievements`; the compact Profile card links to it without showing
all medals in the identity panel. The hierarchy remains: levels show
progression, topic medals show Complete, section medals show broad expertise,
and exam medals show test achievements. The app-wide brand roles use the
Halifax blue family while semantic feedback and neutral surfaces remain
independent; see `docs/BRAND_PALETTE.md`.

### Achievement identity matrix

| Achievement type | Visual |
| --- | --- |
| Study Level | Steering wheel |
| Rules topic | Steering wheel |
| Sign topic | Yield-shaped road-sign badge |
| Rules Expert | Premium steering wheel |
| Road Signs Expert | Premium Yield-shaped badge |
| Practice Exam | Tiered steering wheel |

Topic state colours are shared across both families: grey means Unearned, blue
means Complete, and gold means Mastered. Shape communicates achievement family;
colour communicates topic achievement state.

One geometry, recoloured. No variant needs a path edit.

**Study levels**

| Level | Direction |
| --- | --- |
| Novice | muted blue-grey |
| Learner | light Halifax blue (`--brand-light`) |
| Competent | primary / deep blue (`--brand`, `--brand-deep`) |
| Proficient | mustard / gold (`--achievement`) |
| Expert | richer premium gold, optional restrained `--mastery` detail |

**Topic medals** — shared wheel treatment; Rules topics primarily blue. Sign
medals may later take the canonical category accents (`--cat-*`), which already
exist and must not be duplicated.

**Section expertise** — richer `--brand-deep` + `--achievement` treatment.

**Practice exams** — Tier 1 Bronze, Tier 2 Silver, Tier 3 Gold, Tier 4 Platinum
with a restrained special highlight.

All rendered variants use `src/ui/SteeringWheelBadge.tsx`, which imports the
master SVG as raw markup, scopes its gradient id per instance, and changes only
semantic colour and surrounding treatment. No duplicated medal SVGs exist.

### Master geometry

`src/assets/medals/steering-wheel-base.svg` is the sole wheel geometry: 512 ×
512, transparent, vector, and unchanged across levels, topic medals, section
medals and practice-exam medals.

### Study levels

Levels are progression tokens, not medals: Novice uses muted slate blue-grey,
Learner Halifax light blue, Competent primary/deep blue, Proficient achievement
mustard, and Expert richer gold with restrained mastery-purple detail. The
Profile level rail uses these five wheel nodes; future levels are desaturated,
the current level is larger and emphasised, and the established thresholds
(0/20/45/70/90%) remain unchanged.

### Topic medals

Rules topics share a blue treatment. The ten canonical learner sign categories
share the same weight and use restrained enamel-like category colour variation.
The two visual states are earned and unearned; unearned is desaturated and
does not glow. A topic medal is awarded at **Complete**, with learner-facing
copy such as “Complete this topic”. Mastered is stronger learning state only;
it does not create a second medal. Topic state colour follows one simple model:
Unearned is neutral grey; Complete uses Halifax brand blue; Mastered uses
achievement gold. Purple is not used as a topic mastery marker. Shape
communicates achievement family, while colour communicates topic achievement
state.

### Sign achievement taxonomy

The learner-facing sign medals are exactly: Regulatory; Lane Use & Turns;
Parking & Stopping; Warning; School, Pedestrian & Cyclist; Railway; Work
Zones; Guide & Information; Pavement Markings; and Sign Shapes. Their state is
derived from assessed Core evidence through the presentation aggregation layer;
Reference signs, Sign Match and the full catalogue do not count.

### Section medals

Rules of the Road expert and Road Signs expert use the same wheel core with a
larger gold bezel, restrained half-laurel and richer centre treatment. Rules
requires all 21 Rules topics Complete. Road Signs requires all 10 canonical
assessed sign categories Complete.

### Practice exam medals

Exam medals retain existing unlock logic and use simple vector finishes:
Tier 1 Bronze, Tier 2 Silver, Tier 3 Gold, and Tier 4 Platinum. Small raised
centre marks indicate the tier; no tier text is placed inside the artwork.

### Accessibility

When adjacent UI text conveys the achievement name, state and requirement, the
wheel artwork is decorative (`aria-hidden="true"`). Earned state is also stated
in text and never depends on colour alone. Labels remain outside the SVG.

## Visual QA

Rendered at 32, 48, 64, 96 and 160 px on the light background (`#f7f6f4`), the
app dark background (`#0e1014`) and a transparency checkerboard, plus a 300 px
render and a magnified view of the hub and T junction.

| Size | Result |
| --- | --- |
| 32 px | Rim, all three arms and the hub still read |
| 48 px | Clean; the T reads as one frame |
| 64 px | Clean; the cove at the leg junction is visible |
| 96 px | Full detail, shading legible |
| 160 px | Full detail |

- No gaps at the T junction, no spoke seams, no halo.
- The magnified centre shows the horizontal bar flowing into the leg through the
  coves as one piece.
- Blue stays legible on the charcoal dark background; the structure is lighter
  than `--bg`, so the frame does not disappear.
- Background is transparent — no `<rect>`, and the checkerboard shows through.
- Recolouring verified per copy with five tier treatments (bronze, silver, gold,
  mastery, deep navy) on one page; each rendered independently and correctly.

## Files

| File | Change |
| --- | --- |
| `src/assets/medals/steering-wheel-base.svg` | three spokes replaced by one connected `#spoke-assembly` path; `--wheel-hub` added; palette-derived defaults |
| `src/styles.css` | additive brand / achievement / wheel token block in `:root` |
| `docs/ACHIEVEMENT_DESIGN_SYSTEM.md` | this file |

No question content, sign artwork, achievement logic, level calculation,
progression, mastery, Profile or Home code was changed.
