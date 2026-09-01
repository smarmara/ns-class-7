# Sign syllabus coverage — Priority 1

Completed 2026-08-19. Closes the gap between the artwork the app has wired up
and the sign concepts a learner is actually asked about.

Every meaning below is taken from the **Driver's Handbook, Chapter 3**
(repository snapshot `data/sources/snapshots/ns-handbook-ch3.txt`). No artwork,
mapping, name, provenance or approval record was modified.

## Before

| | |
| --- | ---: |
| Active sign questions | 90 |
| Distinct sign visuals reachable from a question | 68 |
| Registered sign visuals used by no question | 14 |

## After

| | |
| --- | ---: |
| Active sign questions | **104** |
| Distinct sign visuals reachable from a question | **82** |
| Registered sign visuals used by no question | **0** |

Total active questions: 255 → 269.

## A note on sourcing

`sign-fidelity.json` attributes the ten work-zone visuals to the *Temporary
Workplace Traffic Control Manual*, which is **not in the source manifest** and
therefore cannot be cited by a question. That turned out not to matter: the
Driver's Handbook describes every one of these signs explicitly in Chapter 3
(pp. 98–103), in wording precise enough to author from directly. All fourteen
questions cite the Handbook, at the page its neighbouring questions already use.

## Decisions

| App ID | Source | Concept | Decision | Question ID |
| --- | --- | --- | --- | --- |
| hazard-marker-keep-left | Handbook ch.3 p.90 | Stripes sloping down to the left mean pass to the left of the marker | ADD QUESTION | signs-reg-022 |
| railway-crossing-ahead | Handbook ch.3 p.81 | Advance warning that a crossing is ahead; look and listen, you may have to stop | ADD QUESTION | signs-rail-007 |
| fire-truck-entrance | Handbook ch.3 p.91 | Approaching a place where fire trucks enter or leave the road | ADD QUESTION | signs-warn-023 |
| bridge-opening | Handbook ch.3 p.92 | A bridge ahead can be opened to permit the passage of boats | ADD QUESTION | signs-warn-024 |
| tar | Handbook ch.3 p.99 | Tar sprayed ahead; surface may be slippery and spray can stick to the vehicle | ADD QUESTION | signs-wz-011 |
| work-right-lane-ends | Handbook ch.3 p.99 | Advance notice so traffic forms a single lane early, avoiding last-moment conflict | ADD QUESTION | signs-wz-012 |
| prepare-to-stop | Handbook ch.3 p.98 | Advance notice that a traffic control person may stop traffic; ease off gradually | ADD QUESTION | signs-wz-013 |
| road-surface-hazard | Handbook ch.3 p.99 | Surface may be rutted or grooved; two-wheeled traffic can become unstable | ADD QUESTION | signs-wz-014 |
| work-road-narrows | Handbook ch.3 p.99 | Road narrows but the number of lanes does not change | ADD QUESTION | signs-wz-015 |
| construction-traffic | Handbook ch.3 p.100 | Construction vehicles entering/leaving on the right, often moving slower | ADD QUESTION | signs-wz-016 |
| blasting-ahead | Handbook ch.3 p.100 | Blasting on or near the road; traffic may be required to stop | ADD QUESTION | signs-wz-017 |
| survey-work | Handbook ch.3 p.101 | Human-activity sign: a survey crew is working on or near the road | ADD QUESTION | signs-wz-018 |
| overhead-work | Handbook ch.3 p.102 | Human-activity sign: work overhead on electrical or data cables | ADD QUESTION | signs-wz-019 |
| flashing-double-arrow | Handbook ch.3 pp.102–103 | Two arrow heads: lane closed, safe to pass on **either** side | ADD QUESTION | signs-wz-020 |

All fourteen are Class 7 material: each has its own entry and its own meaning in
the Handbook chapter the official test page names as the study material. None
was excluded, and none was added merely to raise a count — see *Overlap
considered* below for the two that were argued hardest.

## Questions added

