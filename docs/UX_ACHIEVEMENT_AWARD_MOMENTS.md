# Achievement Award Moments

## Philosophy

Profile stores the permanent achievement collection. Result screens provide
the immediate celebration when a learner crosses a new achievement boundary.

## Topic awards

Learning results compare the derived achievement state before and after the
session. Learning → Complete produces **Medal earned**. Complete → Mastered
produces **Medal mastered** with the same achievement identity and the gold
visual. A direct transition to Mastered produces only the strongest event.
Complete → Complete and Mastered → Mastered produce no event.

Rules topics use the steering-wheel family. Canonical Road Sign categories use
the Yield-sign family.

## Section awards

Completing all Rules topics can produce the Rules of the Road Expert section
award. Completing all canonical Road Sign categories can produce the Road
Signs Expert section award. Section awards are derived transitions and are
shown after topic awards.

## Practice Exam awards

Practice exam results compare the existing mock-medal collection before and
after recording the completed exam. The four existing tiers remain unchanged:
First full test, Passed both parts, Consistent, and Flawless. Multiple tiers
may appear together, including First full test and Passed both parts after a
learner's first passing exam. A failed first exam can still earn First full
test.

## Multiple awards and idempotence

Events are ordered from topic to section to larger achievement. Unlocking is
never persisted separately for the celebration: the existing derived medal
state is authoritative, so previously earned medals are not re-awarded.

## Session isolation

Each result compares the snapshot captured when that run began with its own
post-session progress. Practise Again and Continue create fresh runs, so an old
award card cannot leak into another result.

## Accessibility and motion

Award cards include an accessible sentence containing the award type, title,
and meaning. Artwork is decorative because the surrounding text carries the
meaning. The entrance and highlight sweep are short, non-blocking, and are
disabled under `prefers-reduced-motion`.

## Mobile QA

The award is an inline result section that can add vertical content and remains
usable at 390×844, 375×812, and 320×568. It never blocks result actions.

## Tests

The pure event helper covers Complete, Mastered upgrades, idempotence, section
expertise ordering, and multiple first-exam awards. Result screens use the
same helper and the existing medal visual components.
