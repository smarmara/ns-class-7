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
- Missing security headers that GitHub Pages does not let a static site control.

## Content errors

A factually wrong question is not a security issue but it *is* the most serious
kind of defect this project has. Open a **Content or source correction** issue
with the official source — see [CONTRIBUTING.md](CONTRIBUTING.md).
