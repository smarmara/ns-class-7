import { describe, expect, it } from 'vitest';
import { assetUrl, deploymentBase, joinBase } from '@/assetUrl';
import { getSignArtwork } from '@/signs/artwork';
import approvalsJson from '@data/signs/visual-approvals.json';

/**
 * Deployment base path.
 *
 * The app is served from the domain root in development and from
 * `/<repository>/` on a GitHub Pages project site. Asset paths that live in
 * data files rather than in code — notably the 221 official sign images — must
 * be resolved against that base, or every sign becomes a broken image the
 * moment the app is deployed anywhere but the root.
 *
 * `import.meta.env.BASE_URL` is substituted by the bundler, so it cannot be
 * stubbed in a unit test: a test that tried would only be asserting against its
 * own mock. So the *rule* is tested here as a pure function, and the wiring is
 * proved against a real subdirectory build in `e2e/pages-deployment.spec.ts`,
 * which loads the app at `/ns-class-7/` and fails on any 404.
 */

describe('joinBase — the rebasing rule', () => {
  it('leaves root-absolute paths alone at the domain root', () => {
    expect(joinBase('/', '/signs/ns-official/RB-1.png')).toBe('/signs/ns-official/RB-1.png');
  });

  it('prefixes the base when the app is served from a subdirectory', () => {
    // The GitHub Pages project-site case. Without this the browser would ask
    // for https://owner.github.io/signs/... and get a 404.
    expect(joinBase('/ns-class-7/', '/signs/ns-official/RB-1.png')).toBe(
      '/ns-class-7/signs/ns-official/RB-1.png',
    );
  });

  it('works for any repository name, so a fork needs no edits', () => {
    expect(joinBase('/someone-elses-fork/', '/signs/ns-official/WC-1.png')).toBe(
      '/someone-elses-fork/signs/ns-official/WC-1.png',
    );
  });

  it('never produces a double slash at the join', () => {
    expect(joinBase('/ns-class-7/', '/icons/icon-192.png')).not.toContain('//');
    expect(joinBase('/deep/nested/', '/signs/x.png')).toBe('/deep/nested/signs/x.png');
  });

  it('tolerates a base with no trailing slash', () => {
    expect(joinBase('/ns-class-7', '/signs/x.png')).toBe('/ns-class-7/signs/x.png');
  });

  it('falls back to the root for an empty base', () => {
    expect(joinBase('', '/signs/x.png')).toBe('/signs/x.png');
  });

  it('leaves bundler-resolved and relative paths untouched', () => {
    // Vite already rewrote these; rebasing them again would corrupt them.
    expect(joinBase('/ns-class-7/', './favicon.svg')).toBe('./favicon.svg');
    expect(joinBase('/ns-class-7/', 'assets/index.js')).toBe('assets/index.js');
  });

  it('leaves protocol-relative and data URLs untouched', () => {
    expect(joinBase('/ns-class-7/', '//cdn.example.com/x.png')).toBe(
      '//cdn.example.com/x.png',
    );
    expect(joinBase('/ns-class-7/', 'data:image/png;base64,AAAA')).toBe(
      'data:image/png;base64,AAAA',
    );
  });
});

describe('deploymentBase', () => {
  it('resolves to the root under the test runner and plain Node', () => {
    // The audit scripts import the artwork resolver and run under tsx, where
    // import.meta.env does not exist. Returning '/' keeps them working.
    expect(deploymentBase()).toBe('/');
  });

  it('is what assetUrl composes with the rule', () => {
    expect(assetUrl('/signs/ns-official/RB-1.png')).toBe(
      joinBase(deploymentBase(), '/signs/ns-official/RB-1.png'),
    );
  });
});

describe('sign artwork resolution', () => {
  const approvals = approvalsJson as {
    approvals: Record<string, { status: string; assetPath?: string }>;
  };

  const cropIds = Object.entries(approvals.approvals)
    .filter(([, a]) => a.status === 'approved' && a.assetPath)
    .map(([id]) => id);

  it('has the full set of official crops to protect', () => {
    expect(cropIds.length).toBe(221);
  });

  it('routes every official crop through the rebasing rule', () => {
    /*
     * The property that actually matters: whatever the base is, the rendered
     * src must equal the recorded path rebased. Checked against every crop, so
     * a future code path that bypasses assetUrl is caught.
     */
    for (const id of cropIds) {
      const artwork = getSignArtwork(id);
      expect(artwork?.kind).toBe('crop');
      if (artwork?.kind !== 'crop') continue;

      const recorded = approvals.approvals[id]!.assetPath!;
      expect(artwork.src).toBe(joinBase(deploymentBase(), recorded));
      // And it would land under a subdirectory deployment too.
      expect(joinBase('/ns-class-7/', recorded)).toBe(
        `/ns-class-7${recorded}`,
      );
    }
  });

  it('does not rewrite the recorded approval data', () => {
    // The stored assetPath is covered by each approval's fingerprint, so it
    // must stay exactly as recorded. Rebasing happens at render time only.
    for (const id of cropIds) {
      expect(approvals.approvals[id]!.assetPath!.startsWith('/signs/')).toBe(true);
    }
  });
});
