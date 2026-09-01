import type { CapacitorConfig } from '@capacitor/cli';
import identity from './app.identity.json';

/**
 * Capacitor shell configuration.
 *
 * The React/Vite app is the application; Capacitor is only the native
 * container around it. Nothing about the learning engine lives here.
 *
 * `webDir` is the Vite production output directory. Release builds package
 * those files INTO the binary — there is deliberately no `server.url`, because
 * a native build that fetched its own UI from a website would stop working the
 * moment the learner lost signal, and offline study is the whole point.
 * Live reload for development is opt-in via env vars below and is never
 * written into a release build.
 */

const liveReloadUrl = process.env.CAP_SERVER_URL;

const config: CapacitorConfig = {
  appId: identity.appId,
  appName: identity.appName,
  webDir: 'dist',

  // Anything that is not the bundled app should leave the WebView and open in
  // the system browser, so a learner tapping an official source link can never
  // end up stranded in chrome-less browsing with no way back.
  server: {
    androidScheme: 'https',
    ...(liveReloadUrl
      ? {
          // Development only. `pnpm native:live` sets CAP_SERVER_URL; a normal
          // `pnpm native:sync` leaves this undefined so it cannot leak into a
          // release build.
          url: liveReloadUrl,
          cleartext: liveReloadUrl.startsWith('http://'),
        }
      : {}),
  },

  android: {
    // Keep the shell strict: only the bundled app runs inside the WebView.
    allowMixedContent: false,
  },

  plugins: {
    SplashScreen: {
      // The web app paints almost immediately, so the splash exists to cover
      // WebView start-up, not to advertise. It is hidden from JS the moment
      // React has mounted (see src/native/nativeShell.ts) rather than being
      // held for a fixed, invented duration.
      launchAutoHide: false,
      launchShowDuration: 0,
      backgroundColor: identity.splashBackgroundColor.light,
      androidSplashResourceName: 'splash',
      showSpinner: false,
    },
    StatusBar: {
      // The app sets style and colour at runtime from the resolved appearance
      // (Automatic/Light/Dark); this is only the pre-JS starting point.
      overlaysWebView: false,
      backgroundColor: identity.themeColor,
      style: 'DARK',
    },
  },
};

export default config;
