import { isNativeApp } from './platform';
import { applyStatusBar, watchSystemScheme } from './statusBar';
import { initBackButton } from './backButton';
import { initExternalLinks } from './externalLinks';
import { useAppearance } from '@/store/useAppearance';

export * from './platform';
export * from './statusBar';
export * from './backButton';
export * from './externalLinks';
export * from './backup';

/**
 * Everything the native shell needs, wired once at start-up.
 *
 * On the web every branch below is a no-op, so this costs a single boolean
 * check and the app behaves exactly as it always has.
 */
export function initNativeShell(): () => void {
  if (!isNativeApp()) return () => {};

  const cleanups: (() => void)[] = [];

  // Status bar follows the resolved appearance, and keeps following it when
  // the learner changes the setting or the system flips light/dark under
  // Automatic.
  const paint = () => void applyStatusBar(useAppearance.getState().appearance);
  paint();
  cleanups.push(useAppearance.subscribe(paint));
  cleanups.push(watchSystemScheme(paint));

  cleanups.push(initExternalLinks());

  void initBackButton().then((cleanup) => cleanups.push(cleanup));

  // Hide the splash as soon as the app is actually up. Holding it longer would
  // be branding theatre at the cost of the learner's time.
  void hideSplash();

  return () => {
    for (const cleanup of cleanups) cleanup();
  };
}

async function hideSplash(): Promise<void> {
  try {
    const { SplashScreen } = await import('@capacitor/splash-screen');
    await SplashScreen.hide();
  } catch {
    // No splash plugin, or already hidden. Either way the app is running.
  }
}
