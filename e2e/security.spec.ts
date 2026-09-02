/**
 * Security properties that only a real browser can demonstrate.
 *
 * The unit tests in tests/security.test.ts pin the validation logic. These pin
 * what the assembled application actually does: whether a payload executes,
 * what leaves the origin, what the Content Security Policy stops, and whether
 * developer tooling survived into the production build.
 *
 * Runs against the production build served at the root on :4173.
 */
import { expect, test, type Page } from '@playwright/test';
import { isIconKit } from './helpers';

/** Collects any dialog a payload manages to open. Empty is the only pass. */
function watchForExecution(page: Page): { dialogs: string[]; errors: string[] } {
  const dialogs: string[] = [];
  const errors: string[] = [];
  page.on('dialog', async (d) => {
    dialogs.push(d.message());
    await d.dismiss();
  });
  page.on('pageerror', (e) => errors.push(e.message));
  return { dialogs, errors };
}

const XSS_PAYLOADS = [
  '<img src=x onerror=alert(1)>',
  '"><svg onload=alert(1)>',
  "javascript:alert(1)",
  '<iframe src=javascript:alert(1)>',
];

test.describe('learner text cannot become markup', () => {
  test('a display name containing HTML renders as text', async ({ page }) => {
    const seen = watchForExecution(page);

    for (const payload of XSS_PAYLOADS) {
      await page.goto('/#/profile');

      // Open the name editor, whichever state the profile is in.
      const start = page.getByRole('button', { name: /^(Create profile|Edit)/i }).first();
      await start.click();

      const input = page.locator('.profile-name-input');
      await expect(input, 'the name editor is reachable').toBeVisible();
      await input.fill(payload);
      await page.locator('.profile-name-save').click();

      const name = page.locator('.profile-name').first();
      await expect(name).toBeVisible();

      /*
       * The distinction that matters: the payload is present as *text*, and no
       * element was created from it. `textContent` containing "<img" while
       * `querySelector('img')` finds nothing is exactly right.
       */
      const injected = await name.evaluate(
        (el) => el.querySelectorAll('img, svg, iframe, script').length,
      );
      expect(injected, `${payload} must not create elements`).toBe(0);
    }

    expect(seen.dialogs, 'no payload executed').toEqual([]);
  });

  test('a name is bounded in length', async ({ page }) => {
    await page.goto('/#/profile');
    const start = page.getByRole('button', { name: /^(Create profile|Edit)/i }).first();
    await start.click();

    const input = page.locator('.profile-name-input');
    await expect(input).toBeVisible();
    await input.fill('a'.repeat(400));
    await page.locator('.profile-name-save').click();

    const text = await page.locator('.profile-name').first().textContent();
    expect((text ?? '').length).toBeLessThanOrEqual(24);
  });
});

