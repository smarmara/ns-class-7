# UX — Practice Exam + Progress Separation

**Status**: Complete

**Date**: 2026-08-19

## Executive Summary

The **Practice** tab now IS the exam: a full two-part timed practice exam (renamed from "Mock Test"), reachable at `/practice`, with its start action and the previous exams' results on the same page. The old "practice hub" menu is gone — Practice hosts the exam engine, and the everyday untimed learning surface remains Quick Practice at `/practice/quick`.

- **Bottom nav**: `Home · Learn · Practice · Signs · Progress`. Practice is the exam page. `/mock` redirects to `/practice` for any older deep links.
- **Practice** (`/practice`) is the practice exam: the format intro ("How this test is set up" / "While the test is running"), the **Start practice exam** button, and a **Practice exam history** section listing every recorded previous exam (pass/fail badge, per-part scores, date). Starting the exam runs the same engine as before — 20 Rules + 20 Signs, 30 minutes each, 16/20 per part, pass/fail per part, no explanations until submit.
- **Quick Practice** stays at `/practice/quick` — the low-pressure mixed session, reachable from Home ("Quick Practice" focus fallback) and the review/empty-state CTAs.
- **Progress** (`/progress`) keeps the course ring, recommended next, Rules/Signs meters and medals, with the exam-history section relabelled "Practice exam history" and the medal group "Practice exams".
- Terminology is now **uniform**: "Mock Test"/"mock test" user-facing copy was renamed to "practice exam" app-wide (exam intro/buttons/results, Home/Learn/Progress links, medal requirements, checkpoint labels).

## Terminology Model

### Practice Exam (formerly "Mock Test")
**Purpose**: Exam simulation

**Characteristics**:
- Formal test structure (20 Rules + 20 Signs)
- Timed sections (30 minutes each)
- Pass/fail outcome (16/20 to pass each section)
- No explanations during test
- Simulates real exam conditions
- Shows previous exam results on the same page

**Route**: `/practice` (the Practice tab). `/mock` redirects here.

**Result Language**:
- "Practice exam"
- "Pass" / "Fail"
- "Practice exam results"
- Section-by-section scoring

### Quick Practice
**Purpose**: Low-pressure learning activity

**Characteristics**:
- Mixed weighted session (weak areas + due review)
- Immediate feedback, explanations, no timer
- Builds topic mastery through repetition

**Route**: `/practice/quick` — reachable from Home and empty-state CTAs.

### Progress
**Purpose**: Understand where you are and what to work on next

**Characteristics**:
- Course progress ring (topics complete · mastered)
- Recommended next topic
- Rules vs Signs breakdown using real models (topics / assessed Core concepts)
- Strongest / Needs attention topics
- Medal collection (including "Practice exams" group)
- Practice exam history (separate from everyday practice)

**Route**: `/progress`

## Navigation

**Decision**: Practice is the exam page; the timed simulation is the primary destination of the tab, not a hidden secondary link. Quick Practice remains a session route.

```typescript
const NAV = [
  { to: '/', label: 'Home', icon: HomeIcon, end: true },
  { to: '/learn', label: 'Learn', icon: LearnIcon, end: false },
  { to: '/practice', label: 'Practice', icon: PracticeIcon, end: false },
  { to: '/signs', label: 'Signs', icon: SignsIcon, end: false },
  { to: '/progress', label: 'Progress', icon: ProgressIcon, end: false },
];
```

## Practice Page (before → after)

### Before
`/practice` was a hub menu: Quick Practice hero, recommended next, Rules/Signs/Review rows, and a secondary "Ready for the exam format?" Mock Test link at the bottom. The exam itself lived on a hidden `/mock` route.

### After — the Practice Exam page (`src/routes/PracticeExam.tsx`, formerly `MockTest.tsx`)
Top to bottom:

