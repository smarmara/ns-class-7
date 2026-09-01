import { Link } from 'react-router-dom';
import { SIGNS_TOPICS, activeQuestions, learnerCatalogueCounts } from '@/content';
import { isComplete, topicMastery } from '@/engine/learning/mastery';
import { signCategorySummaries } from '@/engine/learning/signCategories';
import { useProgress } from '@/store/useProgress';
import { SignArt } from '@/signs/SignArt';
import { Disclaimer } from '@/ui/components';
import { ChevronIcon } from '@/ui/icons';

/**
 * Thematic accent per learner category. This tints the *card surface* only —
 * the sign artwork itself is the Province's image and is never recoloured,
 * filtered or inverted, in either colour scheme.
 *
 * Deliberately restrained: five tones shared across ten categories, rather
 * than ten competing hues.
 */
const CATEGORY_TONE: Record<string, string> = {
  regulatory: 'regulatory',
  'lane-use': 'regulatory',
  'parking-stopping': 'regulatory',
  warning: 'warning',
  'pedestrian-cyclist-school': 'warning',
  railway: 'other',
  'work-zone': 'work-zone',
  guide: 'guide',
  'pavement-marking': 'other',
  shape: 'other',
};

/**
 * The Signs hub.
 *
 * The category grid describes the **study catalogue** first: how many signs a
 * learner can browse in each category, with assessment coverage as secondary
 * metadata. It used to describe the question bank instead, which meant the
 * largest category in the catalogue — Lane Use & Turns, 56 signs — advertised
 * itself as "3 questions".
 *
 * Category identity, order and counts all come from the canonical learner
 * taxonomy via `signCategorySummaries`, so this component holds no list of
 * category names that could drift from the catalogue.
 */
export function Signs() {
  const progress = useProgress((s) => s.progress);
  const summaries = signCategorySummaries(activeQuestions, progress);
  const catalogueCounts = learnerCatalogueCounts();

  const signQuestions = activeQuestions.filter((q) => q.type === 'sign');
  const seen = signQuestions.filter((q) => (progress.questions[q.id]?.seen ?? 0) > 0).length;

  // Practice progress is still measured against the question topics, which are
  // what mastery is actually built on. Named "practice topics" so it cannot be
  // read as a count of the catalogue categories below.
  const practiceTopics = SIGNS_TOPICS.filter((topic) =>
    activeQuestions.some((q) => q.topic === topic),
  );
  const topicsComplete = practiceTopics.filter((topic) =>
    isComplete(topicMastery(activeQuestions, progress, topic).stage),
  ).length;

  return (
    <>
      <header className="screen-head">
        <h1>Road signs</h1>
        <p>Learn them by sight, then know what to do about them.</p>
      </header>

      <div className="signs-summary">
        <span className="signs-summary-value">
          {seen} <span className="signs-summary-of">of {signQuestions.length}</span>
        </span>
        <span className="signs-summary-label">sign questions seen</span>
        <span className="signs-summary-sub">
          {topicsComplete} of {practiceTopics.length} practice topics complete
        </span>
      </div>

      <ul className="row-list signs-quick">
        <li>
          <Link className="row" to="/signs/all">
            <span className="row-body">
              <span className="row-title">All road signs</span>
              <span className="row-sub">Mixed drill across all {signQuestions.length} questions</span>
            </span>
            <ChevronIcon className="row-chevron" />
          </Link>
        </li>
        <li>
          <Link className="row" to="/signs/match">
            <span className="row-body">
              <span className="row-title">Sign Match</span>
              <span className="row-sub">Choose the sign that matches the name</span>
            </span>
            <ChevronIcon className="row-chevron" />
          </Link>
        </li>
        <li>
          <Link className="row" to="/signs/gallery">
            <span className="row-body">
              <span className="row-title">Sign catalogue</span>
              <span className="row-sub">
                Browse {catalogueCounts.total} signs — {catalogueCounts.core} assessed, {catalogueCounts.reference} reference
              </span>
            </span>
            <ChevronIcon className="row-chevron" />
          </Link>
        </li>
      </ul>

      <h2 className="section-title">Browse the catalogue</h2>
      <ul className="category-grid">
        {summaries.map((summary) => {
          const meta = `${summary.catalogueCount} sign${summary.catalogueCount === 1 ? '' : 's'} · ${summary.assessedCount} assessed`;
          const accuracy =
            summary.attempts >= 3 && summary.accuracy !== null
              ? `${Math.round(summary.accuracy * 100)}%`
              : null;

          return (
            <li key={summary.id}>
              <Link
                className="category"
                to={`/signs/gallery?category=${summary.id}`}
                data-tone={CATEGORY_TONE[summary.id] ?? 'other'}
                aria-label={`${summary.label}, ${meta}${accuracy ? `, ${accuracy} correct` : ''}`}
              >
                <span className="category-art">
                  {summary.representativeSignIds.map((signId) => (
                    <span className="sign-thumb" key={signId}>
                      <SignArt signId={signId} size={44} decorative />
                    </span>
                  ))}
                </span>
                <span className="category-body" aria-hidden="true">
                  <span className="category-name">{summary.label}</span>
                  <span className="category-meta">
                    {meta}
                    {accuracy && <> · {accuracy} correct</>}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      <p className="tiny faint section-gap">
        Sign counts are study concepts in the catalogue. &ldquo;Assessed&rdquo; counts the ones
        practice questions cover — reference signs are worth knowing but do not affect your
        completion or mastery.
      </p>

      <Disclaimer />
    </>
  );
}
