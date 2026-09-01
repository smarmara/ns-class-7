# Syllabus Priority 8 — Licensing

Completed 2026-08-19. A concept-completeness and current-law audit of Chapter 1.

Two headline results:

1. **The app's mock-test configuration matches the current official Class 7 test
   exactly** — verified against the live Government of Nova Scotia test page, not
   the Handbook. No `MOCK CONFIG REVIEW REQUIRED`.
2. **The Handbook's road-test waiting period needed current-source review.**
   Resolved by **Priority 8A** (section at the end of this document): current
   RMV guidance sets a 12-month minimum practice period, reduced to 9 months
   with an approved driver education course, and `rules-gdl-005` was updated.

## Source scope

| Source | Use |
| --- | --- |
| `ns-handbook-ch1` | Read in full — pages 1–36; pages 2–36 carry content (35 pages) |
| `ns-handbook-intro-amendments` | Chapter 1 amendment block read in full — the April 2015 GDL changes |
| `ns-class7-test-page` | Read in full — current official knowledge-test process and eligibility |
| `ns-mva` | s. 70A (newly licensed driver) verified for stage duration and exit conditions |
| `ns-reg-classification-drivers-licences` | Class 5 minimum requirements; current to N.S. Reg. 163/2024 |

**No new source-manifest entries were added during Priority 8.** Priority 8A
subsequently added three current RMV pages — `ns-rmv-gdl-system`,
`ns-rmv-who-takes-exam` and `ns-rmv-point-system` — to resolve the open items.

### Source limitations

- The Classification Regulations snapshot does not carry the supervising-driver
  rule, so that requirement rests on the Handbook plus the 2015 amendment.
- The MVA snapshot contains no "graduated licensing" waiting-period provision;
  the period is set by regulation, which is where the conflict below lives.

## Before

Derived from the repository.

| | |
| --- | ---: |
| Active questions | 294 |
| Rules pool | 189 |
| Sign pool | 105 |
| Graduated Licensing topic | 18 |
| Questions citing `ns-handbook-ch1` | 15 |
| Chapter 1 pages cited | 16 / 35 |
| Content errors | 0 |
| Content warnings | 63 |

The brief's approximate figures (15 Chapter 1 questions, 16/36 pages, 18 GDL
questions) were still accurate; the chapter has 35 content pages, not 36.

## Concept inventory

