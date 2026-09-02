/**
 * Which base path a deployment builds for.
 *
 * There are two shapes of GitHub Pages site and they need different bases:
 *
 *   root      https://roadlearn.ca/                  → `/`
 *   project   https://smarmara.github.io/ns-class-7/ → `/ns-class-7/`
 *
 * Getting this wrong is not a subtle failure. Every asset in the build is
 * resolved against the base, so a project-site base served from a root domain
 * 404s the JS bundle and shows a blank page.
 *
 * The rule is deliberately not "ask GitHub what the URL is". `actions/configure-pages`
 * reports a base derived from the repository's Pages settings, which is right
 * for a fork and is exactly the thing that would silently keep building
 * `/ns-class-7/` for this repository if the custom domain were ever not yet
 * propagated, or were briefly cleared. So a declared custom domain wins, and
 * the derived value is the fallback rather than the source of truth.
 */

/** Everything the decision depends on, so it can be exercised without a CI run. */
export interface DeployBaseInput {
  /** `web.customDomain` from app.identity.json. Empty or absent means none. */
  customDomain?: string | null;
  /** `base_path` output of actions/configure-pages, when it ran. */
  derivedBasePath?: string | null;
}

export interface DeployBaseDecision {
  /** The value to pass as VITE_BASE_PATH. Always `/`-wrapped. */
  base: string;
  /** Why, in one line, for the build log. */
  reason: string;
}

/**
 * Normalised to `/segment/`, or `/` for a root deployment — the shape Vite, the
 * PWA `scope` and Workbox's `navigateFallback` all expect.
 *
 * Deliberately literal: it normalises slashes and nothing else. It is tempting
 * to also un-mangle Git Bash on Windows, which rewrites an environment value
 * that looks like a Unix path into a Windows one (`VITE_BASE_PATH=/` arrives as
 * `C:/Program Files/Git/`). Guessing there is worse than not guessing — the
 * best available guess turns that into `/Git/`, which is indistinguishable from
 * a real project site and would ship. `pnpm deploy:check` inspects the built
 * artifact and fails on exactly this, which is a check rather than a guess.
 */
export function normaliseBase(value: string | null | undefined): string {
  const raw = value?.trim();
  if (!raw || raw === '/') return '/';
  return `/${raw.replace(/^\/+|\/+$/g, '')}/`;
}

export function resolveDeployBase({
  customDomain,
  derivedBasePath,
}: DeployBaseInput): DeployBaseDecision {
  const domain = customDomain?.trim();
  if (domain) {
    return {
      base: '/',
      reason: `custom domain ${domain} declared in app.identity.json — root deployment`,
    };
  }

  const derived = normaliseBase(derivedBasePath);
  return {
    base: derived,
    reason:
      derived === '/'
        ? 'no custom domain declared; GitHub Pages reports a root site'
        : `no custom domain declared; GitHub Pages reports a project site at ${derived}`,
  };
}
