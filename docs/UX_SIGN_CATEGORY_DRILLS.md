# Learn road-sign category drills

## Previous behavior

Learn Road Signs cards opened the Sign Catalogue at
`/signs/gallery?category=<id>`. That surface is for browsing Core and Reference
sign material, not formal practice.

## New behavior

Learn cards open the canonical formal drill route:

`/study/signs/<category-id>`

The session title uses the learner-facing category name, such as **Lane Use &
Turns** or **Parking & Stopping**. The catalogue remains separately available
from the Signs area.

## Drill composition

Each run contains one formal question per Core concept in the canonical
category. The question bank remains the source of truth; no questions are
generated from catalogue names or artwork. The selected question variant is
the least-seen eligible question for that concept, with a stable ID tie-break.

Reference, variant, and developer-only signs are excluded.

## Continue flow

Rules continuation into Road Signs now opens the Regulatory drill. Each sign
category continues to the next canonical category drill, and the final Sign
Shapes category has no next target.

Answers use the normal formal progress recorder, so existing per-question
accuracy, retention, Complete, Mastered, and medal derivations remain the same.

Sign Match remains a separate supplementary game.
