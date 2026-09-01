import { isAndroid, isNativeApp } from './platform';

/**
 * Android hardware/gesture Back.
 *
 * Android users expect Back to undo their last step and, at the start of the
 * app, to leave it. Anything else feels broken, so the rule is deliberately
 * boring:
 *
 *   1. if the WebView has history, go back one entry;
 *   2. if it does not but we are somewhere other than Home — a cold launch
 *      straight into a deep link — go to Home rather than quitting, so Back
 *      never throws the learner out of an app they only just opened;
 *   3. at Home with nothing to go back to, exit as Android expects.
 *
 * There is no modal or overlay layer to dismiss first: every screen in this app
 * is a route, and result screens (finished topic, award moment, Sign Match
 * result, practice-exam result) are component state inside the route that
 * produced them. They are not separate history entries, so Back leaves the
 * screen instead of re-entering a finished session — the stale-result problem
 * cannot arise.
 */

export type BackAction = 'history-back' | 'go-home' | 'exit-app';

/** Route paths treated as the app root for Back purposes. */
const ROOT_PATHS = new Set(['', '/', '#/', '#']);

export function isRootRoute(hash: string): boolean {
  const path = hash.replace(/^#/, '').split('?')[0] ?? '';
  return ROOT_PATHS.has(path) || path === '/';
}

/** Pure decision, so the rule can be tested without an Android WebView. */
export function decideBackAction(canGoBack: boolean, hash: string): BackAction {
  if (canGoBack) return 'history-back';
  return isRootRoute(hash) ? 'exit-app' : 'go-home';
}

/**
 * Wire the Android Back button. Returns a cleanup function.
 *
 * iOS has no hardware Back, and the browser's own Back already does the right
 * thing on the web, so this is Android-native only.
 */
export async function initBackButton(): Promise<() => void> {
  if (!isNativeApp() || !isAndroid()) return () => {};

  try {
    const { App } = await import('@capacitor/app');
    const handle = await App.addListener('backButton', ({ canGoBack }) => {
      switch (decideBackAction(canGoBack, window.location.hash)) {
        case 'history-back':
          window.history.back();
          break;
        case 'go-home':
          window.location.hash = '#/';
          break;
        case 'exit-app':
          void App.exitApp();
          break;
      }
    });
    return () => void handle.remove();
  } catch {
    // Without the listener Android falls back to its default Back, which
    // exits the app. Unhelpful, but not broken.
    return () => {};
  }
}
