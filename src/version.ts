/**
 * Release identity, injected at build time by vite.config.ts.
 *
 * App version comes from package.json. Content version is a digest of the
 * question bank, so it changes only when the served questions change. Both
 * are surfaced on the Sources page for troubleshooting and provenance.
 */
declare const __APP_VERSION__: string;
declare const __CONTENT_VERSION__: string;

export const appVersion: string = __APP_VERSION__;
export const contentVersion: string = __CONTENT_VERSION__;