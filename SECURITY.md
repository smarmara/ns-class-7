# Security and privacy

## Reporting

If you find a security or privacy problem, please report it privately rather
than opening a public issue.

Use GitHub's **Report a vulnerability** button under the repository's *Security*
tab (Security → Advisories → Report a vulnerability). That creates a private
advisory only the maintainers can see.

Please include what you found, how to reproduce it, and what you think the
impact is. You will get an acknowledgement, and an honest answer about whether
and when it will be fixed. This is a small volunteer project, so there is no
formal response-time commitment and no bug-bounty programme.

## What is in scope

The attack surface here is small on purpose, and that is worth knowing before
you spend time:

- There is **no backend**, no API and no database.
- There are **no accounts**, no authentication and no sessions.
- There is **no analytics**, telemetry or advertising.
- Nothing about a learner ever leaves their browser.

So the interesting categories are:

- **Cross-site scripting** or any way to get script into the app.
- **Learner data leaving the device** — anything that would make the privacy
  claims above untrue.
- **Supply chain** — a dependency or build step that could inject something into
  the published bundle.
- **Content integrity** — a way to make the app teach a rule that its cited
  source does not support. This project treats that as a security-adjacent
  problem, because people act on it in a car.

## What is not a vulnerability

- Learner progress being readable in the browser's own storage. It is stored
  locally by design; anyone with the device has it.
- Losing progress after clearing site data or uninstalling. Documented behaviour;
  the app offers an explicit backup for this.
- Official source links pointing to government websites. Those are the point.
- Missing security *headers*. GitHub Pages serves static files and does not let
  a site set response headers, so the parts of a security posture that live in
  headers are outside this project's control. See the section below for exactly
  what is and is not enforced.

## What is enforced, and what cannot be

The app ships a Content Security Policy as an HTML `<meta>` tag, because a
static host has no other way to declare one. Being honest about what that does:

**Enforced**

- Scripts and styles may load only from this origin and `kit.fontawesome.com`,
  so an injected `<script src="https://elsewhere">` is refused.
- `connect-src` limits where the page may send anything to this origin and the
  Font Awesome payload host — there is no endpoint an exfiltration attempt
  could reach.
- `object-src 'none'`, `base-uri 'self'` and `form-action 'self'` close the
  plugin, `<base>`-hijack and form-exfiltration routes.

**Not enforced, and why**

- `frame-ancestors` is ignored in a meta policy by specification, so
  **clickjacking protection is not in place**. It needs a host that can set
  response headers. JavaScript frame-busting is not a substitute and is not
  used here.
- `script-src` includes `'unsafe-inline'`. The hosted Font Awesome Pro Kit
  fetches its payload and evaluates it as an injected inline script, so without
  it every Pro icon disappears. A static site cannot issue per-request nonces,
  and a fixed nonce in a static file is readable by anyone and protects
  nothing. This is the weakest part of the policy and is a deliberate,
  documented trade.
- `Strict-Transport-Security`, `X-Content-Type-Options` and `Permissions-Policy`
  are response headers and cannot be set from markup.

The real defence against script injection is upstream of the policy: the app has
no HTML injection sink. Learner text is rendered by React as text, the only
`dangerouslySetInnerHTML` use takes build-time SVG assets and no runtime data,
and every external link is scheme-checked in `src/safeUrl.ts`. The policy is
defence in depth, not the primary control.

## Third-party code in the browser

One third-party script runs in this origin: the Font Awesome Pro Kit
(`kit.fontawesome.com`, which then fetches from `ka-p.fontawesome.com`). It
renders the Pro icons, which cannot be bundled because Pro artwork is licensed
per seat and this repository is public.

It executes with the same privileges as the app, so a compromise of that Kit is
genuinely part of this app's threat model. Two things bound it: the Kit is
restricted to an allow-list of domains in the Font Awesome account, and nothing
about a learner is ever sent to it — the requests carry the icon fetch and
nothing else. Subresource Integrity is not usable, because a Kit's contents are
generated per account and change without notice, so a pinned hash would break
the icons rather than protect them.

If the Kit does not load, the app is fully usable: every icon sits beside a text
label, and `e2e/font-awesome-kit.spec.ts` proves the whole learner journey works
with `*.fontawesome.com` blocked.

## Content errors

A factually wrong question is not a security issue but it *is* the most serious
kind of defect this project has. Open a **Content or source correction** issue
with the official source — see [CONTRIBUTING.md](CONTRIBUTING.md).
