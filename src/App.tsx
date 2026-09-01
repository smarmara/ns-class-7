import { lazy, Suspense, useEffect } from 'react';
import { NavLink, Navigate, Route, Routes } from 'react-router-dom';
import { initPwa } from '@/pwa';
import { initNativeShell } from '@/native';
import { useProgress } from '@/store/useProgress';
import { useEngagement } from '@/store/useEngagement';
import { bindLearnerSources, loadPersistedState } from '@/store/learnerStorage';
import { useProfile } from '@/store/useProfile';
import { applyAppearance, useAppearance } from '@/store/useAppearance';
import { emptyProgress } from '@/engine/learning/types';
import { emptyEngagement } from '@/engine/engagement/types';
import { contentVersion } from '@/version';
import { Dashboard } from '@/routes/Dashboard';
import { NotFound } from '@/routes/NotFound';
import { ErrorBoundary } from '@/ui/ErrorBoundary';
import { UpdateNotices } from '@/ui/UpdateNotices';
import { HomeIcon, LearnIcon, PracticeIcon, ProfileIcon, SignsIcon } from '@/ui/icons';

const PracticeExam = lazy(() =>
  import('@/routes/PracticeExam').then((m) => ({ default: m.PracticeExam })),
);
const QuickPractice = lazy(() =>
  import('@/routes/QuickPractice').then((m) => ({ default: m.QuickPractice })),
);
const Learn = lazy(() => import('@/routes/Learn').then((m) => ({ default: m.Learn })));
const TopicQuiz = lazy(() => import('@/routes/TopicQuiz').then((m) => ({ default: m.TopicQuiz })));
const Signs = lazy(() => import('@/routes/Signs').then((m) => ({ default: m.Signs })));
const SignsDrill = lazy(() =>
  import('@/routes/SignsDrill').then((m) => ({ default: m.SignsDrill })),
);
const SignCategoryQuiz = lazy(() =>
  import('@/routes/SignsDrill').then((m) => ({ default: m.SignCategoryQuiz })),
);
const SignMatch = lazy(() => import('@/routes/SignMatch').then((m) => ({ default: m.SignMatch })));
const SignGallery = lazy(() =>
  import('@/routes/SignGallery').then((m) => ({ default: m.SignGallery })),
);
const Review = lazy(() => import('@/routes/Review').then((m) => ({ default: m.Review })));
const Mistakes = lazy(() =>
  import('@/routes/ReviewQueues').then((m) => ({ default: m.Mistakes })),
);
const Saved = lazy(() => import('@/routes/ReviewQueues').then((m) => ({ default: m.Saved })));
const WeakAreas = lazy(() =>
  import('@/routes/ReviewQueues').then((m) => ({ default: m.WeakAreas })),
);
const Sources = lazy(() => import('@/routes/Sources').then((m) => ({ default: m.Sources })));
const Progress = lazy(() => import('@/routes/Progress').then((m) => ({ default: m.Progress })));
const Achievements = lazy(() => import('@/routes/Achievements').then((m) => ({ default: m.Achievements })));
/*
 * Developer-only. The route is already gated by `import.meta.env.DEV`, but the
 * lazy import alone is enough to make Rollup emit the chunk into a production
 * build, where it is dead weight the learner downloads and can never reach.
 * Resolving to an empty component in production drops it from the bundle.
 */
const AchievementShowroom = import.meta.env.DEV
  ? lazy(() =>
      import('@/routes/AchievementShowroom').then((m) => ({ default: m.AchievementShowroom })),
    )
  : (() => null);

/**
 * Primary destinations. Five is the practical ceiling for a bottom bar at
 * 320px, so Review moved to a secondary destination reached from Progress —
 * Signs keeps a tab because half the official test is signs.
 *
 * The Practice tab is the practice exam: the full two-part timed simulation.
 * It is the everyday "when you are ready" destination reached from Home, Learn
 * and Progress, and it doubles as the exam itself — no separate Mock route is
 * surfaced in the primary nav.
 */
const NAV = [
  { to: '/', label: 'Home', icon: HomeIcon, end: true },
  { to: '/learn', label: 'Learn', icon: LearnIcon, end: false },
  { to: '/practice', label: 'Practice', icon: PracticeIcon, end: false },
  { to: '/signs', label: 'Signs', icon: SignsIcon, end: false },
  { to: '/profile', label: 'Profile', icon: ProfileIcon, end: false },
];

export function App() {
  const hydrated = useProgress((s) => s.hydrated);
  const engagementHydrated = useEngagement((s) => s.hydrated);

  // Single bootstrap: bind the two stores to the learner-storage layer, load
  // persisted state (migrating legacy keys if needed) and install it into both
  // stores. Both stores hydrate together so the Dashboard never flashes zeros
  // before saved progress arrives.
  // Reflect the stored appearance before anything paints. Automatic writes no
  // attribute, leaving prefers-color-scheme in charge.
  useEffect(() => {
    applyAppearance(useAppearance.getState().appearance);
  }, []);

  useEffect(() => {
    bindLearnerSources({
      getProgress: () => useProgress.getState().progress,
      getEngagement: () => useEngagement.getState().engagement,
      getProfile: () => useProfile.getState().profile,
      contentVersion,
    });
    void loadPersistedState().then(({ state }) => {
      useProgress.getState().install(state?.progress ?? emptyProgress());
      useEngagement.getState().install(state?.engagement ?? emptyEngagement());
      useProfile.getState().install(state?.profile);
    });
  }, []);

  useEffect(() => {
    initPwa();
  }, []);

  // Native shell: status bar, Android Back, external links, splash dismissal.
  // A no-op on the web, so the browser build is untouched.
  useEffect(() => initNativeShell(), []);

  return (
    <div className="app">
      <a className="skip-link" href="#main">
        Skip to main content
      </a>

      <nav className="nav" aria-label="Primary">
        {NAV.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end}>
            <span className="nav-icon" aria-hidden="true">
              <item.icon />
            </span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <UpdateNotices />

      <main className="main" id="main">
        {!hydrated || !engagementHydrated ? (
          <p className="muted" role="status">
            Loading your progress…
          </p>
        ) : (
          <ErrorBoundary>
            <Suspense
              fallback={
                <p className="muted" role="status">
                  Loading…
                </p>
              }
            >
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/practice" element={<PracticeExam />} />
                <Route path="/practice/quick" element={<QuickPractice />} />
                <Route path="/mock" element={<Navigate to="/practice" replace />} />
                <Route path="/learn" element={<Learn />} />
                <Route path="/study" element={<Navigate to="/learn" replace />} />
                <Route path="/study/:topic" element={<TopicQuiz />} />
                <Route path="/study/signs/:category" element={<SignCategoryQuiz />} />
                <Route path="/signs" element={<Signs />} />
                <Route path="/signs/gallery" element={<SignGallery />} />
                <Route path="/signs/match" element={<SignMatch />} />
                <Route path="/signs/:category" element={<SignsDrill />} />
                <Route path="/profile" element={<Progress />} />
                <Route path="/profile/achievements" element={<Achievements />} />
                {import.meta.env.DEV && <Route path="/dev/achievements" element={<AchievementShowroom />} />}
                {/* Old bookmarks and deep links keep working. */}
                <Route path="/progress" element={<Navigate to="/profile" replace />} />
                <Route path="/review" element={<Review />} />
                <Route path="/review/mistakes" element={<Mistakes />} />
                <Route path="/review/saved" element={<Saved />} />
                <Route path="/review/weak" element={<WeakAreas />} />
                <Route path="/sources" element={<Sources />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        )}
      </main>
    </div>
  );
}
