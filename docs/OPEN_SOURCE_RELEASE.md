# Open-source release

Everything needed to publish this repository and get the app onto GitHub Pages.

The repository is prepared: workflows, licensing, contributor documentation and
a subdirectory-hosting regression suite are all in place. What remains is the
handful of steps that can only be done by a person with the GitHub account.

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
about. After the first Pages deploy, add your Pages origin in the Font Awesome
account (Kits → your Kit → Settings → Domains):

```
<your-username>.github.io
```

Add `localhost` too if it is not already there, for local preview. Note that a
GitHub Pages *project* site is `<username>.github.io/<repo>/` — the allow-list
takes the **origin**, so `<username>.github.io` covers every repository on that
account. A custom domain needs its own entry.

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
- [ ] Add `<your-username>.github.io` to the Font Awesome Kit's domain
      allow-list (see above) — without it the Pro icons will not render

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
         ├── build    VITE_BASE_PATH from actions/configure-pages, then offline audit
         └── deploy   upload dist/ as the Pages artifact and publish
```

A failed verification stops the deployment. Only `dist/` is published — no
source, tests, documentation, native projects, source snapshots or git history
reach the public site.

Pull requests run `ci.yml` instead, which validates without deploying.

### The base path

A GitHub Pages *project* site is served from `https://<owner>.github.io/<repo>/`,
not the domain root. The app handles this with one configurable value:

- `VITE_BASE_PATH` unset → `/` (dev server, custom domain, any root host)
- `VITE_BASE_PATH=/<repo>/` → a project site

The workflow reads it from `actions/configure-pages`, which reports the real base
path, so **the repository name is never hard-coded and a fork works untouched**.

`pnpm pages:test` builds at a subpath and asserts the whole thing — index, JS,
CSS, manifest scope, service-worker scope, fonts, sign images, hash routes and
refresh — works there, with no 404s. It runs in `pnpm verify`.

### The source monitor never auto-accepts

`pnpm sources:check:ci` runs in `ci.yml` and on a weekly schedule, never with
`--accept`. If Nova Scotia changes a page, CI goes red and waits for a person to
read the diff. It is deliberately **not** in the deploy workflow: a government
site being briefly unreachable should not block publishing content that was
already verified.

---

## Moving to a custom domain later

Nothing in the application changes.

1. Add the domain in **Settings → Pages → Custom domain** and set the DNS records
   GitHub asks for.
2. `actions/configure-pages` then reports an empty base path, so the next deploy
   builds for `/` automatically. There is no code to edit.
3. Commit the `CNAME` file GitHub creates, if it is not committed for you.

**One thing to tell learners:** browser storage is per-origin, so moving from
`<owner>.github.io/<repo>/` to `customdomain.com` starts a fresh, empty store.
Progress does not follow automatically, and there is no cloud copy to restore
from — that is the direct consequence of storing nothing on a server.

Anyone who wants to keep their progress can export it (Sources → *Back up
progress*) on the old URL and restore it on the new one. The backup format is
identical, so it moves cleanly. Consider announcing the move before making it.

---

## Other hosts

GitHub Pages is the first host, not a dependency. The same build deploys to
Cloudflare Pages, Netlify, Vercel or any static web host:

```bash
pnpm build          # root-hosted; upload dist/
```

Set `VITE_BASE_PATH` only if the host serves the app from a subdirectory.

---

## Native apps

The Capacitor Android and iOS projects remain in the repository and are
**not part of the web release**. They are optional, experimental tooling: nothing
in `android/` or `ios/` is read by the Pages build, and the deploy workflow
publishes only `dist/`.

See [NATIVE_APP.md](NATIVE_APP.md) if you return to them.
