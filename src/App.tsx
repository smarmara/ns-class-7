import { lazy, Suspense, useEffect } from 'react';
import { NavLink, Route, Routes } from 'react-router-dom';
import { initPwa } from '@/pwa';
import { useProgress } from '@/store/useProgress';
import { Dashboard } from '@/routes/Dashboard';
import { NotFound } from '@/routes/NotFound';
import { ErrorBoundary } from '@/ui/ErrorBoundary';
import { UpdateNotices } from '@/ui/UpdateNotices';

const QuickPractice = lazy(() =>
  import('@/routes/QuickPractice').then((m) => ({ default: m.QuickPractice })),
);
const Topics = lazy(() => import('@/routes/Topics').then((m) => ({ default: m.Topics })));
const TopicQuiz = lazy(() => import('@/routes/TopicQuiz').then((m) => ({ default: m.TopicQuiz })));
const Signs = lazy(() => import('@/routes/Signs').then((m) => ({ default: m.Signs })));
const SignsDrill = lazy(() =>
  import('@/routes/SignsDrill').then((m) => ({ default: m.SignsDrill })),
);
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
const MockTest = lazy(() => import('@/routes/MockTest').then((m) => ({ default: m.MockTest })));
const Sources = lazy(() => import('@/routes/Sources').then((m) => ({ default: m.Sources })));

const NAV = [
  { to: '/', label: 'Home', icon: '🏠', end: true },
  { to: '/practice', label: 'Practice', icon: '⚡', end: false },
  { to: '/study', label: 'Topics', icon: '📚', end: false },
  { to: '/signs', label: 'Signs', icon: '🛑', end: false },
  { to: '/mock', label: 'Mock test', icon: '📝', end: false },
  { to: '/review', label: 'Review', icon: '🔁', end: false },
];

export function App() {
  const hydrate = useProgress((s) => s.hydrate);
  const hydrated = useProgress((s) => s.hydrated);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    initPwa();
  }, []);

  return (
    <div className="app">
      <a className="skip-link" href="#main">
        Skip to main content
      </a>

      <nav className="nav" aria-label="Primary">
        {NAV.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end}>
            <span className="nav-icon" aria-hidden="true">
              {item.icon}
            </span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <UpdateNotices />

      <main className="main" id="main">
        {!hydrated ? (
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
                <Route path="/practice" element={<QuickPractice />} />
                <Route path="/study" element={<Topics />} />
                <Route path="/study/:topic" element={<TopicQuiz />} />
                <Route path="/signs" element={<Signs />} />
                <Route path="/signs/gallery" element={<SignGallery />} />
                <Route path="/signs/:category" element={<SignsDrill />} />
                <Route path="/mock" element={<MockTest />} />
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
