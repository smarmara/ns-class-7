# Learner quality & exam readiness audit

**Date:** 2026-08-17 · **Bank:** 249 questions (249 active) · **Scope:** content quality, coverage, exam realism, learning features, mobile journey, accessibility, source integrity.

This is the evidence-based audit for the Nova Scotia Class 7 study app. Every number below was produced by a deterministic script in `scripts/` (run commands are listed in the [Reproduction](#reproduction) section) or by the automated test suite. Findings are classified **critical / high / worthwhile-medium / low** with the evidence, the learner impact, and the action taken.

---

## 1. Executive summary

The bank is in genuinely good shape: 249/249 active questions, every question traces to an official Nova Scotia source with a locatable reference, every answer has a real explanation and per-distractor notes, and no factual errors surfaced in a full-file spot-check. The mock test engine is faithful to the published format, and the offline/accessibility/mobile behaviour is covered by an automated suite that passes on phone and desktop.

Two high-value content gaps were found and closed this phase:

- **Distraction/inattention was under-tested** (exactly 1 question) even though the handbook lists driver inattention and driver distraction as the first- and third-most-common causes of crashes in Nova Scotia. Added 3 sourced questions.
- **The sign pool was small enough that consecutive mock tests repeated ~5 of 20 sign questions** on average. Added 3 sourced sign questions using existing verified artwork that no question had used yet.

One systemic writing-quality pattern is documented and guarded against, but deliberately not rewritten (see finding M1): **the correct answer is the longest option in 199 of 249 questions**, which a test-taker could exploit by length alone. This is real but low-risk here (positions are shuffled in-app, and gaming a practice app rewards nothing), and a full rewrite of 147 questions would risk factual drift for marginal gain. It is now caught by validator warnings so future questions cannot repeat the worst cases.

No **critical** findings. The "readiness score" is consistently framed as study-progress, not a pass probability, which is the correct posture for an app with no access to the official bank.

---

## 2. Coverage matrix (spec item 1)

`pnpm content:coverage` → `reports/question-coverage.{md,json}`

- **249 total / 249 active.** Rules **165**, signs **84**. Difficulty **84 easy / 125 medium / 40 hard**.
- Mock pools: rules **8.3×** test size (165 for 20), signs **4.2×** (84 for 20). Both comfortably clear the validator's 2× "feels samey" warning threshold.

Topic-level active counts (thin topics bolded):

| Rules topic | Active | | Signs topic | Active |
| --- | ---: | --- | --- | ---: |
| Traffic signals | 10 | | Regulatory signs | 21 |
| Right of way | 5 | | Warning signs | 22 |
| Intersections | 6 | | School signs | 4 |
| Pedestrians and crosswalks | 6 | | Work zone signs | 10 |
| School zones and buses | 6 | | Guide signs | 5 |
| Emergency vehicles | 6 | | **Lane use signs** | 3 |
| **Transit buses** | 3 | | Railway signs | 6 |
| Speed limits | 6 | | **Pedestrian/cyclist signs** | 3 |
| Following and stopping | 5 | | Pavement markings | 10 |
| Lane use | 5 | | |
| **Turning** | 4 | | |
| Passing | 8 | | |
| Parking and stopping | 12 | | |
| **Roundabouts** | 4 | | |
| Highways and merging | 7 | | |
| Adverse conditions | 13 | | |
| Impairment | 11 | | |
| Graduated licensing | 18 | | |
| Vehicle and driver safety | 14 | | |
| Sharing the road | 7 | | |
| Collisions and emergencies | 9 | | |

**Thin topics** (3–5 questions) are all accurate and internally consistent; none is so thin it cannot be served. The two sign topics at 3 questions (lane-use signs, pedestrian/cyclist signs) are the most exposed — growth there needs new artwork, which is a content-authoring project rather than a data fix (see H2).

**Imbalance to note:** no `hard` question exists in traffic signals, intersections, transit buses, roundabouts, highways, guide signs, lane-use signs or pedestrian/cyclist signs, and none `easy` in collisions-and-emergencies. This is a calibration observation, not a defect — the distribution is not artificially forced (see finding L1).

## 3. Duplicates and near-duplicates (spec item 2)

The validator fingerprints every question on stem + sign artwork + correct answer and treats ≥0.85 similarity as an error, ≥0.70 as a warning. **0 errors, 0 warnings** at that level across 249 questions — no meaningful duplicates. The four same-question choice pairs flagged by the quality heuristics are deliberate discriminator pairs (e.g. "S in a crossed-out red circle" vs "P in a crossed-out red circle"), which is exactly what good distractor design looks like.

## 4. Difficulty and answer distribution (spec item 3)

`pnpm content:quality` → `reports/question-quality.{md,json}`

- All questions have exactly **4 choices**.
- **Authored correct-choice position is `0` in all 249 questions** (every file). In-app, `prepareQuestion` shuffles the presented order from the same seed as the draw, so learners never see "correct is always first". This is therefore an **authoring hygiene issue, not a leakage risk** — but a future surface that forgot to shuffle would silently make everything trivial. Mitigation: new validator warning `authoring-position` (see M2).
- **Correct is the longest option in 199/249 (80%)**; **147/249 (59%)** have a correct answer >1.5× the mean distractor; **58/249** are egregious (correct ≥3× the shortest distractor). See M1 — the one systematic quality finding.

## 5. Choice quality (spec item 4)

- Every choice is distinct text; no question has two identical options.
- **0 questions missing a per-distractor explanation.**
- Manual read of full files (`rules-parking-roundabouts-highways`, `rules-impairment-and-licensing`, `rules-signals-and-intersections`, `rules-vulnerable-road-users`, `rules-speed-lanes-and-passing`, `rules-conditions-and-safety`, `signs-regulatory`, `signs-school-pedestrian-railway`) found consistently *tempting-but-wrong* distractors with explanations that teach the rule the distractor plays on (e.g. 30 m railway-crossing speed vs 15 m parking distance vs 60 m following distance). Distractors frequently borrow the *other* numbers/terms the handbook uses so a learner must actually distinguish them.

## 6. Explanation quality (spec item 5)

- Length: min 82, mean 238, median 237 chars. **0 under 80, 0 that merely restate the answer.**
- Explanations routinely add the "why" (the reason a rule exists, or the detail that discriminates the options), not just the correct answer.
- Stems: mean 80 chars, **0 over 220** — nothing awkward on a phone.

## 7. Source usability (spec item 6)

- 249/249 questions cite at least one manifest source; all 18 manifest sources cited resolve.
- Numeric/legal facts all carry a locator (chapter/page or statute section) — enforced by validator rule `unlocatable-numeric-fact`, asserted by `tests/content-integrity.test.ts` (`numeric facts`), **0 violations**.
- Content freshness policy is enforced (sources re-verified within the policy window; `content:validate` fails on stale or non-current sources).

## 8. Sign questions: recognition vs application (spec item 7)

- **61 application** (sign artwork shown, "what does this require"), **5 recognition** (choices are sign artworks), **18 text-only** sign-knowledge questions (design conventions, railway-crossing rules, work-zone colours, pavement markings).
- The 18 text-only questions were each read and verified **benign**: they ask about sign *design principles* or *crossing rules* that have no single picture (e.g. "what colour marks a work zone?"), or deliberately describe the sign in words to test the description itself. No question that should show a sign fails to.
- Every sign reference resolves to artwork in the registry (`content:validate` errors on a missing `signId`/`choiceSignIds`); artwork exists for all 62 sign-meta entries. Every recognition choice's label is the sign's `visualDescription` verbatim, so the accessible name is what a sighted user sees — asserted by tests.
- **3 registered artworks were used by no question at all** (`maximum-speed-80`, `no-left-turn`, `no-right-turn`) — all three are now in the bank (H2).

## 9. Mock-test realism (spec item 8)

`pnpm mock:analyze` → `reports/mock-analyze.{md,json}` (400 seeded sessions)

- Official format reproduced exactly (2 × 20 questions, 30 min, 16/20, sections passed independently — asserted by tests and `data/exam-config/class7.json`).
- **Exposure is fair: every one of the 249 questions appeared within 400 tests; none appeared fewer than twice.** Rules mean 48.5 appearances, signs mean 95.2.
- **Coverage vs tests taken:** rules 50% in 5 tests, 90% in 19, 100% in 39; signs 50% in 2, 90% in 7, 100% in 15.
- **Composition:** a rules section averages 12.8 distinct topics (9–17 of 20); signs 7.3 (4–9 of 9). Reasonable breadth.
- **Difficulty variance per rules test is wide** (easy 0–11, medium 5–18, hard 0–8). This mirrors a genuinely random draw from the official-style bank; the app does not (and should not) force a balanced mix, because the real test does not either. Recorded as an observation (L1), not a defect.
- **Consecutive tests overlap:** rules 2.4 questions on average; signs **4.8** (0–12). The sign repetition is the direct result of an 84-question pool for a 20-question section. It is inherent to the pool size and realistic, but it is the most likely thing a learner will notice. Mitigated by H2; further growth is a content project.

## 10. Learning progression (spec item 9)

The app exposes three ordered surfaces — Quick Practice (mixed, weak-weighted), topic quizzes, and the mock test — and a spaced-repetition scheduler (Leitner boxes `[0.15h, 8h, 24h, 72h, 168h, 336h]`, box ≥3 = retained). The progression is sound:

- Practice answers explain the rule immediately; mock tests disclose nothing until a section is submitted — so practice teaches and the mock measures. Asserted by E2E.
- The scheduler weights unseen questions first, recent misses 2.2×, flagged questions 2×, and caps how much any one miss can dominate — reviewed against the code, behaviour consistent with the design comments.
- **Observation (low):** `Retention` shows `0%` until some question reaches box 3, so a diligent learner who answered 210 questions once sees `retention 0%` alongside `coverage 86% / accuracy 100%`. The number is honest and the dashboard labels it ("spaced out"), but the first impression could read as "nothing retained." Optional wording improvement; not fixed (the metric genuinely needs re-review to move, and the copy is accurate).

## 11. Weak-areas feature (spec item 10)

Verified with deterministic synthetic histories (5 learner archetypes, in-progress script):

- **Learner C** (misses right-of-way and turning repeatedly): `weakTopics` returns exactly `right-of-way:60%, turning:60%`, and the mistake queue is dominated by those topics. The feature isolates the right weaknesses.
- **Learner B** (6 attempts, all correct): `hasEnoughData=false` → the dashboard shows "Provisional — answer more questions", so a new learner is not given a false score. Correct behaviour.
- **Learner E** (243 attempts, 67% accuracy): score 65 — coverage-heavy but transparent: the breakdown shows coverage 100% / recent accuracy 67%, so the learner can see exactly why. The score is documented in-app as "study progress, not a prediction of passing." Consistent with the app's honest-posture requirement.

## 12. Mistake-review feature (spec item 11)

`mistakeQueue` returns questions whose last result was incorrect or that are flagged for review, oldest-missed first. In the synthetic histories it tracks weakness correctly (Learner C: 9 items led by right-of-way/turning; Learner E: 81 items spread across every topic the learner got wrong). The dashboard surfaces "Review your mistakes" only when the queue is non-empty. Correct.

## 13. Mobile journey (spec items 12–13)

The entire E2E suite runs on **Pixel 7** and **Desktop Chrome** (`playwright.config.ts`), 42 tests per project, all passing. The journey verified on mobile includes: clean start → honest readiness score → quick practice (answer, explanation, official source, bookmark) → topic quiz → sign drill with artwork → mock test (format disclosure rules, resume after refresh, independent part scoring) → sources/erase-data. No horizontal overflow on a phone (asserted). No findings.

## 14. Offline / PWA (spec item 14)

- Vite PWA configured with `autoUpdate`, workbox precache (27 entries, 657 KiB), `navigateFallback: index.html`.
- **New E2E test added** (`offline (PWA)`): after the service worker is active and controlling the page, the network is cut with `context.setOffline(true)` and the app reloads and renders from cache. Passes on mobile and desktop.
- The readiness data is client-side (IndexedDB/localStorage), so an offline install retains progress. No findings.

## 15. Accessibility (spec item 15)

Existing suite covers keyboard-only answering, skip link, labelled primary nav, `fieldset.choices` with a non-empty legend, sign `aria-label`s that describe appearance not meaning, and no-vertical-horizontal-overflow on a phone — all green. The sign-description-not-meaning property is additionally asserted by unit tests. No findings.

## 16. Spot-check of question accuracy (spec items 16–22)

All ten question files were read in full during this audit. Every sampled question was factually consistent with the cited source snapshots in `data/sources/snapshots/` (e.g. 30 m / 15 m / 60 m distance distinctions, .05 vs .08 BAC thresholds, school-zone limits, transit-bus yield at ≤60 km/h, 60 km/h move-over). Difficulty ratings (easy/medium/hard) read as well-calibrated to a novice driver. Halifax context (Spring Garden Road, Bedford Highway, Halifax Transit, HRM streets) is used accurately and never invents a local law — the tagging is consistent and searchable (15 `halifax` tags). Tags/subtopics are consistent with their topics; `content:validate` enforces the topic taxonomy and duplicate-id rules.

---

## 17. Findings

### Critical
**None.** No factual errors, no unanswerable questions, no invalid tests, no broken sources, no inaccessible flows.

### High

**H1 — Distraction and inattention are under-tested** *(fixed)*
- Evidence: exactly **1** question on distracted driving in 243 (now 249), while the handbook names driver **inattention** as the #1 and driver **distraction** as the #3 most-common cause of crashes in Nova Scotia (`ns-handbook-ch4`, p. 126), and the MVA creates a distinct distracted-driving offence (`s.100D`, 4 demerit points). Driver error causes the crashes; a learner should be drilled on it.
- Learner impact: a candidate could complete the bank and meet almost no distraction material, despite it being among the most important safety content for a novice.
- Action: added `rules-impair-010` (crash-cause ranking, ch4 p.126), `rules-impair-011` (avoid the "spectator" temptation, ch4 p.126 + ch1 p.11), and `rules-safety-014` (ornaments that distract are prohibited, ch4 p.114 + MVA s.184(5)). The distracted-driving subtopic now has 3 questions plus the existing phone-law question.

**H2 — Sign pool is small enough to feel repetitive across mock tests** *(partially fixed)*
- Evidence: `mock:analyze` shows consecutive sign sections share **4.8 of 20 questions on average** (up to 12), and 100% sign-bank coverage takes 15 tests. Root cause: an 84-question pool against a 20-question section.
- Learner impact: taking several sign sections back-to-back surfaces repeated signs, which can read as low-quality or make a learner over-anchor on a few signs.
- Action: added `signs-reg-019/020/021` (`maximum-speed-80`, `no-left-turn`, `no-right-turn`) using existing verified artwork that had **no question** (all three are classic exam signs). Remaining exposure is inherent to pool size; growing lane-use-signs (3) and pedestrian/cyclist-signs (3) would need new artwork — recommended as a content project, not a data fix.

### Worthwhile-medium

**M1 — Correct answer is identifiable by length alone** *(guarded, not rewritten)*
- Evidence: correct is the **longest** option in 199/249; >1.5× mean distractor in 147; **≥3× the shortest distractor in 58**. Positions are shuffled in-app, but a learner who reads all four options and picks the longest is right ~80% of the time.
- Learner impact: mocks and practice can be gamed without learning; the tell also trains a bad habit ("the long answer is right").
- Action taken: **validator warning `choice-length-tell`** added so the egregious pattern is visible per question and cannot silently grow. **Not rewritten**: rebalancing 147 verified questions is a content-authoring project of its own and would risk factual drift for marginal benefit in a practice-only app. Recommended future work: authoring guideline "keep the correct answer within ~1.5× the longest distractor; lengthen obviously-wrong short distractors with a plausible qualifier."

**M2 — Correct answer is always authored at position 0** *(guarded)*
- Evidence: `content:quality` shows authored `correctChoice = 0` in all 249 questions, in every file.
- Learner impact: none today (in-app shuffle), but the pattern is one forgotten-shuffle away from trivially solvable.
- Action taken: **validator warning `authoring-position`** flags any file where every question puts the correct answer in the same slot, so future files vary the position.

**M3 — Retention metric reads "0%" until questions are reviewed again** *(noted)*
- Evidence: `computeReadiness` counts retention only at box ≥3; Learner A (86% coverage, 100% accuracy, first pass) shows retention 0%. The label "spaced out" is accurate but the figure can feel wrong.
- Action taken: none this phase; optional copy change. Not a correctness issue — the breakdown and the "not a prediction" note are shown.

### Low (observations, no action)

- **L1** Mock difficulty variance is wide (easy 0–11, hard 0–8 per test) — faithful to a random draw; forcing a mix would make mocks *less* realistic.
- **L2** 18 text-only sign questions — verified benign (they test design principles or crossing rules with no single picture).
- **L3** 4 near-duplicate choice pairs — deliberate discriminator pairs, verified correct.
- **L4** 1 double-negative stem — reads fine; not worth churn.

---

## 18. What changed this phase

Content (all sourced to `data/sources/snapshots/`):
- `data/questions/rules-impairment-and-licensing.json` — added `rules-impair-010`, `rules-impair-011`.
- `data/questions/rules-conditions-and-safety.json` — added `rules-safety-014`.
- `data/questions/signs-regulatory.json` — added `signs-reg-019`, `signs-reg-020`, `signs-reg-021`.

Tooling:
- `scripts/content-quality.ts` (+ `pnpm content:quality`) — writing-quality heuristics → `reports/question-quality.{md,json}`.
- `scripts/mock-analyze.ts` (+ `pnpm mock:analyze`) — 400-seed mock simulation → `reports/mock-analyze.{md,json}`.
- `package.json` — `content:coverage`, `content:quality`, `mock:analyze` scripts.
- `scripts/content-validate.ts` — new `choice-length-tell` and `authoring-position` warnings; module now safe to import (entry guard).

Guard rails:
- `tests/content-authoring.test.ts` — 7 tests for the new validator helpers.
- `e2e/learner-journey.spec.ts` — offline/PWA test (cuts the network, reloads from the service-worker cache).

## 19. Verification

- `pnpm content:validate` — 249 questions, **0 errors** (68 advisory warnings: 10 authoring-position, 58 choice-length-tell).
- `pnpm lint` — clean.
- `pnpm exec tsc -b` — clean.
- `pnpm test` — **145 unit tests pass** (was 138).
- `pnpm test:e2e` — **42 pass** on Pixel 7 + 42 on Desktop Chrome, including the new offline test.
- `pnpm build` — succeeds (main chunk 562 kB / 153 gzip, route-split).
- `pnpm sources:check` — 19 sources unchanged.
- Analysis reports regenerated against the final bank.

## 20. Reproduction

```
pnpm content:validate    # correctness + source integrity + authoring warnings
pnpm content:coverage    # coverage matrix → reports/question-coverage.{md,json}
pnpm content:quality     # writing-quality heuristics → reports/question-quality.{md,json}
pnpm mock:analyze        # 400-seed mock simulation → reports/mock-analyze.{md,json}
pnpm test                # unit + content-integrity + authoring
pnpm test:e2e            # full journey incl. offline/PWA, mobile + desktop
pnpm build               # production build + PWA precache
```