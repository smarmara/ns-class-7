import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Native shell behaviour.
 *
 * These tests exercise the seams between the web app and the Capacitor
 * container: platform detection, and the pure decisions that hang off it.
 * They deliberately do not try to simulate an Android WebView — the plugin
 * calls themselves are thin wrappers, and the parts worth protecting are the
 * rules about WHEN the app does something native, not the plugin plumbing.
 */

const isNativePlatform = vi.fn(() => false);
const getPlatform = vi.fn(() => 'web');

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: () => isNativePlatform(),
    getPlatform: () => getPlatform(),
  },
}));

const {
  appPlatform,
  isAndroid,
  isIos,
  isNativeApp,
  isWebApp,
  shouldRegisterServiceWorker,
  shouldShowWebInstallUi,
} = await import('@/native/platform');

function pretend(platform: 'web' | 'android' | 'ios') {
  isNativePlatform.mockReturnValue(platform !== 'web');
  getPlatform.mockReturnValue(platform);
}

beforeEach(() => pretend('web'));

describe('platform detection', () => {
  it('reports the web when running in a browser', () => {
    expect(isNativeApp()).toBe(false);
    expect(isWebApp()).toBe(true);
    expect(appPlatform()).toBe('web');
    expect(isAndroid()).toBe(false);
    expect(isIos()).toBe(false);
  });

  it('reports Android inside the Android container', () => {
    pretend('android');
    expect(isNativeApp()).toBe(true);
    expect(isWebApp()).toBe(false);
    expect(appPlatform()).toBe('android');
    expect(isAndroid()).toBe(true);
    expect(isIos()).toBe(false);
  });

  it('reports iOS inside the iOS container', () => {
    pretend('ios');
    expect(isNativeApp()).toBe(true);
    expect(appPlatform()).toBe('ios');
    expect(isIos()).toBe(true);
    expect(isAndroid()).toBe(false);
  });

  it('asks Capacitor rather than sniffing the user agent', async () => {
    // Both native WebViews report a browser user agent, so any UA-based guess
    // would be wrong exactly where it matters.
    const source = await import('node:fs').then((fs) =>
      fs.readFileSync('src/native/platform.ts', 'utf8'),
    );
    expect(source).not.toMatch(/navigator\.userAgent/);
  });
});

describe('service worker registration', () => {
  it('registers on the web, where it is what makes the PWA work offline', () => {
    expect(shouldRegisterServiceWorker()).toBe(true);
  });

  it('does not register inside a native build', () => {
    // Native assets are already in the binary; a worker would cache a second
    // copy and offer an update lifecycle the app cannot honour.
    pretend('android');
    expect(shouldRegisterServiceWorker()).toBe(false);
    pretend('ios');
    expect(shouldRegisterServiceWorker()).toBe(false);
  });
});

describe('web install and update affordances', () => {
  it('are allowed on the web', () => {
    expect(shouldShowWebInstallUi()).toBe(true);
  });

  it('are suppressed on native, where refresh-to-update means nothing', () => {
    pretend('android');
    expect(shouldShowWebInstallUi()).toBe(false);
  });
});
