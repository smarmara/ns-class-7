# NS Class 7 Study

A free, independent study app for the **Nova Scotia Class 7 learner's licence
knowledge test** — road rules, road signs and full practice exams. It runs
entirely in your browser, works offline, and needs no account.

> **This is not an official app.** It is an independent project, not affiliated
> with or endorsed by the Government of Nova Scotia, Access Nova Scotia or the
> Registry of Motor Vehicles. Every question is original, written from published
> official sources — they are not the questions used on the real examination,
> and nobody outside the Registry has those.

---

## Try it

**Deployment URL: configured after the repository is published.**

Once GitHub Pages is enabled, the app lives at
`https://<owner>.github.io/<repository>/` and opens straight into Home — no
sign-up, no onboarding, nothing between you and the first question.

Running it locally takes two commands: see [Development](#development).

---

## What it includes

| | |
| --- | --- |
| **Learn** | 31 topics across the rules of the road, each tracked from first attempt to Mastered |
| **Road signs** | Category drills over 232 approved sign visuals, 221 of them the Province's own published images |
| **Practice exams** | The real two-part format: 20 rules + 20 signs, 16/20 to pass each part, timed, scored independently |
| **Sign Catalogue** | Every sign in the app, browsable, with meanings |
| **Sign Match** | A fast recognition game with a best-streak record |
| **Progress** | XP, study levels, per-topic mastery and a recommended next topic |
| **Achievements** | Steering-wheel and yield medals for topics, categories and exam tiers |
| **Sources** | Exactly what the app is based on, when it was last verified, and what is still uncertain |

It is a PWA: install it to your home screen and study with no connection —
questions, explanations, every sign image and the fonts are all bundled. The one
thing that is not is the interface icons, which are Font Awesome Pro and load
from a hosted Kit; they are decorative, every one sits beside a text label, and
the app works fully without them.

---

## Why this exists

Nova Scotia publishes everything you need to pass the Class 7 test — a Handbook,
the Motor Vehicle Act, the regulations — but it is spread across PDFs and
legislation pages, and some of it disagrees with itself. The Handbook chapters
still describe a two-stage graduated licensing programme; the amendment pages
printed with the same Handbook replaced it with three stages in 2015.

Most free practice apps solve that by not caring: they collect plausible-sounding
questions and never say where a rule came from. If one of them is wrong you have
no way to tell.

This project takes the opposite approach. Every question cites the specific
source it came from, sources are monitored for changes, and content that is not
current law is not served at all. The point is not the quiz — it is being able
to check the answer.

---

## Test format

The app models the **published structure** of the Nova Scotia Class 7 knowledge
test, taken from the official
[knowledge test page](https://www.novascotia.ca/take-driver-knowledge-test-learners-licence-class-7):

- **Rules of the Road** — 20 multiple-choice questions, 16 correct to pass
- **Road Sign Recognition** — 20 multiple-choice questions, 16 correct to pass
- 30 minutes per part; each part is passed or failed **independently**, so a
  strong score on one cannot rescue the other

Those numbers live in `data/exam-config/class7.json`, not in application code, so
they change when the Province changes them.

**What this app cannot claim:** the real question bank is private. These are
original questions written from the same source material the test is drawn from.
Working through them is good preparation. It is not a guarantee of anything, and
the app never presents a score as a probability of passing.

---

## Content approach

This is the part that makes the project more than a static quiz bank.

**Official sources only.** Government of Nova Scotia and Nova Scotia Legislature
material. No driving-school sites, no SEO practice-test sites, no forums.

**A source registry.** [`data/sources/source-manifest.json`](data/sources/source-manifest.json)
records every source with its URL, authority, retrieval date, verification date
and a content hash. Every question points into it.

**Source monitoring.** `pnpm sources:check` re-fetches all 26 monitored sources,
normalises them to visible text, and compares hashes. A change **fails CI on
purpose** and writes a report naming every question that depends on that source.
Nothing is auto-accepted — a government page changing is a signal for a person to
read a diff, not permission for a crawler to rewrite what learners are taught.

**Precedence, when sources disagree.** Statute in force beats regulations, which
beat current RMV guidance and Handbook amendments, which beat the older Handbook
chapter text. The app teaches the amendments.

**Current law only.** Nova Scotia has enacted a Traffic Safety Act that will
replace the Motor Vehicle Act, but as verified on 2026-08-31 the Legislature's
Proclamations page still lists it as `NOT PROCLAIMED IN FORCE`. Royal Assent is
not commencement. Content written against it is marked `future` and is not
served; the validator fails the build if anything is marked current against a law
that is not in force.

**Content validation.** `pnpm content:validate` fails on a question with no
source, an unknown source id, a numeric fact with no locatable citation, a
near-duplicate, or an expired question still marked current.

**Core and reference signs.** Signs are split into a Core set the test actually
assesses (80/80 covered) and a wider reference catalogue. All 232 visuals carry a
human approval record with a fingerprint, so approved artwork cannot drift
unnoticed.

---

## Privacy

Everything stays in your browser.

- **No accounts.** Nothing to sign up for.
- **No backend.** There is no server to talk to; the app is static files.
- **No analytics, tracking or advertising.** None. No Firebase, no Sentry, no tag
  managers.
- **Your progress never leaves your device.** It lives in IndexedDB with a
  localStorage mirror. We could not read it if we wanted to.
- **Export is yours.** Sources → *Back up progress* writes a JSON file you keep.

Two honest caveats:

**The host sees you load the page.** The app itself collects nothing, but it is
served like any website, so the hosting provider and your network see ordinary
request metadata (an IP address, which files were fetched). That is true of every
website and outside the app's control. Official source links open government
websites, which have their own privacy policies.

**The interface icons come from Font Awesome.** They are Font Awesome Pro, which
is licensed per seat and so cannot be shipped inside an open-source repository —
your browser fetches them from `kit.fontawesome.com` and `ka-p.fontawesome.com`
when the app loads. Font Awesome therefore sees that request, like any CDN would.
No progress, answer or study data is involved: those requests carry nothing but
the icon fetch itself, and the app sends nothing to Font Awesome. It is the only
third-party host the app contacts, and blocking it costs you the icons and
nothing else.

Because storage is per-origin, progress does not follow you between
`localhost`, a Pages URL and a future custom domain. Use the backup file to move
it.

---

## Install as an app

It is a PWA, so no store is involved:

- **iOS/Safari** — Share → *Add to Home Screen*
- **Android/Chrome** — menu → *Install app* / *Add to Home Screen*
- **Desktop Chrome/Edge** — install icon in the address bar

Once installed it launches full-screen and works offline. Updates arrive the next
time you open it online: the app tells you a new version is ready and waits for
you to accept, so an update can never interrupt a practice exam.

---

## Development

Requires **Node 22+** and **pnpm 10+** (pinned in `.nvmrc` and `packageManager`).

```bash
pnpm install
pnpm dev            # http://localhost:5173
```

Browsers for the end-to-end tests, once:

```bash
pnpm exec playwright install --with-deps chromium
```

### Verification

```bash
pnpm verify
```

The full gate, the same one CI runs: lint, typecheck, content validation, source
monitoring, sign approvals, unit tests, end-to-end tests, the GitHub Pages
subpath suite, a production build, and an offline audit. It must pass before a
change can be merged or deployed.

Useful individually:

```bash
pnpm test                # unit and integration tests
pnpm test:e2e            # browser tests, mobile and desktop
pnpm content:validate    # question bank integrity
pnpm content:progression # every topic can reach Complete and Mastered
pnpm signs:approval:check
pnpm pages:preview       # serve the built app at /ns-class-7-study/
pnpm release:audit       # is this repository safe to publish?
```

### Content maintenance

```bash
pnpm sources:check           # fetch official sources, report changes
pnpm sources:check --accept  # record a reviewed change as the new baseline
```

A change writes a readable report to `.sources/reports/` listing the diff and
every dependent question. The review workflow is in
[CONTRIBUTING.md](CONTRIBUTING.md#when-a-source-changes).

---

## Project structure

```
data/                    the content layer — no code
  exam-config/             official test format; which law is in force
  sources/                 source registry, hashes, normalised snapshots
  questions/               the question bank, one file per topic group
  signs/                   sign metadata, fidelity, approvals

src/
  content/                 typed loading and filtering of everything in data/
  engine/                  quiz, learning, exam, progression, achievements
  store/                   zustand stores, IndexedDB + localStorage persistence
  signs/                   sign artwork and resolution
  ui/  routes/             components and screens
  native/                  Capacitor shell edges (no-ops on the web)

scripts/                 validation, source monitoring, audits, release tooling
tests/  e2e/             unit tests and browser tests
```

The content layer knows nothing about React, and the UI knows nothing about
where content came from. A rule change is a data edit, never a component edit.

---

## Deployment

The app is a fully static bundle. GitHub Pages is the first host, not a
dependency — the same `dist/` works on Cloudflare Pages, Netlify, Vercel or any
static web host.

- `.github/workflows/ci.yml` validates pull requests and non-default branches,
  and sweeps the official sources weekly. It never deploys.
- `.github/workflows/deploy-pages.yml` runs the same verification on `main`, then
  builds and publishes. **A failed verification stops the deployment.**

The base path is configurable, never hard-coded: the Pages workflow derives it
from the repository name, so a fork deploys to its own URL with no edits, and a
custom domain needs only for the variable to be unset. Routing is hash-based
(`#/learn`), which is what lets a static host serve deep links and refreshes
without any server rewrite rules.

One deployment detail that is not in the code: the Font Awesome Kit is
restricted to an allow-list of domains, so a new host has to be added in the
Font Awesome account before the Pro icons appear. Missing icons on a fresh
deploy are almost always that. A fork without a Font Awesome Pro licence sets
`FA_KIT_URL` at build time — to its own Kit, or to an empty string to ship no
Kit at all.

Publication steps: [docs/OPEN_SOURCE_RELEASE.md](docs/OPEN_SOURCE_RELEASE.md).

---

## Contributing

Contributions are welcome — see [CONTRIBUTING.md](CONTRIBUTING.md).

One thing to know first: **content changes are not copy edits.** Anything that
changes what the app teaches needs a citation to an official Nova Scotia source,
with the section or page, and the date you checked it. A wrong rule here is a
safety problem, not a typo. Code changes are ordinary open-source work.

Reporting a content error without writing any code is genuinely valuable — there
is an issue template for it.

---

## Licensing

**Project code and content: [MIT](LICENSE).** That covers the application source,
tooling, tests, the original practice questions and explanations, the interface
text and the original SVG artwork.

**Third-party and government material is not relicensed by being here.** The
official Nova Scotia road-sign images are Crown copyright; Google Sans is under
the SIL Open Font License; Font Awesome icons are licensed by Fonticons, Inc.
(the free-tier icons are bundled under CC BY 4.0, the Pro icons are referenced by
name and loaded from the maintainer's Kit — a fork gets no Pro licence and should
read §4.2 before deploying); npm dependencies keep their own licences.

[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) is the full inventory, including
where the position is genuinely uncertain and what a fork may not assume.
[LEGAL_AND_SOURCES.md](LEGAL_AND_SOURCES.md) has the detailed source attribution
and copyright analysis.

---

## Disclaimer

This is an independent study tool for the Nova Scotia Class 7 learner's licence
knowledge test. It is **not affiliated with or endorsed by the Government of Nova
Scotia**, Access Nova Scotia, or the Registry of Motor Vehicles.

It is a study aid, not legal advice. The Motor Vehicle Act and its regulations
are the law. Always confirm current requirements, fees and test arrangements with
the Registry of Motor Vehicles.