| Concept | Page(s) | Claim Type | Current Authority | Existing Question(s) | Coverage | Decision |
| --- | --- | --- | --- | --- | --- | --- |
| RMV issues, renews and suspends licences under the MVA | 2 | GENERAL EXPLANATION | MVA | — | none | SUPPORTING LICENSING INFORMATION — DO NOT TEST |
| Licence must match the vehicle type; Class 5 is the passenger-vehicle licence | 2 | LICENCE CLASSIFICATION | Classification Regs | rules-gdl-002 | partial | SUPPORTING LICENSING INFORMATION — DO NOT TEST |
| GDL applies to all new drivers regardless of age | 2, 18 | GENERAL EXPLANATION | Handbook | rules-gdl-012 | partial | SUPPORTING LICENSING INFORMATION — DO NOT TEST |
| **GDL has three stages** (learner → newly licensed → restricted individual) | 2 + amendment V | LICENCE CLASSIFICATION | 2015 amendment | rules-gdl-012 | strong | GDL CORE — WELL COVERED |
| Motorcycles follow a parallel GDL pathway | 2, 18 | LICENCE CLASSIFICATION | Handbook | — | none | OTHER LICENCE CLASS — OUT OF SCOPE |
| **Visitors/new residents: 90 days with a valid out-of-province licence, 16+** | 4 | AGE / EXPERIENCE | Handbook | rules-gdl-016 | strong | CLASS 7 CORE — WELL COVERED |
| Out-of-province plates: 90 days visitor / 30 days new resident | 4 | ADMINISTRATIVE PROCESS | Handbook | — | none | ADMINISTRATIVE PROCESS — DO NOT TEST |
| Three applicant groups; expired-licence rules (3 years / 2 full years) | 4–5 | ADMINISTRATIVE PROCESS | Handbook | — | none | ADMINISTRATIVE PROCESS — DO NOT TEST |
| Licence exchange rules for Canada / USA / other countries | 5–6 | ADMINISTRATIVE PROCESS | Handbook | — | none | ADMINISTRATIVE PROCESS — DO NOT TEST |
| **Minimum age 16 to apply for Class 7** | 6, 35 | AGE / EXPERIENCE | Test page + Classification Regs | rules-gdl-014 | strong | CLASS 7 CORE — WELL COVERED |
| **Written parental/guardian consent if 16 or 17** | 6, 35 | DOCUMENT REQUIREMENT | Test page + Classification Regs | rules-gdl-014 | strong | CLASS 7 CORE — WELL COVERED |
| Who may sign the consent (parent, guardian, employer, spouse over 18) | 7 | ADMINISTRATIVE PROCESS | Handbook | — | none | ADMINISTRATIVE PROCESS — DO NOT TEST |
| Self-reflection questions for young applicants | 7 | GENERAL EXPLANATION | Handbook | — | none | NOT SUITABLE FOR KNOWLEDGE TEST |
| **Knowledge test: two parts, 20 questions each, 16 to pass** | 7, 9 | TEST ELIGIBILITY | **Test page (current)** | — | none | SUPPORTING LICENSING INFORMATION — DO NOT TEST |
| Test booking, phone numbers, first-come-first-served | 7 | VOLATILE FEE / PROCESS | superseded by test page | — | none | ADMINISTRATIVE PROCESS — DO NOT TEST |
| Identity documents required at application | 8 | DOCUMENT REQUIREMENT | Test page | — | none | ADMINISTRATIVE PROCESS — DO NOT TEST |
| **Vision screening: 120° field, 6/12 (20/40) acuity, colour, distance** | 8 | LICENCE CONDITION | Handbook + ch6 | rules-gdl-015 | strong | CLASS 7 CORE — WELL COVERED |
| Corrective-lens condition placed on the licence | 8–9, 36 | LICENCE CONDITION | Handbook | rules-gdl-015 | partial | SUPPORTING LICENSING INFORMATION — DO NOT TEST |
| Licence fee payable after passing | 9 | VOLATILE FEE / PROCESS | Test page | — | none | ADMINISTRATIVE PROCESS — DO NOT TEST |
| **Always carry your learner's licence when driving** | 9, 21 | LICENCE CONDITION | Handbook + MVA | rules-gdl-017 | strong | CLASS 7 CORE — WELL COVERED |
| **Learner's licence validity** | 9–10 | LICENCE CONDITION | **2015 amendment (2 years)** | rules-gdl-004 | strong | OUTDATED HANDBOOK DETAIL — corrected already |
| Re-applying after expiry does not add a further 3/6-month wait | 10, 18 | ADMINISTRATIVE PROCESS | Handbook | rules-gdl-004 | partial | SUPPORTING LICENSING INFORMATION — DO NOT TEST |
| **Learner supervision: experienced driver in the front seat, no other passengers** | 10, 20, 35 | SUPERVISORY REQUIREMENT | Handbook + amendment + MVA s.70A | rules-gdl-001, -002 | strong | CLASS 7 CORE — WELL COVERED |
| **Supervisor must hold a valid Class 1–5 licence for the vehicle type** | 35 | SUPERVISORY REQUIREMENT | Handbook class table | rules-gdl-002 (explanation) | partial | CLASS 7 CORE — PARTIALLY COVERED |
| **Learner blood-alcohol level must be zero** | 10 | GDL RESTRICTION | MVA s.100A(1) | rules-gdl-003 | strong | GDL CORE — WELL COVERED |
| **Learner demerit consequence** | 10, 30 | SUSPENSION / CONSEQUENCE | **RMV Point System (current)** | rules-gdl-006 | strong | OUTDATED HANDBOOK DETAIL — corrected in Priority 8A (4 points brings an interview, not a suspension) |
| Becoming a good driver / be prepared / vehicle control | 10–11 | GENERAL EXPLANATION | Handbook | rules-impair-011 | partial | ALREADY COVERED ELSEWHERE |
| **Driver training: long course 25 h class + 10 h driving; short course 6 h** | 12 | TEST ELIGIBILITY | Handbook | rules-gdl-005 | strong | GDL CORE — WELL COVERED |
| Fuel-efficiency tips | 12–13 | GENERAL EXPLANATION | Handbook | — | none | NOT SUITABLE FOR KNOWLEDGE TEST |
| **Road-test waiting period** | 13, 20 | AGE / EXPERIENCE | **RMV GDL guidance (current): 12 months, 9 with approved training** | rules-gdl-005 | strong | OUTDATED HANDBOOK DETAIL — corrected in Priority 8A |
| Road-test booking, receipts, cancellation for weather | 13 | VOLATILE FEE / PROCESS | Handbook | — | none | ADMINISTRATIVE PROCESS — DO NOT TEST |
| Items to bring to the road test; what the examiner assesses | 13–15 | ADMINISTRATIVE PROCESS | Handbook | — | none | ADMINISTRATIVE PROCESS — DO NOT TEST |
| Road-test retake interval | 15 | ADMINISTRATIVE PROCESS | **Book a Road Test (current): next day** | — | none | OUTDATED / ADMINISTRATIVE — DO NOT TEST (Priority 8A) |
| Licence must be upgraded within 6 months of passing the road test | 16 | ADMINISTRATIVE PROCESS | Handbook | — | none | SUPPORTING LICENSING INFORMATION — DO NOT TEST |
| **Class 5N stage lasts at least two years** | 16, 21 | LICENCE CONDITION | MVA s.70A(1) | **rules-gdl-019 (new)** | good | GDL CORE — UNCOVERED / ADD QUESTION |
| **Class 5N zero blood alcohol** | 16, 21 | GDL RESTRICTION | MVA s.100A(1) | **rules-gdl-021 (new)** | good | GDL CORE — UNCOVERED / ADD QUESTION |
| **Class 5N passengers: one in front, rear limited by seat belts** | 16, 20–21 | GDL RESTRICTION | Handbook | rules-gdl-010 | strong | GDL CORE — WELL COVERED |
| **Class 5N curfew: midnight–5:00 am, with two exceptions** | 16–17, 22 | GDL RESTRICTION | Handbook + amendment | rules-gdl-009 | strong | GDL CORE — WELL COVERED |
| Curfew work exemption application and fee | 17 | VOLATILE FEE / PROCESS | Handbook | — | none | ADMINISTRATIVE PROCESS — DO NOT TEST |
| **No upgrade to Class 1–4 while learner or newly licensed** | 17 + amendment V | LICENCE CONDITION | 2015 amendment | rules-gdl-018 | strong | GDL CORE — WELL COVERED |
| **Class 5N: 6 demerit points → six-month suspension** | 17, 30 | SUSPENSION / CONSEQUENCE | Handbook | rules-gdl-006 (learner only) | partial | GDL CORE — PARTIALLY COVERED |
| **Suspension at 5N restarts the two-year period from reinstatement** | 17, 22 | SUSPENSION / CONSEQUENCE | MVA s.70A(4) | rules-gdl-019 (explanation) | partial | GDL CORE — PARTIALLY COVERED |
| **Exiting the GDL program** | 17 + amendment VI | LICENCE CONDITION | MVA s.70A(3) + amendment | **rules-gdl-020 (new)** | good | GDL CORE — UNCOVERED / ADD QUESTION |
| No driving school required to reach Class 5N | 18 | GENERAL EXPLANATION | Handbook | rules-gdl-005 | partial | SUPPORTING LICENSING INFORMATION — DO NOT TEST |
| **Learner may not drive a motorcycle or farm tractor on a public road** | 20 | GDL RESTRICTION | Handbook | rules-gdl-007 | strong | CLASS 7 CORE — WELL COVERED |
| **Dual-control exemption: up to three students in the back** | 20 | SUPERVISORY REQUIREMENT | Handbook | rules-gdl-008 | strong | CLASS 7 CORE — WELL COVERED |
| **GDL drivers may use 100-series highways** | 20 | GDL RESTRICTION | Handbook | rules-gdl-011 | strong | GDL CORE — WELL COVERED |
| GDL speeding conviction: one-week loss, 4 points, mandatory interview | 22 | SUSPENSION / CONSEQUENCE | **RMV Point System (current): 2/3/4/6 points by offence** | — | none | SUPPORTING / CURRENT POINT-SYSTEM DETAIL — DO NOT ADD QUESTION (Priority 8A) |
| BAC over .00 conviction: 6 points and six-month suspension | 22, 28 | SUSPENSION / CONSEQUENCE | Handbook + MVA s.100A | rules-gdl-003, -006 | partial | ALREADY COVERED ELSEWHERE |
| Class 8 holders fall under GDL at 16 | 23 | OTHER LICENCE CLASS | Handbook | — | none | OTHER LICENCE CLASS — OUT OF SCOPE |
| Licence renewal every five years; medical/health disclosure on renewal | 23–24 | ADMINISTRATIVE PROCESS | Handbook | rules-impair-013 | partial | ADMINISTRATIVE PROCESS — DO NOT TEST |
| $30 reinstatement fee after unpaid fines | 24 | VOLATILE FEE / PROCESS | Handbook | — | none | VOLATILE DETAIL — DO NOT TEST |
| Mandatory revocation offence list (Criminal Code) | 24–25 | SUSPENSION / CONSEQUENCE | Criminal Code | rules-impair-006 | partial | ALREADY COVERED ELSEWHERE |
| Restoration application, 30 days before eligibility, alcohol assessment | 25 | ADMINISTRATIVE PROCESS | Handbook | — | none | ADMINISTRATIVE PROCESS — DO NOT TEST |
| Suspension without conviction; Registrar's powers | 26 | SUSPENSION / CONSEQUENCE | MVA | — | none | SUPPORTING LICENSING INFORMATION — DO NOT TEST |
| Lending your licence / using another's / failing licence restrictions | 26 | LICENCE CONDITION | MVA | — | none | SUPPORTING LICENSING INFORMATION — DO NOT TEST |
| Court-imposed suspension | 27 | SUSPENSION / CONSEQUENCE | MVA | — | none | SUPPORTING LICENSING INFORMATION — DO NOT TEST |
| Demerit points stay on the record two years | 27 | SUSPENSION / CONSEQUENCE | Handbook | — | none | SUPPORTING LICENSING INFORMATION — DO NOT TEST |
| Full demerit-point table (all offences and values) | 28–30 | VOLATILE / NUMERIC | Handbook | rules-gdl-006 | partial | VOLATILE DETAIL — DO NOT TEST |
| Probationary licence after point suspension | 31 | SUSPENSION / CONSEQUENCE | Handbook | — | none | SUPPORTING LICENSING INFORMATION — DO NOT TEST |
| **Class 5N, 7 and 8 holders cannot have demerit points removed** | 31 | SUSPENSION / CONSEQUENCE | Handbook | — | none | SUPPORTING LICENSING INFORMATION — DO NOT TEST |
| Conditional licence application | 31–32 | ADMINISTRATIVE PROCESS | Handbook | — | none | ADMINISTRATIVE PROCESS — DO NOT TEST |
| Driver enhancement re-examination; Medical Advisory Committee | 32 | ADMINISTRATIVE PROCESS | Handbook | rules-impair-013 | partial | ALREADY COVERED ELSEWHERE |
| Classes 1, 2, 3, 4 (commercial) and their minimum ages | 33–34 | LICENCE CLASSIFICATION | Classification Regs | — | none | OTHER LICENCE CLASS — OUT OF SCOPE |
| Class 5 / 5N definition and minimum age | 34 | LICENCE CLASSIFICATION | Classification Regs | rules-gdl-014 | partial | SUPPORTING LICENSING INFORMATION — DO NOT TEST |
| Class 6 (motorcycle) and Class 8 (farm tractor) | 35 | LICENCE CLASSIFICATION | Classification Regs | — | none | OTHER LICENCE CLASS — OUT OF SCOPE |
| Commercial medical-report requirements | 35 | ADMINISTRATIVE PROCESS | Handbook | — | none | OTHER LICENCE CLASS — OUT OF SCOPE |
| Endorsements A–E | 36 | LICENCE CLASSIFICATION | Handbook | — | none | OTHER LICENCE CLASS — OUT OF SCOPE |
| Condition codes (01 lenses, 02 learner, 03 air brakes) | 36 | LICENCE CONDITION | Handbook | rules-gdl-015 | partial | SUPPORTING LICENSING INFORMATION — DO NOT TEST |

