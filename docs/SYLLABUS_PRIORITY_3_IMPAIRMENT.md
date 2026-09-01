# Syllabus Priority 3 — Driving and Impairment

Completed 2026-08-19. Closes the gap between the Driver's Handbook Chapter 6
("Driving and Impairment", pp. 151–163) and the question bank that is supposed
to test it.

Every concept below is taken from the **Driver's Handbook, Chapter 6**
(repository snapshot `data/sources/snapshots/ns-handbook-ch6.txt`). Page
citations use the running-footer convention: content appearing on the page
whose footer reads *Driving and Impairment N* is cited as page N.

## Source scope

### Sources inspected

- `ns-handbook-ch6` — Chapter 6 body text (pp. 151–163), precedence 4
- `ns-handbook-ch1` — GDL alcohol restrictions, precedence 4
- `ns-handbook-intro-amendments` — Restricted Individual stage, precedence 3
- `ns-mva` — s.100A novice zero blood alcohol, s.100D cell phones, precedence 1
- `ns-handbook-ch4` — Collision causes table (alcohol row), precedence 4

### No new sources added

The existing tracked sources are sufficient for every concept in this chapter.
Cannabis and current federal Criminal Code impaired-driving provisions are
**not** tracked in the source manifest and are recorded as SOURCE REVIEW
REQUIRED below.

### Source limitations

- The Handbook's Chapter 6 text was last modified 2021-08-16 (per HTTP
  headers). It may predate some current federal Criminal Code amendments
  (e.g. the 2018 changes to impaired-driving law).
- The Handbook references the "SL2 unit" for roadside screening — this is
  obsolete equipment terminology. The current Criminal Code uses "approved
  screening device". Existing questions correctly avoid the SL2 name.
- The Handbook does not mention cannabis at all.

## Before

| | |
| --- | ---: |
| Total active questions | 280 |
| Rules pool | 176 |
| Impairment-topic questions | 11 |
| Questions citing Chapter 6 | 9 |
| Chapter 6 page coverage | 7/15 (47%) |

## After

| | |
| --- | ---: |
| Total active questions | **282** |
| Rules pool | **178** |
| Impairment-topic questions | **13** |
| Questions citing Chapter 6 | **11** |
| Chapter 6 page coverage | **10/15 (67%)** |

The five remaining uncited pages (149, 150, 151, 152, 158) are each
NOT-SUITABLE — see *Exclusions* below.

## Concept inventory

