import { useEffect, useState } from 'react';
import { usePwa } from '@/pwa';
import { useMockExam } from '@/store/useMockExam';
import { Banner } from '@/ui/components';

/**
 * Lightweight release/offline notices.
 *
 * The update banner is deliberately shown only when no mock test is running:
 * with 'prompt' mode the new version simply waits, so a learner mid-test is
 * never interrupted. It reappears as soon as they reach a safe moment.
 */
export function UpdateNotices() {
  const updateAvailable = usePwa((s) => s.updateAvailable);
  const offlineReady = usePwa((s) => s.offlineReady);
  const applyUpdate = usePwa((s) => s.applyUpdate);
  const midExam = useMockExam((s) => Boolean(s.session && s.session.status !== 'complete'));
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!offlineReady || dismissed) return;
    const timer = window.setTimeout(() => setDismissed(true), 10_000);
    return () => window.clearTimeout(timer);
  }, [offlineReady, dismissed]);

  if (updateAvailable && !midExam) {
    return (
      <div className="update-banner">
        <span>A new study-content version is available.</span>
        <button type="button" className="btn btn-secondary" onClick={applyUpdate}>
          Refresh to update
        </button>
      </div>
    );
  }

  if (offlineReady && !dismissed) {
    return (
      <Banner tone="info" icon="📴">
        <p>This app now works without an internet connection.</p>
      </Banner>
    );
  }

  return null;
}