# Syllabus Priority 7 — Driving in Adverse Conditions

Completed 2026-08-19. A concept-completeness and quality audit of Chapter 5,
not a question-growth exercise.

The headline result: **Chapter 5 page coverage did not move at all** (13/16
before and after), while eight genuinely uncovered concepts were closed. No
question was added to raise a citation percentage.

## Source scope

- **`data/sources/snapshots/ns-handbook-ch5.txt`** — read in full. Pages 133–150;
  133 and 134 are the chapter divider and contents, so **pages 135–150 (16 pages)**
  carry testable content.
- **`data/sources/snapshots/ns-mva.txt`** — Motor Vehicle Act, R.S.N.S. 1989,
  c. 293. Used to verify every legally-phrased claim in this chapter.

Page convention: content between running footers `N` and `N+1` is cited as page
`N+1`. Verified against the existing Chapter 5 citations before use.

### Source limitations

- **Studded-tyre dates cannot be verified in this repository.** MVA s.198(2)
  prohibits studs "unless permitted by regulations" and delegates the detail to
  a regulation that is **not in the source manifest**. See *Current-law review*.
- The chapter's collision-report threshold reads `$1000` in the body text with a
  `$2000 or more` erratum printed alongside it. The existing question already
  uses $2,000. Not reopened — it belongs to an earlier priority.

## Before

Derived from the repository, not from earlier reports.

| | |
| --- | ---: |
| Active questions | 286 |
| Rules pool | 181 |
| Sign pool | 105 |
| Adverse Conditions topic | 13 |
| Questions citing `ns-handbook-ch5` | 22 |
| Chapter 5 pages cited | 13 / 16 |
| Content errors | 0 |
| Content warnings | 63 |

The approximate figures quoted in the brief (22 citations, 13/18 pages, 13 topic
questions) turned out to still be accurate, except that the chapter has 16
content pages rather than 18.

## Concept inventory

