import { Link, useSearchParams } from 'react-router-dom';
import {
  LEARNER_CATEGORY_BLURBS,
  LEARNER_CATEGORY_LABELS,
  getLearnerSignCatalogue,
  learnerCategories,
  learnerCatalogueCounts,
  learnerSignsByCategory,
} from '@/content';
import { variantsFor } from '@/content/sign-variants';
import { SignArt } from '@/signs/SignArt';
import { Card, Disclaimer, PageHead } from '@/ui/components';

/**
 * The learner sign catalogue — every Core and Reference sign a Class 7
 * learner should be able to study, grouped by learner category.
 *
 * Two separate pieces of data drive this screen, and neither is inferred here:
 * `learner-scope.json` decides which signs a learner sees at all, and
 * `learner-categories.json` decides which section each one appears in. The
 * component only lays them out.
 *
 * A `?category=` search parameter narrows the page to one category. It is the
 * single category-selection mechanism in the app: the chips at the top set it,
 * and the Signs hub links straight into it, so there is no second filter state
 * that could disagree with this one. Because it lives in the URL, the browser
 * Back button returns to wherever the learner came from.
 */
export function SignGallery() {
  const [params] = useSearchParams();
  const byCategory = learnerSignsByCategory();
  const categories = learnerCategories();
  const counts = learnerCatalogueCounts();
  const catalogue = getLearnerSignCatalogue();
  const assessed = catalogue.filter((entry) => entry.inQuiz).length;

  const requested = params.get('category');
  const selected = requested && categories.includes(requested) ? requested : null;
  const shown = selected ? [selected] : categories;

  return (
    <>
      <PageHead title="Sign catalogue">
        {counts.total} signs to study — {counts.core} assessed in practice, {counts.reference}{' '}
        reference
      </PageHead>

      <p className="small muted">
        <Link to="/signs">← Back to sign drills</Link>
      </p>

      <nav className="sign-jump" aria-label="Sign categories">
        <Link
          to="/signs/gallery"
          className="sign-jump-chip"
          aria-current={selected ? undefined : 'true'}
          data-selected={selected ? undefined : 'true'}
        >
          All
          <span className="sign-jump-count">{counts.total}</span>
        </Link>
        {categories.map((category) => (
          <Link
            key={category}
            to={`/signs/gallery?category=${category}`}
            className="sign-jump-chip"
            aria-current={selected === category ? 'true' : undefined}
            data-selected={selected === category ? 'true' : undefined}
          >
            {LEARNER_CATEGORY_LABELS[category]}
            <span className="sign-jump-count">{byCategory.get(category)!.length}</span>
          </Link>
        ))}
      </nav>

      {shown.map((category) => {
        const entries = byCategory.get(category)!;
        return (
          <Card
            key={category}
            id={`signs-${category}`}
            className="section-gap"
            title={`${LEARNER_CATEGORY_LABELS[category]} (${entries.length})`}
          >
            <p className="tiny faint sign-category-blurb">{LEARNER_CATEGORY_BLURBS[category]}</p>
            <ul className="sign-gallery">
              {entries.map((entry) => (
                <li key={entry.id}>
                  <figure>
                    <span className="sign-card-art">
                      <SignArt signId={entry.id} size={76} label={entry.displayName} lazy />
                    </span>
                    <figcaption>
                      <span className="sign-card-name">{entry.displayName}</span>
                      {entry.scope === 'reference' && (
                        <span className="sign-gallery-badge">Reference</span>
                      )}
                    </figcaption>
                  </figure>
                  <RelatedSigns signId={entry.id} />
                </li>
              ))}
            </ul>
          </Card>
        );
      })}

      <div className="section-gap">
        <p className="tiny faint">
          Where a sign has been matched to its official Nova Scotia Schedule image, the app shows
          that government crop exactly as it appears. Other signs use original SVG drawn from the
          shapes, colours and legends described in the Traffic Signs Regulations and the Driver's
          Handbook, not reproduced from Crown illustrations.
        </p>
        <p className="tiny faint">
          {assessed} of {counts.total} signs are assessed in practice questions. Signs marked
          Reference are study material you may still meet on the road — they simply do not affect
          your completion or mastery status.
        </p>
      </div>

      <Disclaimer />
    </>
  );
}

/**
 * Supplementary tab plates that mount below a catalogue sign.
 *
 * These are the Phase 6A Variant visuals. They are approved artwork and worth
 * seeing, but they are not independent learner concepts — "All Way" means
 * nothing without the Stop sign above it — so they live inside their parent's
 * card rather than as cards of their own. The catalogue's headline count stays
 * at the 155 top-level concepts.
 *
 * Rendered as a native <details> so it costs nothing when closed, works with a
 * keyboard, and needs no state.
 */
function RelatedSigns({ signId }: { signId: string }) {
  const variants = variantsFor(signId);
  if (variants.length === 0) return null;

  return (
    <details className="sign-variants">
      <summary>
        Related signs<span className="sign-variants-count">{variants.length}</span>
      </summary>
      <ul>
        {variants.map((variant) => (
          <li key={variant.id}>
            <span className="sign-variant-art">
              <SignArt signId={variant.id} size={40} label={variant.displayName} />
            </span>
            <span className="sign-variant-name">{variant.displayName}</span>
          </li>
        ))}
      </ul>
    </details>
  );
}
