import type { ReactNode } from 'react';
import approvalsJson from '@data/signs/visual-approvals.json';
import { assetUrl } from '@/assetUrl';
import { SIGN_ART } from './registry';
import { SIGN_SHAPE_IDS } from './SignShapeArt';

/**
 * The one place that answers "what artwork does this sign id render as?".
 *
 * The canonical App ID -> approved artwork relationship lives in
 * data/signs/visual-approvals.json. That file is the record of which visual a
 * human actually looked at and approved, and its fingerprint covers the asset
 * path, so it cannot drift from the image on disk without the approval check
 * failing.
 *
 * Before this module existed the app resolved artwork through
 * data/signs/sign-fidelity.json instead, which only ever described the 82
 * signs the question bank uses. That was invisible while the gallery was built
 * from the question bank, and became a bug the moment the learner catalogue
 * started listing all 155 Core and Reference signs: the other 73 had approved
 * images but no fidelity row, so they rendered the missing-artwork fallback.
 *
 * Resolving from approvals is byte-identical to the old path for all 82
 * question-bank signs — including the RB-1/RB-1A variable-number speed pair,
 * whose approval records carry the same asset override `cropKeyFor` applied.
 */

interface ApprovalRecord {
  status: string;
  assetPath?: string;
  designation?: string;
  displayName: string;
}

const approvals = approvalsJson as {
  schemaVersion: number;
  approvals: Record<string, ApprovalRecord>;
};

export type SignArtwork =
  /**
   * An official Nova Scotia Schedule crop, served as-is from /public.
   *
   * `src` is resolved against the deployment base (see src/assetUrl.ts): the
   * approval record stores a root-absolute path, which would 404 when the app
   * is hosted under a subdirectory such as a GitHub Pages project site.
   */
  | { kind: 'crop'; src: string; designation?: string }
  /** A sign-shape concept drawing, rendered by SignShapeArt. */
  | { kind: 'shape'; shapeId: string }
  /** Original SVG artwork from the registry (pavement markings, guide concept). */
  | { kind: 'svg'; art: ReactNode };

/**
 * Resolve the approved artwork for a sign, or `undefined` if the id has no
 * approved visual at all.
 *
 * Only approved visuals resolve. An id that is registered but not approved is
 * treated as having no artwork, so nothing unreviewed can reach a learner.
 */
export function getSignArtwork(appId: string): SignArtwork | undefined {
  const approval = approvals.approvals[appId];
  if (!approval || approval.status !== 'approved') return undefined;

  if (approval.assetPath) {
    return { kind: 'crop', src: assetUrl(approval.assetPath), designation: approval.designation };
  }
  if (SIGN_SHAPE_IDS.includes(appId)) {
    return { kind: 'shape', shapeId: appId };
  }
  const art = SIGN_ART[appId];
  if (art) return { kind: 'svg', art };

  return undefined;
}

/** Whether a sign id resolves to renderable approved artwork. */
export function hasSignArtwork(appId: string): boolean {
  return getSignArtwork(appId) !== undefined;
}

/** The approved display name for a sign id, used where sign-meta has no row. */
export function approvedDisplayName(appId: string): string | undefined {
  return approvals.approvals[appId]?.displayName;
}
