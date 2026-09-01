import { isNativeApp } from './platform';

/**
 * Opening links that leave the app.
 *
 * On the web an official source link is an ordinary `target="_blank"` anchor
 * and should stay one. Inside a native shell the same anchor would navigate the
 * app's own WebView to novascotia.ca — no address bar, no tabs, no reliable way
 * back, and the learner's study session replaced by a government PDF. So on
 * native the link is intercepted and handed to the system browser instead,
 * which gives them Done/Back and returns them exactly where they were.
 *
 * Internal hash routes are never treated as external: they must stay in-app.
 */

/** True for a URL that should leave the app when tapped on native. */
export function isExternalUrl(href: string): boolean {
  if (!href) return false;
  // In-app routes, same-page anchors and non-navigations.
  if (href.startsWith('#') || href.startsWith('/') || href.startsWith('.')) return false;
  return /^https?:\/\//i.test(href);
}

/**
 * Open an external URL the way the current platform should.
 *
 * Returns true when it handled the navigation, so a click handler knows
 * whether to call preventDefault.
 */
export async function openExternal(url: string): Promise<boolean> {
  if (!isNativeApp() || !isExternalUrl(url)) return false;
  try {
    const { Browser } = await import('@capacitor/browser');
    await Browser.open({ url });
    return true;
  } catch {
    // If the in-app browser is unavailable, let the anchor do whatever it
    // would have done rather than swallowing the learner's tap.
    return false;
  }
}

/**
 * Global click interceptor for external anchors.
 *
 * A listener beats editing every link site: source citations are rendered from
 * data in several places (question explanations, the Sources page, the manifest
 * listing), and a future one would otherwise be trapped in the WebView until
 * somebody remembered. Returns a cleanup function.
 */
export function initExternalLinks(): () => void {
  if (!isNativeApp()) return () => {};

  const onClick = (event: MouseEvent) => {
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    const anchor = (event.target as Element | null)?.closest?.('a');
    if (!anchor) return;

    const href = anchor.getAttribute('href') ?? '';
    if (!isExternalUrl(href)) return;

    event.preventDefault();
    void openExternal(href);
  };

  document.addEventListener('click', onClick);
  return () => document.removeEventListener('click', onClick);
}
