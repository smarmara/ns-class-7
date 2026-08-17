import { Link } from 'react-router-dom';
import { SIGN_CATEGORY_LABELS, getSignMeta, signsByCategory } from '@/content';
import { SignArt } from '@/signs/SignArt';
import { Card, Disclaimer, PageHead } from '@/ui/components';

/**
 * A plain reference view of every sign in the bank.
 *
 * Useful for study, and it doubles as a visual check that no artwork has gone
 * missing from the registry.
 */
export function SignGallery() {
  const byCategory = signsByCategory();

  return (
    <>
      <PageHead title="Sign gallery">
        Every sign used in this app, with what it means
      </PageHead>

      <p className="small muted">
        <Link to="/signs">← Back to sign drills</Link>
      </p>

      {[...byCategory.entries()].map(([category, ids]) => (
        <Card key={category} className="section-gap" title={SIGN_CATEGORY_LABELS[category] ?? category}>
          <div className="sign-gallery">
            {ids.map((id) => {
              const meta = getSignMeta(id);
              return (
                <figure key={id}>
                  <SignArt signId={id} size={84} />
                  <figcaption>{meta?.label ?? id}</figcaption>
                </figure>
              );
            })}
          </div>
        </Card>
      ))}

      <div className="section-gap">
        <p className="tiny faint">
          The sign artwork in this app is original SVG drawn from the shapes, colours and legends
          described in the Nova Scotia Traffic Signs Regulations and the Driver's Handbook. It is
          not reproduced from Crown illustrations.
        </p>
      </div>

      <Disclaimer />
    </>
  );
}
