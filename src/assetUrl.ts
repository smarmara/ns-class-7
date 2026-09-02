/**
 * Resolves a bundled asset path against the deployment base.
 *
 * Some asset paths live in data files rather than in code — the 221 official
 * Schedule sign images are recorded in `data/signs/visual-approvals.json` as
 * root-absolute paths like `/signs/ns-official/RB-1.png`. Those strings are
 * covered by each approval's fingerprint, so they cannot be rewritten without
 * invalidating the human sign-off that says "someone looked at this image and
 * approved it". They therefore stay exactly as recorded, and are resolved
 * against the base at render time instead.
 *
 * That matters because the app is not always served from the root. On GitHub
 * Pages it lives at `/<repository>/`, where `/signs/ns-official/RB-1.png`
 * would resolve to the domain root and 404 — every official sign in the app
 * would be a broken image.
 *
 * `import.meta.env.BASE_URL` is Vite's build-time base:
 *   - `/`                    development, and any root deployment
 *   - `/ns-class-7/`   a GitHub Pages project site
 *   - `/`                    a future custom domain
 *
 * Assets imported through the bundler (fonts, medal SVGs, icons) are rewritten
 * by Vite already and must not pass through here.
 */

/**
 * The joining rule, as a pure function.
 *
 * Split out from `assetUrl` because it is the part worth testing directly:
 * `import.meta.env.BASE_URL` is substituted by the bundler and cannot be
 * meaningfully stubbed in a unit test, so a test that tried would be asserting
 * against its own mock rather than the rule. Here the rule is exercised for
 * real, and `e2e/pages-deployment.spec.ts` proves the wiring end to end against
 * an actual subdirectory build.
 */
export function joinBase(base: string, path: string): string {
  // Only root-absolute paths need rebasing. Anything already relative, a data:
  // URI, or a protocol-relative URL is returned untouched.
  if (!path.startsWith('/') || path.startsWith('//')) return path;

  // A base always ends in '/', so trim it before joining to avoid '//'.
  return `${(base || '/').replace(/\/$/, '')}${path}`;
}

/**
 * The base Vite built with, or '/' when there is no Vite.
 *
 * The audit scripts (`pnpm signs:learner-audit`, the fidelity report) import the
 * artwork resolver directly and run under plain Node via tsx, where
 * `import.meta.env` does not exist at all. Those scripts reason about which
 * sign maps to which file on disk, not about where a web server mounts the app,
 * so falling back to the root is exactly right for them — and it keeps a
 * build-tool detail from breaking tooling that has nothing to do with builds.
 */
export function deploymentBase(): string {
  const env = (import.meta as ImportMeta & { env?: { BASE_URL?: string } }).env;
  return env?.BASE_URL || '/';
}

export function assetUrl(path: string): string {
  return joinBase(deploymentBase(), path);
}