| Concept | Page(s) | Claim type | Existing question(s) | Coverage | Current-law check | Decision |
| --- | --- | --- | --- | --- | --- | --- |
| Factors affecting impairment (age, gender, condition, emotion, food, interactions) | 152 | SAFETY PRINCIPLE | — | PARTIALLY COVERED | No | NOT SUITABLE — too general for single-best-answer |
| Alcohol-induced impairment begins with the first drink | 152 | SAFETY PRINCIPLE | rules-impair-001 (explanation) | WELL COVERED | No | ALREADY COVERED in rules-impair-001 explanation |
| Legal impairment = BAC ≥ .08 | 152 | FEDERAL CRIMINAL LAW | rules-impair-001 | WELL COVERED | Yes — Criminal Code s.320.14 | ALREADY COVERED |
| Can be charged/convicted below .08 if showing symptoms | 152 | FEDERAL CRIMINAL LAW | rules-impair-001 (explanation) | WELL COVERED | Yes | ALREADY COVERED |
| Time is the only way to remove alcohol | 153 | SAFETY PRINCIPLE | rules-impair-004 | WELL COVERED | No | ALREADY COVERED |
| Liver breaks down alcohol at .015 mg/hr | 153 | SAFETY PRINCIPLE | — | NOT SUITABLE | No | NOT SUITABLE — numeric trivia |
| Standard drink definitions (340 ml beer, 43 ml spirits, 142 ml wine) | 153 | SAFETY PRINCIPLE | rules-impair-005 | WELL COVERED | No | ALREADY COVERED |
| Coffee/showers/exercise do not sober you up | 153 | SAFETY PRINCIPLE | rules-impair-004 | WELL COVERED | No | ALREADY COVERED |
| Roadside screening (two-step process) | 153–154 | PROVINCIAL ADMINISTRATIVE LAW | rules-impair-002 | WELL COVERED | No | ALREADY COVERED |
| Pass/warn/fail results | 154 | PROVINCIAL ADMINISTRATIVE LAW | rules-impair-002 | WELL COVERED | No | ALREADY COVERED |
| Warn = .05–.08, 7/15/30-day suspensions | 154 | PROVINCIAL ADMINISTRATIVE LAW | rules-impair-002 | WELL COVERED | SOURCE REVIEW | ALREADY COVERED — see Source Review |
| Fail leads to arrest and breathalyzer | 154 | PROVINCIAL ADMINISTRATIVE LAW | rules-impair-002 (explanation) | WELL COVERED | No | ALREADY COVERED |
| Refusal is an offence | 154 | FEDERAL CRIMINAL LAW | rules-impair-003 | WELL COVERED | Yes | ALREADY COVERED |
| 1994 survey: 44% of injured drivers had been drinking | 154 | HISTORICAL | — | NOT TESTED | No | HISTORICAL — DO NOT TEST |
| 82% of drinking drivers were legally impaired | 154 | HISTORICAL | — | NOT TESTED | No | HISTORICAL — DO NOT TEST |
| 10% of nighttime drivers have been drinking | 154 | HISTORICAL | — | NOT TESTED | No | HISTORICAL — DO NOT TEST |
| Drug impairment: prescription, non-prescription, herbal, illegal | 155 | SAFETY PRINCIPLE | rules-impair-007 | WELL COVERED | No | ALREADY COVERED |
| Drinking + drugs = serious impairment | 155 | SAFETY PRINCIPLE | rules-impair-007 (explanation) | WELL COVERED | No | ALREADY COVERED |
| List of specific drug categories that affect driving | 155 | SAFETY PRINCIPLE | — | NOT SUITABLE | No | NOT SUITABLE — disease list memorization |
| Criminal Code offence: impaired by alcohol or drugs | 155 | FEDERAL CRIMINAL LAW | rules-impair-007 (explanation) | PARTIALLY COVERED | Yes | ALREADY COVERED in explanation |
| Penalties: fine up to $2000, prison up to life for death | 155 | FEDERAL CRIMINAL LAW | — | NOT SUITABLE | Yes | NOT SUITABLE — penalty detail too granular |
| Prohibited from driving 1 year to life | 155 | FEDERAL CRIMINAL LAW | — | NOT SUITABLE | Yes | NOT SUITABLE — penalty detail |
| Administrative Licence Suspension: 3-month for fail/refusal | 156 | PROVINCIAL ADMINISTRATIVE LAW | rules-impair-003 (explanation) | PARTIALLY COVERED | SOURCE REVIEW | ALREADY COVERED in explanation |
| .05–.08: removed from road, minimum 7-day suspension | 156 | PROVINCIAL ADMINISTRATIVE LAW | rules-impair-002 | WELL COVERED | SOURCE REVIEW | ALREADY COVERED |
| 1st offence: 1-year revocation, Alcohol Assessment Program | 156–157 | PROVINCIAL ADMINISTRATIVE LAW | rules-impair-006 | WELL COVERED | No | ALREADY COVERED |
| 2nd offence: 14+ days prison, 3-year revocation | 157 | PROVINCIAL ADMINISTRATIVE LAW | — | NOT SUITABLE | Yes | NOT SUITABLE — penalty schedule detail |
| 3rd offence: 90+ days prison, indefinite (min 10 years) | 157 | PROVINCIAL ADMINISTRATIVE LAW | — | NOT SUITABLE | Yes | NOT SUITABLE — penalty schedule detail |
| 4th offence: permanent revocation | 157 | PROVINCIAL ADMINISTRATIVE LAW | — | NOT SUITABLE | Yes | NOT SUITABLE — penalty schedule detail |
| GDL suspension: must restart 2-year program | 157 | PROVINCIAL LICENCE CONDITION | rules-gdl-006 (related) | PARTIALLY COVERED | No | ALREADY COVERED in GDL context |
| Responsible host/hostess guidance | 157–158 | GENERAL SAFETY ADVICE | — | NOT SUITABLE | No | NOT SUITABLE — harm-reduction advice, not testable |
| Guidelines for issuing a licence / fitness to drive | 158–159 | PROVINCIAL ADMINISTRATIVE LAW | — | UNCOVERED | No | ADD QUESTION → rules-impair-013 |
| Medical conditions may require Driver's Medical Examination Report | 159–160 | PROVINCIAL ADMINISTRATIVE LAW | — | UNCOVERED | No | ADD QUESTION → rules-impair-013 |
| List of medical conditions (vision, substance abuse, diabetes, etc.) | 160 | MEDICAL / FITNESS-TO-DRIVE | — | NOT SUITABLE | No | NOT SUITABLE — disease list memorization |
| Commercial drivers must file medical report every 5 years (annually after 64) | 160 | PROVINCIAL ADMINISTRATIVE LAW | — | NOT SUITABLE | No | NOT SUITABLE — commercial-licence detail |
| Emotional and physical stress: avoid driving, take a walk, stay off road | 160–161 | SAFETY PRINCIPLE | — | UNCOVERED | No | ADD QUESTION → rules-impair-012 |
| Aggressive driving won't get you there sooner | 161 | SAFETY PRINCIPLE | — | NOT SUITABLE | No | NOT SUITABLE — general advice |
| Vision standards: Class 1/2/4 vs Class 3/5/6/7/8 | 161–162 | PROVINCIAL ADMINISTRATIVE LAW | rules-gdl-015 | WELL COVERED | No | ALREADY COVERED |
| Hearing: commercial vehicle, forced whisper at 5 feet | 162 | PROVINCIAL ADMINISTRATIVE LAW | — | NOT SUITABLE | No | NOT SUITABLE — commercial-licence detail |
| Driver fatigue: unsafe to drive when overtired | 162–163 | SAFETY PRINCIPLE | rules-impair-009 | WELL COVERED | No | ALREADY COVERED |
| Never use cruise control when overtired | 163 | SAFETY PRINCIPLE | rules-impair-009 | WELL COVERED | No | ALREADY COVERED |
| Highway hypnosis | 163 | SAFETY PRINCIPLE | rules-impair-009 (explanation) | WELL COVERED | No | ALREADY COVERED |

