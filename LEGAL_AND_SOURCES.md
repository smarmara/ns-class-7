# Legal notes, source attribution and copyright

Last reviewed: **2026-08-17**

---

## 1. Status of this project

This is an **independent, unofficial study aid**. It is **not** affiliated with, endorsed by,
sponsored by, or connected to:

- the Government of Nova Scotia
- Access Nova Scotia
- the Nova Scotia Registry of Motor Vehicles
- the Nova Scotia Department of Public Works
- Service Nova Scotia

No government logo, crest, wordmark, colour scheme or branding is used anywhere in the application
or this repository. Nothing here should be read as implying official approval.

The application states its unofficial status on every screen (in the footer disclaimer) and again
in full on the Sources page.

### What this project does not claim

- It does **not** have access to the Registry's real examination questions.
- It does **not** reproduce, and does not claim to reproduce, any official test.
- The "readiness" score is a study-progress measure, explained openly in the UI. It is **not** a
  prediction of whether a learner will pass, and the app says so.
- It is not legal advice. The Motor Vehicle Act and its regulations are the law; this app is a
  study aid pointing at them.

---

## 2. Official sources referenced

All are Government of Nova Scotia or Nova Scotia Legislature publications. The machine-readable
registry, including retrieval dates and content hashes, is `data/sources/source-manifest.json`.

### Statute