**68 substantive concepts.** 15 well covered, 5 partially covered, 4 already
covered elsewhere, 3 genuine gaps, 14 supporting, 17 administrative, 3 volatile,
7 other-licence-class, 3 current-law review, 2 not suitable, 1 outdated (already
corrected in the bank).

## Class 7 learner licence

Verified current model:

| Element | Current rule | Authority |
| --- | --- | --- |
| Minimum age | 16 | Test page; Classification Regs |
| Consent | Written parent/guardian consent if 16 or 17 | Test page (current) |
| Vision | Colour, 120° field, 6/12 (20/40) acuity, distance judgement | Handbook ch.1 p.8 |
| Knowledge test | Two parts — Rules of the Road and Road Sign Recognition, 20 questions each, 16 to pass | **Test page (current)** |
| Supervision | Supervising driver in the front passenger seat; two years' licensed experience; no longer in GDL; holds Class 1–5 valid for the vehicle type | Handbook pp.10, 20, 35; amendment p.V; MVA s.70A(1) |
| Passengers | None other than the supervising driver (dual-control instruction excepted) | Handbook pp.10, 20 |
| Alcohol | Zero blood alcohol | MVA s.100A(1) |
| Licence validity | **Two years** (Handbook's one year is superseded) | 2015 amendment p.VI |
| Demerits | 4+ points → six-month suspension | Handbook pp.10, 30 |
| Prohibited vehicles | Motorcycle and farm tractor on a public road | Handbook p.20 |
| Road-test eligibility | **Disputed — see Current-law review** | Handbook vs Classification Regs |

## Graduated Driver Licensing

Three stages since 1 April 2015:

| Stage | Duration | Restrictions |
| --- | --- | --- |
| **Learner (Class 7)** | Up to 2 years | Supervising driver in front seat, no other passengers; zero alcohol; no motorcycle or farm tractor; no upgrade to Class 1–4 |
| **Newly licensed (Class 5N)** | At least 2 years | Zero alcohol; one front-seat passenger, rear limited by seat belts; midnight–5:00 am curfew with two exceptions; no upgrade to Class 1–4 |
| **Restricted individual (Class 5R, condition 47)** | 2 years | Zero alcohol **or drugs**; may not act as a supervising driver; **may** upgrade licence class |

Exit requires all of: two years at 5N, an approved driver-training program with
the certificate registered, and completion of the two-year restricted stage.
MVA s.70A(3) states the same two statutory conditions — two years' experience
(excluding Class 7/8 time) and a recognised driver improvement program.

## Supervising driver

The current requirement, assembled from three sources:

- Held a valid driver's licence for **two years** (MVA s.70A(1) excludes time on
  a Class 7 or 8 licence from counting as experience)