1. **Header** — "Practice exam / A full simulation of the official Class 7 knowledge test format."
2. **How this test is set up** — the two sections with question counts, pass thresholds and time limits.
3. **While the test is running** — what to expect during the exam (no marking until submit, no explanations, saved continuously, timer auto-submits).
4. **Start practice exam** button — the primary action.
5. **Practice exam history** — every recorded previous exam, newest first: Pass/Fail badge, per-part scores ("Rules 18/20 · Road Signs 17/20"), and completion date.
6. Honesty banners and disclaimer (unchanged).

Starting the exam runs the same engine: per-part begin screens, timer, question runner, per-part submit confirmation, results with per-part pass/fail, XP, suggested study areas, and missed questions.

### Terminology
- All user-facing "mock" copy replaced with "practice exam" — intro, start button, results heading, "Take another practice exam", the shortfall banner, medal requirements, checkpoint labels, and Home/Learn/Progress entry points.

## Progress Page

Unchanged in structure from the previous pass (course ring, recommended next, Rules/Signs meters, fresh-learner empty state, medals, review), with two relabels:

- "Mock Test history" → **"Practice exam history"**
- Medal group "Mock tests" → **"Practice exams"** (medal requirement strings updated to "practice exam")
- Fresh-learner empty state: "Start practising" → `/practice/quick`, "Take a practice exam" → `/practice`.

## Terminology Regression Tests (`tests/navigation-terminology.test.tsx`)

Context-based, not a word ban:

1. **Practice is the nav label for the practice route** — the primary nav contains a link named "Practice" with `href="/practice"`.
2. **Mock is not a primary-nav tab** — the primary nav contains no link named Mock.
3. **The Quick Practice session uses no mock language** — rendered directly, it contains no "mock" text.
4. **The Practice tab is the practice exam itself** — rendering `/practice` shows the heading "Practice exam" and a "Start practice exam" button, and there is no separate "Ready for the exam format?" hub section.

## Changes Made

### `src/App.tsx`
- Routes: `/practice` → `PracticeExam` (was `MockTest`); `/practice/quick` → `QuickPractice`; `/mock` → redirect to `/practice`. Removed the `Practice` hub route.
- NAV comment updated (Practice is the exam page).

### `src/routes/PracticeExam.tsx` (new, renamed from `MockTest.tsx`)
- Component renamed `MockTest` → `PracticeExam`.
- User-facing copy renamed to "practice exam" (intro title, start button, results heading, "Take another practice exam", shortfall banner).
- Added **Practice exam history** section to the intro, fed from `progress.mockTests` (newest first).

### `src/routes/Practice.tsx` (deleted)
The hub menu is gone — its content is served by the Practice Exam page and the existing tabs.

### `src/routes/Progress.tsx`
- "Mock Test history" → "Practice exam history".
- Medal group "Mock tests" → "Practice exams".
- Empty-state CTAs → "Start practising" (`/practice/quick`) and "Take a practice exam" (`/practice`).
- Recommended-next completion card → "Take a practice exam" (`/practice`).

### `src/routes/Dashboard.tsx` / `src/routes/Learn.tsx`
- "Take a mock test" → "Take a practice exam", linking to `/practice`.

### `src/engine/learning/path.ts`
- Checkpoint labels and `to` targets: "Practice exam ready", all checkpoints → `/practice`.

### `src/engine/engagement/progression.ts`
- Medal requirement strings → "practice exam" (ids/kind unchanged).

### `src/ui/QuizSession.tsx` / `src/routes/ReviewQueues.tsx`
- Empty-state "Try Quick Practice" / "Keep practising" / "Start practising" / "Answer some questions" CTAs → `/practice/quick` (they launch practice sessions, not the exam).

### `src/routes/Sources.tsx`
- Reset copy: "any practice exam in progress".

