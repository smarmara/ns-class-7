# Open-source release and deployment

| | |
| --- | --- |
| **Production** | https://roadlearn.ca/ |
| **Hosting** | GitHub Pages, deployed by GitHub Actions |
| **Repository** | [smarmara/ns-class-7](https://github.com/smarmara/ns-class-7) |
| **Custom domain** | `roadlearn.ca` (apex); `www.roadlearn.ca` redirects to it |
| **Base path** | `/` — the app is mounted at the domain root |
| **Fallback** | `https://smarmara.github.io/ns-class-7/` still builds, through the configurable base path |

The app *is* the site: roadlearn.ca opens the study app immediately. There is no
landing page and no province path — the current Nova Scotia app lives at the
root. A broader domain leaves room for that to change later; nothing is designed
for it yet.

---

## Before you publish

Run the publication audit:

```bash
pnpm release:audit
```

It fails on anything that is fine in a private working copy and **not** fine in
a public repository — licensed third-party artwork, credential-shaped strings,
machine-specific paths in public docs, and missing open-source paperwork.

### Resolved: Font Awesome Pro icons

This used to be a blocker. `src/ui/icons-pro.ts` held real Pro path data, and
publishing it would have redistributed per-seat artwork.

The app now renders those twelve glyphs from the maintainer's **hosted Kit**
instead. `src/ui/Icon.tsx` contains icon *names* only; the artwork is fetched by
the visitor's browser from Font Awesome, under the maintainer's own Pro licence.
Nothing licensed is in the repository, the established icon design is unchanged,
and `release:audit` now fails on Pro *artwork* while deliberately ignoring Kit
URLs, Kit ids and icon names — those are references, not redistribution.

Full reasoning: [THIRD_PARTY_NOTICES.md §4.2](../THIRD_PARTY_NOTICES.md).

**One deployment step you must do by hand.** Font Awesome Kits are restricted to
a domain allow-list, so the Kit will not load on a host it has not been told
about. In the Font Awesome account (Kits → your Kit → Settings → Domains) this
deployment needs:

```
roadlearn.ca            production
www.roadlearn.ca        if the Kit matches on exact hostname
smarmara.github.io      the fallback project URL
localhost               local preview
```

The allow-list takes the **origin**, so `smarmara.github.io` covers every
repository on that account, while a custom domain needs its own entry — which is
the whole reason this step exists after the domain move.

If icons are missing on a fresh deployment, this is almost always why. It is a
one-field fix and **not** a reason to change the icons.

If the Kit is not allow-listed, the app still works: the twelve Pro icon slots
stay empty beside their text labels. That is a cosmetic fault with a
one-checkbox fix — **do not respond to it by replacing the icons.**

A fork without a Pro licence sets `FA_KIT_URL` (build-time environment
variable): to its own Kit URL to use its own icons, or to an empty string to
ship none.

---

## Publication checklist

### Prepare

- [ ] `pnpm release:audit` passes with no blockers
- [ ] `pnpm verify` passes
- [ ] Decide the repository name — it becomes part of the URL and the app's
      base path. The Pages workflow derives the base from it automatically.
- [ ] Review [THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md) and confirm you
      are comfortable with the position taken on the official sign images
      (§1 flags this as unconfirmed with the Province)
- [ ] Set the copyright holder in [LICENSE](../LICENSE) if you want your name
      rather than "NS Class 7 Study contributors"

### Publish

- [ ] Create the public GitHub repository
- [ ] `git remote add origin git@github.com:<owner>/<repository>.git`
- [ ] Confirm the default branch is `main` — the deploy workflow only runs there
- [ ] Review what is staged, then commit and push
- [ ] **Settings → Pages → Source → GitHub Actions**
      *(this cannot be set from code; the first deploy will not run without it)*
- [ ] Watch the **Deploy to GitHub Pages** workflow complete
- [ ] Open the production URL
- [ ] Set the custom domain and enforce HTTPS — see
      [The custom domain](#the-custom-domain)
- [ ] Add the deployment's domains to the Font Awesome Kit allow-list —
      without it the Pro icons will not render

### Verify the deployment

- [ ] Home renders and the app is usable immediately — no login, no onboarding
- [ ] Check on a phone
- [ ] Install as a PWA (Add to Home Screen / Install app)
- [ ] Turn off the network, relaunch, confirm study still works — icons may be
      missing, since the Kit is the one thing that is not bundled; nothing else
      should be
- [ ] Answer a question in a Rules drill
- [ ] Open a Road Sign drill and confirm sign images load
- [ ] Run a Practice Exam through to a result
- [ ] Play a round of Sign Match
- [ ] Check Profile persists after a reload
- [ ] Push a second commit and confirm the update prompt appears on reload
- [ ] Confirm the Pro icons render (nav, XP, streak) — if they do not, it is
      the domain allow-list, not the code
- [ ] Confirm the independence disclaimer is visible
- [ ] Confirm the Privacy section on the Sources page is accurate
- [ ] Confirm LICENSE and THIRD_PARTY_NOTICES.md read correctly on GitHub

### After publishing

- [ ] Add the live URL to the README "Try it" section
- [ ] Add the repository description and topics on GitHub
- [ ] Consider enabling **Discussions** for content questions
- [ ] Confirm private security reporting is on
      (Settings → Security → *Private vulnerability reporting*)

---

## How the deployment works

```
push to main
   └── deploy-pages.yml
         ├── verify   lint, typecheck, content, signs, unit, e2e, pages subpath
         ├── build    resolve base -> build -> deploy:check -> offline audit
         └── deploy   upload dist/ as the Pages artifact and publish
```

A failed verification stops the deployment. Only `dist/` is published — no
source, tests, documentation, native projects, source snapshots or git history
reach the public site.

Pull requests run `ci.yml` instead, which validates without deploying.

### The base path

Where the app is mounted is a deployment decision, not an application one.
Nothing in `src/` knows which host it is on; one value carries it:

- `VITE_BASE_PATH` unset or `/` → the domain root (dev server, roadlearn.ca,
  and any other root host)
- `VITE_BASE_PATH=/<repo>/` → a GitHub Pages project site

The workflow resolves it with `pnpm deploy:base`, and the rule is deliberately
**not** "ask GitHub what the URL is":

| Situation | Base | Why |
| --- | --- | --- |
| A custom domain is declared in `app.identity.json` | `/` | A custom domain is always a root deployment |
| No custom domain declared | whatever `actions/configure-pages` reports | A fork gets its own `https://<owner>.github.io/<repo>/` with no edits |

`configure-pages` derives its answer from the repository's Pages settings. That
is right for a fork, and it is exactly what could keep building `/ns-class-7/`
here if the custom domain had not propagated yet, or were briefly cleared —
publishing a blank page to every learner. So a declared domain wins, and the
derived value is the fallback rather than the source of truth. The rule lives in
`scripts/lib/deploy-base.ts`; what it guarantees is `tests/deploy-base.test.ts`.

**A fork changes nothing.** Clear `web.customDomain` in `app.identity.json` for
a project site, or set it to your own domain. Either works untouched.

### Three checks, because a base-path mistake is invisible

A wrong base builds cleanly, tests green, audits clean — and then 404s its own
JavaScript in production. So it is checked three ways:

- `pnpm deploy:check` inspects the built artifact: asset URLs, manifest
  `scope`/`start_url`/`id`, the service-worker fallback, leftover paths from a
  different base, and that the Font Awesome Kit URL stayed absolute. It runs in
  the deploy workflow, against the artifact that is about to be published.
- `e2e/root-deployment.spec.ts` is the production shape — the app at `/`, with
  the PWA, offline reload, hash routes, sign artwork, fonts and the Kit. Runs in
  `pnpm test:e2e`.
- `e2e/pages-deployment.spec.ts` is the project-site shape at `/ns-class-7/`.
  Production does not depend on it; forks and project Pages do, so it stays.
  Runs in `pnpm pages:test`.

### The source monitor never auto-accepts

`pnpm sources:check:ci` runs in `ci.yml` and on a weekly schedule, never with
`--accept`. If Nova Scotia changes a page, CI goes red and waits for a person to
read the diff. It is deliberately **not** in the deploy workflow: a government
site being briefly unreachable should not block publishing content that was
already verified.

---

## The custom domain

### Why there is no CNAME file

There is exactly one mechanism, and it is **Settings → Pages → Custom domain**.

GitHub stores the custom domain in the repository's Pages settings. With the
Actions publishing flow used here, that setting is authoritative and the uploaded
artifact does not need to carry a `CNAME` file — that file belongs to the older
branch-publishing flow, where the served content *is* a branch.

So this repository deliberately ships no `CNAME`, and `public/` contains none.
Adding one would create a second place the domain is declared, free to disagree
with the first and silent when it does. If the domain ever changes, there is one
setting to change.

### DNS (already configured — do not change)

```
A      @     185.199.108.153
A      @     185.199.109.153
A      @     185.199.110.153
A      @     185.199.111.153
CNAME  www   smarmara.github.io
```

The four A records are GitHub Pages' apex addresses. The `www` CNAME points at
the account, which is what lets GitHub answer for `www.roadlearn.ca` and redirect
it to the apex once the custom domain is set.

### Manual steps

Code cannot do any of these — they are account and DNS settings.

1. **DNS** — already done, per the records above. Nothing to change.

2. **GitHub → Settings → Pages → Custom domain** → enter `roadlearn.ca` → Save.
   Leave **Source** set to *GitHub Actions*.

3. **Wait for the DNS check** to go green. GitHub verifies the A records resolve
   to it; usually minutes, occasionally up to 24 hours.

4. **Settings → Pages → Enforce HTTPS.** GitHub provisions a Let's Encrypt
   certificate once the DNS check passes, and the checkbox becomes available
   then — often already ticked. Tick it if not. Production is
   `https://roadlearn.ca/`, not HTTP. The certificate covers `www` as well.

5. **Font Awesome → Kits → this Kit → Settings → Domains.** Add:

   ```
   roadlearn.ca
   www.roadlearn.ca      (if the Kit matches on exact hostname)
   ```

   Keep `smarmara.github.io` for the fallback project URL, and `localhost` for
   local work. Without this the Pro icons silently do not render — a domain-list
   problem with a one-field fix, **not** a reason to change the icons.

6. **Re-run the deploy** (Actions → *Deploy to GitHub Pages* → Run workflow), or
   push to `main`. The build logs the target it resolved; confirm it reports
   `VITE_BASE_PATH     /`.

7. **Visit https://roadlearn.ca/** and check: Home renders; `#/learn`,
   `#/practice` and `#/signs` load and survive a refresh; sign artwork appears;
   the Pro icons render.

8. **Install it on a phone** (Add to Home Screen), then turn the network off and
   relaunch. Study must still work; only the icons may be missing.

### www

`https://www.roadlearn.ca/` is GitHub's job, not the app's. With `roadlearn.ca`
set as the custom domain and the `www` CNAME in place, GitHub serves `www` and
redirects it to the apex. There is no application-level redirect and there should
not be — a React redirect would run only *after* the wrong page had loaded.

The canonical tag in the built HTML declares `https://roadlearn.ca/` whichever
address served the page, so the apex, `www` and the old project URL are one page
rather than three.

### The old GitHub Pages URL

`https://smarmara.github.io/ns-class-7/` keeps working: GitHub redirects a
project URL to the configured custom domain by itself. No application redirect
logic is needed, and none was added.

### Learner progress does not move with the domain

Browser storage is per-origin. `smarmara.github.io` and `roadlearn.ca` are
different origins, so progress saved on the old address does **not** appear on
the new one. No site can read another origin's storage — that is the web working
correctly, and the direct consequence of storing nothing on a server.

Nothing migrates it automatically, and nothing should try: a cross-origin
migration would mean either a server, or a mechanism for one site to read
another's data. Anyone who wants their progress moved exports it (Sources →
*Back up progress*) on the old URL and restores it on the new one. The backup
format is unchanged, so it moves cleanly.

The app was newly launched when the domain moved, so there is no in-app banner or
migration prompt — this is documented for maintainers answering the question,
not surfaced to learners.

---

## Other hosts

GitHub Pages is the first host, not a dependency. The same build deploys to
Cloudflare Pages, Netlify, Vercel or any static web host:

```bash
pnpm build          # root-hosted; upload dist/
```

Set `VITE_BASE_PATH` only if the host serves the app from a subdirectory, and
`SITE_URL` to your own address so the canonical tag does not point at
roadlearn.ca. Verify the result with `pnpm deploy:check` before uploading.

---

## Native apps

The Capacitor Android and iOS projects remain in the repository and are
**not part of the web release**. They are optional, experimental tooling: nothing
in `android/` or `ios/` is read by the Pages build, and the deploy workflow
publishes only `dist/`.

See [NATIVE_APP.md](NATIVE_APP.md) if you return to them.