| Concept | Page(s) | Claim Type | Existing Question(s) | Coverage | Decision |
| --- | --- | --- | --- | --- | --- |
| Anticipate conditions; check the forecast; consider not driving | 135 | GENERAL SAFETY ADVICE | — | none | SAFETY GUIDANCE — TEACH BUT DO NOT TEST |
| Moisture forms on brakes and increases stopping distance | 135, 139 | PHYSICS / TRACTION | rules-adverse-017 (new) | good | UNCOVERED — ADD QUESTION |
| Night is more dangerous: darkness, impaired drivers, fatigue, glare | 136 | GENERAL SAFETY ADVICE | rules-impair-009 (fatigue) | partial | DUPLICATE / SUPPORTING MATERIAL |
| Headlights from half an hour after sunset to half an hour before sunrise | 136 | LEGAL REQUIREMENT | rules-adverse-001 | strong | WELL COVERED |
| **Headlights also required when a person is not discernible at 300 m** | 136 | LEGAL REQUIREMENT | rules-adverse-021 (new) | good | UNCOVERED — ADD QUESTION |
| Low beams in the city, high beams on the open road | 136 | SAFE-DRIVING TECHNIQUE | rules-pass-006, rules-adverse-004 | partial | PARTIALLY COVERED |
| Dim within 150 m approaching / 60 m following | 136 | LEGAL REQUIREMENT | rules-adverse-003 | strong | WELL COVERED |
| **Oncoming driver does not dim — stay on low beam, keep right, look right** | 137 | SAFE-DRIVING TECHNIQUE | rules-adverse-019 (new) | good | UNCOVERED — ADD QUESTION |
| Sunlight glare: visor, sunglasses, stop if needed | 137 | GENERAL SAFETY ADVICE | — | none | SAFETY GUIDANCE — TEACH BUT DO NOT TEST |
| Tunnel or parking garage on a bright day: slow, remove sunglasses, lights on | 137 | SAFE-DRIVING TECHNIQUE | — | none | NOT SUITABLE FOR KNOWLEDGE TEST |
| Rain/snow/fog: slow gradually, no sudden stops, more following distance | 137 | SAFE-DRIVING TECHNIQUE | rules-adverse-005 | strong | WELL COVERED |
| **Low beams only in rain, snow and fog** | 137 | SAFE-DRIVING TECHNIQUE | rules-adverse-004 | strong | WELL COVERED |
| Do not use parking lights when driving | 137 | LEGAL REQUIREMENT | rules-adverse-002 | strong | WELL COVERED |
| **Extreme trouble seeing: pull off, flashers, leave by the passenger side** | 138 | EMERGENCY RESPONSE | rules-adverse-020 (new) | good | UNCOVERED — ADD QUESTION |
| Trucker blind spots; the side-mirror check | 138 | SAFE-DRIVING TECHNIQUE | rules-share-006 | strong | ALREADY COVERED ELSEWHERE |
| Make yourself visible near trucks (lights, signals, horn, space) | 138 | SAFE-DRIVING TECHNIQUE | rules-share-006, rules-pass-001 | partial | DUPLICATE / SUPPORTING MATERIAL |
| Rain: drive slower, low beams, wipers | 139 | SAFE-DRIVING TECHNIQUE | rules-adverse-004, rules-adverse-005 | strong | WELL COVERED |
| Following distance of four or more seconds in rain | 139 | SAFE-DRIVING TECHNIQUE | rules-adverse-005 | strong | WELL COVERED |
| Stopping distance on slippery pavement 2–10× dry | 139 | VOLATILE / NUMERIC | rules-adverse-008 (concrete figures) | partial | DUPLICATE / SUPPORTING MATERIAL |
| First 10–15 minutes of rain are most dangerous | 139 | PHYSICS / TRACTION | rules-adverse-006 | strong | WELL COVERED |
| Hydroplaning onset ~55 km/h, total ~85 km/h | 139 | VOLATILE / NUMERIC | rules-adverse-007 | strong | WELL COVERED |
| **Hydroplaning response — reduce speed; no friction to brake, accelerate or corner** | 139 | SAFE-DRIVING TECHNIQUE | rules-adverse-018 (new) | good | UNCOVERED — ADD QUESTION |
| **Wet brakes are less effective; test them; dry them with left foot on brake** | 139 | SAFE-DRIVING TECHNIQUE | rules-adverse-017 (new) | good | UNCOVERED — ADD QUESTION |
| Slush, packed snow and black ice each behave differently | 140 | PHYSICS / TRACTION | rules-adverse-008, -010 | partial | PARTIALLY COVERED |
| Black ice is a thin layer of ice on the road surface | 140 | PHYSICS / TRACTION | rules-adverse-008, -009, -010 | partial | PARTIALLY COVERED |
| Stopping distances at 30 km/h: 6 m dry, 22 m packed snow, 52 m black ice | 140 | VOLATILE / NUMERIC | rules-adverse-008 | strong | WELL COVERED |
| Bridges, overpasses and shaded sections freeze first and thaw last | 140 | PHYSICS / TRACTION | rules-adverse-009 | strong | WELL COVERED |
| Snowstorm: reduce speed, wipers, defroster, low beams | 140 | SAFE-DRIVING TECHNIQUE | rules-adverse-016 (new) | good | UNCOVERED — ADD QUESTION |
| **Cut speed by more than half on packed snow; crawl on ice** | 140 | SAFE-DRIVING TECHNIQUE | rules-adverse-016 (new) | good | UNCOVERED — ADD QUESTION |
| Chains or studded tyres may improve traction | 140, 142 | LEGAL REQUIREMENT | rules-adverse-013 | partial | CURRENT-LAW REVIEW REQUIRED |
| Gravel and dirt roads lengthen stopping distances | 140 | PHYSICS / TRACTION | — | none | SAFETY GUIDANCE — TEACH BUT DO NOT TEST |
| Traction determines control | 141 | PHYSICS / TRACTION | rules-adverse-011 | strong | WELL COVERED |
| Four-wheel drive does not shorten stopping distance | 141 | PHYSICS / TRACTION | rules-adverse-011 | strong | WELL COVERED |
| **Slight and gentle inputs on brake, accelerator and steering** | 141 | SAFE-DRIVING TECHNIQUE | rules-adverse-015 (new) | good | UNCOVERED — ADD QUESTION |
| Test the surface with light braking; release if a tyre locks | 141 | SAFE-DRIVING TECHNIQUE | rules-follow-006 | strong | ALREADY COVERED ELSEWHERE |
| Roads more slippery near 0 °C than at −10 or −20 °C | 141 | PHYSICS / TRACTION | rules-adverse-010 | strong | WELL COVERED |
| Early-morning frost in autumn and spring | 141 | GENERAL SAFETY ADVICE | rules-adverse-010 | partial | DUPLICATE / SUPPORTING MATERIAL |
| Stopping on ice: gradual pressure, do not lock the wheels | 142 | SAFE-DRIVING TECHNIQUE | rules-follow-006, rules-adverse-015 | strong | DUPLICATE / SUPPORTING MATERIAL |
| Studded tyres shorten stopping distance on ice | 142 | LEGAL REQUIREMENT | rules-adverse-013 | partial | CURRENT-LAW REVIEW REQUIRED |
| Rules for winter driving (seven-item checklist) | 142 | VEHICLE PREPARATION | various | partial | SAFETY GUIDANCE — TEACH BUT DO NOT TEST |
| Keep windshield and windows clear | 142 | VEHICLE PREPARATION | rules-safety-006 | partial | ALREADY COVERED ELSEWHERE |
| First sign of trouble: mirrors, flashers, slow, pull well off; never stop in a lane | 143 | EMERGENCY RESPONSE | rules-hwy-003 | strong | ALREADY COVERED ELSEWHERE |
| Call for help; "Call Police" sign; do not raise the hood; stay in the vehicle | 143 | EMERGENCY RESPONSE | — | none | SAFETY GUIDANCE — TEACH BUT DO NOT TEST |
| Steering beats braking above 40 km/h | 143 | SAFE-DRIVING TECHNIQUE | rules-follow-004 | strong | ALREADY COVERED ELSEWHERE |
| Threshold braking defined | 143 | SAFE-DRIVING TECHNIQUE | rules-follow-006 | strong | ALREADY COVERED ELSEWHERE |
| ABS: press hard, brakes will not lock, you can still steer | 143 | SAFE-DRIVING TECHNIQUE | rules-follow-005 | strong | ALREADY COVERED ELSEWHERE |
| Brake failure | 144 | EMERGENCY RESPONSE | rules-emergencies-002 | strong | WELL COVERED |
| Tyre blowout | 144 | EMERGENCY RESPONSE | rules-emergencies-001 | strong | WELL COVERED |
| Power failure — loss of power steering and brakes | 144 | EMERGENCY RESPONSE | — | none | DUPLICATE / SUPPORTING MATERIAL |
| Headlight failure | 144 | EMERGENCY RESPONSE | — | none | DUPLICATE / SUPPORTING MATERIAL |
| Sticking gas pedal | 145 | EMERGENCY RESPONSE | — | none | DUPLICATE / SUPPORTING MATERIAL |
| Vehicle fires | 145 | EMERGENCY RESPONSE | — | none | DUPLICATE / SUPPORTING MATERIAL |
| **Skid causes and recovery — off the gas, let it slow, evasive steering** | 146 | SAFE-DRIVING TECHNIQUE | rules-adverse-014 (new) | good | UNCOVERED — ADD QUESTION |
| Wheels leaving the pavement | 146 | EMERGENCY RESPONSE | rules-emergencies-003 | strong | WELL COVERED |
| Animals on the road; high beams at night | 146 | SAFE-DRIVING TECHNIQUE | signs-warn-019 | strong | ALREADY COVERED ELSEWHERE |
| Vehicle plunging into water — escape through the windows | 147 | EMERGENCY RESPONSE | rules-safety-019 (belt rationale) | partial | DUPLICATE / SUPPORTING MATERIAL |
| Electrical wires on the roadway — stay in the vehicle | 147 | EMERGENCY RESPONSE | rules-emergencies-007 | strong | WELL COVERED |
| Exiting near live wires — jump clear, feet together, shuffle 20 m | 147 | EMERGENCY RESPONSE | rules-emergencies-007 | partial | PARTIALLY COVERED |
| Snow plows — do not pass between staggered plows | 148 | SAFE-DRIVING TECHNIQUE | rules-adverse-012 | strong | WELL COVERED |
| Collision reporting: 24 hours, $2,000 threshold | 149 | LEGAL REQUIREMENT | rules-emergencies-004 | strong | WELL COVERED |
| Information you must give and assistance you must render | 149 | LEGAL REQUIREMENT | rules-emergencies-005 | strong | WELL COVERED |
| Unattended vehicle or property damage | 150 | LEGAL REQUIREMENT | rules-emergencies-006 | strong | WELL COVERED |
| Garage must notify police of a serious-collision vehicle | 149 | LEGAL REQUIREMENT | — | none | NOT SUITABLE FOR KNOWLEDGE TEST |
| Licence suspension after collision with no proof of financial responsibility ($50) | 150 | VOLATILE / NUMERIC | — | none | OUTDATED / HISTORICAL — DO NOT TEST |