- **No longer in the GDL program** — which since 2015 explicitly excludes a
  restricted individual (Class 5R), who "cannot be a supervising driver"
- Holds a valid **Class 1, 2, 3, 4 or 5** licence for the type of vehicle
- Seated in the **front passenger seat**
- Only exemption: a dual-control vehicle with an approved instructor, where up to
  three students may sit in the back

The 2015 amendment renamed the role from *experienced driver* to **supervising
driver**. `rules-gdl-009` was updated to the current term.

## Waiting periods / driver education

The Handbook's rule — six months, reduced to three by an approved course of at
least 25 classroom hours and 10 driving hours — is what `rules-gdl-005` teaches.
**It is contradicted by a current regulation.** See *Current-law review*.

The exit-stage driver-training requirement is separately confirmed by MVA
s.70A(3) and is not in doubt.

## Test process

Verified against the current official page, which supersedes the Handbook's
description:

| Element | Current official process | App mock |
| --- | --- | --- |
| Parts | Rules of the Road + Road Sign Recognition | Rules + Signs |
| Questions per part | 20 | 20 |
| Pass mark per part | 16 of 20 | 16 of 20 |
| Section independence | Retake only the part you failed | Each section passed or failed on its own |
| Time | 30 minutes per part | — (untimed practice) |

