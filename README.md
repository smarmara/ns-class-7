# Nova Scotia Class 7 Study

An independent, mobile-first study app for the **Nova Scotia Class 7 Learner's Licence knowledge
test**, built as a PWA that works offline.

> **This is not an official app.** It is not affiliated with, endorsed by, or connected to the
> Government of Nova Scotia, Access Nova Scotia, or the Registry of Motor Vehicles. The questions
> are original practice questions written from official sources — they are not the questions used
> on the real examination, and nobody outside the Registry has those.

The goal is not "a quiz app". The goal is a study system whose every claim about Nova Scotia road
law can be traced back to an official source, and which is honest about what it does and does not
know.

---

## What you get

| Area | What it does |
| --- | --- |
| **Dashboard** | Readiness score with its calculation shown, per-section progress, accuracy, streak, weak and strong topics, last mock result, content-verified date |
| **Quick Practice** | Mixed set weighted toward weak areas and anything due for review |
| **Study by topic** | 21 Rules of the Road topics, each with per-topic accuracy |
| **Road signs** | Drills by category plus a browsable gallery of all 60 signs |
| **Mock test** | Full simulation of the official two-part format, timed, with per-section pass/fail |
| **Review** | Mistakes queue, weak-area drill, saved (bookmarked) questions |
| **Sources** | What the bank is based on, the Traffic Safety Act status, and a data reset |

243 questions across 30 topics, every one carrying at least one official source reference.

---

## Running it

Requires Node 20+ and pnpm.

```bash
pnpm install
pnpm dev            # http://localhost:5173
```

Other commands:

```bash
pnpm lint               # eslint (flat config, zero errors required)
pnpm build              # typecheck + production build (with service worker)
pnpm preview            # serve the production build
pnpm test               # unit and integration tests (vitest)
pnpm test:e2e           # browser tests (playwright, mobile + desktop)
pnpm content:validate   # question-bank integrity checks
pnpm sources:check      # fetch official sources and detect changes
pnpm sources:check:ci   # same, but exit non-zero if anything changed (CI)
pnpm icons:generate     # regenerate the PWA icons
pnpm verify             # content:validate + test + build
```

---

## Architecture

The content layer knows nothing about React, and the UI knows nothing about where content came
from. A rule change is a data edit, never a component edit.

```
data/                        ← the content layer (no code)
  exam-config/class7.json      official test format, derived from the Class 7 page
  exam-config/legal-status.json  which law is IN FORCE — the commencement gate
  sources/source-manifest.json   the official source registry + content hashes
  sources/snapshots/             normalized-text baseline per source (for real diffs)
  questions/*.json               the question bank, one file per topic group
  signs/sign-meta.json           sign meanings + accessible descriptions

src/
  content/       typed loading and filtering of everything in data/
  engine/
    random.ts        seeded PRNG — makes sessions reproducible and tests deterministic
    quiz/            question selection, choice shuffling, scoring
    learning/        spaced repetition, weak-topic detection, readiness
    exam/            mock-test session lifecycle
  store/         zustand stores + IndexedDB/localStorage persistence
  signs/         original SVG sign artwork (drawing only — meanings live in data/)
  ui/            shared components, question renderer, quiz session driver
  routes/        one file per screen (each lazy-loaded on navigation)

scripts/         validation, source monitoring, PDF ingestion, icon generation
tests/           unit and integration tests
e2e/             Playwright browser tests
```

### Why the seeded PRNG

Every selection and shuffle is driven by a seed. That buys three things: a mock test can be
restored byte-identically after a refresh, randomisation tests are deterministic rather than
flaky, and a reported bug can be reproduced from its seed.

### How answer shuffling stays safe

`question.correctChoice` always refers to the choices **as authored**. Shuffling never rewrites it;
instead a `displayOrder` array maps presented positions back to authored indices. There is no code
path where reordering can change which answer is correct — and `tests/selection.test.ts` asserts
this over 200 seeds.