**62 substantive concepts.** 24 well covered, 8 partially covered, 11 already
covered elsewhere, 8 genuine gaps, 7 guidance, 1 outdated, 2 current-law review,
2 not suitable.

## Wet weather / hydroplaning

- **Traction** — the first-rain effect (oil and residue lifting off the asphalt)
  is well covered by `rules-adverse-006`.
- **Stopping distance** — the concrete 6/22/52 m figures at 30 km/h are tested by
  `rules-adverse-008`. The chapter's looser "two to ten times farther" claim
  teaches the same magnitude less precisely and was not duplicated.
- **Standing water and hydroplaning** — `rules-adverse-007` already tests the
  85 km/h figure. What was missing was the *response*, so `rules-adverse-018`
  now teaches that speed is both cause and cure, with the loss of braking,
  acceleration and cornering explained rather than tested as a number.
- **Wet brakes** — an entirely uncovered, practical concept. `rules-adverse-017`
  teaches the Handbook's drying technique exactly as written.
- **Following distance** — four or more seconds, covered by `rules-adverse-005`.
- **Visibility** — low beams and wipers in rain, covered by `rules-adverse-004`.

## Snow / ice / skids

**Skids were the single largest gap: not one question in the entire bank tested
them.** Chapter 5 covers them across two pages and the audit found zero coverage.

