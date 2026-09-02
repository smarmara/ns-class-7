/**
 * Scheme validation for links the app renders from data.
 *
 * Every external link in the app — the Sources page, the citation under a
 * question explanation — takes its address from `data/sources/source-manifest.json`
 * rather than from anything a learner types. That data is reviewed, and today
 * every entry is `https://novascotia.ca` or `https://nslegislature.ca`.
 *
 * This exists anyway, because "the data is trusted" is an assumption with a
 * failure mode: a bad merge, a compromised contributor account, or an automated
 * source update that writes a URL nobody read. React escapes text, but it does
 * not stop `href="javascript:…"` from executing when clicked — the escaping
 * that protects the rest of the app does not cover this one attribute.
 *
 * So the check lives in one place, is applied at render, and fails closed: an
 * address that is not plain http(s) yields no link at all rather than a link
 * that does something else.
 */

/** Schemes a link in this app may ever use. Anything else is not a document. */
const SAFE_SCHEMES = new Set(['http:', 'https:']);

/**
 * Returns the URL if it is safe to put in an `href`, otherwise `undefined`.
 *
 * Parsing with `URL` rather than string-matching on purpose: `javascript:` can
 * be written as `java\tscript:`, ` javascript:`, `JaVaScRiPt:` or with embedded
 * newlines, and a browser will still run it. The URL parser normalises all of
 * that to a protocol, which is the thing worth checking.
 *
 * Relative URLs resolve against the current document and so cannot introduce a
 * new scheme; they are returned unchanged.
 */
export function safeExternalHref(url: string | undefined | null): string | undefined {
  if (!url) return undefined;
  const trimmed = url.trim();
  if (!trimmed) return undefined;

  // In-app destinations: hash routes, absolute and relative paths.
  if (trimmed.startsWith('#') || trimmed.startsWith('/') || trimmed.startsWith('.')) {
    return trimmed;
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    // Not a resolvable absolute URL and not a recognised relative form.
    return undefined;
  }
  return SAFE_SCHEMES.has(parsed.protocol) ? parsed.href : undefined;
}

/** True when a URL is safe to render as an external link. */
export function isSafeExternalUrl(url: string | undefined | null): boolean {
  return safeExternalHref(url) !== undefined;
}