Choices that refer to other choices by position (`"Both of the above"`) are detected and left
unshuffled. The bank does not currently use any, but the guard means a future one cannot silently
corrupt a test.

---

## Where the content comes from

Official Government of Nova Scotia and Nova Scotia Legislature sources only. No driving-school
sites, no SEO practice-test sites, no forums, no Quizlet.

**Precedence — higher wins when sources conflict:**

1. **Statute in force** — Motor Vehicle Act, R.S.N.S. 1989, c. 293
2. **Regulations in force** — Traffic Signs, School Areas, Yield to Transit Buses, Classification
   of Drivers' Licenses
3. **Current RMV guidance and printed handbook amendments**
4. **Driver's Handbook chapter body text** (which may be older than the amendments)

That ordering matters in practice. The handbook chapters still describe a two-stage GDL programme
and a one-year learner's licence; the official amendment pages published with the same handbook
supersede both. The app teaches the amendments.

**Test format** comes from the
[official Class 7 knowledge test page](https://www.novascotia.ca/take-driver-knowledge-test-learners-licence-class-7)
and lives in `data/exam-config/class7.json`. Nothing about the format is hard-coded in components.

Full attribution and copyright analysis: [LEGAL_AND_SOURCES.md](LEGAL_AND_SOURCES.md).

---

## The Traffic Safety Act transition

Nova Scotia enacted a Traffic Safety Act (S.N.S. 2025, c. 20) that will eventually replace the
Motor Vehicle Act. **Royal Assent is not commencement.**

As verified on 2026-08-17, the Legislature's
[Proclamations of Nova Scotia Statutes](https://www.nslegislature.ca/legislation/proclamations-nova-scotia-statutes)
page lists:

```
Traffic Safety Act
2025, c. 20 -- NOT PROCLAIMED IN FORCE
```

and the Department of Public Works
[changes page](https://novascotia.ca/changes-to-traffic-safety-legislation/) instructs readers to
"Continue to follow the Motor Vehicle Act until then."

This is modelled explicitly rather than assumed:

- `data/exam-config/legal-status.json` records each law version, whether it is `inForce`, and the
  **evidence** for that claim including the source and the date observed.
- Every question carries a `lawVersion`. The loader serves a question only if its `legalStatus`
  is `current` **and** its law version is in force.
- A question written against the Traffic Safety Act must be `legalStatus: "future"`. The validator
  **fails the build** if anything is marked `current` against a law version that is not in force.
- Nothing is promoted because the calendar year changed, because a crawler saw a page update, or
  because the Act exists. Promotion is a deliberate edit following the
  `promotionChecklist` in `legal-status.json`.

Currently the app ships **no** Traffic Safety Act content. That is intentional: the official
sources do not yet state the new provisions in enough detail to write questions from, and inventing
them would be exactly the failure mode this project exists to avoid. The machinery is in place and
tested (`tests/content-integrity.test.ts`) so that content can be added and gated when the details
are published.

---

## Maintainer workflows

### Checking for source changes

```bash
pnpm sources:check              # fetch, compare, write a report (read-only)
pnpm sources:check --accept     # also record the new hashes + snapshots as the baseline
pnpm sources:check --ci         # exit non-zero if anything changed (used by CI)
pnpm sources:check --only=ns-mva
```

Pages are normalised to visible text before hashing, so a CSS rebuild, a new analytics tag or
whitespace churn does not raise a false alarm — but a changed number or an added sentence does.
`tests/source-check.test.ts` and `tests/source-diff.test.ts` pin that behaviour.

**The checker never edits a question.** A government page changing is a signal for a human to read
a diff, not a licence for a crawler to rewrite what a learner is taught.

#### Snapshots and real diffs

Alongside the manifest hash, the checker keeps a **normalized-text snapshot** per source at
`data/sources/snapshots/<source-id>.txt`. When a source changes, the report includes a genuine
old-versus-new diff (context lines, `-` removals, `+` additions, bounded to keep it readable)
instead of just "hash differs". `scripts/lib/diff.ts` is a small Myers-diff implementation with no
runtime dependencies.

Snapshot lifecycle:

- Sources whose content is **unchanged** get their snapshot written automatically on every run —
  this simply records the verified baseline (a first run after this feature shipped captures all
  baselines at once).
- A **changed** or **first-seen** source is never snapshotted without `--accept`, so the review
  artifact is never polluted by unreviewed bytes.

### Reviewing a detected legal change

When `pnpm sources:check` reports a change it writes `.sources/reports/source-check-<timestamp>.md`
listing the changed source, its precedence, old and new hashes, a **readable diff of the old vs new
normalized text**, and **every question that depends on it**. Then:

1. Read the current source and work out what actually changed — the diff shows you what to focus on.
2. If a rule the app teaches has changed, set the affected questions to
   `"legalStatus": "under_review"` with a `reviewReason`. They immediately stop being served —
   they do not wait for a release.
3. Re-verify each question against the new text. Rewrite it, or retire it (below).
4. Update the question's `verifiedAt`, and the source's `verifiedAt` once a human has re-read it.
5. `pnpm sources:check --accept` to record the new baseline hash **and** the new snapshot. A future
   change is now diffable against the newly accepted text.
6. `pnpm content:validate && pnpm test`.

Note that `--accept` deliberately does **not** touch `verifiedAt`: a matching hash proves the bytes
are the same, not that a person has re-read the rule.

### Adding a question

Add an object to the appropriate file in `data/questions/`. Required fields are enforced by the
validator:

```jsonc
{
  "id": "rules-passing-009",              // unique, stable, human-meaningful
  "type": "rules",                        // "rules" | "sign"
  "topic": "passing",                     // must be in the taxonomy in src/content/types.ts
  "question": "…",
  "choices": ["…", "…", "…", "…"],
  "correctChoice": 0,                     // index into choices AS AUTHORED
  "explanation": "…",                     // why the right answer is right
  "incorrectChoiceExplanations": [null, "…", "…", "…"],  // null at the correct index
  "difficulty": "medium",
  "tags": ["passing"],
  "sourceRefs": [
    { "sourceId": "ns-mva", "section": "s.115(1)", "note": "…" }
  ],
  "legalStatus": "current",
  "verifiedAt": "2026-08-17",
  "lawVersion": "mva"
}
```

Rules the validator enforces, each of which fails the build:

- at least one source reference, and every `sourceId` must exist in the manifest;
- any question stating a **number, distance, age, fine or limit** must have a source reference with
  a `section`, `chapter`, `page` or `note` — naming a document is not enough to locate a fact;
- `correctChoice` must point at a real choice, and no two choices may be textually identical
  (which would make two answers correct);
- no duplicate ids and no near-duplicate questions (fingerprinted on stem + sign + correct answer);
- `current` only if the law version is in force; `under_review` must carry a `reviewReason`;
- sign references must resolve to both metadata and artwork;
- for identify-the-sign questions the choice text must be the sign's `visualDescription` verbatim,
  because that string is the accessible name;
- the source's `verifiedAt` must be within the policy window in the manifest.

### Retiring an outdated question

Do not delete it — the audit trail is the point.

```jsonc
"legalStatus": "superseded",
"effectiveTo": "2027-01-01",
"reviewReason": "School-area limit changed by N.S. Reg. …; replaced by rules-school-009"
```

It stops being served immediately and stays in the repository as the record of what was taught and
when.

### Adding a road sign

1. Add metadata to `data/signs/sign-meta.json` — `label` (the meaning), `category`,
   `visualDescription`, and `basis` (which official source specifies the design).
2. Add the SVG to `SIGN_ART` in `src/signs/registry.tsx`, keyed by the same id, composed from the
   blanks in `src/signs/shapes.tsx`.
3. `pnpm content:validate` will fail if either half is missing.

`visualDescription` must describe **shape, colour and symbols only — never the meaning.** It is the
accessible name for the artwork, so a description that stated the meaning would hand screen-reader
users the answer to every recognition question. Legends actually painted on the sign (STOP, YIELD,
MAXIMUM 50) are fair to state, because a sighted user reads them too. Both halves of this rule are
asserted in `tests/content-integrity.test.ts`.

### Re-ingesting official documents

The handbook PDFs and the consolidated Motor Vehicle Act live in `.sources/` as a **local research
cache** — never shipped, never republished.

```bash
pnpm sources:ingest                                    # handbook PDFs -> text
pnpm exec tsx scripts/extract-pdf.ts in.pdf out.txt    # any other PDF
```

---

## Testing

Continuous integration (`.github/workflows/ci.yml`) runs on every push to `main` and every pull
request:

1. `pnpm lint` — no lint errors.
2. `pnpm content:validate` — question-bank integrity.
3. `pnpm test` — unit and integration tests.
4. `pnpm build` — typecheck + production build.
5. `pnpm sources:check --ci` — fetches every monitored government source and **fails the build** if
   any has changed or could not be fetched. A change here is a review signal, never auto-promoted
   content.
6. A separate end-to-end job (after the checks pass) installs Playwright's Chromium and runs
   `pnpm test:e2e` on both the mobile and desktop projects.

The tests are deterministic: the seeded PRNG (`src/engine/random.ts`) means randomisation tests and
the mock-test lifecycle produce the same outcome on every run and every machine, so CI is not a
source of flakes.

```bash
pnpm test        # 138 unit/integration tests
pnpm test:e2e    # 40 browser tests (20 each on Pixel 7 and Desktop Chrome)
```

Unit coverage: scoring and independent section pass/fail, randomisation invariants, spaced
repetition, weak-topic calculation, readiness, progress persistence and migration, mock-session
lifecycle and serialisation, source-manifest parsing, HTML normalisation for change detection,
the old-vs-new diff renderer and snapshot lifecycle, and content integrity (sources, legal-status
filtering, exam config, numeric-fact traceability).

E2E covers the learner journey end to end: answering with explanations and sources, bookmarking,
topic and sign drills, the mock test including mid-test non-disclosure and refresh recovery,
per-section scoring, the sources page, data reset, and accessibility (keyboard operation, skip
link, labelled fieldsets, no horizontal overflow on a phone).

### Accessibility

- Keyboard operable throughout, with visible focus rings.
- Choices are a labelled `<fieldset>`; each question's stem is the group label.
- **Correct/incorrect is never conveyed by colour alone** — every marked choice carries an icon and
  the words "Correct answer" or "Your answer — incorrect".
- Sign artwork has an accessible description of what it looks like, so recognition questions are
  answerable non-visually without being given away.
- Focus moves to the top of each new question so keyboard users are not stranded.
- Light and dark themes, both meeting contrast requirements.
- `prefers-reduced-motion` respected.

---

## Local context

The law is province-wide. Halifax appears only to make scenarios concrete — Halifax Transit buses,
urban crosswalks, roundabouts, the bridges in freezing weather, Highway 102 merges. There is no
separate "Halifax driving law" dataset. Where a Halifax detail matters legally it is because
provincial law says so: Halifax Regional Municipality is a *prescribed* transit operator under the
Yield to Transit Buses Regulations, which is why the transit-bus rule applies to Halifax Transit
and is cited that way.

---

## Privacy

Everything stays on the device. Progress is in IndexedDB (with a localStorage fallback); the
in-flight mock test mirrors to localStorage because that write is synchronous and must survive an
abrupt refresh. No account, no server, no analytics, no network calls at runtime. "Reset all
progress" on the Sources page erases everything.

---

## Licence and disclaimer

Application code, question text, explanations, UI copy and sign artwork in this repository are
original work. Official Nova Scotia material is used as a cited factual research layer and is not
republished. No government logos or branding are used. See
[LEGAL_AND_SOURCES.md](LEGAL_AND_SOURCES.md).

Study aids are not legal advice. Always confirm current requirements with the Registry of Motor
Vehicles.
