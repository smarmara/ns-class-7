# Priority 6E — Learn Road Signs Refresh

**Status**: Complete

**Date**: 2026-08-19

## Executive Summary

Priority 6E successfully refreshed the Learn page's Road Signs section to use the canonical 10 learner categories with Core concept-based progress tracking, replacing the stale question-topic presentation.

**Key Achievements**:
- ✅ Replaced old question-topic cards with 10 canonical learner categories
- ✅ Implemented Core concept-based progress (denominator = unique Core concepts, not question count)
- ✅ Added `signCategoryLearnProgress()` derivation module
- ✅ Added 14 comprehensive unit tests
- ✅ All 504 unit tests pass
- ✅ All 200 E2E tests pass
- ✅ `pnpm verify` fully green

## Problem Solved

### Before
The Learn page showed stale question-topic presentation:
- "Lane use signs: 0 / 3 seen" (wrong denominator)
- Separate "School signs" and "Pedestrian and cyclist signs" cards
- No "Parking & Stopping" category
- Denominators based on question count, not Core concepts

### After
The Learn page now shows canonical learner categories:
- "Lane Use & Turns: 0 of 6 assessed signs seen" (correct Core denominator)
- Merged "School, Pedestrian & Cyclist" category
- Added "Parking & Stopping" category
- All denominators based on unique Core concepts
- Optional catalogue breadth shown as secondary info

## Architecture

### New Module: `signCategoryLearnProgress()`

Added to `src/engine/learning/signCategories.ts`:

```typescript
export function signCategoryLearnProgress(
  pool: readonly Question[],
  progress: Progress,
): SignCategoryLearnProgress[]
```

**Key Features**:
- Derives per-category progress from Core concepts
- Denominator = unique Core concepts (not question count)
- Numerator = Core concepts seen (at least one question attempted)
- Deduplicates multiple questions for same concept
- Derives state from existing mastery thresholds
- No new persistence required

**State Derivation**:
- 0 seen → 'new' (Not started)
- Some seen, coverage < 0.5 or accuracy < 0.6 → 'learning' (Learning)
- Coverage >= 0.5, accuracy >= 0.6 → 'developing' (Developing)
- All seen (coverage = 1.0), accuracy >= 0.8 → 'complete' (Complete)
- All seen, accuracy >= 0.9, with retention → 'mastered' (Mastered)

### Updated Learn Page

**File**: `src/routes/Learn.tsx`

**Changes**:
- Removed `SIGNS_TOPICS` import (no longer used for Road Signs)
- Added `signCategoryLearnProgress` import
- Added `SignCategoryCard` component for category cards
- Replaced Road Signs section with canonical categories
- Rules of the Road section unchanged

**SignCategoryCard Features**:
- Shows Core concept progress (coreSeen / coreCount)
- Shows mastery state (Not started / Learning / Complete / Mastered)
- Optional secondary line showing catalogue breadth
- Links to filtered catalogue view
- Accessible progress bar with proper ARIA attributes

## Canonical Categories

The 10 canonical learner categories with current counts:

| Category | Catalogue | Core | Reference |
|---|---:|---:|---:|
| Regulatory | 21 | 13 | 8 |
| Lane Use & Turns | 56 | 6 | 50 |
| Parking & Stopping | 7 | 2 | 5 |
| Warning | 23 | 23 | 0 |
| School, Pedestrian & Cyclist | 15 | 3 | 12 |
| Railway | 3 | 3 | 0 |
| Work Zones | 17 | 17 | 0 |
| Guide & Information | 3 | 3 | 0 |
| Pavement Markings | 4 | 4 | 0 |
| Sign Shapes | 6 | 6 | 0 |
| **Total** | **155** | **80** | **75** |

## Key Denominator Decisions

### Lane Use & Turns
- **Old**: 0 / 3 seen (question count)
- **New**: 0 of 6 assessed signs seen (Core concepts)
- **Why**: 56 catalogue entries but only 6 are Core assessed concepts

### Guide & Information
- **Catalogue**: 3 Core concepts
- **Questions**: 4+ questions
- **Denominator**: 3 (unique Core concepts, not question count)

### Sign Shapes
- **Catalogue**: 6 Core concepts
- **Questions**: 7 questions (including shape-yield)
- **Denominator**: 6 (unique Core concepts)

### Railway
- **Old**: 7 questions (historical topic count)
- **New**: 3 Core concepts (canonical denominator)

## Progress Semantics