**No `MOCK CONFIG REVIEW REQUIRED`.** The application's exam configuration agrees
with the current official process on every dimension it models. The one element
the app does not model is the 30-minute per-part limit, which is a deliberate
practice-mode choice rather than a discrepancy.

The knowledge-test structure was classified *supporting* rather than tested: it
is process rather than driving theory, the learner meets it directly, and a
question about it would sit uncomfortably close to describing the app itself.

## Licence classes

**Retained:** the Class 7 row's supervision requirement (it defines who may
supervise), and the Class 5/5N relationship as the stage a learner progresses to.

**Excluded as other-licence-class detail:** Classes 1–4 and their weights,
capacities and minimum ages; Class 6 motorcycle licensing (Priority 5 established
Chapter 8 as the separate pathway); Class 8 farm tractors; endorsements A–E;
commercial medical-report requirements. A Class 7 learner does not need to
memorise the gross vehicle weight thresholds for a Class 3 licence.

## Suspensions / demerits

**Tested:** the learner's 4-point suspension threshold (`rules-gdl-006`).

**Supporting, not tested:** the full demerit-point table (28–30) — a volatile
schedule of offence values; the probationary licence; the conditional licence;
suspension without conviction; the Registrar's powers; the two-year record
retention; and the rule that Class 5N, 7 and 8 holders cannot have points removed
by a defensive-driving course.

**Already covered elsewhere:** mandatory revocation for impaired driving
(`rules-impair-006`), medical re-examination (`rules-impair-013`).

**Partially covered:** the Class 5N 6-point threshold — `rules-gdl-006` covers
the learner threshold only. Adding a second near-identical question was judged a
paraphrase; the distinction is carried in the explanation instead.

## Administrative material excluded

Fees (knowledge test, licence, road test, curfew exemption, $30 reinstatement);
application forms; identity-document lists; booking procedures and phone numbers;
office locations; renewal and replacement mechanics; out-of-province plate
timelines; licence-exchange rules for other jurisdictions; road-test day
logistics and the examiner's scoring sheet.

None of these is driving-theory knowledge, and most are volatile. A unit test now
asserts no Graduated Licensing question mentions a fee, form, appointment or
phone number.

## Outdated Handbook material

| Handbook Statement | Current Rule | Current Source | Content Impact |
| --- | --- | --- | --- |
| GDL has three levels ending at Class 5 | Three stages, the third being **restricted individual** (Class 5R) | Amendment p.V | Already correct in the bank (`rules-gdl-012`, `-013`, `-018`) |
| Learner's licence valid **one year** (pp. 6, 9–10, 18) | **Two years** | Amendment p.VI | Already correct in the bank (`rules-gdl-004`) |
| "Experienced driver" supervises | Renamed **supervising driver**; a Class 5R holder may not act as one | Amendment p.V | **Corrected this priority** (`rules-gdl-009`) |
| Exit GDL after two years at 5N plus driver training | Also requires the **two-year restricted individual stage** | Amendment p.VI | **Closed this priority** (`rules-gdl-020`) |
| No upgrade to Class 1–4 while in GDL (p.17) | Upgrade **is** allowed at the restricted individual stage | Amendment p.V | Already correct (`rules-gdl-018`) |
| Test booking by phone, first-come-first-served (p.7) | Online knowledge test with per-part retake rules | Test page | Excluded as administrative |
| Road test waiting period six / three months (p.13) | Regulation says 60 days unless driver training completed | Classification Regs | **Unresolved — see below** |

## Existing questions corrected

