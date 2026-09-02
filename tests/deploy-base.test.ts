/**
 * Which base path a deployment builds for.
 *
 * This is one line of configuration that decides whether the deployed site
 * works at all. A root build served from a project URL, or a project build
 * served from a root domain, 404s its own JavaScript bundle and shows a blank
 * page — with a green build, green tests and a clean audit behind it.
 *
 * The specific regression these guard: production moved to the custom domain
 * roadlearn.ca, and must never quietly go back to building `/ns-class-7/`
 * because GitHub Pages was asked what the URL is at the wrong moment.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { normaliseBase, resolveDeployBase } from '../scripts/lib/deploy-base';

const identity = JSON.parse(
  readFileSync(path.join(process.cwd(), 'app.identity.json'), 'utf8'),
) as { web?: { repository?: string; customDomain?: string; productionUrl?: string } };

describe('normaliseBase', () => {
  it('treats nothing, empty and "/" as a root deployment', () => {
    for (const input of [undefined, null, '', '   ', '/']) {
      expect(normaliseBase(input)).toBe('/');
    }
  });

  it('wraps a project site in slashes, however it was written', () => {
    for (const input of ['ns-class-7', '/ns-class-7', 'ns-class-7/', '/ns-class-7/']) {
      expect(normaliseBase(input), input).toBe('/ns-class-7/');
    }
  });

  it('does not try to rescue a shell-mangled value', () => {
    /*
     * Git Bash on Windows rewrites `VITE_BASE_PATH=/` into the MSYS root. The
     * temptation is to take the last segment, as the --base flag handling does
     * — but here that yields `/Git/`, which is indistinguishable from a real
     * project site and would deploy. Failing the artifact check (deploy:check)
     * is the correct outcome, so this stays a normaliser, not a guesser.
     */
    expect(normaliseBase('C:/Program Files/Git/')).not.toBe('/');
    expect(normaliseBase('C:/Program Files/Git/')).not.toBe('/Git/');
  });
});

describe('resolveDeployBase', () => {
  it('builds for the root when a custom domain is declared', () => {
    const { base } = resolveDeployBase({ customDomain: 'roadlearn.ca' });
    expect(base).toBe('/');
  });

  it('ignores what GitHub Pages reports once a custom domain is declared', () => {
    /*
     * The whole point. `actions/configure-pages` derives its base from the
     * repository's Pages settings, so during a domain change — or if the custom
     * domain were briefly cleared — it can still report the old project path.
     * Production must not follow it there.
     */
    const { base } = resolveDeployBase({
      customDomain: 'roadlearn.ca',
      derivedBasePath: '/ns-class-7/',
    });
    expect(base).toBe('/');
  });

  it('falls back to the project site for a fork with no custom domain', () => {
    // A fork clones this repository, changes nothing, and must still get a
    // working https://<owner>.github.io/<repo>/ deployment.
    for (const declared of [undefined, '', '   ', null]) {
      const { base } = resolveDeployBase({
        customDomain: declared,
        derivedBasePath: '/their-fork/',
      });
      expect(base, String(declared)).toBe('/their-fork/');
    }
  });

  it('falls back to the root when Pages reports nothing usable', () => {
    expect(resolveDeployBase({ derivedBasePath: undefined }).base).toBe('/');
    expect(resolveDeployBase({ derivedBasePath: '' }).base).toBe('/');
  });

  it('explains itself, because the reason ends up in a deploy log', () => {
    expect(resolveDeployBase({ customDomain: 'roadlearn.ca' }).reason).toContain('roadlearn.ca');
    expect(resolveDeployBase({ derivedBasePath: '/x/' }).reason).toContain('/x/');
  });
});

describe('this repository declares a root production deployment', () => {
  it('names the custom domain and its production URL', () => {
    expect(identity.web?.customDomain).toBe('roadlearn.ca');
    expect(identity.web?.productionUrl).toBe('https://roadlearn.ca/');
  });

  it('resolves production to the root base', () => {
    const { base } = resolveDeployBase({
      customDomain: identity.web?.customDomain,
      // Whatever GitHub reports, including the pre-custom-domain project path.
      derivedBasePath: '/ns-class-7/',
    });
    expect(base).toBe('/');
  });

  it('keeps the repository name available for project-site builds', () => {
    // Forks and the subpath regression suite build for /<repo>/; the fallback
    // has to know the real repository name, not the checkout folder's name.
    expect(identity.web?.repository).toBe('smarmara/ns-class-7');
    expect(normaliseBase(identity.web!.repository!.split('/').at(-1))).toBe('/ns-class-7/');
  });
});
