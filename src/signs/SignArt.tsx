import { getSignArtwork } from './artwork';
import { SignShapeArt } from './SignShapeArt';
import { getSignMeta } from '@/content/signs';

interface SignArtProps {
  signId: string;
  /** Maximum rendered size of the artwork box (see notes below). */
  size?: number;
  /**
   * When true the sign is decorative — its description is already conveyed by
   * adjacent text — so it is hidden from assistive technology to avoid
   * double-announcing.
   */
  decorative?: boolean;
  /**
   * Accessible name for catalogue use only, applied when the sign has no
   * `visualDescription` in sign-meta.
   *
   * Quiz code must never pass this. A catalogue card already shows the sign's
   * name in its caption, so naming the image after it leaks nothing; doing the
   * same in a question would answer the question. Every sign the question bank
   * uses has a sign-meta row, which `tests/sign-artwork.test.ts` enforces, so
   * the quiz path never reaches this fallback.
   */
  label?: string;
  className?: string;
  /** Defer decoding until the image is near the viewport. */
  lazy?: boolean;
}

/**
 * Renders a sign from whichever approved visual it resolves to — an official
 * Schedule crop, a sign-shape concept drawing, or original registry SVG.
 *
 * Official crops are the Province's images: they keep their natural aspect
 * ratio and must never be filtered, recoloured or distorted. The artwork is
 * bounded to `size` (max-width/max-height, width/height auto) so wide and tall
 * signs render true to their real shape.
 *
 * Accessibility note: in a question the accessible name is the sign's
 * `visualDescription` — shape, colour and symbols — never its meaning. A
 * screen-reader user gets exactly what a sighted user sees, so sign-recognition
 * questions stay fair instead of answering themselves. The file name is never
 * exposed as text.
 */
export function SignArt({
  signId,
  size = 120,
  decorative = false,
  label,
  className,
  lazy = false,
}: SignArtProps) {
  const artwork = getSignArtwork(signId);
  const meta = getSignMeta(signId);
  const accessibleName = meta?.visualDescription ?? label;

  // A decorative sign is rendered with an empty alt and hidden from assistive
  // technology, so it needs artwork but no name. Requiring one here is what
  // made Reference thumbnails on the Signs hub fall back to the warning icon:
  // those ids have no sign-meta row, and a decorative caller has no reason to
  // pass a label it will never render.
  if (!artwork || (!decorative && !accessibleName)) {
    // Not a valid production state: every learner-visible and question-linked
    // sign resolves to approved artwork, which `signs:learner-audit` and the
    // artwork tests both assert. This branch only exists so a future data
    // mistake degrades visibly instead of crashing the page.
    if (import.meta.env.DEV) {
      console.error(
        `SignArt: no approved artwork or accessible name for "${signId}". ` +
          'This is a data defect — run `pnpm signs:learner-audit`.',
      );
    }
    return (
      <span role="img" aria-label={`Missing sign artwork: ${signId}`} className={className}>
        ⚠️
      </span>
    );
  }

  if (artwork.kind === 'shape') {
    return (
      <SignShapeArt
        shapeId={artwork.shapeId}
        size={size}
        decorative={decorative}
        className={className}
        // The canonical description, so a shape is named the same way every
        // other sign is. It is also colour-free ("An eight-sided silhouette"),
        // which matters now that the shape is near-black in light mode and
        // pale in dark: nothing announces a colour the learner may not see.
        ariaLabel={accessibleName}
      />
    );
  }

  if (artwork.kind === 'crop') {
    return (
      <img
        src={artwork.src}
        alt={decorative ? '' : accessibleName}
        role={decorative ? 'presentation' : 'img'}
        aria-hidden={decorative || undefined}
        className={className}
        style={{ maxWidth: size, maxHeight: size, width: 'auto', height: 'auto', objectFit: 'contain' }}
        draggable={false}
        loading={lazy ? 'lazy' : undefined}
        decoding={lazy ? 'async' : undefined}
      />
    );
  }

  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      className={className}
      role={decorative ? 'presentation' : 'img'}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : accessibleName}
      focusable="false"
    >
      {!decorative && <title>{accessibleName}</title>}
      {artwork.art}
    </svg>
  );
}