## Alcohol and BAC

The app now distinguishes three separate propositions:

### A. Impairment begins with the first drink

`rules-impair-001` explanation states: "Alcohol-induced impairment begins
with the first drink." This is a SAFETY PRINCIPLE — no numeric threshold
implies a safe level.

**COVERED + CURRENTLY VERIFIED** — the Handbook (p. 152) and the Criminal
Code both support this.

### B. Criminal BAC threshold (.08)

`rules-impair-001` asks "At what blood-alcohol content is a driver legally
impaired?" with answer ".08 per cent or more — though you can be charged and
convicted below this level if you show other symptoms of impairment."

This correctly teaches:
1. .08 is the legal impairment definition
2. You can be charged below .08
3. Impairment begins with the first drink

**COVERED + CURRENTLY VERIFIED** — Criminal Code s.320.14(1)(a) establishes
.08 as the offence threshold. The question wording does not imply that
drinking below .08 is safe.

### C. Class 7 / GDL zero-alcohol requirement

`rules-gdl-003` asks about the learner's blood-alcohol level (zero).
`rules-gdl-013` covers the restricted individual stage (zero alcohol or
drugs).

These are separate from the general BAC offence and cite `ns-mva` s.100A
(precedence 1) and `ns-handbook-intro-amendments` (precedence 3).

