# Third-party notices

The repository's [LICENSE](LICENSE) is MIT, and it covers **only** what this
project owns and created. This file inventories everything else.

Nothing listed here is relicensed under MIT by being present in this
repository. Where the licensing position is uncertain, this file says so rather
than guessing.

Last reviewed: **2026-08-31**

---

## Summary

| Category | Owner | Terms | Covered by this repo's MIT licence? |
| --- | --- | --- | --- |
| Application code, tooling, tests | This project | MIT | **Yes** |
| Practice questions and explanations | This project | MIT | **Yes** |
| Interface text | This project | MIT | **Yes** |
| Original SVG sign drawings | This project | MIT | **Yes** |
| App icon and splash artwork | This project | MIT | **Yes** |
| Official NS road-sign Schedule images | Province of Nova Scotia | Crown copyright — see §1 | **No** |
| Facts drawn from the Handbook and Motor Vehicle Act | Province of Nova Scotia | Facts are not copyrightable — see §2 | N/A |
| Google Sans font files | Google Sans Project Authors | SIL Open Font License 1.1 | **No** |
| Font Awesome Free icons | Fonticons, Inc. | CC BY 4.0 | **No** |
| Font Awesome **Pro** icons | Fonticons, Inc. | Commercial, per-seat — loaded at runtime, **not redistributed**; see §4.2 | **No** |
| npm dependencies | Various | MIT / Apache-2.0 / ISC — see §5 | **No** |

---

## 1. Government of Nova Scotia road-sign images

**Location:** `public/signs/ns-official/` (221 PNG files)
**Owner:** Province of Nova Scotia
**Status:** Crown copyright. **Not** covered by this repository's MIT licence.

