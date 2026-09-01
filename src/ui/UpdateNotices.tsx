import { useEffect, useState } from 'react';
import { usePwa } from '@/pwa';
import { useMockExam } from '@/store/useMockExam';
import { shouldShowWebInstallUi } from '@/native/platform';

/**
 * Lightweight release/offline notices, presented as a floating toast above the
 * bottom navigation.
 *
 * They float rather than sit in the document flow because Home and every
 * question screen are viewport-first: a transient notice that reflows the page
 * would push an otherwise-fitting question into scrolling, which is precisely
 * the failure this layout is built to avoid.
 *
 * The update notice is deliberately shown only when no practice exam is running:
 * with 'prompt' mode the new version simply waits, so a learner mid-test is
 * never interrupted. It reappears as soon as they reach a safe moment.
 *
 * Both notices are web-only. In a native build there is no service worker to
 * refresh onto and no browser cache to warm, so "refresh to update" would do
 * nothing and "this app now works offline" would be telling a learner something
 * that was already true when they installed it. The guard is belt-and-braces:
 * the worker is not registered on native either, so neither flag can be set.
 */
export function UpdateNotices() {
  const updateAvailable = usePwa((s) => s.updateAvailable);
  const offlineReady = usePwa((s) => s.offlineReady);
  const applyUpdate = usePwa((s) => s.applyUpdate);
  const midExam = useMockExam((s) => Boolean(s.session && s.session.status !== 'complete'));
  const [dismissed, setDismissed] = useState(false);
  const webInstallUi = shouldShowWebInstallUi();

  useEffect(() => {
    if (!offlineReady || dismissed) return;
    const timer = window.setTimeout(() => setDismissed(true), 10_000);
    return () => window.clearTimeout(timer);
  }, [offlineReady, dismissed]);

  if (!webInstallUi) return null;

  if (updateAvailable && !midExam) {
    return (
      <div className="toast" role="status">
        <span>A new study-content version is available.</span>
        <button type="button" className="toast-action" onClick={applyUpdate}>
          Refresh to update
        </button>
      </div>
    );
  }

  if (offlineReady && !dismissed) {
    return (
      <div className="toast" role="status">
        <span>This app now works without an internet connection.</span>
        <button
          type="button"
          className="toast-action"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss notice"
        >
          Dismiss
        </button>
      </div>
    );
  }

  return null;
}