/**
 * Security regressions, pinned.
 *
 * This app has an unusually small attack surface — no server, no accounts, no
 * database, nothing to steal but the learner's own progress on their own
 * device. That makes the few boundaries it does have worth guarding precisely,
 * because there is no second layer behind them:
 *
 *   1. a JSON file the learner imports, which may have come from anywhere
 *   2. text the learner types, which is rendered back to them
 *   3. URLs taken from repository data and put into an `href`
 *
 * Each test below is a specific thing that must keep being true, not a general
 * gesture at security. The browser-level counterparts are in
 * e2e/security.spec.ts.
 */
import { describe, expect, it } from 'vitest';
import {
  MAX_BACKUP_BYTES,
  MAX_BACKUP_ENTRIES,
  parseBackup,
} from '../src/store/learnerStorage';
import { MAX_DISPLAY_NAME, normaliseDisplayName, normaliseProfile } from '../src/engine/profile/types';
import { isSafeExternalUrl, safeExternalHref } from '../src/safeUrl';

/** A minimal backup that must always be accepted, as the control case. */
function validBackup(extra: Record<string, unknown> = {}): string {
  return JSON.stringify({
    format: 'ns-class7-progress',
    schemaVersion: 1,
    savedAt: new Date().toISOString(),
    progress: { questions: {}, attempts: [], mockTests: [], streak: {} },
    engagement: { xp: 0, goalXp: 50, daily: [] },
    ...extra,
  });
}

describe('backup import: the control case still works', () => {
  it('accepts a well-formed backup', () => {
    const result = parseBackup(validBackup());
    expect(result.ok, 'a real backup must still restore').toBe(true);
  });
});

describe('backup import: prototype pollution', () => {
  /*
   * `JSON.parse` creates `__proto__` as an ordinary own property rather than
   * invoking the setter, and the envelope is rebuilt field by field rather than
   * merged — so pollution has no path through. These tests exist because that
   * is a property of how the code is written today, and a future refactor to
   * "just spread the parsed object" would silently remove it.
   */
  const probes = [
    ['__proto__ at the top level', '{"__proto__":{"polluted":"yes"}}'],
    ['__proto__ inside progress', '{"progress":{"__proto__":{"polluted":"yes"}}}'],
    ['constructor.prototype', '{"constructor":{"prototype":{"polluted":"yes"}}}'],
    ['prototype key', '{"prototype":{"polluted":"yes"}}'],
  ] as const;

  for (const [name, fragment] of probes) {
    it(`does not pollute Object.prototype via ${name}`, () => {
      const payload = JSON.parse(validBackup()) as Record<string, unknown>;
      Object.assign(payload, JSON.parse(fragment));
      parseBackup(JSON.stringify(payload));

      expect(({} as Record<string, unknown>).polluted).toBeUndefined();
      expect(([] as unknown as Record<string, unknown>).polluted).toBeUndefined();
      expect(Object.prototype).not.toHaveProperty('polluted');
    });
  }

  it('drops unknown top-level keys instead of carrying them into storage', () => {
    // The envelope is rebuilt from known fields. An attacker-supplied key
    // should not survive into the object the app then persists.
    const result = parseBackup(validBackup({ evilKey: 'should not survive' }));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.state).not.toHaveProperty('evilKey');
  });
});