**COVERED + CURRENTLY VERIFIED** — MVA s.100A establishes zero BAC for novice
drivers.

### Administrative thresholds (.05 warn)

`rules-impair-002` teaches the warn range (.05–.08) and the suspension
consequences (7/15/30 days). This is provincial administrative law, not
criminal law. The question correctly frames it as what the screening device
indicates and what can follow, not as a "safe" level.

**COVERED — HANDBOOK SAFETY PRINCIPLE** — the underlying provincial
regulation is not tracked as a separate source, but the Handbook (p. 154,
156) states these figures and no higher authority contradicts them.

## Enforcement / testing

### Roadside screening

`rules-impair-002` covers the pass/warn/fail system correctly. The Handbook
mentions the "SL2 unit" but the question correctly uses "roadside screening
device" — avoiding obsolete equipment terminology.

**COVERED + CURRENTLY VERIFIED** — the legal obligation to provide a breath
sample when demanded is current.

### Breath testing

The two-step process (screening then breathalyzer) is covered in
`rules-impair-002` explanation.

**COVERED — HANDBOOK PROCEDURE**

### Refusal

`rules-impair-003` covers refusal as an offence, citing both the Handbook
and the Administrative Licence Suspension Program.

**COVERED + CURRENTLY VERIFIED** — refusal is a Criminal Code offence
(s.320.15) and triggers administrative suspension.

### Administrative / criminal consequences

`rules-impair-006` covers first-offence penalties (1-year revocation).
`rules-impair-003` explanation mentions the 3-month ALS suspension.

**COVERED — HANDBOOK PROCEDURE** — penalty schedules for 2nd/3rd/4th
offences are deliberately excluded as too granular for Class 7.

### Old device terminology

The Handbook's "SL2 unit" is not taught in any question. The term is
equipment-specific and has been superseded by "approved screening device" in
current Criminal Code terminology.

**CORRECTLY EXCLUDED**

## Drugs and medication

`rules-impair-007` covers drug impairment comprehensively: prescription
medicines, non-prescription medicines, herbal remedies, and illegal drugs.
The explanation lists specific drug categories (pain killers,
antidepressants, anti-nausea, antihistamines, sedatives, muscle relaxants)
from the Handbook.

**COVERED + CURRENTLY VERIFIED** — the Handbook (p. 155) lists these
categories. The question correctly teaches that all of these can impair
driving, not just illegal drugs.

### Cannabis

The Handbook does **not** mention cannabis. This is a genuine gap in the
official Class 7 study material. However, no authoritative current source
for cannabis-impaired-driving law is tracked in the source manifest.

**SOURCE REVIEW REQUIRED** — see below.

## Fatigue / emotional / physical condition

### Fatigue

`rules-impair-009` covers fatigue: never use cruise control when overtired,
highway hypnosis, know when to pull over and stop.

**COVERED + CURRENTLY VERIFIED** — Handbook p. 163.

### Emotional and physical stress

**NEW** — `rules-impair-012` covers the Handbook's advice: if you are angry
or excited, stay off the road until you can give driving your full
attention. If under emotional or physical stress, avoid driving and choose
another competent driver.

**COVERED + CURRENTLY VERIFIED** — Handbook p. 161.

## Medical fitness

**NEW** — `rules-impair-013` covers the concept that a medical condition
affecting safe operation may require a Driver's Medical Examination Report,
and that Service Nova Scotia may refuse to issue or renew a licence if there
are concerns about ability to operate a vehicle.

**COVERED — HANDBOOK PROCEDURE** — Handbook pp. 159–160. The specific list
of medical conditions is deliberately excluded as disease-list
memorization.

## Historical material

The following material from Chapter 6 is deliberately excluded:

