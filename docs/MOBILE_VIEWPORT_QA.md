# Mobile Viewport QA

Measured 2026-08-19, after the premium mobile UX pass.

Screens fall into two classes, and they are held to different standards.

**Viewport-first** — Home and every question screen (practice, topic quiz, sign
drill, weak-area, mistake review, saved, mock). With ordinary content and
default text scaling these should not need meaningful vertical scrolling on a
standard phone.

**Content-first** — Learn, Signs, Progress, review queues, Sources, About.
These are browsing experiences and are *expected* to scroll. Compressing them
to fit would be the bug.

## How these numbers are produced

`e2e/mobile-viewport.spec.ts` drives the built app, waits for fonts and artwork
to settle, then reads `document.documentElement.clientHeight` and
`scrollHeight`. Each test writes its own shard and Playwright's globalTeardown
(`e2e/viewport-report.ts`) merges them into
`test-results/ux-redesign/viewport-measurements.json` — tests are spread across
worker processes, so a shared array would only capture the last worker.

The fit assertion allows **8px** of tolerance. Sub-pixel rounding and font
metrics move by a pixel or two between runs, and a pixel-exact assertion here
would fail for reasons that have nothing to do with the design.

Home and the practice-style question screens are measured once: they draw from
a scoped pool and measure identically run to run.

**Mock is sampled, not spot-checked.** A mock section draws a random
20-question paper from the whole Rules bank, which contains the longest stems in
the app, so an arbitrary draw is not a fair test — roughly one question in eight
is genuinely long and is *supposed* to scroll. The whole section is walked
through the jump pad and judged on the distribution instead: the **median**
question must fit (that is the "normally fits" promise), and **at least 70%**
must fit (a real regression collapses this toward zero, while one or two long
questions leave it comfortably above).

The assertions run at 390×844 and 375×812 only. 320×568 is measured and
reported but never asserted — see the classification notes below.

## Results

### 390 × 844 — primary design target

| Screen | clientHeight | scrollHeight | Overflow | Classification |
| --- | ---: | ---: | ---: | --- |
| Home | 844 | 844 | 0 | **EXPECTED FIT** |
| Text question | 844 | 844 | 0 | **EXPECTED FIT** |
| Sign question | 844 | 844 | 0 | **EXPECTED FIT** |
| Mock question (median of 20) | 844 | 844 | 0 | **EXPECTED FIT** |

Mock sampling across full sections: **18–20 of 20** questions fit (90–100%),
median overflow 0, worst single question +18px.

### 375 × 812

| Screen | clientHeight | scrollHeight | Overflow | Classification |
| --- | ---: | ---: | ---: | --- |
| Home | 812 | 812 | 0 | **EXPECTED FIT** |
| Text question | 812 | 812 | 0 | **EXPECTED FIT** |
| Sign question | 812 | 812 | 0 | **EXPECTED FIT** |
| Mock question (median of 20) | 812 | 812 | 0 | **EXPECTED FIT** |

Mock sampling across full sections: **15–18 of 20** questions fit (75–90%),
median overflow 0, worst single question +30px. The tail is long-stem
questions — a 125-character stem wraps to four lines and takes the screen past
the fold. Per the rule below that is expected, not a defect.

### 320 × 568 — small-phone stress size

| Screen | clientHeight | scrollHeight | Overflow | Classification |
| --- | ---: | ---: | ---: | --- |
| Home | 568 | 716 | 148 | **EXPECTED FALLBACK SCROLL** |
| Text question | 568 | 605 | 37 | **EXPECTED FALLBACK SCROLL** |
| Sign question | 568 | 687 | 119 | **EXPECTED FALLBACK SCROLL** |
| Mock question | 568 | 826 | 258 | **EXPECTED FALLBACK SCROLL** |

No horizontal overflow at any size, on any screen (asserted).

### Notes on the 320×568 results

320×568 is the fallback stress test, not a design size — an iPhone SE (1st
generation) or a heavily zoomed browser. At that height the layout has already
given up what it can afford to: `@media (max-height: 720px)` in
`styles-quiz.css` tightens gaps, reduces artwork to `min(24dvh, 160px)` and
trims answer padding, and `@media (max-height: 820px)` in `styles-exam.css`
compacts the mock jump pad. What it does
**not** do is shrink body text, shrink touch targets below 44–48px, or hide
question content — so the remainder scrolls, which is the correct outcome.

Mock is the largest overflow because it keeps every piece of information the
official format requires on screen: part name, timer, question number, the
answered count and the 20-question jump pad. None of that was moved behind a
disclosure to win pixels.

### Why Mock is measured differently

An earlier version of this spec asserted that one arbitrary mock question must
fit. It failed roughly one run in three — not because of a layout bug, but
because the paper is drawn at random and some questions are legitimately long.
A probe of eight fresh draws at 375×812 made the cause plain:

```
run 0: overflow=  0   stemChars=103  stemH= 76  choicesH=232
run 1: overflow=  0   stemChars=104  stemH= 76  choicesH=275
run 2: overflow=  0   stemChars= 60  stemH= 51  choicesH=264
run 3: overflow=  0   stemChars=101  stemH= 76  choicesH=279
run 4: overflow=  0   stemChars= 89  stemH= 76  choicesH=232
run 5: overflow=  0   stemChars= 43  stemH= 51  choicesH=287
run 6: overflow=  0   stemChars= 73  stemH= 76  choicesH=279
run 7: overflow= 27   stemChars=125  stemH=102  choicesH=299   <- 4-line stem
```

Seven of eight draws fit exactly. Asserting on a single draw was asserting the
opposite of the product rule, so the assertion now describes the distribution.
The practice-style screens were checked the same way and fit **100%** of their
pool (10/10 topic-quiz questions, 12/12 sign-drill questions, both viewports),
so they are still measured once.

## What made the viewport-first screens fit

Measured against the previous layout, the savings came from removing decoration
rather than content:

- **The page header above every question** (title + subtitle + a full-width
  progress meter, ~150px) became one 40px bar carrying back, topic, count and
  save, plus a 3px progress rail.
- **The card wrapper around the question** (~32px of padding plus a border) was
  removed. The question is the page; it does not need a box around it.
- **Answer padding** went from generous to comfortable — 11px/13px with a 52px
  minimum height, which keeps the touch target while saving ~10px per answer.
- **Artwork sizing** moved from a fixed 168px canvas to
  `max-height: min(30dvh, 210px)`, so a sign shrinks against available height
  before answer text is ever compressed.
- **PWA notices** became a floating toast. Previously the "works offline"
  banner sat in the document flow and pushed an otherwise-fitting question into
  scrolling — that was a real bug this pass fixed.
- **Home** was cut from eight stacked cards to four elements: greeting,
  Continue Learning hero, a bento progress row and one Focus Next action. The
  statistics it used to carry now live on Progress.

## Accessibility takes precedence

The fit target never overrides accessibility. Scrolling is the correct
behaviour, and is not treated as a defect, when:

- the learner has increased text size or zoomed the browser;
- a question stem or an answer is unusually long;
- an incorrect answer adds a "why this is wrong" note plus an explanation;
- the device is unusually short.

Nothing is clipped or truncated to hit the target. The one place text is
shortened is the feedback explanation, which collapses behind a **More detail**
button — and that reveals the full text in place rather than removing it.

## Re-running

```
pnpm build
npx playwright test --project=mobile e2e/mobile-viewport.spec.ts
```

Screenshots for the same targets:

```
npx playwright test --project=shots
```