| ID | Old problem | Change | Source |
| --- | --- | --- | --- |
| `rules-gdl-009` | Used the superseded term "experienced driver"; answer was also over the choice-length threshold (ratio 3.13) | Reworded to "supervising driver", shortened the answer (ratio now 2.17), explanation now notes the 2015 rename and that a Class 5R holder may not supervise | Amendment p.V |
| `rules-gdl-002` | Two-year experience rule cited only to the Handbook | Added `ns-mva` s.70A(1), which defines the experience and excludes Class 7/8 time | MVA s.70A(1) |

No question was found teaching a wrong age, a wrong passenger rule, an obsolete
stage name in its answer, or a stale restriction. The GDL topic had already been
brought onto the 2015 amendments by an earlier priority.

## Genuine gaps

| Concept | Source | Why a Class 7 learner needs it | Question |
| --- | --- | --- | --- |
| Class 5N lasts at least two years | MVA s.70A(1); Handbook pp.16, 21 | The learner is progressing into this stage and needs to know restrictions do not end at the road test | `rules-gdl-019` (new) |
| What is required to exit the GDL program | Amendment pp.V–VI; MVA s.70A(3) | The amended three-stage exit path is the single most changed rule in the chapter, and failing to complete it leaves you restricted indefinitely | `rules-gdl-020` (new) |
| Zero alcohol applies at every GDL stage | Handbook pp.10, 16, 21; amendment p.V | Counters the common belief that the zero-alcohol condition ends with the learner stage; also discriminates it from the stage-specific curfew and passenger limits | `rules-gdl-021` (new) |

## Current-law review

### 1. Road-test waiting period — Handbook vs current regulation

| | |
| --- | --- |
| **Handbook says** | "Normally, learners have to wait at least six months before they can take a road test. (However, if you pass a long-course driver training program, you have to wait only three months.)" — ch.1 pp. 13, 20 |
| **Current authority says** | Class 5 minimum requirements: "Age 18 (16 with parental or guardian consent), **must have held a Class 7 license 60 days unless driver education or driver training course completed**" — Classification of Drivers' Licences Regulations, amended to N.S. Reg. 163/2024, effective 13 August 2024 |
| **Learner content uses** | The Handbook's six/three months, unchanged |
| **Question affected** | `rules-gdl-005` |

The two differ in both the number (60 days vs six months) and the structure
(the regulation *waives* the period entirely with driver training; the Handbook
*reduces* it to three months).

There is a plausible reading under which both stand — the regulation setting the
class-eligibility floor while the GDL program imposts a longer stage duration, in
which case the longer period governs in practice. The MVA snapshot contains no
graduated-licensing waiting provision to settle it, and the 2015 amendments are
silent on the period.

**No change was made and no question was authored from the 60-day figure.**
Resolving this needs the regulation that establishes the GDL stage durations,
which is not in the manifest. This is the strongest candidate for the next
priority.

### 2. Road-test retake interval

The Handbook's "wait at least one week" (p.15) has no current corroboration. The
current test page gives retake rules for the *knowledge* test only (online:
immediately; in person: next day). Not tested; flagged.

### 3. GDL speeding-conviction consequence

The Handbook's "lose driving privileges for one week, 4 demerit points, mandatory
interview" (p.22) is an old penalty statement with no current corroboration in
any tracked source. Not tested; flagged.

### Backlog kept separate

Pre-existing items are untouched: child-restraint thresholds, cannabis/drug
impairment sourcing, administrative suspension regulation, studded-tyre season
dates.

## After

| | Before | After |
| --- | ---: | ---: |
| Active questions | 294 | **297** |
| Rules pool | 189 | **192** |
| Sign pool | 105 | 105 |
| Graduated Licensing topic | 18 | **21** |
| Questions citing `ns-handbook-ch1` | 15 | **17** |
| Chapter 1 pages cited | 16 / 35 | **16 / 35** |
| Content errors | 0 | 0 |
| Content warnings | 63 | **62** |

- **Added:** 3 (`rules-gdl-019`, `-020`, `-021`)
- **Modified:** 2 (`rules-gdl-009`, `rules-gdl-002`)
- **Retargeted:** 0
- **Removed:** 0

Page coverage is unchanged at 16/35 — the new questions cite pages already
cited, and 19 of the chapter's 35 pages are administrative, other-licence-class
or volatile material that was deliberately excluded.

### Remaining Class 7 gaps

**Known uncovered Class 7 licensing concepts: 0**, with three concepts held at
`CURRENT-LAW REVIEW REQUIRED` above rather than guessed at. **All three were
subsequently resolved by Priority 8A** — see the section at the end of this
document.

## Content version

Content version is a deterministic digest of the question bank and artwork
inputs, computed in `vite.config.ts`. Editing
`data/questions/rules-impairment-and-licensing.json` changes it automatically; it
was not touched by hand.

## Tests

`tests/licensing.test.ts` — 14 tests:

