# Safe-driving syllabus coverage — Priority 2

Completed 2026-08-19. Closes the gap between the Driver's Handbook Chapter 4
("Safety", pp. 106–131) and the question bank that is supposed to test it.

Every concept below is taken from the **Driver's Handbook, Chapter 4**
(repository snapshot `data/sources/snapshots/ns-handbook-ch4.txt`). Page
citations use the running-footer convention: content appearing on the page
whose footer reads *Safety N* is cited as page N.

## Before

| | |
| --- | ---: |
| Active ch4 questions | 14 |
| ch4 pages cited at least once | 14 of 26 |
| Reachable testable concepts (of ~66 enumerated) | 31 |

## After

| | |
| --- | ---: |
| Active ch4 questions | **25** (+11 new, 1 retargeted duplicate) |
| ch4 pages cited at least once | **23 of 26** |
| Reachable testable concepts | **62** |
| Total active questions (all chapters) | **280** |

The three uncited pages (106, 115, 118) are each NOT-SUITABLE — see
*Exclusions* below.

## Duplicate found and fixed

`rules-safety-009` and `rules-impair-010` asked the same question (most
frequent cause of highway crashes), had the same correct answer (driver
inattention), and cited the same page (p. 126). `rules-impair-010` sat in the
impairment topic but tested a safety-table concept — a topic mismatch on top
of the duplication.

