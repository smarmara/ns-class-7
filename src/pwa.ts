/// <reference types="vite-plugin-pwa/client" />
import { create } from 'zustand';
import { registerSW } from 'virtual:pwa-register';
import { shouldRegisterServiceWorker } from '@/native/platform';

/**
 * Service-worker lifecycle wiring.
 *
 * The worker is registered here (not in the HTML) so the app can react to
 * two events that matter to a learner:
 *
 *  - `onNeedRefresh` — a newer version of the app/content is installed and
 *    waiting. With `registerType: 'prompt'` the new worker stays dormant
 *    until the learner chooses to refresh, so it can never interrupt an
 *    in-progress mock test. The app surfaces a "refresh to update" banner
 *    and defers showing it while a test is running.
 *  - `onOfflineReady` — the first install has cached everything needed to
 *    work offline; shown once as a small notice.
 *
 * None of this applies inside a native build. There the web assets are already
 * inside the binary, so a worker would cache a second copy of local files, and
 * its "a new version is waiting" lifecycle would be a promise the app cannot
 * keep — native updates arrive through the App Store and Play Store. So the
 * worker is simply not registered on native, and `updateAvailable` stays false,
 * which keeps the update banner off screen as well.
 */

interface PwaState {
  /** A newer app/content version is installed and waiting to be activated. */
  updateAvailable: boolean;
  /** The app is fully cached and can run without a connection. */
  offlineReady: boolean;
  /** Activate the waiting worker and reload onto the new version. */
  applyUpdate: () => void;
}

let apply: ((reloadPage?: boolean) => Promise<void>) | undefined;
let started = false;

export const usePwa = create<PwaState>(() => ({
  updateAvailable: false,
  offlineReady: false,
  applyUpdate: () => {
    void apply?.(true);
  },
}));

/** Register the worker and wire the update lifecycle exactly once. */
export function initPwa(): void {
  if (started) return;
  if (!shouldRegisterServiceWorker()) return;
  started = true;
  apply = registerSW({
    immediate: true,
    onNeedRefresh() {
      usePwa.setState({ updateAvailable: true });
    },
    onOfflineReady() {
      usePwa.setState({ offlineReady: true });
    },
  });
}