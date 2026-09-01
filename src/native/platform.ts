import { Capacitor } from '@capacitor/core';

/**
 * The one place that answers "are we inside a native shell?".
 *
 * Everything else in the app asks these helpers instead of calling
 * `Capacitor.isNativePlatform()` directly, so the native/web split stays
 * countable and testable rather than sprinkled through components.
 *
 * Detection comes from Capacitor itself, never from user-agent sniffing: the
 * WebView on Android reports a Chrome user agent and on iOS a Safari one, so
 * sniffing would be wrong in exactly the cases that matter.
 */

export type AppPlatform = 'android' | 'ios' | 'web';

/** Running inside an Android or iOS Capacitor container. */
export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform();
}

/** Running in a browser — including an installed PWA, which is still the web. */
export function isWebApp(): boolean {
  return !isNativeApp();
}

export function appPlatform(): AppPlatform {
  const platform = Capacitor.getPlatform();
  return platform === 'android' || platform === 'ios' ? platform : 'web';
}

export function isAndroid(): boolean {
  return appPlatform() === 'android';
}

export function isIos(): boolean {
  return appPlatform() === 'ios';
}

/**
 * Whether the browser service worker should be registered.
 *
 * Native builds carry their web assets inside the binary, so a service worker
 * there would cache a copy of files that are already local, and its update
 * lifecycle would be meaningless — a native app updates through the store, not
 * by activating a waiting worker. Registering one would also give the learner
 * a "refresh to update" prompt that cannot do anything useful.
 */
export function shouldRegisterServiceWorker(): boolean {
  return isWebApp();
}

/**
 * Whether web-install and update affordances may be shown.
 *
 * Covers the PWA update banner, the offline-ready notice and any future
 * "add to home screen" prompt: all of them are browser concepts that would be
 * nonsense inside an installed native app.
 */
export function shouldShowWebInstallUi(): boolean {
  return isWebApp();
}
