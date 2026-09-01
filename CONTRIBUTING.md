# Contributing

Thanks for looking. This is a small, focused project: an independent study app
for the Nova Scotia Class 7 learner's licence knowledge test.

One thing to understand before you start, because it shapes everything else:

> **Content changes are not copy edits.** People use this app to prepare for a
> licence that lets them drive a car. A wrong speed limit or a wrong right-of-way
> rule is a safety problem, not a typo. Changes to driving guidance need a
> citation to an official source — see [Content changes](#content-changes).

Code changes are ordinary open-source work and very welcome.

---

## Setup

Requires **Node 22+** and **pnpm 10+**. The exact versions are pinned in
`.nvmrc` and `packageManager` in `package.json`.

```bash
pnpm install
pnpm dev            # http://localhost:5173
```

First run also needs browsers for the end-to-end tests:

```bash
pnpm exec playwright install --with-deps chromium
```

---

## The one command that matters

```bash
pnpm verify
```

This is the same gate CI runs, and it must pass before a pull request can be
merged. It runs, in order:

| Step | What it protects |
| --- | --- |
| `lint`, `typecheck` | Ordinary code health |
| `content:validate` | Every question has a valid, in-force source |
| `sources:check:ci` | Official Nova Scotia sources have not changed underneath us |
| `signs:approval:check` | No approved sign artwork has been altered |
| `test` | Unit and integration tests |
| `test:e2e` | Browser tests, mobile and desktop |
| `pages:test` | The app still works hosted under a subdirectory |
| `build` | Production build |
| `native:offline:check` | The build needs no network to teach |

If `sources:check:ci` fails, that is usually **not your fault** — it means
Nova Scotia changed a page. See [When a source changes](#when-a-source-changes).

Individual gates, if you want faster feedback:

```bash
pnpm test              # unit tests
pnpm test -- --watch   # while working
pnpm content:validate  # question bank integrity
pnpm content:quality   # authoring quality warnings
pnpm content:syllabus  # syllabus coverage
pnpm content:progression
pnpm signs:learner-audit
pnpm pages:preview     # serve the built app at /ns-class-7-study/
```

---

## Content changes

Anything that changes what the app teaches — a question, an answer, an
explanation, a legal fact, a source mapping — needs evidence.

### What a content pull request must include

1. **The authoritative source.** Government of Nova Scotia or Nova Scotia
   Legislature only. Not driving-school sites, not practice-test sites, not
   forums, not another province.
2. **A precise citation** — section, chapter or page. `sourceRefs` entries carry
   `section`, `chapter`, `page` and `note` fields for exactly this.
3. **The date you checked it.**
4. **`pnpm content:validate` passing.** It enforces the rules mechanically: a
   question with no source, an unknown source id, a numeric fact with no
   locatable citation, a near-duplicate, or content written against a law that
   is not in force will all fail the build.

### Source precedence

When sources disagree, higher wins:

1. **Statute in force** — Motor Vehicle Act, R.S.N.S. 1989, c. 293
2. **Regulations in force** under it
3. **Current RMV guidance and the printed Handbook amendment pages**
4. **Driver's Handbook chapter body text**

This ordering is not academic. The Handbook chapters still describe a two-stage
graduated licensing programme and a one-year learner's licence; the amendment
pages published with the same Handbook supersede both. The app teaches the
amendments.

### Law that is not yet in force

Nova Scotia has enacted a Traffic Safety Act that will eventually replace the
Motor Vehicle Act. **Royal Assent is not commencement.** Content written against
it must be `legalStatus: "future"` and carries `lawVersion: "tsa-2025"`; the
loader will not serve it and the validator fails the build if it is marked
`current`.

Do not promote it because the calendar year changed, or because a news article
said it was coming. `data/exam-config/legal-status.json` records the evidence
gate and the promotion checklist.

### What not to do

- Do not "fix" a rule from memory, or from how it works in another province.
- Do not add questions without sources, even good ones.
- Do not copy questions from anywhere. This project writes original questions and
  has no access to the real examination bank.
- Do not paste Handbook text as an explanation. Say it in your own words and
  cite the page.

---

## When a source changes

`pnpm sources:check` fetches every monitored official source, normalises it and
compares a hash against the recorded baseline. A change fails CI **on purpose**.

It never edits a question. A government page changing is a signal for a person
to read a diff, not permission for a crawler to rewrite what learners are taught.

The workflow:

1. Run `pnpm sources:check` and read the report it writes to `.sources/reports/`.
   It names the changed source and every question that depends on it.
2. Work out what actually changed. Often it is a new unrelated entry in an index.
3. **If a rule the app teaches changed**, set the affected questions to
   `legalStatus: "under_review"` with a `reviewReason`. They stop being served
   immediately. Then re-verify each one against the new text.
4. **If the change does not affect us**, record why in the source's `notes` and
   bump its `verifiedAt`.
5. `pnpm sources:check --accept` to record the new baseline.
6. `pnpm content:validate && pnpm test`.

`--accept` deliberately does not touch `verifiedAt`: a matching hash proves the
bytes are the same, not that a human re-read the rule.

---

## Sign artwork

The sign system is protected by an approval mechanism. The current state is:

```
232 approved visuals · 0 changed · 0 broken
80/80 Core concepts assessed
```

Each approved sign has a fingerprint covering its image and metadata, recorded
in `data/signs/visual-approvals.json`. `pnpm signs:approval:check` fails if any
of it drifts.

**Please do not redraw approved official artwork.** The 221 official images are
the Province's own published sign images, used unaltered on purpose: a learner
should practise against the sign they will actually see. Changing colours,
proportions or symbols makes the app teach the wrong thing.

If you believe a sign is genuinely wrong, open an issue with the official source
that shows the correct design rather than changing the image.

Adding a sign involves metadata, artwork and an approval record together — see
`docs/` and `scripts/sign-approval-*.ts`.

---

## Progression and achievements

The progression system has invariants that are checked, not assumed:

```
31 topics · 0 Complete unreachable · 0 Mastered unreachable
```

`pnpm content:progression` proves every topic can actually reach Complete and
Mastered. If you change thresholds, question counts or topic structure, run it —
a topic nobody can finish is a bug that is invisible until someone tries.

---

## Pull requests

- **One thing per pull request.** A content correction and a refactor in the same
  branch are hard to review and hard to revert.
- **Say why, not just what.** Especially for content: link the source.
- **`pnpm verify` must pass.**
- **Tests for behaviour changes.** The existing suites are a good guide to the
  level of detail expected.
- **Comments explain reasoning, not mechanics.** Match the surrounding style.

Small fixes — a typo in interface text, a broken link, a clearer explanation that
does not change the rule — are welcome without ceremony.

---

## Reporting problems without writing code

That is genuinely useful, especially for content:

- **Something in the app is wrong** → open a *Content or source correction*
  issue. Include the question, what is wrong, and the official source.
- **Something is broken** → open a *Bug report*.
- **Security or privacy** → see [SECURITY.md](SECURITY.md).

---

## Conduct

Be decent to people. Assume good faith, keep criticism about the work, and
accept that maintainers may say no to a change without it being personal.
See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

---

## Licensing your contribution

By contributing you agree that your work is licensed under the repository's
[MIT licence](LICENSE).

Do not contribute material you do not have the right to license — that includes
copyrighted images, text from other study apps, and anything from a commercial
icon or font licence. [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) records
what in this repository is *not* MIT and why.

### A note on the icons

Twelve interface icons are Font Awesome **Pro**. This repository contains their
*names* only — the artwork loads at runtime from the maintainer's hosted Kit,
under the maintainer's licence.

**Cloning this repository does not give you a Font Awesome Pro licence**, and
MIT cannot grant you one. In practice:

- Running the app locally works fine. The Pro icon slots may be empty, because
  the Kit is restricted to an allow-list of domains. That is expected and is not
  a bug to fix.
- Never commit Pro artwork to work around it — no downloaded SVGs, no extracted
  `<path>` data, no webfonts, no `@fortawesome/pro-*` packages.
  `pnpm release:audit` fails on all of those, deliberately.
- Adding a new icon? Prefer the free tier (`src/ui/icons.tsx`, CC BY 4.0,
  bundled). If it genuinely has to be Pro, add the name to `src/ui/Icon.tsx` and
  `src/ui/kitIcons.ts` and say so in the pull request.
- Any icon must have a text label beside it. The app has to stay usable when the
  Kit does not load; `e2e/font-awesome-kit.spec.ts` enforces that.
