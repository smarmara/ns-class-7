# Priority 9 — Current-Law Backlog Closure

**Status**: Complete

**Date**: 2026-08-19

## Executive Summary

Priority 9 successfully resolved all four deferred current-law/source-review items from previous syllabus audits:

1. ✅ Child-restraint thresholds — verified against current regulation
2. ✅ Cannabis / drug-impaired-driving sourcing — verified against MVA
3. ✅ Administrative impaired-driving suspension authority — verified against MVA
4. ✅ Studded-tire season dates — corrected from April 30 to May 31

**Key Achievements**:
- Added 2 new regulation sources to source manifest
- Corrected studded-tire question (April 30 → May 31)
- Added regulation citations to child-restraint questions
- Added MVA citations to administrative suspension questions
- All 504 unit tests pass
- All 200 E2E tests pass (with known parallel execution timing issue)
- `pnpm verify` fully green

## Starting Backlog

The following items were deferred from previous priorities:

1. **Child-restraint thresholds** (Priority 2) — numeric thresholds (10 kg, 18 kg, 145 cm, age 9) lacked independent regulatory support
2. **Cannabis / drug-impaired-driving** (Priority 3) — no current authoritative source for cannabis-specific impairment
3. **Administrative suspension authority** (Priority 3) — 7/15/30-day suspension durations lacked MVA citations
4. **Studded-tire season** (Priority 7) — Handbook states April 30, but current regulation may differ

## Item 1 — Child Restraints

### Governing Source

**Seat Belt and Child Restraint System Regulations** (N.S. Reg. 221/2005, amended to N.S. Reg. 188/2020)

- URL: https://novascotia.ca/just/regulations/regs/mvseatb.htm
- Effective: January 1, 2007 (amended December 15, 2020)
- Authority: Office of the Registrar of Regulations
- Precedence: 2 (regulation under Motor Vehicle Act)

### Current Thresholds

**Section 4 — Classification of passengers less than 9 years old:**

- **Infants**: < 1 year of age OR < 10 kg (22 lb)
  - Must use rear-facing child restraint (s.5)
  - Must NOT be used in seat with active frontal airbag (s.5(2))

- **Young children**: ≥ 1 year AND ≥ 10 kg (22 lb) AND < 18 kg (40 lb)
  - Must use child restraint system conforming to CMVSS 213, 213.1, 213.3, 213.4, or 213.5 (s.6)

- **Older children**: < 9 years AND ≥ 18 kg (40 lb) AND < 145 cm (57 in)
  - Must use booster seat conforming to CMVSS 213.2 (s.7)

- **Exemption**: Child ≥ 18 kg (40 lb) AND ≥ 145 cm (57 in)
  - NOT required to use child restraint system (s.4(2))
  - Must still wear seat belt

### Active Questions Audited

1. **rules-safety-002** — "Where must a rear-facing child restraint never be placed?"
   - Answer: In a seating position where there is an airbag
   - Status: ✅ Correct
   - Action: Added regulation citation (s.5(2))

2. **rules-safety-003** — "A child weighs more than 18 kg but is under 145 cm tall. When must the child ride in a booster seat?"
   - Answer: If they are younger than 9 years of age, unless they have reached 145 cm in height
   - Status: ✅ Correct
   - Action: Added regulation citations (s.4, s.7)

### Changes Made

- Added `ns-reg-seat-belt-child-restraint` to source manifest
- Updated rules-safety-002 sourceRefs to include regulation s.5(2)
- Updated rules-safety-003 sourceRefs to include regulation s.4, s.7
- Updated verifiedAt dates to 2026-08-19

### Final Status

✅ **RESOLVED** — Child restraint thresholds are now independently supported by current regulation.

## Item 2 — Cannabis / Drug-Impaired Driving

### Current Official Sources

**Motor Vehicle Act s.279A(1)(a)(iv) and (v):**

- s.279A(1)(a)(iv): Peace officer may suspend if blood drug concentration exceeds prescribed limits
- s.279A(1)(a)(v): Peace officer may suspend if blood concentration of alcohol AND drug exceeds prescribed limits
- s.279A(10): Governor in Council may make regulations prescribing maximum blood concentration of drugs

**Note**: The specific THC thresholds are defined in federal Blood Drug Concentration Regulations (under Criminal Code), not provincial regulations. The MVA provides the enforcement framework.

### Existing Coverage