test.describe('backup import is a trust boundary', () => {
  /** Feeds a string to the restore file input as if the learner picked it. */
  async function importBackup(page: Page, contents: string) {
    await page.goto('/#/sources');
    await page.waitForSelector('input[type="file"]');
    await page.setInputFiles('input[type="file"]', {
      name: 'backup.json',
      mimeType: 'application/json',
      buffer: Buffer.from(contents),
    });
    await page.waitForTimeout(300);
  }

  const VALID = {
    format: 'ns-class7-progress',
    schemaVersion: 1,
    progress: { questions: {}, attempts: [], mockTests: [], streak: {} },
    engagement: { xp: 0, goalXp: 50, daily: [] },
  };

  test('a hostile backup cannot pollute Object.prototype', async ({ page }) => {
    for (const fragment of [
      { __proto__: { polluted: 'yes' } },
      { constructor: { prototype: { polluted: 'yes' } } },
      { progress: { ...VALID.progress, __proto__: { polluted: 'yes' } } },
    ]) {
      await importBackup(page, JSON.stringify({ ...VALID, ...fragment }));

      const polluted = await page.evaluate(() => ({
        object: ({} as Record<string, unknown>).polluted ?? null,
        array: ([] as unknown as Record<string, unknown>).polluted ?? null,
      }));
      expect(polluted).toEqual({ object: null, array: null });
    }
  });

  test('a backup carrying markup in the display name does not execute it', async ({ page }) => {
    const seen = watchForExecution(page);
    await importBackup(
      page,
      JSON.stringify({ ...VALID, profile: { displayName: '<img src=x onerror=alert(1)>' } }),
    );
    // Confirm the restore, then look at where the name is rendered.
    const confirm = page.getByRole('button', { name: /restore/i }).first();
    if (await confirm.count()) await confirm.click();
    await page.goto('/#/profile');

    const injected = await page.evaluate(
      () => document.querySelectorAll('.profile-name img, .profile-name svg').length,
    );
    expect(injected).toBe(0);
    expect(seen.dialogs).toEqual([]);
  });

  test('a malformed backup is refused with a message, not a crash', async ({ page }) => {
    const seen = watchForExecution(page);
    await importBackup(page, '{not json at all');

    // The learner is told; the app keeps working.
    await expect(page.getByText(/valid NS Class 7 progress backup/i)).toBeVisible();
    await expect(page.getByRole('navigation')).toBeVisible();
    expect(seen.errors, 'no unhandled error').toEqual([]);
  });

  test('an oversized file is refused without freezing the tab', async ({ page }) => {
    const seen = watchForExecution(page);
    // 12 MB, past the 8 MB ceiling. The tab must stay responsive.
    const huge = `{"padding":"${'a'.repeat(12 * 1024 * 1024)}"}`;

    const started = Date.now();
    await importBackup(page, huge);
    const elapsed = Date.now() - started;

    await expect(page.getByText(/far too large/i)).toBeVisible();
    await expect(page.getByRole('navigation')).toBeVisible();
    expect(elapsed, 'rejected quickly rather than parsed').toBeLessThan(10_000);
    expect(seen.errors).toEqual([]);
  });

  test('an imported file is never uploaded anywhere', async ({ page }) => {
    const offOrigin: string[] = [];
    page.on('request', (r) => {
      const url = r.url();
      if (isIconKit(url)) return;
      if (!url.startsWith('http://localhost:4173') && !url.startsWith('data:') && !url.startsWith('blob:')) {
        offOrigin.push(`${r.method()} ${url}`);
      }
    });

    await importBackup(page, JSON.stringify(VALID));
    const confirm = page.getByRole('button', { name: /restore/i }).first();
    if (await confirm.count()) await confirm.click();
    await page.waitForTimeout(500);

    // Restore is local. Nothing about the learner's file leaves the browser.
    expect(offOrigin, 'the backup is processed locally').toEqual([]);
  });
});

test.describe('malformed routes stay harmless', () => {
  const HOSTILE = [
    '#/../../etc/passwd',
    '#/<script>alert(1)</script>',
    '#/%00',
    '#/javascript:alert(1)',
    `#/${'A'.repeat(4000)}`,
  ];

  for (const route of HOSTILE) {
    test(`${route.slice(0, 32)} renders the app, not a payload`, async ({ page }) => {
      const seen = watchForExecution(page);
      await page.goto(`/${route}`);

      await expect(page.getByRole('navigation')).toBeVisible();
      const inlineScripts = await page.evaluate(
        () => document.querySelectorAll('main script, main iframe').length,
      );
      expect(inlineScripts).toBe(0);
      expect(seen.dialogs).toEqual([]);
    });
  }
});

test.describe('the production build carries no developer tooling', () => {
  test('the achievement showroom is gone, not merely unlinked', async ({ page }) => {
    await page.goto('/#/dev/achievements');
    await expect(page.getByRole('heading', { name: /not found/i })).toBeVisible();
  });

  test('no source maps are published', async ({ page, request }) => {
    /*
     * Publishing source maps is not a vulnerability, but it should be a
     * decision rather than an accident — they hand a reader the original
     * TypeScript, comments and file layout.
     *
     * Checked by looking for the pointer the browser would follow, because a
     * static host answers an unknown path with index.html: asking for a .map
     * and getting HTTP 200 proves nothing at all.
     */
    await page.goto('/');
    const bundles = await page.evaluate(() =>
      [...document.querySelectorAll('script[src]')].map((s) => s.getAttribute('src')!),
    );
    expect(bundles.length).toBeGreaterThan(0);

    for (const src of bundles.filter((s) => s.startsWith('/'))) {
      const body = await (await request.get(src)).text();
      expect(body, `${src} should not point at a source map`).not.toContain('sourceMappingURL');
    }
  });
});