describe('backup import: malformed and hostile files', () => {
  const rejected: [string, string][] = [
    ['not JSON at all', '{not json'],
    ['empty string', ''],
    ['a bare array', '[1,2,3]'],
    ['a JSON string', '"hello"'],
    ['null', 'null'],
    ['a number', '42'],
    ['no format identifier', '{"schemaVersion":1}'],
    ['someone else\'s format', '{"format":"other-app","schemaVersion":1}'],
    ['missing state', '{"format":"ns-class7-progress","schemaVersion":1}'],
  ];

  for (const [name, payload] of rejected) {
    it(`rejects ${name}`, () => {
      const result = parseBackup(payload);
      expect(result.ok, name).toBe(false);
    });
  }

  it('rejects a schema from the future rather than guessing at it', () => {
    const result = parseBackup(validBackup({ schemaVersion: 9999 }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('unsupported-schema');
  });

  it('rejects a negative or fractional schema version', () => {
    for (const schemaVersion of [-1, 0, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(parseBackup(validBackup({ schemaVersion })).ok, String(schemaVersion)).toBe(false);
    }
  });

  it('rejects wrong types where a structure is required', () => {
    expect(parseBackup(validBackup({ progress: 'nope' })).ok).toBe(false);
    expect(parseBackup(validBackup({ engagement: [] })).ok).toBe(false);
    expect(
      parseBackup(
        validBackup({ progress: { questions: {}, attempts: 'no', mockTests: [], streak: {} } }),
      ).ok,
    ).toBe(false);
  });
});

describe('backup import: size limits', () => {
  it('rejects a payload past the byte ceiling without parsing it', () => {
    // The failure this prevents is a frozen tab: JSON.parse is synchronous, so
    // a few hundred megabytes of nonsense blocks the main thread outright.
    const huge = `{"padding":"${'a'.repeat(MAX_BACKUP_BYTES + 1)}"}`;
    const result = parseBackup(huge);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('too-large');
  });

  it('counts bytes rather than characters', () => {
    // A multi-byte character must not be allowed to smuggle through a size
    // check that counted string length.
    const multibyte = '😀'.repeat(MAX_BACKUP_BYTES / 4);
    expect(multibyte.length).toBeLessThan(MAX_BACKUP_BYTES);
    expect(parseBackup(`{"padding":"${multibyte}"}`).ok).toBe(false);
  });

  it('rejects absurd collection lengths', () => {
    const tooMany = parseBackup(
      validBackup({
        progress: {
          questions: {},
          attempts: new Array(MAX_BACKUP_ENTRIES + 1).fill(0),
          mockTests: [],
          streak: {},
        },
      }),
    );
    expect(tooMany.ok).toBe(false);
    if (!tooMany.ok) expect(tooMany.reason).toBe('too-large');
  });

  it('still accepts a large but plausible history', () => {
    // The guard must not reject a genuinely committed learner.
    const realistic = parseBackup(
      validBackup({
        progress: {
          questions: {},
          attempts: new Array(5000).fill({ questionId: 'q', correct: true }),
          mockTests: [],
          streak: {},
        },
      }),
    );
    expect(realistic.ok, 'a heavy but real backup must restore').toBe(true);
  });
});

describe('display name', () => {
  it('keeps ordinary names untouched', () => {
    for (const name of ['Simon', "Siobhán O'Brien", 'Jean-Luc', '李雷', 'Ana María']) {
      expect(normaliseDisplayName(name), name).toBe(name);
    }
  });

  it('caps length', () => {
    const long = 'a'.repeat(500);
    expect(normaliseDisplayName(long)!.length).toBe(MAX_DISPLAY_NAME);
  });

  it('strips control characters', () => {
    expect(normaliseDisplayName('Sim\u0000on')).toBe('Simon');
    expect(normaliseDisplayName('Sim\u001Bon')).toBe('Simon');
  });

  it('strips bidirectional overrides', () => {
    /*
     * U+202E reverses the rendering direction of everything after it, so a name
     * containing one can visually rearrange the interface around it. Nothing to
     * do with escaping — React renders it as text either way — but it is not a
     * name, and it does not belong in one.
     */
    const attack = 'Sim\u202Eon';
    expect(normaliseDisplayName(attack)).toBe('Simon');
    expect(normaliseDisplayName(attack)).not.toContain('\u202E');
  });

  it('treats a name that is only control characters as no name at all', () => {
    expect(normaliseDisplayName('\u0000\u202E\u200E')).toBeNull();
  });

  it('rejects a non-string stored name rather than coercing it', () => {
    expect(normaliseProfile({ displayName: 42 })).toBeUndefined();
    expect(normaliseProfile({ displayName: { toString: () => 'x' } })).toBeUndefined();
    expect(normaliseProfile(null)).toBeUndefined();
  });

  it('carries markup through as literal text, for React to escape', () => {
    // Kept short enough to survive the length cap, so this tests escaping
    // rather than truncation.
    const payload = '<img src=x>';
    expect(normaliseDisplayName(payload)).toBe(payload);
  });
});

describe('external URL schemes', () => {
  it('allows the official source links the app actually uses', () => {
    for (const url of [
      'https://novascotia.ca/just/regulations/regs/mvtrafficsigns.htm',
      'https://www.nslegislature.ca/legc/statutes/motor%20vehicle.pdf',
      'http://example.org/legacy',
    ]) {
      expect(isSafeExternalUrl(url), url).toBe(true);
    }
  });

  it('refuses schemes that execute or embed', () => {
    /*
     * React escapes text, but it does not stop `href="javascript:…"` from
     * running when clicked. Source URLs come from repository data, which is
     * reviewed — but "reviewed data cannot be wrong" is an assumption, and this
     * is the one attribute where being wrong executes code.
     */
    for (const url of [
      'javascript:alert(1)',
      'JavaScript:alert(1)',
      '  javascript:alert(1)',
      'java\tscript:alert(1)',
      'java\nscript:alert(1)',
      'data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==',
      'vbscript:msgbox(1)',
      'file:///etc/passwd',
      'blob:https://evil.example.com/x',
    ]) {
      expect(isSafeExternalUrl(url), url).toBe(false);
      expect(safeExternalHref(url), url).toBeUndefined();
    }
  });

  it('fails closed on nothing, empty and rubbish', () => {
    for (const url of [undefined, null, '', '   ', 'not a url', '://missing-scheme']) {
      expect(safeExternalHref(url), String(url)).toBeUndefined();
    }
  });

  it('leaves in-app destinations alone', () => {
    // Hash routes and relative paths cannot introduce a scheme, and must not be
    // stripped — they are how the app navigates itself.
    expect(safeExternalHref('#/learn')).toBe('#/learn');
    expect(safeExternalHref('/signs/ns-official/RA-1.png')).toBe('/signs/ns-official/RA-1.png');
    expect(safeExternalHref('./favicon.svg')).toBe('./favicon.svg');
  });
});

describe('every source URL shipped with the app is safe to render', () => {
  it('uses only https for official sources', async () => {
    // The data these links come from is repository-controlled; this is what
    // notices if that ever stops being true.
    const manifest = (await import('../data/sources/source-manifest.json')).default as {
      sources: { id: string; url?: string; documentUrl?: string }[];
    };
    for (const source of manifest.sources) {
      for (const url of [source.url, source.documentUrl].filter(Boolean) as string[]) {
        expect(isSafeExternalUrl(url), `${source.id}: ${url}`).toBe(true);
        expect(url.startsWith('https://'), `${source.id} should be https`).toBe(true);
      }
    }
  });
});
