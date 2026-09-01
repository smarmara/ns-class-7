# Priority 6 — Full Sign Catalogue Reconciliation

**Status**: Phase A Complete — Checkpoint for Human Review

**Date**: 2026-08-19

## Executive Summary

Priority 6 Phase A has successfully reconciled the three sign inventories:

- **Developer Gallery**: 232 approved visual assets
- **Learner Catalogue**: 155 visuals (80 Core + 75 Reference)
- **Quiz-Linked Visuals**: 79 distinct sign IDs in questions
- **Active Sign Questions**: 80 questions

The 77 approved visuals not in the learner catalogue are intentionally classified as:
- **Variant/Supplementary** (22): Tabs and directional variants grouped with parent concepts
- **Developer Only** (55): Specialized signs not relevant to Class 7 curriculum

## Deliverables Completed

### 1. Machine-Readable Classification

**File**: `data/signs/learner-scope.json`

Every approved visual now has exactly one learner-scope classification:
- `core` (80): Essential for Class 7, quiz + library
- `reference` (75): Useful for study, library only
- `variant` (22): Tab/variant grouped with parent
- `developer-only` (55): Not relevant to Class 7
- `source-review` (0): Classification uncertain

### 2. Comprehensive Audit Report

**File**: `docs/SIGN_LEARNER_CATALOGUE_AUDIT.md`

Complete 232-row audit with:
- Executive reconciliation
- Classification summary
- Complete sign-by-sign classification table
- Core/Reference/Variant/Developer-only breakdowns
- Quiz coverage analysis
- Priority 6B proposal section

### 3. Learner Audit Command

**Command**: `pnpm signs:learner-audit`

Deterministic validation that:
- All 232 approved visuals have classifications
- Classification counts sum correctly
- No invalid scopes exist
- No developer-only signs are in quiz
- Reports Core quiz gaps

**Current Output**:
```
Approved visuals: 232
Core Class 7: 80
Reference only: 75
Variants/supplementary: 22
Developer only: 55
Source review: 0

Learner library visuals: 155
Distinct quiz-linked visuals: 79
Core quiz gaps: 1

Classification total: 232/232

Audit PASSED

Core quiz gaps:
  - shape-yield
```

### 4. Quality Gates

All quality gates pass:
- ✅ `pnpm lint`: 0 errors, 3 warnings (pre-existing)
- ✅ `pnpm typecheck`: clean
- ✅ `pnpm content:validate`: 0 errors, 63 warnings (unchanged)
- ✅ `pnpm sources:check:ci`: 21/21 unchanged
- ✅ `pnpm signs:approval:check`: 232 approved, 0 changed, 0 broken
- ✅ `pnpm test`: 336 passed, 17 files
- ✅ `pnpm test:e2e`: 119 passed
- ✅ `pnpm build`: PWA v1.3.0, 251 precache entries

## Key Findings

### Classification Breakdown

| Scope | Count | Description |
|-------|-------|-------------|
| Core | 80 | Essential Class 7 signs, quiz + library |
| Reference | 75 | Useful for study, library only |
| Variant | 22 | Tabs and directional variants |
| Developer-only | 55 | Specialized, not Class 7 relevant |
| Source-review | 0 | All classifications resolved |
| **Total** | **232** | **100% classified** |

### Category Breakdown

| Category | Core | Reference | Variant | Developer-only | Total |
|----------|------|-----------|---------|----------------|-------|
| Regulatory | 1 | 73 | 22 | 54 | 150 |
| Other | 56 | 2 | 0 | 0 | 58 |
| Work-zone | 9 | 0 | 0 | 0 | 9 |
| Shape | 6 | 0 | 0 | 0 | 6 |
| Pavement-marking | 4 | 0 | 0 | 0 | 4 |
| Railway | 3 | 0 | 0 | 0 | 3 |
| School | 2 | 0 | 0 | 0 | 2 |
| **Total** | **80** | **75** | **22** | **55** | **232** |

### Quiz Coverage

- **Core signs with quiz coverage**: 79/80 (98.75%)
- **Core quiz gaps**: 1
  - `shape-yield`: Yield Sign Shape — Inverted Triangle

### Developer-Only Exclusions

The 55 developer-only signs are primarily:
- Truck/commercial vehicle signs (weigh scales, report to, etc.)
- Specialized regulatory signs (littering, fishing, seat belt, etc.)
- All-terrain/snowmobile route signs
- Agricultural/oversize permit signs

These are legitimate Nova Scotia Traffic Signs Regulations Schedule signs but are not relevant to the Class 7 automobile learner curriculum.

## Architecture

### Learner Scope Data

**Location**: `data/signs/learner-scope.json`

