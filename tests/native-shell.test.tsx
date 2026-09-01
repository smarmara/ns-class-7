import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

const isNativePlatform = vi.fn(() => false);
const getPlatform = vi.fn(() => 'web');

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: () => isNativePlatform(),
    getPlatform: () => getPlatform(),
  },
}));

const { decideBackAction, isRootRoute } = await import('@/native/backButton');
const { isExternalUrl } = await import('@/native/externalLinks');
const { STATUS_BAR_LOOK, resolveScheme, statusBarLookFor } = await import('@/native/statusBar');
const { usePwa } = await import('@/pwa');
const { useMockExam } = await import('@/store/useMockExam');
const { UpdateNotices } = await import('@/ui/UpdateNotices');

function pretend(platform: 'web' | 'android' | 'ios') {
  isNativePlatform.mockReturnValue(platform !== 'web');
  getPlatform.mockReturnValue(platform);
}

beforeEach(() => {
  pretend('web');
  usePwa.setState({ updateAvailable: false, offlineReady: false });
  useMockExam.setState({ session: null });
});
afterEach(cleanup);

describe('update notices on native', () => {
  it('shows the refresh banner on the web', () => {
    usePwa.setState({ updateAvailable: true });
    render(<UpdateNotices />);
    expect(screen.getByText(/new study-content version is available/i)).toBeVisible();
  });

  it('never shows the refresh banner in a native build', () => {
    // A native app updates through the store. "Refresh to update" would be a
    // button that cannot do the thing it offers.
    pretend('android');
    usePwa.setState({ updateAvailable: true });
    render(<UpdateNotices />);
    expect(screen.queryByText(/new study-content version is available/i)).toBeNull();
  });

  it('never shows the offline-ready notice in a native build', () => {
    // It was already offline when they installed it.
    pretend('ios');
    usePwa.setState({ offlineReady: true });
    render(<UpdateNotices />);
    expect(screen.queryByText(/works without an internet connection/i)).toBeNull();
  });

  it('still shows the offline-ready notice on the web', () => {
    usePwa.setState({ offlineReady: true });
    render(<UpdateNotices />);
    expect(screen.getByText(/works without an internet connection/i)).toBeVisible();
  });
});

describe('Android Back', () => {
  it('goes back through app history when there is history to use', () => {
    expect(decideBackAction(true, '#/learn')).toBe('history-back');
    expect(decideBackAction(true, '#/')).toBe('history-back');
  });

  it('exits from the root with nothing behind it, as Android expects', () => {
    expect(decideBackAction(false, '#/')).toBe('exit-app');
    expect(decideBackAction(false, '')).toBe('exit-app');
    expect(decideBackAction(false, '#')).toBe('exit-app');
  });

  it('goes Home rather than quitting when launched straight into a deep link', () => {
    // Cold launch into a nested route: quitting would throw the learner out of
    // an app they just opened.
    expect(decideBackAction(false, '#/study/signs/regulatory')).toBe('go-home');
    expect(decideBackAction(false, '#/profile/achievements')).toBe('go-home');
    expect(decideBackAction(false, '#/signs/match')).toBe('go-home');
  });

  it('recognises the root route in the forms a hash router produces', () => {
    expect(isRootRoute('#/')).toBe(true);
    expect(isRootRoute('#')).toBe(true);
    expect(isRootRoute('')).toBe(true);
    expect(isRootRoute('#/?from=home')).toBe(true);
    expect(isRootRoute('#/learn')).toBe(false);
    expect(isRootRoute('#/profile')).toBe(false);
  });
});

describe('external link routing', () => {
  it('treats official source links as external', () => {
    expect(isExternalUrl('https://novascotia.ca/sns/rmv/licence/handbook.asp')).toBe(true);
    expect(
      isExternalUrl(
        'https://nslegislature.ca/legislative-business/bills-statutes/consolidated-public-statutes/motor-vehicle-act',
      ),
    ).toBe(true);
  });

  it('never treats an in-app route as external', () => {
    // Sending a hash route to the system browser would drop the learner out of
    // the app to view a page the browser cannot render.
    expect(isExternalUrl('#/learn')).toBe(false);
    expect(isExternalUrl('#/study/signs/warning')).toBe(false);
    expect(isExternalUrl('/profile')).toBe(false);
    expect(isExternalUrl('./favicon.svg')).toBe(false);
    expect(isExternalUrl('')).toBe(false);
  });

  it('ignores non-http schemes', () => {
    expect(isExternalUrl('mailto:someone@example.com')).toBe(false);
    expect(isExternalUrl('tel:+19025551234')).toBe(false);
    expect(isExternalUrl('javascript:void(0)')).toBe(false);
  });
});

describe('status bar', () => {
  it('resolves an explicit choice regardless of the system scheme', () => {
    expect(resolveScheme('light', true)).toBe('light');
    expect(resolveScheme('dark', false)).toBe('dark');
  });

  it('follows the device under Automatic', () => {
    expect(resolveScheme('auto', true)).toBe('dark');
    expect(resolveScheme('auto', false)).toBe('light');
  });

  it('puts dark content on the light surface and light content on the dark one', () => {
    // Getting this backwards makes the clock invisible, which is the whole
    // reason the status bar has to track the theme.
    expect(statusBarLookFor('light', false).content).toBe('dark-content');
    expect(statusBarLookFor('dark', false).content).toBe('light-content');
    expect(statusBarLookFor('auto', true).content).toBe('light-content');
    expect(statusBarLookFor('auto', false).content).toBe('dark-content');
  });

  it('uses the app surface colour, not a platform accent', () => {
    expect(STATUS_BAR_LOOK.light.backgroundColor).toBe('#ffffff');
    expect(STATUS_BAR_LOOK.dark.backgroundColor).toBe('#191d23');
  });
});
