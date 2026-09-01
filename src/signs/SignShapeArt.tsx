import type { ReactNode } from 'react';

/**
 * Concept SVG geometry for the six sign shapes taught in the Nova Scotia
 * Driver's Handbook. These are not official sign artwork — they are clean
 * geometric silhouettes used to teach that sign shape itself conveys meaning.
 *
 * Accessibility: during unanswered recognition questions the alt text
 * describes geometry only (e.g. "black eight-sided silhouette"), never the
 * meaning (e.g. "Stop"), so the shape-recognition question stays fair.
 */

interface SignShapeProps {
  /** Maximum rendered size of the shape box. */
  size?: number;
  /** When true the shape is decorative — hidden from assistive technology. */
  decorative?: boolean;
  className?: string;
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

const BLACK = '#16181d';

export const SIGN_SHAPES: Readonly<Record<string, (props: SignShapeProps) => ReactNode>> = {
  'shape-guide-sign': ({ size, decorative, className }) => (
    <ShapeSvg size={size} decorative={decorative} className={className} ariaLabel="black horizontal rectangular silhouette">
      <rect x="10" y="35" width="100" height="50" rx="3" fill={BLACK} />
    </ShapeSvg>
  ),

  'shape-regulatory-sign': ({ size, decorative, className }) => (
    <ShapeSvg size={size} decorative={decorative} className={className} ariaLabel="black vertical rectangular silhouette">
      <rect x="30" y="10" width="60" height="100" rx="3" fill={BLACK} />
    </ShapeSvg>
  ),

  'shape-school-zone': ({ size, decorative, className }) => (
    <ShapeSvg size={size} decorative={decorative} className={className} ariaLabel="black five-sided school-house-shaped silhouette">
      <polygon points="60,12 108,45 108,108 12,108 12,45" fill={BLACK} />
    </ShapeSvg>
  ),

  'shape-stop': ({ size, decorative, className }) => (
    <ShapeSvg size={size} decorative={decorative} className={className} ariaLabel="black eight-sided silhouette">
      <polygon points="42,12 78,12 108,42 108,78 78,108 42,108 12,78 12,42" fill={BLACK} />
    </ShapeSvg>
  ),

  'shape-yield': ({ size, decorative, className }) => (
    <ShapeSvg size={size} decorative={decorative} className={className} ariaLabel="black inverted triangular silhouette">
      <polygon points="12,18 108,18 60,108" fill={BLACK} />
    </ShapeSvg>
  ),

  'shape-warning-sign': ({ size, decorative, className }) => (
    <ShapeSvg size={size} decorative={decorative} className={className} ariaLabel="black diamond-shaped silhouette">
      <polygon points="60,10 110,60 60,110 10,60" fill={BLACK} />
    </ShapeSvg>
  ),
};

export const SIGN_SHAPE_IDS: readonly string[] = Object.keys(SIGN_SHAPES);

/**
 * Renders a sign-shape concept SVG. Used by the sign-shape learning set.
 * Falls back to a missing-shape indicator if the id is unknown.
 */
export function SignShapeArt({
  shapeId,
  size = 120,
  decorative = false,
  className,
}: { shapeId: string } & SignShapeProps) {
  const render = SIGN_SHAPES[shapeId];
  if (!render) {
    return (
      <span role="img" aria-label={`Missing sign shape: ${shapeId}`} className={className}>
        ⚠️
      </span>
    );
  }
  return render({ size, decorative, className });
}