- `rules-adverse-014` — recovery. Come off the gas and let the vehicle slow, use
  evasive steering, then threshold braking once slowed. The three distractors are
  precisely the three actions the Handbook names as *causing* a skid.
- `rules-adverse-015` — prevention. Slight, gentle movements on all three
  controls, because sudden braking or accelerating starts a skid.

Deliberately **not** used: the phrase *"steer into the skid"*. It appears nowhere
in the source, and a unit test now asserts it appears nowhere in the topic.

- **Snow and ice speed** — `rules-adverse-016` closes the speed-adjustment gap and
  makes the posted-limit answer explicitly wrong.
- **Black ice** — recognition is partially covered across `rules-adverse-008`
  (stopping distance), `-009` (where it forms first) and `-010` (near 0 °C). A
  bare definition question would have been weaker than what already exists, so
  none was added.
- **Braking on slippery surfaces** — Chapter 5 repeats the threshold-braking
  advice Priority 2 already closed with `rules-follow-006`. Recorded as
  supporting material, not duplicated, exactly as §13 requires.

## Fog / visibility

- **Low beams in fog** — `rules-adverse-004`, well covered.
- **Stopping when you cannot see** — `rules-adverse-020` closes a real gap. Pull
  well off, flashers on, then **leave from the passenger side and stay away from
  the road**. This is counterintuitive and life-saving, and nothing tested it.
- **Legal lighting trigger** — `rules-adverse-021` closes the other real gap: the
  requirement to light up whenever a person is not clearly discernible at 300 m.

### Legal verification

Every legally-phrased lighting claim was checked word-for-word against the MVA
snapshot:

| Claim | Handbook | MVA s.178 | Verdict |
| --- | --- | --- | --- |
| Headlights half an hour after sunset to half an hour before sunrise | p.136 | "during the period from a half hour after sunset to a half hour before sunrise" | **confirmed** |
| Headlights when a person is not discernible at 300 m | p.136 | "...and at any other time when visibility is so limited by fog, rain, snow or other atmospheric condition ... at a distance of 300 metres ahead" | **confirmed** |
| Dim within 150 m of an approaching vehicle | p.136 | "when within not less than 150 metres of the other vehicle, dim or depress the beam" | **confirmed** |
| Dim within 60 m when following | p.136 | "while following within 60 metres of the other vehicle, dim or depress the beam" | **confirmed** |

`rules-adverse-001` and `rules-adverse-003` now cite the Act alongside the
Handbook, so the legal basis is recorded where the claim is made.

## Night driving

- **Glare** — `rules-adverse-019` closes the gap: stay on low beam even when the
  other driver does not dim, keep right, use the edge of the road as a guide, and
  look slightly right of the oncoming lights.
- **Beams** — city versus open road is partially covered by `rules-pass-006`
  (low beams when passing) and `rules-adverse-004`. Adding a third beam question
  would have been a paraphrase.
- **Sunlight glare and tunnels** — real but lower-value, and adjacent to the
  question just added. Recorded as guidance rather than tested.
- **Animals at night** — covered by `signs-warn-019`.

## Winter preparation