### Seen
A Core concept counts as "seen" when the learner has encountered at least one formal assessment question mapped to that concept. Multiple questions for the same concept still count as 1 concept seen.

### Progress Bar
Uses the same denominator as the displayed coverage text:
- "3 of 6 assessed signs seen" = 50% coverage bar

### State Labels
- **Not started**: 0 Core concepts seen
- **Learning**: Some Core concepts seen, but not all
- **Developing**: Coverage >= 50%, accuracy >= 60%
- **Complete**: All Core concepts seen, accuracy >= 80%
- **Mastered**: All Core concepts seen, accuracy >= 90%, with retention

## Reference Signs

**No Progress Effect**:
- Reference signs do not affect Learn denominator
- Reference signs do not block Complete
- Reference signs do not block Mastered
- Reference signs do not affect medals
- Reference signs do not affect recommendedNextTopic

**Optional Display**:
- Catalogue breadth shown as secondary info (e.g., "56 signs in catalogue")
- Clearly separated from assessed progress
- Does not create artificial completion requirements

## Historical Progress

**No Migration Required**:
- Existing per-question learner history projects automatically
- Derived from existing question IDs
- No schema changes
- No data reset
- School + Pedestrian/Cyclist merge works automatically

## Rules of the Road

**Unchanged**:
- Rules section still uses question-topic progression
- Denominators correctly correspond to question-topic counts
- No structural changes
- No count changes

**Why Different from Signs**:
- Rules have no separate reference catalogue
- Rules topics directly represent assessed content
- Signs have a separate learner catalogue with Core/Reference distinction

## Tests Added

### `tests/learn-sign-progress.test.ts` (14 tests)

1. ✅ renders exactly 10 canonical categories
2. ✅ includes Lane Use & Turns with correct Core denominator
3. ✅ includes Parking & Stopping
4. ✅ includes merged School, Pedestrian & Cyclist
5. ✅ Guide & Information has Core denominator 3, not question count 4
6. ✅ Sign Shapes has Core denominator 6, not question count 7
7. ✅ Railway uses canonical Core count, not old question count
8. ✅ all Core denominators sum to exactly 80
9. ✅ all catalogue counts sum to exactly 155
10. ✅ Reference counts sum to exactly 75
11. ✅ does not show stale School-only or Pedestrian-only categories
12. ✅ starts with all categories in Not started state
13. ✅ tracks Core concept progress without inflating from multiple questions
14. ✅ Reference signs do not affect Core progress

## Files Changed

### Modified Files
- `src/engine/learning/signCategories.ts` — Added `signCategoryLearnProgress()` function
- `src/routes/Learn.tsx` — Updated Road Signs section to use canonical categories
- `src/styles-modules.css` — Added `.module-meta-secondary` styling
- `tests/learn-sign-progress.test.ts` — NEW: 14 comprehensive tests

### Not Modified
- Question topics — unchanged (derivation adapts to presentation)
- Learner categories — unchanged (uses existing canonical data)
- Learner scope — unchanged (80 Core, 75 Reference)
- Progression algorithm — unchanged (derives from existing evidence)
- Learner persistence — unchanged (no schema changes)
- Sign artwork — unchanged (232 approved, 0 changed)

## Quality Metrics

### Before Priority 6E
- Unit tests: 490
- E2E tests: 200
- Learn page: stale question-topic presentation

### After Priority 6E
- Unit tests: 504 (+14)
- E2E tests: 200 (unchanged)
- Learn page: canonical category presentation with Core progress

### Quality Gates
```
✅ pnpm lint: 0 errors, 3 warnings (pre-existing)
✅ pnpm typecheck: clean
✅ pnpm content:validate: 0 errors, 61 warnings
✅ pnpm sources:check:ci: 21/21 unchanged
✅ pnpm signs:approval:check: 232 approved, 0 changed, 0 broken
✅ pnpm test: 504 passed, 26 files
✅ pnpm test:e2e: 200 passed
✅ pnpm build: PWA v1.3.0, 252 precache entries
✅ pnpm verify: fully green
```

## Acceptance Criteria Status