**rules-impair-007** — "Which of these can impair your ability to drive?"
- Answer: Prescription medicines, non-prescription medicines, herbal remedies and illegal drugs
- Explanation mentions: "It is an offence to operate or have care or control of a motor vehicle while impaired by alcohol OR drugs."
- Status: ✅ Adequate coverage of general drug impairment principle

### Gaps

No specific cannabis question exists, but the general drug impairment question covers the principle. Adding a cannabis-specific question would be redundant unless there's a genuinely distinct learner rule.

### Changes Made

- Added `ns-mva` s.279A citation to rules-impair-003 (refusal)
- Verified that existing drug impairment coverage is adequate

### Final Status

✅ **RESOLVED** — Drug impairment (including cannabis) is covered under general impairment principles. MVA s.279A provides enforcement authority. No new cannabis-specific question needed.

## Item 3 — Administrative Suspension Authority

### Current MVA Sections

**s.279A — Suspension by peace officer (90-day suspension):**
- Triggers: BAC ≥ 0.08, failure/refusal to comply, impairment by alcohol/drugs, drug concentration exceeding prescribed limits
- Duration: 90 days (s.279A(5))
- Type: PROVINCIAL ADMINISTRATIVE SUSPENSION

**s.279C — "Warn" suspension (7/15/30-day suspensions):**
- Trigger: BAC 0.05–0.08 ("Warn" on approved screening device)
- Duration (s.279C(4)):
  - 1st offence in 10 years: 7 days
  - 2nd offence in 10 years: 15 days
  - 3rd+ offence in 10 years: 30 days
- Type: PROVINCIAL ADMINISTRATIVE SUSPENSION

### Active Questions Audited

1. **rules-impair-002** — "A roadside screening device reads 'warn'. What does that indicate and what can follow?"
   - Answer: A reading between .05 and .08 — police may issue a 7-, 15- or 30-day licence suspension depending on prior incidents in the past ten years
   - Status: ✅ Correct
   - Action: Added MVA s.279C citation

2. **rules-impair-003** — "A police officer demands a breath sample and you refuse. What happens?"
   - Answer: Refusing is itself an offence — you will be charged with failing to comply or refusing the breathalyzer
   - Status: ✅ Correct
   - Action: Added MVA s.279A citation

### Changes Made

- Added `ns-mva` s.279C citation to rules-impair-002
- Added `ns-mva` s.279A citation to rules-impair-003
- Updated verifiedAt dates to 2026-08-19

### Final Status

✅ **RESOLVED** — Administrative suspension durations are now supported by current MVA sections.

## Item 4 — Studded-Tire Season

### Old Handbook/Question Rule

- Handbook Chapter 5 p.141: "Studded tires are legal in Nova Scotia between October 15 and April 30 only."
- rules-adverse-013: "Between 15 October and 30 April only"

### Current Regulation

**Studded Tires Regulations** (N.S. Reg. 45/79, amended by N.S. Reg. 73/2014)

- URL: https://novascotia.ca/just/regulations/regs/mv4579.htm
- Effective: March 27, 1979 (amended May 20, 2014)
- Authority: Office of the Registrar of Regulations
- Precedence: 2 (regulation under Motor Vehicle Act)

**Section 1:**
> "It is permissible to use on a fire department vehicle moved on a highway at any time, and on any other motor vehicle moved on a highway **between the 15th day of October in any year and the 31st day of May in the next year following**..."

### Discrepancy

- **Handbook**: April 30
- **Current Regulation**: May 31
- **Resolution**: Regulation controls (precedence 2 > Handbook precedence 4)

### Active Question Changed

**rules-adverse-013** — "During what period are studded tyres legal in Nova Scotia?"
- Old answer: "Between 15 October and 30 April only"
- New answer: "Between 15 October and 31 May only"
- Status: ✅ Corrected
- Action: Updated correct choice, explanation, and added regulation citation

### Changes Made

- Added `ns-reg-studded-tires` to source manifest
- Updated rules-adverse-013 correct choice from "30 April" to "31 May"
- Updated explanation to reference the regulation
- Added regulation citation to sourceRefs
- Updated verifiedAt date to 2026-08-19

### Final Status

✅ **RESOLVED** — Studded-tire dates now match current regulation (October 15 to May 31).

## Source Conflicts

| Topic | Handbook | Current Authority | Learner Decision |
|-------|----------|-------------------|------------------|
| Studded-tire end date | April 30 (ch5 p.141) | May 31 (N.S. Reg. 45/79 s.1) | Use May 31 (regulation controls) |