### E2E tests
- `e2e/helpers.ts` — `startMockTest` renamed `startPracticeExam`, navigates to `/#/practice` and clicks "Start practice exam".
- `e2e/learner-journey.spec.ts` — practice-exam tests go to `/#/practice`; button/heading copy updated.
- `e2e/release.spec.ts` — outcome-messaging describe → "practice exam"; headings, restart button, history label, and reset test updated; `/mock` → `/practice`.
- `e2e/mobile-viewport.spec.ts` — "Mock question" → "Exam question"; Practice hub stress entry → "Practice exam" heading; content-screens list → `/#/practice` = "Practice exam".
- `e2e/ux-shots.spec.ts` — practice hub shots → practice exam intro (`practice-exam-{light,dark,320}`); seeded progress includes a passed exam record so the history section renders.
- `e2e/viewport-report.ts` — screen label "Mock question" → "Exam question".

## Semantic Separation Confirmed

- **Practice Exam ≠ everyday practice** — the exam is timed, pass/fail, no feedback until submit, at `/practice`. Everyday practice stays at `/practice/quick` and `/study/*`.
- **Sign Match ≠ formal progress** — supplementary, session-only, no assessment evidence.
- **Reference signs ≠ required completion** — formal progress uses the assessed Core concepts, never the catalogue breadth.

## Source Baseline (reviewed and accepted)

`pnpm sources:check:ci` flagged `ns-regs-by-act-index` (Nova Scotia Regulations by Act index page, Last-Modified 19 Aug 2026 19:03:58 GMT). The reviewed diff is a single added line on the **Teachers' Pension Plan Regulations** entry — "Effective August 1, 2026, these regulations are amended by N.S. Reg. 189/2026." That is a pensions matter, unrelated to driving content, and **0 questions depend on this source**. The new baseline was recorded with `pnpm sources:check --accept` after review; `sources:check:ci` now reports 0 changed.

## Tests

- **Unit**: 508+ passed (27 files) — includes the 4 context-based terminology regression tests.
- **E2E**: 202+ passed (mobile + desktop + shots), including the new practice-exam heading checks, exam-question viewport sampling, and the seeded history record.
- `pnpm lint`: 0 errors, 3 pre-existing warnings.
- `pnpm typecheck`: clean.
- `pnpm content:validate`: 0 errors, 61 warnings.
- `pnpm content:progression`: 31 topics audited, 0 Complete-unreachable, 0 Mastered-unreachable.
- `pnpm signs:approval:check`: 232 approved, 0 changed, 0 broken.
- `pnpm signs:learner-audit`: passed, 232/232 classified.

## Files Changed

### Modified
- `src/App.tsx` — routes: `/practice` → exam, `/mock` → redirect
- `src/routes/Progress.tsx` — history/medal relabels, empty-state + recommended-next CTAs
- `src/routes/Dashboard.tsx`, `src/routes/Learn.tsx` — exam entry-point copy and links
- `src/engine/learning/path.ts` — checkpoint labels + targets
- `src/engine/engagement/progression.ts` — medal requirement copy
- `src/ui/QuizSession.tsx`, `src/routes/ReviewQueues.tsx` — empty-state CTAs → `/practice/quick`
- `src/routes/Sources.tsx` — reset copy
- `e2e/helpers.ts`, `e2e/learner-journey.spec.ts`, `e2e/release.spec.ts`, `e2e/mobile-viewport.spec.ts`, `e2e/ux-shots.spec.ts`, `e2e/viewport-report.ts`
- `tests/navigation-terminology.test.tsx`
- `data/sources/snapshots/ns-regs-by-act-index.txt`, `data/sources/source-manifest.json` — accepted reviewed external baseline

### New
- `src/routes/PracticeExam.tsx` — the practice exam page (renamed from `MockTest.tsx`), with exam history

### Deleted
- `src/routes/Practice.tsx` — the practice hub
- `src/routes/MockTest.tsx` — superseded by `PracticeExam.tsx`

### Not Modified
- Question data (no content changes)
- Mastery algorithms / thresholds (no progression changes)
- Exam configuration (20 Rules / 20 Signs, 16-20 pass, section behavior, scoring — untouched)
- Persistence / storage schema (no changes; `progress.mockTests`, `useMockExam`, engine internals kept as-is)
- Sign system (no changes)