These are the Province's own published traffic-sign images, reproduced as-is so
that a learner practises against the sign they will actually meet on the road.
They are cropped from the Schedule to the
[Traffic Signs Regulations (N.S. Reg. 165/2012)](https://novascotia.ca/just/regulations/regs/mvtrafficsigns.htm)
made under the Motor Vehicle Act, and from the Driver's Handbook and work-zone
material. Each image's provenance is recorded per sign in
`data/signs/sign-fidelity.json` (`sourceId`), and each has a human approval
record in `data/signs/visual-approvals.json`.

They are used unmodified: no re-render, no recolour, no aspect change. Altering
an official sign's appearance would defeat the purpose of showing it.

**What a fork may assume: nothing.** Reusing these images is between the fork
and the Province. The MIT licence on this repository does not grant any right
to them, and this project is not in a position to sublicense Crown material.

> **Unresolved.** This project has not obtained, and does not claim, an explicit
> reuse grant from the Province for these images. The position taken is that
> reproducing official traffic signs unaltered, for the purpose of teaching
> people to recognise them, with attribution and no implication of endorsement,
> is a reasonable and non-commercial educational use. **That is a considered
> position, not a legal opinion, and it has not been confirmed with the
> Province.** Anyone intending to distribute this material commercially, or at
> scale, should seek confirmation from the Province of Nova Scotia first.

Where a sign has no official image wired up, the app shows an **original**
drawing built from the shape, colour and legend the Regulations prescribe
(`src/signs/registry.tsx`, `src/signs/SignShapeArt.tsx`). Those drawings are
this project's own work and are MIT.

---

## 2. Nova Scotia Driver's Handbook, Motor Vehicle Act and regulations

**Owner:** Province of Nova Scotia / Nova Scotia Legislature
**Status:** Crown copyright. Used as a factual research and citation layer.

The full source inventory, with retrieval dates, content hashes and the
precedence order used when sources conflict, is in
[`data/sources/source-manifest.json`](data/sources/source-manifest.json) and
[LEGAL_AND_SOURCES.md](LEGAL_AND_SOURCES.md).

How this material is used:

- **Facts, not text.** That a school-area limit is 30 km/h where the approaching
  limit is 50 km/h is a fact of Nova Scotia law. This project states such facts
  in its own words. Facts are not copyrightable; the Handbook's *expression* of
  them is, and is not reproduced.
- **No wholesale republication.** No Handbook chapter, page or substantial
  passage appears in the app. The Handbook is not mirrored or served.
- **Everything is cited.** Each question links to its source with section,
  chapter or page.
- **Short quotation for verification.** A few `notes` fields in data files quote
  a phrase so a maintainer can confirm what a source says — for example the
  Proclamations page's "NOT PROCLAIMED IN FORCE". Brief, functional, attributed,
  and not learner-facing study material.

The practice questions themselves are **original**. This project has no access
to the Registry's real examination questions and does not claim any.

---

## 3. Google Sans

**Location:** `src/assets/fonts/google-sans-latin.woff2`,
`src/assets/fonts/google-sans-latin-ext.woff2`
**Owner:** The Google Sans Project Authors
**Licence:** SIL Open Font License, Version 1.1 — full text at
`src/assets/fonts/OFL.txt`

Self-hosted rather than loaded from a CDN, so the app works offline and makes no
request to `fonts.googleapis.com`. The OFL permits bundling and redistribution;
it does not permit selling the fonts on their own, and any derivative font must
keep the OFL and not use the reserved name.

---

## 4. Font Awesome

**Owner:** Fonticons, Inc. — https://fontawesome.com

### 4.1 Free tier — bundled

**Location:** `@fortawesome/free-regular-svg-icons` (npm dependency), rendered
by `src/ui/icons.tsx`
**Licence:** CC BY 4.0 (https://fontawesome.com/license/free)
**Attribution:** *Icons by Font Awesome*

CC BY 4.0 permits redistribution with attribution, so these icons are bundled.
They are imported one at a time and the bundler tree-shakes the rest; no Font
Awesome runtime or webfont ships with them. Ten icons come from this tier and
they work with no network at all.

### 4.2 Pro tier — referenced, never redistributed

**Location:** `src/ui/Icon.tsx` — **icon names only**
**Licence:** Font Awesome Pro — commercial, per-seat. **Not redistributable.**
**Delivery:** the maintainer's hosted Kit, loaded by the browser at runtime

Twelve icons are Font Awesome Pro:

`book-open-cover`, `diamond-turn-right`, `ballot-check`, `bolt`, `fire`,
`triangle-exclamation`, `chevron-left`, `chevron-right`, `arrow-right`,
`up-right-from-square`, `medal`, `award`

**What is in this repository is the names, not the artwork.** `src/ui/Icon.tsx`
emits markup like `<i class="app-icon fa-regular fa-fire">` — an identifier and
a class, the same kind of reference as a CSS class name. The glyph geometry
lives on Font Awesome's servers and is fetched by the visitor's browser from
the maintainer's Kit, under the maintainer's own Pro licence.

This is the distinction the licence turns on. Pro is licensed per seat, so
*copying the artwork into a public repository* would distribute it to people who
have not licensed it. *Naming an icon* distributes nothing. The hosted Kit is
Font Awesome's own supported mechanism for exactly this.

**What a fork gets: no Pro licence.** The MIT licence on this repository covers
this project's code. It does not, and cannot, grant any right to Font Awesome
Pro. A fork that deploys this app has three honest choices:

| Option | What happens |
| --- | --- |
| **Use your own Pro Kit** | Set `FA_KIT_URL` to your Kit's script URL at build time. Requires your own Font Awesome Pro subscription. |
| **Ship no Kit** | Set `FA_KIT_URL=""`. The app runs; those twelve icon slots stay empty beside their text labels. Nothing breaks. |
| **Substitute free icons** | Point `src/ui/Icon.tsx` at Free-tier equivalents. Nine of the twelve exist in Free **Solid**; three (`book-open-cover`, `diamond-turn-right`, `ballot-check`) are Pro-only and need a different glyph. |

Loading the upstream Kit configured here without a licence of your own is not
one of the choices. It consumes the maintainer's account quota, and the Kit is
domain-restricted in any case.

**The Kit id is not a secret.** It is a public client-side identifier that
appears in the page source of every site using it — that is how Kits work — and
it is stored in `app.identity.json` alongside the app name and bundle id.
Account credentials, API tokens and npm registry tokens for Font Awesome are a
different matter entirely and appear nowhere in this repository;
`pnpm release:audit` checks for them.

**Guardrails.** `pnpm release:audit` fails on Pro *artwork* — extracted path
data, downloaded webfonts, self-hosted Kit bundles, or the licensed
`@fortawesome/pro-*` packages — and deliberately does not flag Kit URLs, Kit ids
or icon names, which are references. `tests/icon-kit.test.tsx` asserts the same
boundary in the icon module itself.

### 4.3 Offline consequence, stated plainly

The Pro icons are the one part of this app that needs the network. Everything a
learner studies — questions, explanations, sign artwork, fonts — is bundled and
works offline.

The icons are decorative: every one sits beside a text label, and the app is
fully usable with none of them rendered. `e2e/font-awesome-kit.spec.ts` blocks
`*.fontawesome.com` and walks the learner journey to prove it, and
`src/styles.css` reserves each icon's box so a missing Kit does not reflow the
layout.

---

## 5. npm dependencies

Runtime dependencies, all permissively licensed:

| Package | Licence |
| --- | --- |
| `react`, `react-dom` | MIT |
| `react-router-dom` | MIT |
| `zustand` | MIT |
| `idb-keyval` | Apache-2.0 |
| `@capacitor/*` | MIT |

Build and test tooling — Vite, TypeScript, Vitest, Playwright, ESLint,
`vite-plugin-pwa`, `workbox-window`, `pdfjs-dist` and their transitive
dependencies — is MIT, Apache-2.0 or ISC. None of it ships to the browser except
where bundled by Vite.

To regenerate the full resolved list:

```bash
pnpm licenses list --prod
```

---

## 6. What this project asserts, and what it does not

**Asserts:**

- The application code, tooling, tests, questions, explanations, interface text
  and original SVG artwork are this project's own work, offered under MIT.
- Official Nova Scotia material is attributed, cited and — for the sign images —
  reproduced unaltered.
- No government logo, crest, wordmark or branding is used anywhere.

**Does not assert:**

- Any right to sublicense Crown copyright material.
- That the Province has approved, endorsed or reviewed this project. It has not.
- That reproducing the official sign images is definitively permitted. §1 sets
  out the position taken and flags it as unconfirmed.
- Any right to redistribute Font Awesome Pro artwork. See §4.2.

---

## Reporting a problem with this file

If you own material used here and something is attributed incorrectly, or you
would like it removed, please open an issue or use the contact route in
[SECURITY.md](SECURITY.md). Removal requests will be acted on promptly.