| Material | Treatment |
| --- | --- |
| Cut speed for conditions | **Assessed** — `rules-adverse-016` |
| Keep windshield and windows clear | Already covered by Chapter 4 vehicle-safety content |
| Headlights, wipers and defrosters in working order | Supporting only — Chapter 4 covers the inspection duty |
| Snow tyres, chains, studded tyres | **Current-law review** — see below |
| Seven-item "rules for winter driving" checklist | Guidance — a checklist, not a set of driving decisions |
| Allow extra time; listen for forecasts | Guidance |

No checklist was converted into quiz trivia.

## Emergency / unusual conditions

Chapter 5's vehicle-malfunction sub-family has seven members: brake failure,
tyre blowout, wheels off the pavement, power failure, headlight failure,
sticking gas pedal and vehicle fire. **Three of the seven are assessed** —
`rules-emergencies-001` (blowout), `-002` (brake failure) and `-003` (wheels off
the pavement) — leaving **four untested**: power failure, headlight failure,
sticking gas pedal and vehicle fire. The chapter's separate submerged-vehicle
escape (p.147) is also untested, while the downed-power-line procedure beside it
is covered by `rules-emergencies-007`. All five untested items were
**deliberately sampled rather than exhaustively tested**.

This is a judgement call and is recorded as such. These are vehicle-malfunction
procedures rather than adverse-condition driving decisions, which is what this
chapter's audit is about; testing all seven would be list-filling of exactly the
kind §29 and §30 warn against. If a later priority decides the malfunction family
deserves full coverage, the four concepts above are the ones to add.

## Existing questions corrected

No question was found to be **materially wrong**. Three had their sourcing
strengthened:

| ID | Issue | Change | Justification |
| --- | --- | --- | --- |
| `rules-adverse-001` | Legal claim cited only the Handbook | Added `ns-mva` s.178 | Period confirmed verbatim in the Act |
| `rules-adverse-003` | Legal claim cited only the Handbook | Added `ns-mva` s.178 | 150 m and 60 m confirmed verbatim in the Act |
| `rules-adverse-002` | Cited Chapter 4 only, though asked in an adverse-conditions context | Added Chapter 5 p.137 | Chapter 5 states the parking-light prohibition directly |

### Duplicates found

No true duplicates were found within Chapter 5's coverage. Three overlaps were
examined and resolved as *supporting material* rather than duplication:

- Chapter 5 p.141–142 repeats threshold braking, already tested by
  `rules-follow-006` (Priority 2). Not duplicated.
- Chapter 5 p.143 repeats evasive steering above 40 km/h and ABS, already tested
  by `rules-follow-004` and `rules-follow-005`. Not duplicated.
- Chapter 5's "two to ten times farther" stopping claim overlaps
  `rules-adverse-008`'s concrete figures. Not duplicated.

## Genuine gaps

| Concept | Why existing coverage was inadequate | Source | Question added |
| --- | --- | --- | --- |
| Skid recovery | **No question in the bank tested skids at all** | ch5 p.146 | `rules-adverse-014` |
| Skid prevention through gentle control inputs | Same — the whole p.141 tips block was untested | ch5 p.141 | `rules-adverse-015` |
| Speed reduction on packed snow and ice | Stopping distances were tested; the speed decision was not | ch5 p.140 | `rules-adverse-016` |
| Wet brakes and how to dry them | Nothing anywhere in the bank | ch5 p.139 | `rules-adverse-017` |
| Hydroplaning response | Only the 85 km/h number was tested, not what to do | ch5 p.139 | `rules-adverse-018` |
| Glare from an undimmed oncoming vehicle | Nothing anywhere in the bank | ch5 pp.136–137 | `rules-adverse-019` |
| Stopping and leaving the vehicle when visibility fails | Nothing anywhere in the bank | ch5 p.138 | `rules-adverse-020` |
| Headlights required below 300 m visibility | Only the night-time period was tested | ch5 p.136 + MVA s.178 | `rules-adverse-021` |

## Material deliberately not tested

- **Supporting advice** — anticipate conditions and check the forecast (p.135);
  sunlight glare and sunglasses (p.137); tunnels and parking garages (p.137);
  gravel and dirt roads (p.140); early-morning frost (p.141); the "Call Police"
  sign, not raising the hood, staying in the vehicle with doors locked (p.143).
- **Repetitive lists** — the seven-item winter-driving rules (p.142); the
  make-yourself-visible-near-trucks list (p.138).
- **Historical or overly precise numbers** — the "$50 or more" financial-
  responsibility suspension threshold (p.150), which is stale on its face;
  the "two to ten times" stopping multiplier, superseded by concrete figures
  already tested.