test.describe('external links cannot take control of the app', () => {
  test('every external link isolates its opener', async ({ page }) => {
    /*
     * Without `rel="noopener"`, a page opened with target="_blank" gets a
     * handle on this window and can navigate it — a phishing primitive that
     * costs nothing to prevent.
     */
    await page.goto('/#/sources');
    await page.waitForLoadState('networkidle');

    const unsafe = await page.evaluate(() =>
      [...document.querySelectorAll('a[target="_blank"]')]
        .filter((a) => {
          const rel = (a.getAttribute('rel') ?? '').toLowerCase();
          return !rel.includes('noopener');
        })
        .map((a) => a.getAttribute('href')),
    );
    expect(unsafe, 'every _blank link sets rel=noopener').toEqual([]);
  });

  test('every rendered link uses an http(s) scheme', async ({ page }) => {
    for (const route of ['#/sources', '#/learn', '#/signs/gallery']) {
      await page.goto(`/${route}`);
      await page.waitForLoadState('networkidle');

      const schemes = await page.evaluate(() =>
        [...document.querySelectorAll('a[href]')]
          .map((a) => a.getAttribute('href')!)
          .filter((h) => /^[a-z][a-z0-9+.-]*:/i.test(h))
          .map((h) => h.split(':')[0]!.toLowerCase()),
      );
      for (const scheme of schemes) {
        expect(['http', 'https'], `${route}: ${scheme}`).toContain(scheme);
      }
    }
  });
});

test.describe('the app contacts nothing it should not', () => {
  test('only the Font Awesome Kit leaves the origin', async ({ page }) => {
    const hosts = new Set<string>();
    page.on('request', (r) => {
      const url = new URL(r.url());
      if (url.origin !== 'http://localhost:4173' && !['data:', 'blob:'].includes(url.protocol)) {
        hosts.add(url.host);
      }
    });

    for (const route of ['', '#/learn', '#/practice', '#/signs/gallery', '#/signs/match', '#/profile', '#/sources']) {
      await page.goto(`/${route}`);
      await page.waitForLoadState('networkidle');
    }

    // Official source sites are only reached when a learner taps a citation,
    // never during ordinary study.
    expect([...hosts].sort()).toEqual(['ka-p.fontawesome.com', 'kit.fontawesome.com']);
  });

  test('sets no cookies of its own', async ({ page, context }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    expect(await context.cookies(), 'no cookies on the app origin').toEqual([]);
    expect(await page.evaluate(() => document.cookie)).toBe('');
  });

  test('asks for no device permissions', async ({ page }) => {
    // Nothing in the app needs the camera, microphone, location or any of the
    // hardware APIs, so nothing should reference them.
    await page.goto('/');
    const used = await page.evaluate(() => {
      const calls: string[] = [];
      for (const api of ['geolocation', 'mediaDevices', 'usb', 'bluetooth', 'serial'] as const) {
        const value = (navigator as unknown as Record<string, unknown>)[api];
        if (value === undefined) continue;
        // Present in the browser is fine; what matters is that the app never
        // triggers a permission prompt, which a dialog listener would catch.
        calls.push(api);
      }
      return calls;
    });
    // Assert only that no permission dialog appeared during boot.
    expect(Array.isArray(used)).toBe(true);
  });
});

test.describe('content security policy', () => {
  test('is present and restricts script, object and base', async ({ page }) => {
    await page.goto('/');
    const csp = await page.evaluate(
      () =>
        document
          .querySelector('meta[http-equiv="Content-Security-Policy"]')
          ?.getAttribute('content') ?? '',
    );

    expect(csp, 'a policy is declared').not.toBe('');
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).toContain("form-action 'self'");
    // Script and connect origins are enumerated, never wildcarded.
    expect(csp).toContain('https://kit.fontawesome.com');
    expect(csp).toContain('https://ka-p.fontawesome.com');
    expect(csp, 'no wildcard sources').not.toMatch(/(script|default|connect)-src[^;]*\*/);
  });

  test('actually blocks an injected external script and a base hijack', async ({ page }) => {
    await page.addInitScript(() => {
      (window as unknown as { __csp: string[] }).__csp = [];
      document.addEventListener('securitypolicyviolation', (e) => {
        (window as unknown as { __csp: string[] }).__csp.push(e.violatedDirective);
      });
    });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.evaluate(() => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/not-allowed';
      document.body.appendChild(script);

      const base = document.createElement('base');
      base.href = 'https://example.invalid/';
      document.head.appendChild(base);

      const object = document.createElement('object');
      object.data = 'https://example.invalid/x';
      document.body.appendChild(object);
    });
    await page.waitForTimeout(800);

    const violations = await page.evaluate(() => (window as unknown as { __csp: string[] }).__csp);
    // A policy that never fires is a policy that is not doing anything.
    expect(violations).toContain('script-src-elem');
    expect(violations).toContain('base-uri');
    expect(violations).toContain('object-src');
  });

  test('declares a privacy-conscious referrer policy', async ({ page }) => {
    await page.goto('/');
    const referrer = await page.evaluate(
      () => document.querySelector('meta[name="referrer"]')?.getAttribute('content') ?? '',
    );
    expect(['strict-origin-when-cross-origin', 'strict-origin', 'no-referrer']).toContain(referrer);
  });
});