| Material | Page | Reason |
| --- | --- | --- |
| 1994 survey: 44% of injured drivers had been drinking | 154 | HISTORICAL — statistic from a 30+ year old study |
| 82% of drinking drivers were legally impaired | 154 | HISTORICAL — same survey |
| 10% of nighttime drivers have been drinking | 154 | HISTORICAL — same survey |
| 3% are legally impaired at nighttime | 154 | HISTORICAL — same survey |

The underlying qualitative principle ("alcohol is overrepresented in serious
collisions") is already taught by `rules-impair-010` (alcohol collision
cause from Chapter 4).

## General safety / host material

The responsible host/hostess guidance (pp. 157–158) is classified NOT
SUITABLE. It is harm-reduction advice (offer non-alcoholic alternatives,
serve food early, close the bar early, support designated drivers) that does
not translate into testable Class 7 knowledge. The underlying principle —
prevent an impaired person from driving — is already assessed by
`rules-impair-010`.

## Genuine gaps

Two genuine gaps were identified and closed:

### 1. Emotional and physical stress

- **Concept**: If under emotional or physical stress, avoid driving; if
  angry or excited, stay off the road until you can focus
- **Source**: ns-handbook-ch6 p. 161
- **Why it matters**: Strong emotions impair driving ability; the Handbook
  gives specific advice that a Class 7 learner should know
- **Question added**: `rules-impair-012` (medium difficulty)

### 2. Medical fitness to drive

- **Concept**: A medical condition affecting safe operation may require a
  Driver's Medical Examination Report; Service Nova Scotia can refuse to
  issue or renew a licence
- **Source**: ns-handbook-ch6 pp. 159–160
- **Why it matters**: Learners need to know that medical fitness is a
  licensing requirement, not just a personal health matter
- **Question added**: `rules-impair-013` (medium difficulty)

## Existing questions corrected

No existing questions required material correction. The audit found:

- All impairment-topic questions correctly cite their sources
- Legal wording is accurate (BAC .08, refusal as offence, zero BAC for GDL)
- Obsolete "SL2 unit" terminology is correctly avoided
- No duplicate concepts within the topic
- Topic placement is appropriate for all questions
- Distractors remain defensible

The Priority 2 fix to `rules-impair-010` (retargeted from duplicate to
alcohol collision cause) is preserved.

## Source Review Required

### Cannabis

The Handbook does not mention cannabis. Current federal law (Criminal Code
s.320.14) establishes per-se limits for THC (2 ng/mL and 5 ng/mL blood),
but these provisions are not tracked in the source manifest.

**Status**: SOURCE REVIEW REQUIRED

**Action**: No question authored. If a current authoritative source for
cannabis-impaired-driving law is added to the manifest, a question can be
authored. The existing `rules-impair-007` (drug impairment) covers the
general principle that illegal drugs impair driving.

### Administrative suspension thresholds

The Handbook states the warn range (.05–.08) and suspension periods
(7/15/30 days) but the underlying provincial regulation is not tracked as a
separate source. The Handbook is at precedence 4; the actual regulation
would be at precedence 2.

**Status**: SOURCE REVIEW REQUIRED (low risk — no higher authority
contradicts the Handbook figures)

**Action**: Existing questions retained as-is. The figures are taught in the
Handbook and no contradiction is known.

## Current-law verification

### Official sources used

| Source | Precedence | Role |
| --- | --- | --- |
| ns-mva | 1 | Class 7 zero BAC (s.100A), cell phone offence (s.100D) |
| ns-handbook-intro-amendments | 3 | Restricted Individual stage GDL restrictions |
| ns-handbook-ch6 | 4 | All impairment concepts except GDL-specific |
| ns-handbook-ch1 | 4 | GDL learner restrictions |
| ns-handbook-ch4 | 4 | Collision causes table (alcohol row) |

### No new source-manifest entries

All concepts are covered by existing tracked sources.

### Unresolved legal items

1. **Cannabis** — not in Handbook, no tracked federal source
2. **Administrative suspension regulation** — Handbook figures not verified
   against the actual provincial regulation

## Questions

### Added