| Source | Use |
| --- | --- |
| [Motor Vehicle Act, R.S.N.S. 1989, c. 293](https://nslegislature.ca/legislative-business/bills-statutes/consolidated-public-statutes/motor-vehicle-act) (consolidated to 2026-05-01) | The authority for every numeric legal fact. Sections relied on include s.100A (novice zero BAC), s.100D (hand-held devices), s.101–103 (speed, school areas), s.106D–106F (emergency vehicles), s.124A (transit buses), s.125–125A (pedestrians, crossing guards), s.135–136 (roundabouts, driveways), s.138–143 (parking), s.279 (point system table). |

### Regulations

| Source | Citation | Use |
| --- | --- | --- |
| [Traffic Signs Regulations](https://novascotia.ca/just/regulations/regs/mvtrafficsigns.htm) | N.S. Reg. 165/2012, am. to 178/2023 | Shapes, colours and legends the original sign artwork is drawn from |
| [School Areas Regulations](https://novascotia.ca/just/regulations/regs/mvschoolareas.htm) | N.S. Reg. 164/2012 | Definition of a school area and of a child being "present" |
| [Yield to Transit Buses Regulations](https://novascotia.ca/just/regulations/regs/mvyield.htm) | N.S. Reg. 163/2011 | Prescribed transit operators (incl. Halifax Regional Municipality) and rear signage |
| [Classification of Drivers' Licenses Regulations](https://novascotia.ca/just/regulations/regs/mvclasdl.htm) | — | What a Class 7 licence permits, and its minimum age |
| [Regulations by Act index](https://novascotia.ca/just/regulations/regsbyact.htm) | — | Monitored so a **new** Motor Vehicle Act regulation is noticed |

### Registry of Motor Vehicles guidance

| Source | Use |
| --- | --- |
| [Take a driver knowledge test: Learner's Licence (class 7)](https://www.novascotia.ca/take-driver-knowledge-test-learners-licence-class-7) | The exam configuration: two 20-question parts, 16/20 to pass each, 30 minutes per part, parts retaken independently, eligibility, fee |
| [Driver's Handbook landing page](https://novascotia.ca/sns/rmv/licence/handbook.asp) | **Amendments that supersede the chapter PDFs** — school-zone speeds, the $2,000 collision-reporting threshold, yield-to-transit-bus, and the Restricted Individual GDL stage |

### Driver's Handbook chapters

Chapters 1–6 of the Nova Scotia Driver's Handbook (© Crown copyright, Province of Nova Scotia;
reprinted with revisions 2017). Used as a factual research layer for rules of the road, signs,
pavement markings, work zones, safety, adverse conditions and impairment.

The front matter (pp. V–VIII of the introduction PDF) carries **official amendment pages** and is
treated at a higher precedence than the chapter bodies.

### Legislative status monitoring

| Source | Use |
| --- | --- |
| [Proclamations of Nova Scotia Statutes](https://www.nslegislature.ca/legislation/proclamations-nova-scotia-statutes) | **The commencement gate.** Records that the Traffic Safety Act is not proclaimed in force |
| [Changes to traffic safety legislation](https://novascotia.ca/changes-to-traffic-safety-legislation/) | Department of Public Works guidance on the transition |
| [Bill 130 — Traffic Safety Act](https://nslegislature.ca/legislative-business/bills-statutes/bills/assembly-65-session-1/bill-130) | The enacted text (S.N.S. 2025, c. 20) |
| [Royal Gazette Part II](https://novascotia.ca/just/regulations/rg2issues.htm) | Early-warning feed: newly filed regulations appear here before consolidated pages are rebuilt |

---

## 3. Copyright analysis

### 3.1 What is original to this project

Everything shipped in the application is original work created for it:

- **All 243 practice questions** — stems, answer choices and distractors. Written from the facts in
  the official sources, not copied from any exam, workbook or third-party site.
- **All explanations**, including the per-distractor "why this is wrong" notes.
- **All UI text**, headings, labels, empty states and help copy.
- **All road-sign artwork** (`src/signs/`). Original SVG constructed from the geometric and colour
  specifications in the Traffic Signs Regulations and the handbook's descriptions — see 3.3.
- **All application code, tooling and tests.**
- **The app icon** (`public/icons/`, `public/favicon.svg`), generated by `scripts/generate-icons.ts`.

### 3.2 How official material is used

Crown-copyright material is used as a **factual research and citation layer**:

- **Facts are not copyrightable.** That a school-area limit is 30 km/h where the approaching limit
  is 50 km/h is a fact of Nova Scotia law. This project takes such facts and expresses them in its
  own words.
- **Nothing is republished wholesale.** No handbook chapter, page or substantial passage is
  reproduced in the app. The handbook is not mirrored or served.
- **Everything is attributed.** Each question links to the specific source, with section, chapter
  or page where available. The Sources page lists every source in use.
- **Short quotation for verification.** A small number of manifest and data-file `notes` fields
  quote a phrase from a source so a maintainer can confirm what it says — for example the
  Proclamations page's "NOT PROCLAIMED IN FORCE". These are brief, functional and clearly
  attributed. They are not user-facing study material.

### 3.3 Road-sign artwork specifically

Government handbook illustrations are Crown copyright and are **not** used. Instead:

- Each sign is drawn from its **legal specification**: the Traffic Signs Regulations (N.S. Reg.
  165/2012) prescribe shapes, colours and legends — "block capital white letters on a red
  background", "red inverted triangle with a white centre" — and the handbook describes the rest,
  such as the five-sided fluorescent yellow-green school sign with two black child pedestrian
  symbols.
- The drawings are composed from shared primitives in `src/signs/shapes.tsx`. Nothing is traced,
  vectorised or derived from a Crown illustration.
- `data/signs/sign-meta.json` records the `basis` for each sign — which source specifies its design.

Standard traffic-sign designs are also, by their nature, standardised: their whole purpose is to be
identical everywhere so drivers recognise them. A sign drawn to the legally prescribed shape and
colour is an implementation of a public standard.

### 3.4 The local research cache

`.sources/` holds downloaded official PDFs and extracted text (handbook chapters, the consolidated
Motor Vehicle Act). This is a **local research artifact only**:

- never bundled into the application;
- never served, published or redistributed;
- excluded from the build.

It exists so a maintainer writing or reviewing a question can cite an exact page.

### 3.5 Commercial use — open question

If this app were to be **distributed commercially**, the following should be reviewed with legal
advice before doing so:

| Item | Assessment | Action needed before commercial use |
| --- | --- | --- |
| Original questions, explanations, UI, code | Owned by this project | None |
| Original sign artwork drawn from regulations | Believed clear — implements a public standard, not a Crown illustration | Confirm that drawing to a prescribed specification is not treated as reproducing the Schedule depictions in N.S. Reg. 165/2012 |
| Facts and rules taken from the handbook and Act | Facts are not copyrightable | None |
| Short quoted phrases in `notes` fields | Brief, functional, attributed, not user-facing | Low risk; could be paraphrased if a stricter reading is preferred |
| Deep links to novascotia.ca and nslegislature.ca | Ordinary linking | Review the sites' terms of use |
| Local PDF cache in `.sources/` | Not distributed | Confirm it stays out of any distributed artifact |
| Names "Nova Scotia", "Access Nova Scotia", "Registry of Motor Vehicles" | Used descriptively and accompanied by a disclaimer | Confirm nominative use is acceptable; never use as branding |

Nova Scotia Crown copyright is administered under the province's copyright policy. **Confirm the
current terms and, if there is any doubt, seek permission before commercial distribution.** This
document is an engineering assessment, not legal advice.

---

## 4. Content-integrity commitments

These are enforced by tooling, not just intent. Each maps to a check in
`scripts/content-validate.ts` or `tests/`.

| Commitment | Enforced by |
| --- | --- |
| No invented driving rules | Every question needs a source ref; numeric facts need a section/page locator |
| No third-party practice sites as authority | Manifest URLs restricted to `novascotia.ca` / `nslegislature.ca`, asserted in tests |
| Every active question traceable to an official source | `no-source` / `unknown-source` validator rules |
| Current law distinguished from announced future law | `legalStatus` + `lawVersion` gating; `not-in-force` validator rule |
| The Traffic Safety Act is never activated merely because it exists | `legal-status.json` requires recorded proclamation evidence; validator fails `current` against a version not in force |
| Handbook amendments outrank older PDF wording | Manifest precedence levels, asserted in tests |
| No silent overwriting after a crawler sees a change | `sources:check` never edits questions; `--accept` writes hashes only, and never touches `verifiedAt` |
| Legal changes get a reviewable diff | `sources:check` writes a report naming every dependent question |
| Original questions, not copied exam questions | Stated here and on the Sources page; near-duplicate detection in the validator |
| The learner can always see when content was verified | Shown on the dashboard and Sources page; computed as the **oldest** verification date in use |

---

## 5. Known source conflicts

Recorded rather than silently resolved, as required by the project's own rules.

### 5.1 GDL programme structure — **resolved by precedence**

Handbook Chapter 1 describes a **two-stage** programme with a **one-year** learner's licence. The
official amendment pages (introduction PDF, pp. V–VI) add a **third stage** (Restricted Individual,
Class 5R/6R with condition 47, effective 2015-04-01) and extend the learner's licence to **two
years**.

**Resolution:** the amendment pages are precedence 3, the chapter body precedence 4. The app
teaches three stages and a two-year learner's licence. Questions `rules-gdl-004` and
`rules-gdl-012` state this and explain in their distractor notes that the older wording is
superseded.

### 5.2 Collision-reporting threshold — **resolved by precedence**

The Chapter 5 PDF (p. 149) shows **both** "$2000 or more" and "$1000 or more" overlaid — an
amendment sticker printed over the original figure. The handbook landing page states **$2,000**.

**Resolution:** $2,000 (question `rules-emergencies-004`). Recorded in the manifest note for
`ns-handbook-ch5`.

### 5.3 Demerit points for a novice-driver BAC offence — **open; avoided**

Handbook Chapter 1 (pp. 28–29) lists "Blood Alcohol Content (BAC) exceeds .00 (Zero)" — 6 points
and "Failing to comply with demand" — 6 points. Those entries (items 5A and 5B) were **repealed by
2014, c. 53, s. 12** and do not appear in the current Motor Vehicle Act point table at s.279.

**Resolution:** the app teaches **no** demerit-point value for a novice BAC offence. It does teach
the zero-BAC requirement itself (s.100A, `rules-gdl-003`) and the suspension thresholds stated in
the handbook prose, which are administrative thresholds and unaffected by the repeal. This conflict
is flagged here so a future maintainer does not "fix" the app by copying the outdated table.

### 5.4 Handbook currency generally — **structural, mitigated**

The handbook chapters were last reprinted in 2017 and describe some contact details and procedures
that have changed. Rules taught by the app are cross-checked against the consolidated Motor Vehicle
Act (consolidated to 2026-05-01) wherever the Act speaks to them, and the source manifest notes
which chapters are known to lag.

---

## 6. Reporting a problem

If a question is wrong, out of date, or unsupported by its cited source, that is a defect of the
highest severity in this project. It should be fixed by re-reading the official source, correcting
or retiring the question, and updating `verifiedAt` — following the maintainer workflow in the
README.

---

## 7. Bundled third-party assets

Both are self-hosted so the app works offline and can be packaged for iOS and
Android. Neither is fetched from a CDN at runtime.

### 7.1 Google Sans — SIL Open Font License 1.1

The application typeface. Two subset files of the official variable font
(weights 400–700) live in `src/assets/fonts/`, downloaded from the official
Google Fonts CDN (`fonts.gstatic.com`).

The font's own metadata records the provenance and licence:

- Copyright 2025 The Google Sans Project Authors (github.com/googlefonts/googlesans)
- Licence URL: https://openfontlicense.org

The licence text is kept beside the files in `src/assets/fonts/OFL.txt`. The OFL
requires that the font not be sold on its own and that this notice travel with
the files; both hold here.

### 7.2 Font Awesome icons — Free (CC BY 4.0) and Pro (licensed)

The app's icon language is Font Awesome **Classic Regular** throughout. The two
tiers are delivered differently, and the difference is a licensing one.

**Free tier — bundled.** Ten glyphs come from
`@fortawesome/free-regular-svg-icons`, licensed **CC BY 4.0**
(https://fontawesome.com/license/free). Attribution: *Icons by Font Awesome*.
CC BY permits redistribution, so they are imported one at a time and bundled by
`src/ui/icons.tsx`. They need no network.

**Pro tier — referenced, loaded at runtime.** Twelve glyphs come from the
project owner's Font Awesome **Pro** licence, delivered by the project's hosted
Kit (`kit.fontawesome.com`, licence `pro`, v7.3.1 — configured in
`app.identity.json`, injected into the HTML by `vite.config.ts`, overridable
with `FA_KIT_URL`). Three are Pro-only (`book-open-cover`,
`diamond-turn-right`, `ballot-check`) and carry the primary navigation; the rest
exist in the free tier only as Solid, and Regular cuts keep the icon language
consistent.

`src/ui/Icon.tsx` contains **icon names only** — it emits
`<i class="app-icon fa-regular fa-fire">` and the Kit's script replaces that
with the artwork in the visitor's browser. No Pro path data, SVG, webfont or
`@fortawesome/pro-*` package is in this repository, which is what makes the
repository publishable: naming an icon distributes nothing, whereas copying its
geometry would distribute per-seat artwork to unlicensed people.

Three things a future maintainer should know:

- **The Kit is the app's only runtime network dependency.** Everything a learner
  studies is bundled. The icons are decorative — each sits beside a text label —
  and `e2e/font-awesome-kit.spec.ts` blocks `*.fontawesome.com` and walks the
  journey to prove the app is fully usable without them. `.app-icon` in
  `src/styles.css` reserves each slot so nothing reflows.
- **A fork gets no Pro licence.** MIT covers this project's code and cannot
  grant Font Awesome Pro rights. A fork sets `FA_KIT_URL` to its own Kit, sets
  it empty to ship no icons, or substitutes free-tier glyphs. See
  [THIRD_PARTY_NOTICES.md §4.2](THIRD_PARTY_NOTICES.md).
- **Keep the Pro list minimal.** `src/ui/kitIcons.ts` is the declared inventory
  and `tests/icon-kit.test.tsx` keeps it in step with what the app actually
  uses. Anything the free tier provides in Classic Regular belongs on the free
  tier.

The Kit id itself is a public client-side identifier — it appears in the page
source of every site that uses a Kit — so it lives in `app.identity.json` with
the rest of the app's identity and is not treated as a credential. Font Awesome
*account* credentials and npm registry tokens are credentials, are not in this
repository, and `pnpm release:audit` checks for them.

