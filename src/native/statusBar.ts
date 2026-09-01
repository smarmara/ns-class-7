import type { Appearance } from '@/store/useAppearance';
import { isAndroid, isNativeApp } from './platform';

/**
 * Native status-bar treatment.
 *
 * The status bar sits directly above the app's own surface, so it has to agree
 * with the resolved appearance or the top of the screen looks broken: dark text
 * on a dark bar, or a stripe of the wrong colour above the header.
 */

/** What the status bar should look like for a given resolved theme. */
export interface StatusBarLook {
  /**
   * Capacitor's `Style`. Confusingly, `Style.Dark` means *dark content* — i.e.
   * what you want on a LIGHT background. The names below say what they mean.
   */
  content: 'dark-content' | 'light-content';
  /** Android tints the bar itself; iOS draws it over the app surface. */
  backgroundColor: string;
}

/**
 * App surface colours, matching `--surface` at the top of the page in
 * src/styles.css. Deliberately the app's own surface rather than a platform
 * accent, so the bar reads as part of the app.
 */
export const STATUS_BAR_LOOK: Record<'light' | 'dark', StatusBarLook> = {
  light: { content: 'dark-content', backgroundColor: '#ffffff' },
  dark: { content: 'light-content', backgroundColor: '#191d23' },
};

/**
 * Resolve Automatic against the device colour scheme.
 *
 * Automatic deliberately reads `prefers-color-scheme` — the same signal the
 * stylesheet uses — so the bar and the page can never disagree. Both Android
 * and iOS WebViews report the system setting through that media query, so no
 * second source of truth (and no second user-facing setting) is needed.
 */
export function resolveScheme(
  appearance: Appearance,
  prefersDark: boolean,
): 'light' | 'dark' {
  if (appearance === 'light') return 'light';
  if (appearance === 'dark') return 'dark';
  return prefersDark ? 'dark' : 'light';
}

export function statusBarLookFor(
  appearance: Appearance,
  prefersDark: boolean,
): StatusBarLook {
  return STATUS_BAR_LOOK[resolveScheme(appearance, prefersDark)];
}

function prefersDarkNow(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );
}

/** Push the look for the current appearance to the native status bar. */
export async function applyStatusBar(appearance: Appearance): Promise<void> {
  if (!isNativeApp()) return;
  const look = statusBarLookFor(appearance, prefersDarkNow());
  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    await StatusBar.setStyle({
      style: look.content === 'dark-content' ? Style.Light : Style.Dark,
    });
    // setBackgroundColor is Android-only; iOS shows the app surface through.
    if (isAndroid()) {
      await StatusBar.setBackgroundColor({ color: look.backgroundColor });
    }
  } catch {
    // A status bar that will not tint is cosmetic. Never let it break start-up.
  }
}

/**
 * Keep the bar in step with the system while Automatic is selected.
 *
 * Returns a cleanup function. Under an explicit Light/Dark choice the listener
 * still runs but resolves to the same value, so there is nothing to special-case.
 */
export function watchSystemScheme(onChange: () => void): () => void {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return () => {};
  }
  const query = window.matchMedia('(prefers-color-scheme: dark)');
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}