`rules-impair-010` has been retargeted onto the **alcohol** row of the same
collision-causes table. It now asks what the Handbook gives as the solution
for the alcohol-related cause ("Don't drink and drive; pay attention and watch
for unusual driving behaviour in others"). This preserves the citation
(p. 126), removes the duplicate, and fixes the topic mismatch.

## Concept inventory

Each row is one testable concept enumerated from the chapter. Decisions:

- **ADD QUESTION** — genuinely uncovered, authored in this pass
- **ALREADY COVERED** — an existing question tests this concept
- **NOT SUITABLE** — not appropriate for a Class 7 multiple-choice question

| Page | Concept | Decision | Question ID |
| --- | --- | --- | --- |
| 106 | Chapter intro (bullet list of topics) | NOT SUITABLE | — |
| 107 | Annual inspection required for all registered vehicles and trailers | ALREADY COVERED | rules-safety-012 |
| 107 | Parts that must be inspected (windshield, brakes, lights, etc.) | NOT SUITABLE | — |
| 107 | Police or Minister's inspector can inspect any time; unsafe vehicle ordered off road | ADD QUESTION | rules-safety-015 |
| 107 | Illegal to operate a vehicle in an unfit or dangerous condition | ADD QUESTION | rules-safety-015 |
| 108 | Owner's manual contains recommended maintenance schedule | NOT SUITABLE | — |
| 108 | Perform regular checks throughout the year | covered by rules-safety-015 | |
| 109 | Check tire pressure when cold or still >4 hours | NOT SUITABLE | — |
| 109 | Tread depth at least 1.5 mm | ALREADY COVERED | rules-safety-004 |
| 109 | Check tires for bumps, bulges, exposed cords, deep cuts | NOT SUITABLE | — |
| 109 | Install snow or all-season tires on all four wheels for winter | NOT SUITABLE | — |
| 109 | Studded tires legal Oct 15 – Apr 30 only | ALREADY COVERED | rules-safety-013 |
| 110 | Windshield cracks, wiper streaks | NOT SUITABLE | — |
| 110 | Fluid levels (oil, coolant, brake fluid, washer) | NOT SUITABLE | — |
| 110 | Shock absorber bounce test | NOT SUITABLE | — |
| 110 | Mirrors: solidly attached, re-adjust to personal driving position | NOT SUITABLE | — |
| 110 | Secure loose objects — can lodge under brake or gas pedal | ADD QUESTION | rules-safety-024 |
| 110 | Seat belts: keep clean, check for cuts or wear at anchor points | partially covered | rules-safety-018 |
| 111 | Brake symptoms: pedal too far, metal rubbing, pull, slow stop | NOT SUITABLE | — |
| 111 | Parking brake test on a grade | NOT SUITABLE | — |
| 111 | Steering: unreasonable play | NOT SUITABLE | — |
| 111 | Exhaust holes let poisonous gas into passenger compartment | ADD QUESTION | rules-safety-016 |
| 111 | Inspect floor and trunk for holes (important in winter, windows closed) | covered by rules-safety-016 | |
| 111 | Body: sharp edges, loose parts, doors and windows | NOT SUITABLE | — |
| 112 | Headlights: half hour after sunset to half hour before sunrise | ALREADY COVERED | rules-adverse-001 |
| 112 | Lights required in fog, rain, snow; 300 m visibility threshold | ALREADY COVERED | rules-adverse-001 |
| 112 | Illegal to use parking lights or DRL instead of headlights | ALREADY COVERED | rules-adverse-002 |
| 112 | Headlight beam aim: parallel, not higher than 1 m at 20 m | NOT SUITABLE | — |
| 112 | DRL improve visibility; pre-1990 vehicles can be modified | NOT SUITABLE | — |
| 112 | Brake lights visible 100 m; number-plate light visible 15 m | NOT SUITABLE | — |
| 113 | Signal lights: intention to start, turn, stop, change lane | NOT SUITABLE | — |
| 113 | Signal visibility distances (150 m / 100 m by vehicle width) | NOT SUITABLE | — |
| 113 | Emergency flashers: stalled in roadway; climbing hill <70 km/h | ADD QUESTION | rules-safety-017 |
| 114 | Flashing red: ambulance, police/fire, school bus loading, volunteer fire chief | ALREADY COVERED | rules-safety-005 |
| 114 | Flashing amber: school bus, explosives, wide trailer, service vehicle | ALREADY COVERED | rules-safety-005 |
| 114 | Flashing blue: police or conservation officer only | ALREADY COVERED | rules-safety-005 |
| 114 | Ornaments/decorations obstructing vision or distracting driver | ALREADY COVERED | rules-safety-006, rules-safety-014 |
| 114 | Horn audible 60 m; use to advise intention to pass | NOT SUITABLE | — |
| 115 | Winter maintenance: battery checked twice, terminals cleaned | NOT SUITABLE | — |
| 115 | Winter emergency kit (shovel, sand, booster cables, candles, etc.) | NOT SUITABLE | — |
| 116 | Why seat belts: hold persons in place, reduce injury | NOT SUITABLE | — |
| 116 | Seat belts prevent injury during regular driving (swerve, sudden stop) | NOT SUITABLE | — |
| 116 | Fewer than 1 % of injury collisions involve fire or submersion; belt increases chance of staying conscious | ADD QUESTION | rules-safety-019 |
| 117 | Everyone ≥16 must wear seat belt; driver responsible for passengers <16 | ALREADY COVERED | rules-safety-001 |
| 117 | Rear-facing infant seat: birth to 10 kg (CMVSS 213.1) | ALREADY COVERED | rules-safety-002 |
| 117 | Forward-facing child seat: 10–18 kg (CMVSS 213, tether strap) | SOURCE REVIEW | — |
| 117 | Booster seat: >18 kg, <9 years unless 145 cm (CMVSS 213.2) | ALREADY COVERED | rules-safety-003 |
| 118 | Seat-belt exemption list (medical, peace officer, fireman, taxi, transit, etc.) | NOT SUITABLE | — |
| 119 | Lap belt low on hips; shoulder belt clear of face and neck | ADD QUESTION | rules-safety-018 |
| 119 | Seat belts worn during pregnancy (lap under abdomen) | covered by rules-safety-018 | |
| 119 | Belts maintained in good working order, not altered | NOT SUITABLE | — |
| 120 | Airbags do not replace seat belts | ALREADY COVERED | rules-safety-002 |
| 120 | Rear-facing child restraint never in airbag position | ALREADY COVERED | rules-safety-002 |
| 120 | Children <12 should not be in airbag seating position | NOT SUITABLE | — |
| 120 | Passengers on/off only at curb or side of road | ADD QUESTION | rules-safety-020 |
| 120 | Never allow person to enter or leave while vehicle is moving | covered by rules-safety-020 | |
| 120 | Truck cargo space: passengers only with seats securely affixed | covered by rules-safety-020 | |
| 120 | No passengers in travel trailer or mobile home while towed | covered by rules-safety-020 | |
| 120 | Walking on highway: face traffic, retro-reflective, light after dark | NOT SUITABLE | — |
| 120 | Hitchhiking is illegal | NOT SUITABLE | — |
| 121 | Driving position: sit up straight, small of back against seat | ADD QUESTION | rules-safety-021 |
| 121 | Seat adjustment: right foot on floor, slight bend in leg | covered by rules-safety-021 | |
| 121 | Line of vision halfway between top of wheel and top of windshield | covered by rules-safety-021 | |
| 122 | Hand position: 10-and-2 or 9-and-3 | ALREADY COVERED | rules-safety-008 |
| 122 | Head restraint: top edge 7 cm above eye level | ALREADY COVERED | rules-safety-007 |
| 122 | Relaxed grasp; do not shuffle hands | NOT SUITABLE | — |
| 123 | Hand-over-hand steering for sharp turns and emergencies | ADD QUESTION | rules-safety-022 |
| 123 | Do not let wheel slide through hands | covered by rules-safety-022 | |
| 124 | Scan road ahead; use mirrors frequently | NOT SUITABLE | — |
| 124 | Only inspection sticker allowed at lower driver's corner of windshield | ALREADY COVERED | rules-safety-006 |
| 124 | Do not divert attention (eating, drinking, cell phone) | ALREADY COVERED | rules-safety-014, rules-impair-008 |
| 124 | Never place arm, head, or foot outside moving vehicle | NOT SUITABLE | — |
| 124 | Starting car: parking brake on, neutral or park | NOT SUITABLE | — |
| 125 | Accelerating: vary foot pressure, ease up gradually | NOT SUITABLE | — |
| 125 | Threshold braking: firm, steady pressure; avoid lock-up | ADD QUESTION | rules-follow-006 |
| 125 | If wheels lock: ease off slightly, then reapply | covered by rules-follow-006 | |
| 125 | ABS: press steadily and firmly, do not pump; vibration is normal | ALREADY COVERED | rules-follow-005 |
| 125 | Steering preferred to braking above 40 km/h | ALREADY COVERED | rules-follow-004 |
| 126 | Collision causes table: driver inattention is #1 | ALREADY COVERED | rules-safety-009 |
| 126 | Collision causes table: alcohol — don't drink and drive, watch for unusual behaviour | ADD QUESTION (retargeted) | rules-impair-010 |
| 126 | Collision causes table: failure to yield, distraction, inexperience, speed | ALREADY COVERED | rules-impair-011 (distraction) |
| 127 | Defensive driving: reduce own mistakes, anticipate others' mistakes | ALREADY COVERED | rules-safety-013 |
| 128 | Highway hypnosis: pull over and stop | NOT SUITABLE | — |
| 128 | Tips: eat modestly, comfortable clothing, walking break every hour, cool cabin | NOT SUITABLE | — |
| 128 | Never use cruise control when overtired | ALREADY COVERED | rules-impair-009 |
| 129 | Slow-moving Vehicle sign (farm tractor, <40 km/h) | NOT SUITABLE | — |
| 129 | Open tailgates: illegal for commercial vehicle on highway | NOT SUITABLE | — |
| 130 | Load extends >1 m: red flag ≥300 mm during daylight; amber/red light after dark | ALREADY COVERED | rules-safety-011 |
| 130 | Towing trailers: all must be licensed and inspected | NOT SUITABLE | — |
| 130 | Only commercial vehicles can tow more than one trailer | NOT SUITABLE | — |
| 130 | Draw bar ≤5 m (8 m for poles); chain/rope: red flag ≥300 sq mm | NOT SUITABLE | — |
| 130 | Never carry people in any type of trailer while towed | covered by rules-safety-020 | |
| 131 | Moving disabled vehicle: professional towing recommended | NOT SUITABLE | — |
| 131 | If must tow: flashers, secure attachment, someone in disabled vehicle to brake | ADD QUESTION | rules-safety-023 |
| 131 | Do not tow vehicle with power braking/steering if engine cannot run | NOT SUITABLE | — |
| 131 | Do not try to start disabled vehicle by towing it | covered by rules-safety-023 | |
| 131 | Oversized vehicle: permit required; dimensions (12.5 m / 2.6 m / 4.15 m) | NOT SUITABLE | — |

## Questions added

| ID | Topic | Source | Learning objective |
| --- | --- | --- | --- |
| rules-safety-015 | vehicle-and-driver-safety | ch.4 p.108 | Annual inspection certifies the vehicle on the day; it is illegal to operate an unfit vehicle at any time |
| rules-safety-016 | vehicle-and-driver-safety | ch.4 p.111 | Exhaust holes let poisonous gas into the passenger compartment, especially in winter |
| rules-safety-017 | vehicle-and-driver-safety | ch.4 p.113 | Emergency flashers are for emergencies: stalled vehicle, climbing hill below posted minimum |
| rules-safety-018 | vehicle-and-driver-safety | ch.4 p.119 | Lap belt low on hips, shoulder belt clear of face and neck; worn during pregnancy |
| rules-safety-019 | vehicle-and-driver-safety | ch.4 p.116 | Fewer than 1 % of injury collisions involve fire or submersion; belt keeps you conscious to escape |
| rules-safety-020 | vehicle-and-driver-safety | ch.4 p.120 | Passengers on/off at curb only; never enter or leave while moving; truck cargo space needs fixed seats |
| rules-safety-021 | vehicle-and-driver-safety | ch.4 p.121 | Seat adjustment: slight bend in leg, line of vision halfway between wheel top and windshield top |
| rules-safety-022 | vehicle-and-driver-safety | ch.4 p.123 | Hand-over-hand steering for sharp turns and emergencies; do not let wheel slide through hands |
| rules-safety-023 | vehicle-and-driver-safety | ch.4 p.131 | Towing a disabled vehicle: someone must sit in it to work the brakes and keep the cable tight |
| rules-safety-024 | vehicle-and-driver-safety | ch.4 p.110 | Loose objects can lodge under brake or gas pedal |
| rules-follow-006 | following-and-stopping | ch.4 p.125 | Threshold braking without ABS: if wheels lock, ease off slightly then reapply |

Cognitive task was varied: vehicle knowledge (exhaust, flashers, interior,
towing), body position and technique (seat, steering, seat-belt fit), and
collision-cause recall (alcohol row). No new question contains a
time-sensitive age, weight or height number — see *Source review required*
below.

## Exclusions

### NOT SUITABLE — pages 106, 115, 118

The three uncited ch4 pages map exactly to three NOT-SUITABLE decisions:

- **Page 106** — chapter introduction. A bullet list of topics the chapter
  covers. Not a testable concept.
- **Page 115** — winter emergency kit. A list of items to carry (shovel, sand,
  booster cables, candles, blankets, etc.). Lists of this kind do not make
  good single-best-answer questions; the individual items are not independently
  testable in a way that distinguishes a safe driver from an unsafe one.
- **Page 118** — seat-belt exemption list. Nine categories of exempt person
  (medical, peace officer, fireman, taxi driver, transit bus driver, ambulance
  attendant, person entering/leaving frequently, prisoner transport). The list
  is too long and the categories too specific for a fair Class 7 question; a
  learner who has never encountered "medical attendant in an ambulance" cannot
  be expected to distinguish it from "paramedic" by reasoning.

### NOT SUITABLE — concept-level exclusions

Roughly 30 enumerated concepts were judged NOT SUITABLE for one of three
reasons:

1. **Technical specification** (beam aim 1 m at 20 m, horn audible 60 m, brake
   lights visible 100 m, draw-bar length, oversized vehicle dimensions). These
   are reference numbers, not safety reasoning.
2. **Procedure detail** (shock absorber bounce test, tire pressure check
   interval, starting-car steps, accelerating technique). These belong in an
   owner's manual, not a knowledge test.
3. **General advice** (scan the road, eat modestly before a long drive, don't
   drive too far in one day). True but not discriminating — a learner who has
   never read the chapter would answer correctly on common sense.

## Source review required

The Handbook gives numeric thresholds for child-restraint stages:

| Stage | Weight | Height | Age | Standard |
| --- | --- | --- | --- | --- |
| Rear-facing infant seat | birth – 10 kg | — | — | CMVSS 213.1 |
| Forward-facing child seat | 10 – 18 kg | — | — | CMVSS 213 |
| Booster seat | > 18 kg | < 145 cm | < 9 years | CMVSS 213.2 |

The repository tracks no seat-belt or child-restraint regulation — only
`ns-handbook-ch4` itself. These numbers therefore cannot be cross-checked
against a tracked current regulation. Existing `rules-safety-001` and
`rules-safety-003` already depend on them.

Per the project brief no new questions containing time-sensitive age, weight
or height numbers were authored in this pass. This is recorded as
**SOURCE REVIEW REQUIRED** rather than forced to zero: if the regulation is
later ingested (e.g. Nova Scotia Child Restraint Regulations, CMVSS 213
series), the existing questions can be verified against it and new questions
on the forward-facing stage (10–18 kg) can be authored.

## Incidental fixes — Section 0 accessibility hygiene

Seven work-zone `visualDescription` fields in `sign-meta.json` were corrected:
`blasting-ahead`, `prepare-to-stop`, `overhead-work`, `survey-work`,
`wz-workers-ahead`, `wz-traffic-control-person`, `tar`. Two were factually
wrong, not just vague:

- `blasting-ahead` was described as an orange diamond; it is a white square.
- `prepare-to-stop` was described as a single sign; it is a two-diamond
  combination sign.

The accompanying question `signs-wz-002` had its stem corrected — the flags
are above the upper corners, not lower.

`signs:approval:check` still reports 232/232 approved, 0 changed, 0 broken.
The fingerprint covers app id, designation, asset path, PNG bytes and
canonical display name, none of which changed.

## Gates

| Gate | Result |
| --- | --- |
| content:validate | 0 errors, 63 warnings (was 66) |
| content:quality | wrote reports |
| content:syllabus | ch4 citations 24 → 35; 280 active questions; ch4 page coverage 23/26 |
| content:progression | 31 topics, 0 unreachable |
| signs:approval:check | 232/232 approved, 0 changed, 0 broken |
| test | 336 passed, 17 files |