- **Non-Class-7 material** — the duty on a garage or repair shop to notify
  police of a vehicle showing serious-collision damage (p.149).

## Current-law review

### Resolved

All four lighting claims — see *Fog / visibility* above. Verified against the
tracked MVA snapshot and now cited to it.

### Outstanding — `CURRENT-LAW REVIEW REQUIRED`

**Studded-tyre season dates (`rules-adverse-013`).** The question states 15
October – 30 April, sourced to Handbook Chapter 4 p.109. MVA s.198(2) provides
that "unless permitted by regulations, no tire on a vehicle moved on a highway
shall have on its periphery any block, **stud**, flange, cleat or spike" — that
is, the Act delegates the permission and its dates to a regulation which is **not
in the source manifest**.

The dates are therefore **unverifiable within this repository**. The question was
left unchanged: it is not demonstrably wrong, and the brief is explicit that a
review item should be flagged rather than guessed. No new source was added,
because identifying and vetting the correct regulation is a source-architecture
task rather than part of this audit.

The same gap covers the chapter's chains and studded-tyre traction statements
(pp. 140, 142), which are not tested.

This item is kept separate from the pre-existing review backlog (child-restraint
figures, cannabis-impairment sourcing, administrative suspension regulation).

## After

| | Before | After |
| --- | ---: | ---: |
| Active questions | 286 | **294** |
| Rules pool | 181 | **189** |
| Sign pool | 105 | 105 |
| Adverse Conditions topic | 13 | **21** |
| Questions citing `ns-handbook-ch5` | 22 | **31** |
| Chapter 5 pages cited | 13 / 16 | **13 / 16** |
| Content errors | 0 | 0 |
| Content warnings | 63 | **63** |

- **Questions added:** 8 (`rules-adverse-014` … `rules-adverse-021`)
- **Questions modified:** 3 (source references only)
- **Questions removed:** 0

### Remaining genuine gaps

**Known uncovered testable Chapter 5 concepts: 0.**

The three uncited pages are uncited *by design*, and each corresponds to a
documented decision rather than an oversight:

| Page | Content | Why uncited |
| --- | --- | --- |
| 135 | Chapter introduction — anticipate, check the forecast | General safety advice, no testable decision |
| 142 | Stopping on ice; winter-driving checklist | Duplicates threshold braking; checklist is guidance |
| 145 | Sticking gas pedal; vehicle fires | Malfunction sub-family, deliberately sampled |

Page coverage was 13/16 before and after. That is the intended result: the audit
closed concept gaps without adding a single question to move a citation
percentage.

### Source-review items

1. Studded-tyre season dates — regulation not tracked (new, this priority).

## Content version

Content version is a deterministic digest of the question bank, artwork registry,
fidelity registry and active crops, computed in `vite.config.ts`. Editing
`data/questions/rules-conditions-and-safety.json` changes it automatically; it
was not touched by hand. The built constant was not cleanly extractable from the
bundle for a before/after comparison.

## Tests

`tests/adverse-conditions.test.ts` — 10 tests guarding the three things this
audit found easiest to get wrong:

- every legally-phrased headlight claim cites the Motor Vehicle Act
- the 300 m lighting trigger stays distinct from the 150 m dimming distance
- the lighting requirement is worded as a duty, never a recommendation
- the skid answer is the source response, and is never braking or shifting
- **the phrase "steer into the skid" appears nowhere in the topic**
- keeping to the posted limit is never a correct answer in adverse conditions
- every adverse-conditions question is sourced to a tracked authority

No E2E was added: the new questions use the existing question flow and expose no
new UI path.

## Verification

| Gate | Result |
| --- | --- |
| `pnpm content:validate` | 0 errors, 63 warnings |
| `pnpm content:quality` | reports written |
| `pnpm content:syllabus` | 294 active questions (105 sign, 189 rules) |
| `pnpm content:progression` | 31 topics, 0 Complete unreachable, 0 Mastered unreachable |
| `pnpm sources:check:ci` | 21 unchanged, 0 errors |
| `pnpm signs:approval:check` | 232 approved, 0 changed, 0 broken |
| `pnpm signs:audit` | pass |
| `pnpm signs:learner-audit` | 155/155 artwork, 80/80 Core assessed, 0 gaps |
| `pnpm test` | 399 passed, 21 files |
| `pnpm test:e2e` | 139 passed |
| `pnpm verify` | **exit 0, green** |