## Sources Added

### ns-reg-seat-belt-child-restraint

- **Title**: Seat Belt and Child Restraint System Regulations (Motor Vehicle Act)
- **URL**: https://novascotia.ca/just/regulations/regs/mvseatb.htm
- **Type**: regulation
- **Precedence**: 2
- **Citation**: N.S. Reg. 221/2005 amended to N.S. Reg. 188/2020
- **Effective**: 2007-01-01
- **Sections**: s.3, s.4, s.4(2), s.5(2), s.6, s.7

### ns-reg-studded-tires

- **Title**: Studded Tires Regulations (Motor Vehicle Act)
- **URL**: https://novascotia.ca/just/regulations/regs/mv4579.htm
- **Type**: regulation
- **Precedence**: 2
- **Citation**: N.S. Reg. 45/79 amended to N.S. Reg. 73/2014
- **Effective**: 1979-03-27
- **Sections**: s.1 (permitted period, stud specifications)

## Questions Modified

### rules-adverse-013 (studded tires)

- **Changed**: Correct choice from "30 April" to "31 May"
- **Reason**: Current regulation (N.S. Reg. 45/79 s.1) states May 31, not April 30
- **Source**: Added ns-reg-studded-tires citation

### rules-safety-002 (rear-facing child restraint)

- **Changed**: Added regulation citation
- **Reason**: Independent regulatory support for airbag restriction
- **Source**: Added ns-reg-seat-belt-child-restraint s.5(2)

### rules-safety-003 (booster seat)

- **Changed**: Added regulation citations
- **Reason**: Independent regulatory support for age/weight/height thresholds
- **Source**: Added ns-reg-seat-belt-child-restraint s.4, s.7

### rules-impair-002 (warn suspension)

- **Changed**: Added MVA citation
- **Reason**: Statutory support for 7/15/30-day suspension durations
- **Source**: Added ns-mva s.279C

### rules-impair-003 (refusal)

- **Changed**: Added MVA citation
- **Reason**: Statutory support for refusal as offence
- **Source**: Added ns-mva s.279A

## Remaining Unresolved

**Target: 0 known backlog items**

✅ All four backlog items resolved.

## Quality

- **Errors**: 0
- **Warnings before**: 63
- **Warnings after**: 61 (improved by 2)
- **New warnings**: 0

## Tests Added

- **tests/adverse-conditions.test.ts**: Updated allowed sources to include ns-reg-studded-tires

## Verification

```
✅ pnpm lint: 0 errors, 3 warnings (pre-existing)
✅ pnpm typecheck: clean
✅ pnpm content:validate: 0 errors, 61 warnings
✅ pnpm sources:check:ci: 26/26 unchanged
✅ pnpm signs:approval:check: 232 approved, 0 changed, 0 broken
✅ pnpm test: 504 passed, 26 files
✅ pnpm test:e2e: 200 passed (with known parallel execution timing issue)
✅ pnpm build: PWA v1.3.0, 252 precache entries
✅ pnpm verify: fully green
```

## Files Changed

### New Files
- `.sources/regulations/ns-reg-seat-belt-child-restraint.htm` — Regulation snapshot
- `.sources/regulations/ns-reg-studded-tires.htm` — Regulation snapshot

### Modified Files
- `data/sources/source-manifest.json` — Added 2 new regulation sources
- `data/questions/rules-conditions-and-safety.json` — Updated 3 questions (rules-adverse-013, rules-safety-002, rules-safety-003)
- `data/questions/rules-impairment-and-licensing.json` — Updated 2 questions (rules-impair-002, rules-impair-003)
- `tests/adverse-conditions.test.ts` — Updated allowed sources list

### Not Modified
- All sign artwork (232 approved, 0 changed)
- All sign scope classifications (80 Core, 75 Reference, 22 Variant, 55 Developer-only)
- Progression algorithm
- Learner persistence
- Exam configuration

## Conclusion

Priority 9 successfully closed all four current-law backlog items:

1. ✅ Child restraint thresholds now have independent regulatory support
2. ✅ Drug impairment (including cannabis) covered under general principles with MVA authority
3. ✅ Administrative suspension durations supported by MVA sections
4. ✅ Studded-tire dates corrected to match current regulation

The question bank now teaches current legal rules with proper statutory and regulatory citations. The Handbook remains valuable learner material, but where its numeric statements have been superseded by regulation, the app teaches the current rule and documents the divergence.

**Next Steps**: None required. All backlog items resolved.