| ID | Topic | Concept | Source | Difficulty |
| --- | --- | --- | --- | --- |
| rules-impair-012 | impairment | Emotional/physical stress: stay off road if angry | ns-handbook-ch6 p. 161 | medium |
| rules-impair-013 | impairment | Medical fitness: Driver's Medical Examination Report | ns-handbook-ch6 pp. 159–160 | medium |

### Modified

None.

### Removed

None.

## Alcohol / BAC distinction

The app now clearly distinguishes:

1. **Impairment begins with the first drink** — safety principle, no safe
   threshold (rules-impair-001 explanation)
2. **Criminal BAC offence at .08** — federal law, but can be charged below
   .08 if showing symptoms (rules-impair-001)
3. **Class 7 / GDL zero alcohol** — provincial licence condition, separate
   from criminal threshold (rules-gdl-003, rules-gdl-013)
4. **Administrative warn at .05** — provincial administrative consequence,
   not a "safe" level (rules-impair-002)

No question implies that driving below any numeric threshold is safe.

## Quality

### Validation

| Gate | Result |
| --- | --- |
| content:validate | 0 errors, 63 warnings (unchanged) |
| content:quality | wrote reports |
| content:syllabus | ch6 citations 9 → 11; 282 active questions; ch6 page coverage 10/15 (67%) |
| content:progression | 31 topics, 0 unreachable |
| sources:check:ci | 19/19 unchanged |
| signs:approval:check | 232/232 approved, 0 changed, 0 broken |
| test | 336 passed, 17 files |
| test:e2e | 119 passed |
| build | PWA v1.3.0, 251 precache entries |

### New warnings introduced

- choice-length-tell: 0 new (still 59 total)
- authoring-position: 0 new (still 4 total, all pre-existing)

### Duplicate concepts discovered

None. The Priority 2 fix to `rules-impair-010` resolved the only genuine
duplicate.

## Progression

`pnpm content:progression`: 31 topics, 0 Complete unreachable, 0 Mastered
unreachable.

## Sign integrity

`pnpm signs:approval:check`: 232 approved, 0 changed, 0 broken.

## Verification

`pnpm verify`: fully green.

## Files

### Materially changed

- `data/questions/rules-impairment-and-licensing.json` — added rules-impair-012 and rules-impair-013
- `docs/SYLLABUS_PRIORITY_3_IMPAIRMENT.md` — this report

### Generated (not material)

- `reports/syllabus-coverage.md` — updated by `pnpm content:syllabus`
- `reports/topic-progression.md` — updated by `pnpm content:progression`

## Explicit current-law checklist

| Concept | Status |
| --- | --- |
| General alcohol impairment | COVERED + CURRENTLY VERIFIED |
| BAC definition | COVERED + CURRENTLY VERIFIED |
| Criminal BAC threshold wording | COVERED + CURRENTLY VERIFIED |
| Class 7 / GDL alcohol restriction | COVERED + CURRENTLY VERIFIED |
| Lower administrative thresholds (.05 warn) | COVERED — HANDBOOK SAFETY PRINCIPLE |
| Roadside screening | COVERED + CURRENTLY VERIFIED |
| Breath testing | COVERED — HANDBOOK PROCEDURE |
| Refusal | COVERED + CURRENTLY VERIFIED |
| Licence suspension / consequences | COVERED — HANDBOOK PROCEDURE |
| Cannabis | SOURCE REVIEW REQUIRED |
| Other drugs (illegal) | COVERED + CURRENTLY VERIFIED |
| Prescription medication | COVERED + CURRENTLY VERIFIED |
| Over-the-counter medication | COVERED + CURRENTLY VERIFIED |
| Fatigue / drowsiness | COVERED + CURRENTLY VERIFIED |
| Anger / stress / emotional state | COVERED + CURRENTLY VERIFIED |
| Physical fitness | COVERED — HANDBOOK PROCEDURE |
| Medical conditions / fitness to drive | COVERED — HANDBOOK PROCEDURE |