| # | Criterion | Status |
|---|-----------|--------|
| 1 | Learn → Road Signs uses 10 canonical learner categories | ✅ |
| 2 | Stale old question-topic presentation removed from Road Signs | ✅ |
| 3 | Rules of the Road remains structurally unchanged | ✅ |
| 4 | Lane Use & Turns denominator is 6 Core concepts | ✅ |
| 5 | Parking & Stopping appears | ✅ |
| 6 | School/Pedestrian/Cyclist is unified | ✅ |
| 7 | Category Core denominators sum to 80 | ✅ |
| 8 | Catalogue counts sum to 155 | ✅ |
| 9 | Reference counts sum to 75 | ✅ |
| 10 | Multiple questions for one concept cannot inflate progress | ✅ |
| 11 | Guide & Information denominator is 3 despite 4 questions | ✅ |
| 12 | Sign Shapes denominator is 6 despite 7 questions | ✅ |
| 13 | Railway uses canonical Core concepts | ✅ |
| 14 | Reference signs never affect progress | ✅ |
| 15 | Existing per-question learner history projects correctly | ✅ |
| 16 | No learner progress is reset | ✅ |
| 17 | No schema migration introduced | ✅ |
| 18 | Progress bar denominator matches displayed coverage | ✅ |
| 19 | Sign taxonomy remains unchanged | ✅ |
| 20 | No questions are changed | ✅ |
| 21 | No artwork is changed | ✅ |
| 22 | Global mastery/progression remains unchanged | ✅ |
| 23 | Mobile layout remains clean | ✅ |
| 24 | Accessibility clearly describes assessed progress | ✅ |
| 25 | `pnpm verify` remains fully green | ✅ |

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    DATA LAYER                                │
│                                                              │
│  learner-scope.json (232 classifications)                   │
│  learner-categories.json (155 sign → category mappings)     │
│  signs-*.json (105 sign questions)                          │
│  progress (per-question stats)                              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              DERIVATION LAYER                                │
│                                                              │
│  src/engine/learning/signCategories.ts                      │
│  ├─ signCategoryLearnProgress()                             │
│  │   ├─ Maps Core concepts → assessment questions           │
│  │   ├─ Checks per-question progress                        │
│  │   ├─ Deduplicates by concept (signId)                    │
│  │   ├─ Computes coverage, accuracy, retention              │
│  │   └─ Derives mastery stage                               │
│  └─ SignCategoryLearnProgress interface                     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      UI LAYER                                │
│                                                              │
│  src/routes/Learn.tsx                                       │
│  ├─ Rules of the Road (unchanged, topic-based)              │
│  └─ Road Signs (new, category-based)                        │
│      ├─ SignCategoryCard component                          │
│      │   ├─ Shows Core progress (seen / total)              │
│      │   ├─ Shows mastery state                             │
│      │   ├─ Optional catalogue breadth                      │
│      │   └─ Progress bar with ARIA                          │
│      └─ 10 canonical categories                             │
└─────────────────────────────────────────────────────────────┘
```

## Key Design Decisions

### 1. Core Concepts as Denominator
**Decision**: Use unique Core concepts, not question count or catalogue size.

**Rationale**: Progress should reflect demonstrated knowledge of concepts, not question exposure. Multiple questions for one concept should not inflate progress.

### 2. Derivation from Existing Evidence
**Decision**: Derive category progress from existing per-question stats.

**Rationale**: No new persistence required. Historical learner data projects automatically. No migration needed.

### 3. Separate from Signs Hub
**Decision**: Learn page shows assessed progress; Signs hub shows study breadth.

**Rationale**: Different surfaces answer different questions. Learn: "How am I progressing through assessed concepts?" Hub: "What signs can I study?"

### 4. Rules Unchanged
**Decision**: Rules section continues using question-topic progression.

**Rationale**: Rules have no separate reference catalogue. Topics directly represent assessed content.

### 5. Honest State Derivation
**Decision**: Use existing mastery thresholds where possible; simplify if too complex.

**Rationale**: Accuracy is more important than preserving old badges. Don't invent new thresholds.

## Conclusion

Priority 6E successfully refreshed the Learn page's Road Signs section, achieving all acceptance criteria:

✅ **Replaced** stale question-topic presentation with 10 canonical categories
✅ **Implemented** Core concept-based progress tracking
✅ **Added** comprehensive test coverage (14 new tests)
✅ **Preserved** existing learner history without migration
✅ **Maintained** separation between assessed progress and study breadth
✅ **Verified** all quality gates pass

The Learn page now clearly communicates:
- **Rules of the Road**: question-topic progression
- **Road Signs**: canonical-category Core concept progression

Learners see honest progress through the 80 assessed Core concepts, presented using the 10 canonical learner categories, while the other 75 Reference signs remain available for study without creating artificial completion requirements.

**Next Steps**: None required. Priority 6E is complete. The full Priority 6 sign system is now complete (6A through 6F).