| ID | Topic | Artwork | Source | Learning objective |
| --- | --- | --- | --- | --- |
| signs-reg-022 | signs-regulatory | hazard-marker-keep-left | ch.3 p.90 | Read the stripe direction to know which side of an obstruction to pass |
| signs-rail-007 | signs-railway | railway-crossing-ahead | ch.3 p.81 | Distinguish the advance warning sign from the crossbuck that marks the crossing |
| signs-warn-023 | signs-warning | fire-truck-entrance | ch.3 p.91 | Expect fire trucks to enter or leave the road at this point |
| signs-warn-024 | signs-warning | bridge-opening | ch.3 p.92 | Recognise a movable bridge that opens for boats |
| signs-wz-011 | signs-work-zone | tar | ch.3 p.99 | Fresh tar makes the surface slippery |
| signs-wz-012 | signs-work-zone | work-right-lane-ends | ch.3 p.99 | Merge early so the single lane forms before the pinch point |
| signs-wz-013 | signs-work-zone | prepare-to-stop | ch.3 p.98 | Expect a traffic control person to stop traffic; slow gradually |
| signs-wz-014 | signs-work-zone | road-surface-hazard | ch.3 p.99 | Rutted or grooved surface, especially risky for two-wheeled traffic |
| signs-wz-015 | signs-work-zone | work-road-narrows | ch.3 p.99 | Narrowing *without* losing a lane — distinct from a lane ending |
| signs-wz-016 | signs-work-zone | construction-traffic | ch.3 p.100 | Slower construction vehicles joining and leaving on the right |
| signs-wz-017 | signs-work-zone | blasting-ahead | ch.3 p.100 | Blasting nearby; traffic may have to stop |
| signs-wz-018 | signs-work-zone | survey-work | ch.3 p.101 | Identify the survey-crew human-activity sign among its siblings |
| signs-wz-019 | signs-work-zone | overhead-work | ch.3 p.102 | Workers above the road on cables |
| signs-wz-020 | signs-work-zone | flashing-double-arrow | ch.3 pp.102–103 | Two arrows means pass either side, unlike a single arrow or caution bar |

Cognitive task was varied rather than repeating one stem: recognition
(fire truck, bridge, tar, overhead), driver response (hazard marker, prepare to
stop, merge timing), and discrimination among near-neighbours (road surface vs
uneven lanes vs narrows; survey vs the other human-activity signs; double arrow
vs single arrow vs caution bar).

## Exclusions

None. No visual was judged ALREADY COVERED or OUT OF CLASS-7 SCOPE.

### Overlap considered

Two additions sit close to an existing question and were only kept because the
new question tests something the old one does not:

- **work-right-lane-ends** overlaps `signs-warn-015`, which uses the permanent
  yellow lane-ends sign and asks what to do (merge left). Rather than repeat
  that, `signs-wz-012` asks *why* the Handbook says to merge as soon as it is
  safe — forming the single lane early avoids conflict at the last possible
  moment (p.99). Had it simply asked "what should you do", it would have been a
  duplicate and should have been dropped.
- **survey-work** overlaps `signs-wz-002`, which covers the workers-ahead
  human-activity sign. `signs-wz-018` is written as a discrimination task
  against the other human-activity signs (traffic control person, overhead
  cables) rather than re-testing "workers are present".

Both are recorded here so the judgement can be overturned easily if you disagree.

## Remaining gaps

**No registered sign visual is now unreachable from a question.** The syllabus
audit reports 82 reachable visuals against 82 wired signs.

## Incidental fix — one accessibility description

`road-surface-hazard`'s accessible description read:

> An orange diamond with a black symbol indicating **a road surface hazard**.

That names the sign's meaning instead of describing the picture, which the
project's own test forbids (`tests/content-integrity.test.ts` — "keeps every
sign meaning out of its own visual description"). It had never been caught
because no question used the sign. It now reads:

> An orange diamond showing a black motorcycle and rider above a band of small bumps.

This is `sign-meta.json` only — no artwork, mapping, name, provenance or
approval record was touched, and `signs:approval:check` still reports all 232
approved visuals valid (the fingerprint covers the app id, designation, asset
path, PNG bytes and canonical display name, none of which changed).

The same test's printed-legend exemption was extended to `prepare-to-stop`,
whose face literally reads PREPARE TO STOP — the same treatment
`wz-end-construction` already had. For signs with a legend painted on them the
words *are* the appearance; omitting them would give a screen-reader user less
than a sighted one, and leaks nothing because the words are visible in the image.

### Colour checked, not a defect

The work-zone descriptions all say "orange diamond" while the crops look amber
next to the yellow warning signs. Measured rather than eyeballed: work-zone
faces are hue 39–44° (rgb 243,183,23) and permanent warning faces are hue 57°
(rgb 255,242,0). They are genuinely different colours and "orange" is a fair
description. **No artwork/source mismatch found.**

## Follow-up worth considering

Several work-zone descriptions are vague in the same way the fixed one was —
for example `overhead-work` is "an orange diamond with a black symbol indicating
work being done above the road". They pass the tests, so nothing was changed,
but a pass over the family would make the accessible names more useful.
