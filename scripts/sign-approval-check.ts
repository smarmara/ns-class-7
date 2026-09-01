/**
 * Visual approval integrity check.
 *
 * Every approval on record is re-derived from what is on disk right now. An
 * approval only survives while the artwork, the app-id/designation mapping,
 * the source asset path and the canonical display name are all unchanged —
 * whichever one moved, the visual goes back for re-review.
 *
 * Usage: pnpm signs:approval:check
 */

import {
  APPROVAL_SCHEMA_VERSION,
  buildVisualInventory,
  countVisuals,
  loadApprovals,
  normaliseSemanticName,
} from './lib/sign-visuals';

async function main(): Promise<void> {
  const approvals = await loadApprovals();
  const visuals = await buildVisualInventory();
  const byId = new Map(visuals.map((visual) => [visual.appId, visual]));

  const invalidations: string[] = [];
  let checked = 0;

  for (const [appId, approval] of Object.entries(approvals.approvals)) {
    if (approval.status !== 'approved') continue;
    checked += 1;

    const visual = byId.get(appId);
    const report = (reason: string, detail?: string) => {
      invalidations.push(appId);
      console.log('\nVISUAL APPROVAL INVALIDATED');
      console.log(`Sign:                ${appId}`);
      console.log(`Designation:         ${approval.designation ?? 'n/a'}`);
      console.log(`Approved name:       ${approval.displayName ?? 'n/a'}`);
      if (detail) console.log(`Current:             ${detail}`);
      console.log(`Previously approved: ${approval.approvedAt ?? 'unknown'}`);
      console.log(`Reason:              ${reason}`);
      console.log('Action:              pnpm signs:gallery:review, then review this visual again.');
    };

    if (!visual) {
      report('Visual no longer exists in the sign system');
      continue;
    }
    if ((approval.schemaVersion ?? approvals.schemaVersion) !== APPROVAL_SCHEMA_VERSION) {
      report(
        `Approval recorded under schema v${approval.schemaVersion ?? approvals.schemaVersion}, current schema is v${APPROVAL_SCHEMA_VERSION}`,
      );
      continue;
    }
    if (visual.approvalStatus === 'broken') {
      report('Artwork missing or unreadable');
      continue;
    }
    if (visual.approvalStatus !== 'approved') {
      const nameChanged =
        approval.displayName !== undefined &&
        normaliseSemanticName(approval.displayName) !== normaliseSemanticName(visual.displayName);
      report(
        nameChanged
          ? 'Canonical sign name changed since approval'
          : 'Artwork or mapping has changed since approval',
        nameChanged ? `name is now "${visual.displayName}"` : visual.assetPath,
      );
    }
  }

  const counts = countVisuals(visuals);

  if (checked === 0) {
    console.log('No approved visuals to check.');
    console.log(`${counts.total} visuals in the gallery, ${counts.pending} pending review.`);
    console.log('Use pnpm signs:gallery:review to approve visuals.');
    return;
  }

  console.log(`\nChecked ${checked} approved visual(s).`);
  console.log(
    `Gallery: ${counts.total} total, ${counts.approved} approved, ${counts.pending} pending, ` +
      `${counts.changed} changed, ${counts.broken} broken, ${counts.unresolvedNames} unresolved names.`,
  );

  if (invalidations.length > 0) {
    console.log(`\n${invalidations.length} approval(s) invalidated. Review required.`);
    process.exit(1);
  }
  console.log('All approved visuals remain valid.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
