import { describe, expect, it } from 'vitest';
import { hashText, normaliseHtml } from '../scripts/sources-check';

describe('HTML normalisation for change detection', () => {
  it('strips markup down to the text a reader would see', () => {
    const html = `
      <html><body>
        <h1>School zone</h1>
        <p>The maximum speed is <strong>30&nbsp;km/h</strong>.</p>
      </body></html>`;
    const text = normaliseHtml(html);
    expect(text).toContain('School zone');
    expect(text).toContain('The maximum speed is 30 km/h .');
    expect(text).not.toContain('<');
  });

  it('ignores script and style changes — a CSS rebuild is not a change in the law', () => {
    const base = '<body><style>.a{color:red}</style><p>Yield to the bus.</p></body>';
    const restyled =
      '<body><style>.a{color:blue;font-size:2rem}</style><p>Yield to the bus.</p></body>';
    expect(hashText(normaliseHtml(base))).toBe(hashText(normaliseHtml(restyled)));
  });

  it('ignores analytics tags and comments', () => {
    const base = '<body><p>Stop.</p></body>';
    const tracked =
      '<body><!-- build 4821 --><script src="/analytics.js"></script><p>Stop.</p></body>';
    expect(hashText(normaliseHtml(base))).toBe(hashText(normaliseHtml(tracked)));
  });

  it('ignores whitespace and indentation churn', () => {
    const a = '<p>Yield   the   right of way.</p>';
    const b = '<p>\n   Yield the right of way.\n</p>';
    expect(hashText(normaliseHtml(a))).toBe(hashText(normaliseHtml(b)));
  });

  it('DOES detect a change to a substantive number', () => {
    const before = '<p>The maximum speed is 30 km/h.</p>';
    const after = '<p>The maximum speed is 40 km/h.</p>';
    expect(hashText(normaliseHtml(before))).not.toBe(hashText(normaliseHtml(after)));
  });

  it('DOES detect added or removed sentences', () => {
    const before = '<p>Stop for the bus.</p>';
    const after = '<p>Stop for the bus.</p><p>This does not apply to school buses.</p>';
    expect(hashText(normaliseHtml(before))).not.toBe(hashText(normaliseHtml(after)));
  });

  it('decodes the entities that government pages actually use', () => {
    const text = normaliseHtml('<p>&quot;Stop&quot; &amp; yield &lt;here&gt;</p>');
    expect(text).toContain('"Stop" & yield <here>');
  });

  it('keeps block boundaries so merged paragraphs are detected', () => {
    const separate = normaliseHtml('<p>Alpha</p><p>Bravo</p>');
    const merged = normaliseHtml('<p>Alpha Bravo</p>');
    expect(separate).not.toBe(merged);
  });
});

describe('hashing', () => {
  it('is a stable sha256 hex digest', () => {
    const hash = hashText('nova scotia');
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hashText('nova scotia')).toBe(hash);
  });

  it('differs for different content', () => {
    expect(hashText('a')).not.toBe(hashText('b'));
  });
});