- the two-year learner licence is taught and the one-year figure cannot return
- three GDL stages including the restricted individual stage
- every amended rule cites the amendment source
- every stage-specific question names its licence stage
- the curfew and passenger limit stay at the newly licensed stage
- the zero-alcohol answer is the only all-stages restriction offered
- supervising-driver requirements: two years, out of GDL, Class 1–5, cited to the Act
- **no answer in the topic uses the superseded term "experienced driver"**
- stage duration and exit requirements cite the Motor Vehicle Act
- no Graduated Licensing question mentions a fee, form, appointment or phone number
- no question tests the app's own mock configuration

No E2E was added — the new questions use the existing flow and change no UI path.

## Verification

| Gate | Result |
| --- | --- |
| `pnpm content:validate` | 0 errors, 62 warnings |
| `pnpm content:quality` | reports written |
| `pnpm content:syllabus` | 297 active questions (105 sign, 192 rules) |
| `pnpm content:progression` | 31 topics, 0 Complete unreachable, 0 Mastered unreachable |
| `pnpm sources:check:ci` | 21 unchanged, 0 errors |
| `pnpm signs:approval:check` | 232 approved, 0 changed, 0 broken |
| `pnpm signs:audit` | pass |
| `pnpm signs:learner-audit` | 155/155 artwork, 80/80 Core assessed, 0 gaps |
| `pnpm test` | 413 passed, 22 files |
| `pnpm test:e2e` | 139 passed |
| `pnpm verify` | **exit 0, green** |

---

# Priority 8A — Current-source reconciliation

Completed 2026-08-19. Resolves the three current-law items Priority 8 left open,
using current official Nova Scotia sources fetched and tracked through the
normal source-manifest workflow.

Three RMV pages were added to the manifest at precedence 3 (current official
guidance), which the manifest already ranks above precedence 4 (Handbook chapter
body text):

| Source ID | Page |
| --- | --- |
| `ns-rmv-gdl-system` | Registry of Motor Vehicles - Graduated Drivers Licence System |
| `ns-rmv-who-takes-exam` | Registry of Motor Vehicles - Who Takes the Exam |
| `ns-rmv-point-system` | Registry of Motor Vehicles - The Point System |

Every figure below was read from the stored snapshots of those pages, not from a
search summary and not from the Handbook.

## Class 7 waiting period

### Old Handbook

> "Normally, learners have to wait at least six months before they can take a
> road test. (However, if you pass a long-course driver training program, you
> have to wait only three months.)" - ch.1 pp. 13, 20

### Current RMV/GDL

> "The minimum practice period is 12 months. The practice period can be reduced
> to a minimum of 9 months if the driver completes a recognized driver education
> or training program." - `ns-rmv-gdl-system`

> "If you have a Learner's Licence, you must wait 12 months from the date your
> Learner's licence was issued before applying for a road test. Exceptions to
> the 12 month waiting period are: ... if you successfully complete a driver
> education/training course approved by the Registrar of Motor Vehicles and your
> instructor states that you are ready to take the road test the waiting period
> is reduced to 9 months from the date you received your Learner's licence."
> - `ns-rmv-who-takes-exam`

The change from 6/3 to 12/9 took effect **1 April 2016**, announced in the
Province's release *Change to the Graduated Driver's Licence Program Takes
Effect April 1*. The Handbook chapter simply predates it.

`ns-rmv-who-takes-exam` also records a second exception the learner content does
not test: a person who has previously held a driver's licence in Nova Scotia or
an equivalent licence elsewhere is not subject to the 12-month wait.

### Classification Regulations

> "Age 18 (16 with parental or guardian consent), must have held a Class 7
> license 60 days unless driver education or driver training course completed."
> - Classification of Drivers' Licences Regulations, Class 5 minimum
> requirements, amended to N.S. Reg. 163/2024

This provision is **not superseded and is not contradicted**. It sets the
*regulatory eligibility floor* for the Class 5 licence class - the minimum
holding period below which a Class 5 licence cannot issue at all. It does not
purport to state the GDL learner practice period, and a rule that something may
not happen before 60 days is not a statement that it may happen at 60 days.

The GDL programme imposes a longer minimum practice period on top of it. Both
apply; the longer one governs what a Class 7 learner actually experiences.

### Source comparison

| Source | Rule stated | Role | Learner-content decision |
| --- | --- | --- | --- |
| Driver's Handbook ch.1 (precedence 4) | 6 months, 3 with training | Historical study text, predates April 2016 | **Not used** - superseded figures |
| Classification of Drivers' Licences Regulations (precedence 2) | Class 7 held 60 days, waived with driver education | Regulatory eligibility floor for the Class 5 class | **Documented, not taught** - it is not the GDL practice period |
| RMV Graduated Drivers Licence System (precedence 3) | 12-month minimum practice period, 9 with a recognized program | Current operational GDL guidance | **Used** - primary citation |
| RMV Who Takes the Exam (precedence 3) | 12 months from issue date; 9 with a Registrar-approved course | Current road-test eligibility guidance | **Used** - supporting citation |

