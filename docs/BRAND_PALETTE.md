# App Brand Palette

## Core brand

| Role | Token | Value |
| --- | --- | --- |
| Deep | `--brand-deep` | `#002b49` |
| Primary | `--brand` | `#00558c` |
| Light | `--brand-light` | `#428bca` |
| Soft | `--brand-soft` | `#e9f3f9` |
| On brand | `--on-brand` | `#ffffff` |

The semantic app accent roles now resolve to the Halifax blue family for
navigation, primary actions, links, selection and ordinary progress. Dark mode
uses a lighter derived blue for contrast.

## Achievement

| Role | Token | Value |
| --- | --- | --- |
| Gold | `--achievement` | `#ffb500` |
| Mastery | `--mastery` | `#9b26b6` |

Gold is reserved for awards, levels and celebratory emphasis. It is not used
as small body text on light surfaces. Mastery purple is reserved for mastered
states and rare/premium details.

## Existing semantic colours

`--good`, `--warn` and `--bad` remain authoritative for success, warning and
danger. They were deliberately selected for readable text contrast and were
not replaced by Halifax's raw green, orange and red values.

## Neutral surfaces

Light mode remains an off-white neutral page with white cards and warm grey
secondary surfaces. Dark mode remains near-black/charcoal (`--bg: #0e1014`)
with charcoal cards. Halifax Navy is an accent, never the dark page
background.

## Usage rules

- Navigation, primary actions, links, focus and selected controls: Halifax blue.
- Ordinary progress: Halifax blue.
- Achievement levels and award highlights: achievement gold where specified by
  the achievement system.
- Mastered or rare special states: restrained mastery purple.
- Success, warning and danger feedback: existing `--good`, `--warn`, `--bad`.
- Road-sign category colours: retain their taxonomy role; never recolour the
  approved sign artwork.
- Surfaces and body text: existing neutral tokens.

The palette is applied by semantic role rather than global hex replacement.

## Dark mode

Neutral charcoal surfaces remain primary. Blue controls and selected states are
lifted for visibility, while the same semantic feedback colours remain
distinct from the brand family.