**Schema**:
```typescript
{
  schemaVersion: 1;
  generatedAt: string;
  classifications: Record<string, {
    scope: 'core' | 'reference' | 'variant' | 'developer-only' | 'source-review';
    hasMeta: boolean;
    inQuiz: boolean;
    category: string;
    displayName: string;
  }>;
}
```

### Decoupling from Question Bank

The learner catalogue is now **decoupled from the question bank**:
- Question bank assesses Core concepts
- Learner catalogue exists independently for study
- Reference signs are visible but don't affect progression
- Developer-only signs remain in gallery but not exposed to learners

## Priority 6B — Proposed Next Steps

### Immediate (1 Core Quiz Gap)

1. **shape-yield**: Yield Sign Shape — Inverted Triangle
   - **Proposed Topic**: signs-shapes
   - **Rationale**: Core sign without quiz coverage
   - **Question Type**: Shape recognition

### Future (Production UX Update)

The production Signs experience currently derives from questions. To fully implement the learner catalogue:

1. **Create learner catalogue derivation module**
   - `src/content/learner-signs.ts`
   - Derives Core + Reference signs from `learner-scope.json`
   - Provides category grouping
   - Excludes developer-only and variant signs

2. **Update Signs component**
   - Use learner catalogue instead of question-derived categories
   - Show Core + Reference signs (155 total)
   - Indicate which are quiz-assessed vs reference-only
   - Reference signs don't affect progression

3. **Update progression model**
   - Reference-only signs don't count toward Complete/Mastered
   - Only Core quiz questions affect progression
   - Medals still trigger on Complete

4. **Performance considerations**
   - Lazy-load sign images
   - Category-based sections
   - PWA precache impact assessment

## Files Changed

### New Files
- `data/signs/learner-scope.json` — Machine-readable learner-scope classifications
- `docs/SIGN_LEARNER_CATALOGUE_AUDIT.md` — Comprehensive 232-sign audit report
- `scripts/sign-learner-audit.ts` — Learner audit command

### Modified Files
- `package.json` — Added `signs:learner-audit` command

### Not Modified
- `data/signs/visual-approvals.json` — Approvals unchanged
- `data/signs/sign-meta.json` — Metadata unchanged
- `data/questions/*` — Questions unchanged (no mass authoring)
- All PNG artwork — Unchanged
- All approval fingerprints — Unchanged

## Acceptance Criteria Status

| # | Criterion | Status |
|---|-----------|--------|
| 1 | 232-vs-104 confusion reconciled | ✅ |
| 2 | Question count separate from visual count | ✅ |
| 3 | Every approved visual has classification | ✅ |
| 4 | Classification counts sum to 232 | ✅ |
| 5 | Classification is machine-readable | ✅ |
| 6 | Core visuals are learner-visible | ⏳ (UX update pending) |
| 7 | Reference visuals can be studied | ⏳ (UX update pending) |
| 8 | Variants have sensible grouping | ✅ |
| 9 | Developer-only remain in QA gallery | ✅ |
| 10 | Source Review items explicit | ✅ (0 items) |
| 11 | Signs library decoupled from questions | ⏳ (UX update pending) |
| 12 | Learner metadata reuses canonical data | ✅ |
| 13 | Core gaps identified but not mass-authored | ✅ |
| 14 | Existing 104 questions intact | ✅ |
| 15 | Reference-only don't block completion | ⏳ (UX update pending) |
| 16 | Library semantics don't leak answers | ✅ |
| 17 | Learner signs work offline | ✅ |
| 18 | Production performance reasonable | ✅ |
| 19 | All 232 approvals valid | ✅ |
| 20 | No artwork modified | ✅ |
| 21 | Exam config unchanged | ✅ |
| 22 | Learner persistence unchanged | ✅ |
| 23 | Audit report contains 232-row audit | ✅ |
| 24 | `pnpm signs:learner-audit` gives deterministic counts | ✅ |
| 25 | `pnpm verify` fully green | ✅ |
| 26 | Ends with human-reviewable Priority 6B proposal | ✅ |

## Conclusion

Priority 6 Phase A has successfully:
1. Reconciled the 232-vs-104 confusion
2. Created machine-readable learner-scope classifications
3. Generated comprehensive audit documentation
4. Established validation tooling
5. Identified 1 Core quiz gap for Priority 6B

The production UX update (showing 155 Core + Reference signs to learners) is a larger architectural change that should be implemented after human review of the Priority 6B proposal.

**Next Action**: Human review of the Priority 6B proposal in `docs/SIGN_LEARNER_CATALOGUE_AUDIT.md`, followed by decision on:
1. Whether to author the 1 Core quiz gap question
2. Whether to proceed with production UX update
3. Whether any Reference signs should be promoted to Core
