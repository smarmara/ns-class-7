import type { ReactNode } from 'react';

/**
 * Concept SVG geometry for the six sign shapes taught in the Nova Scotia
 * Driver's Handbook. These are not official sign artwork — they are clean
 * geometric silhouettes used to teach that sign shape itself conveys meaning.
 *
 * Accessibility: during unanswered recognition questions the alt text
 * describes geometry only (e.g. "an eight-sided silhouette"), never the
 * meaning (e.g. "Stop"), so the shape-recognition question stays fair.
 *
 * ## Colour
 *
 * Because these are abstract diagrams rather than real signs, they take the
 * interface theme — unlike official artwork, which always keeps the Province's
 * real colours. The `fill` attributes below are the *default* identity: the
 * near-black the shapes were reviewed and approved in, and what any renderer
 * without the app's stylesheet draws (the QA gallery, the approval
 * fingerprint). In the app, `.sign-shape` in styles.css overrides them from
 * theme variables — CSS beats a presentation attribute — so dark mode gets a
 * pale shape instead of a near-black one that vanished into the page.
 *
 * That split is deliberate. The approved visual identity stays exactly as
 * reviewed, and theming lives in the one place the rest of the app's theming
 * lives. Putting `var(--…)` in these attributes instead would change the
 * rendered markup, and the markup is what the approval fingerprint hashes.
 */

interface SignShapeProps {
  /** Maximum rendered size of the shape box. */
  size?: number;
  /** When true the shape is decorative — hidden from assistive technology. */
  decorative?: boolean;
  className?: string;
  /**
   * Overrides the built-in geometric description.
   *
   * `SignArt` passes the sign's canonical `visualDescription` from sign-meta,
   * so the app has one source of truth for what a shape is called. The
   * built-in fallback below only applies when a shape renders outside that
   * path — the QA gallery, and the approval fingerprint, which must keep
   * rendering the exact markup that was reviewed.
   */
  ariaLabel?: string;
}

function ShapeSvg({
  size = 120,
  decorative = false,
  className,
  ariaLabel,
  children,
}: SignShapeProps & { ariaLabel: string; children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      className={className}
      role={decorative ? 'presentation' : 'img'}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : ariaLabel}
      focusable="false"
    >
      {!decorative && <title>{ariaLabel}</title>}
      {children}
    </svg>
  );
}

/**
 * The reviewed default. `.sign-shape` re-paints this from `--sign-shape-fill`
 * in the app; see the note at the top of this file before changing it, because
 * this literal is part of what `visual-approvals.json` fingerprints.
 */
const SHAPE_INK = '#16181d';

export const SIGN_SHAPES: Readonly<Record<string, (props: SignShapeProps) => ReactNode>> = {
  'shape-guide-sign': ({ size, decorative, className, ariaLabel }) => (
    <ShapeSvg
      size={size}
      decorative={decorative}
      className={className}
      ariaLabel={ariaLabel ?? 'black horizontal rectangular silhouette'}
    >
      <rect x="10" y="35" width="100" height="50" rx="3" fill={SHAPE_INK} />
    </ShapeSvg>
  ),

  'shape-regulatory-sign': ({ size, decorative, className, ariaLabel }) => (
    <ShapeSvg
      size={size}
      decorative={decorative}
      className={className}
      ariaLabel={ariaLabel ?? 'black vertical rectangular silhouette'}
    >
      <rect x="30" y="10" width="60" height="100" rx="3" fill={SHAPE_INK} />
    </ShapeSvg>
  ),

  'shape-school-zone': ({ size, decorative, className, ariaLabel }) => (
    <ShapeSvg
      size={size}
      decorative={decorative}
      className={className}
      ariaLabel={ariaLabel ?? 'black five-sided school-house-shaped silhouette'}
    >
      <polygon points="60,12 108,45 108,108 12,108 12,45" fill={SHAPE_INK} />
    </ShapeSvg>
  ),

  'shape-stop': ({ size, decorative, className, ariaLabel }) => (
    <ShapeSvg
      size={size}
      decorative={decorative}
      className={className}
      ariaLabel={ariaLabel ?? 'black eight-sided silhouette'}
    >
      <polygon points="42,12 78,12 108,42 108,78 78,108 42,108 12,78 12,42" fill={SHAPE_INK} />
    </ShapeSvg>
  ),

  'shape-yield': ({ size, decorative, className, ariaLabel }) => (
    <ShapeSvg
      size={size}
      decorative={decorative}
      className={className}
      ariaLabel={ariaLabel ?? 'black inverted triangular silhouette'}
    >
      <polygon points="12,18 108,18 60,108" fill={SHAPE_INK} />
    </ShapeSvg>
  ),

  'shape-warning-sign': ({ size, decorative, className, ariaLabel }) => (
    <ShapeSvg
      size={size}
      decorative={decorative}
      className={className}
      ariaLabel={ariaLabel ?? 'black diamond-shaped silhouette'}
    >
      <polygon points="60,10 110,60 60,110 10,60" fill={SHAPE_INK} />
    </ShapeSvg>
  ),
};

export const SIGN_SHAPE_IDS: readonly string[] = Object.keys(SIGN_SHAPES);

/**
 * Marks a shape diagram as theme-aware artwork.
 *
 * The hook `.sign-shape` in styles.css paints from. It is added here rather
 * than inside the entries above so that the markup the approval fingerprint
 * hashes stays byte-identical to what was reviewed; see the note at the top of
 * this file.
 */
export const SIGN_SHAPE_CLASS = 'sign-shape';

/**
 * Renders a sign-shape concept SVG. Used by the sign-shape learning set.
 * Falls back to a missing-shape indicator if the id is unknown.
 */
export function SignShapeArt({
  shapeId,
  size = 120,
  decorative = false,
  className,
  ariaLabel,
}: { shapeId: string } & SignShapeProps) {
  const render = SIGN_SHAPES[shapeId];
  if (!render) {
    return (
      <span role="img" aria-label={`Missing sign shape: ${shapeId}`} className={className}>
        ⚠️
      </span>
    );
  }
  return render({
    size,
    decorative,
    className: [SIGN_SHAPE_CLASS, className].filter(Boolean).join(' '),
    ariaLabel,
  });
}