No official source is treated as invalid, and current service guidance is not
claimed to repeal legislation. The two instruments answer different questions.

**No residual legal ambiguity.** The regulation and the GDL guidance are
consistent once read as a floor and a programme requirement respectively.

### Content decision

`rules-gdl-005` now teaches: **twelve months, reduced to nine by an approved
driver education course.** The explanation adds that the period runs from the
date the learner's licence was issued, that the course must be approved by the
Registrar of Motor Vehicles, and that the older 6/3 figures were replaced on
1 April 2016. The 60-day regulatory floor is deliberately kept out of the
learner-facing copy - it is source layering, not something a learner acts on.

The superseded 6/3 rule survives in the question only as a distractor, which is
useful: a learner may still meet it in an older printed Handbook.

## Road-test retake

| | |
| --- | --- |
| **Old Handbook** | "You must wait at least one week before you may take the test again." - ch.1 p.15 |
| **Current official rule** | "if you have an incomplete or unsuccessful road test, you must wait until the next day before you can book another road test" - Book a Road Test service |
| **Active questions affected** | **None.** A scan of all active questions for "one week", "1 week", "seven days" and "7 days" in a retake context found nothing. |
| **Decision** | `OUTDATED / ADMINISTRATIVE - DO NOT TEST` |

The Handbook's one-week interval is stale, but verifying that does not create a
reason to assess it: how soon a booking system lets you rebook is service
process, not driving theory. No question was added, and a regression test now
asserts none is added. The Book a Road Test page was deliberately **not** added
to the manifest - the project tracks sources that support active questions, and
nothing here supports one.

## Speeding consequence

### Handbook claim

> "If you are convicted of a speeding violation, you could, in addition to any
> other penalty imposed, lose your driving privileges for one week and
> accumulate four demerit points on your driving record." - ch.1 p.22

### Current point system

Speeding is **not one value**. From `ns-rmv-point-system`:

| Offence | Section | Points |
| --- | --- | ---: |
| Speeding or dangerous driving | 101 | 6 |
| Speeding in excess of posted limit (school area) | 103(1) | 4 |
| Speeding in excess of prima facie speed limit | 102 | 4 |
| Exceeding posted limit by 1-15 km/h | 106A(a) | 2 |
| Exceeding posted limit by 16-30 km/h | 106A(b) | 3 |
| Exceeding posted limit by 31 km/h or more | 106A(c) | 4 |

The Handbook's flat "four demerit points" is therefore wrong as a general
statement - four points applies only to the highest speed band and to two
specific provisions. The "lose your driving privileges for one week" element has
no support anywhere in the current point system page.

### Active question impact

**None.** No active question depends on the Handbook's speeding-consequence
passage.

### Decision

`SUPPORTING / CURRENT POINT-SYSTEM DETAIL - DO NOT ADD QUESTION`

Testing it would require either a universal rule the current schedule does not
support, or memorising a six-row penalty table - volatile trivia in both
directions. A regression test now asserts no answer states a single point value
for speeding generally.

### Additional finding - the learner point threshold

Checking the point system for the speeding item surfaced a **fourth stale item
Priority 8 had not identified**, in `rules-gdl-006`.

The current Registry table reads:

```
This table shows how the assignment of points would affect you:
                          Interview*   6-month suspension
Learner's licence         4 points
Newly Licensed Driver     4            6
All Others                6            10
```

For a learner's licence the table populates **only the Interview column, at 4
points**, and leaves the suspension cell empty. The footnote adds that "an
interview with a Driver Enhancement Officer will include a complete driver's
re-examination."

The old Handbook prose instead said: "As a learner, if you get four or more
demerit points, then your driving privileges will be suspended for six months."
`rules-gdl-006` was written from that sentence and asked how many points cause a
six-month suspension for a learner.

**Corrected.** The question now asks what happens at four points and answers
with the interview and full re-examination. The explanation keeps the stages
separate: a newly licensed driver is also interviewed at four but suspended at
six; other drivers are interviewed at six and suspended at ten. The question no
longer asserts a learner suspension threshold, because the current source does
not state one.

## Priority 8 unresolved items - final status

| Item | Status |
| --- | --- |
| **1. Road-test waiting period** (`rules-gdl-005`) | **RESOLVED - ACTIVE CONTENT UPDATED** |
| **2. Road-test retake interval** | **RESOLVED - OUTDATED / NOT TESTED** |
| **3. GDL speeding consequence** | **RESOLVED - OUTDATED / NOT TESTED** (current point system verified; no question depends on it) |
| *(new)* **4. Learner demerit threshold** (`rules-gdl-006`) | **RESOLVED - ACTIVE CONTENT UPDATED** |

The unrelated backlog is untouched: child-restraint thresholds,
cannabis/drug-impairment sourcing, administrative suspension regulation and
studded-tyre season dates all remain open.
