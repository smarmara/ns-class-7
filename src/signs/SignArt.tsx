import { SIGN_ART } from './registry';
import { getSignMeta } from '@/content/signs';

interface SignArtProps {
  signId: string;
  /** Rendered pixel size of the square canvas. */
  size?: number;
  /**
   * When true the sign is decorative — its description is already conveyed by
   * adjacent text — so it is hidden from assistive technology to avoid
   * double-announcing.
   */
  decorative?: boolean;
  className?: string;
}

/**
 * Renders a sign from the original SVG artwork registry.
 *
 * Accessibility note: the accessible name is the sign's `visualDescription`
 * — shape, colour and symbols — never its meaning. A screen-reader user gets
 * exactly what a sighted user sees, so sign-recognition questions stay fair
 * instead of answering themselves.
 */
export function SignArt({ signId, size = 120, decorative = false, className }: SignArtProps) {
  const art = SIGN_ART[signId];
  const meta = getSignMeta(signId);

  if (!art || !meta) {
    return (
      <span role="img" aria-label={`Missing sign artwork: ${signId}`} className={className}>
        ⚠️
      </span>
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
      aria-label={decorative ? undefined : meta.visualDescription}
      focusable="false"
    >
      {!decorative && <title>{meta.visualDescription}</title>}
      {art}
    </svg>
  );
}
