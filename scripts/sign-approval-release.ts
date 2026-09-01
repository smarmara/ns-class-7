/**
 * Sign approval release gate.
 *
 * Stricter than signs:approval:check. Requires every ACTIVE learner visual to
 * be approved against its current fingerprint, with nothing changed, broken or
 * missing a canonical name. Unused library assets do not block a release.
 *
 * Usage: pnpm signs:approval:release
 */

import { buildVisualInventory, countVisuals } from './lib/sign-visuals';

async function main(): Promise<void> {
  const visuals = await buildVisualInventory();
  const active = visuals.filter((visual) => visual.isActive);

  const pending = active.filter((visual) => visual.approvalStatus === 'pending');
  const changed = active.filter((visual) => visual.approvalStatus === 'changed');
  const broken = active.filter((visual) => visual.approvalStatus === 'broken');
  const unnamed = active.filter((visual) => !visual.nameResolved);
  const approved = active.filter((visual) => visual.approvalStatus === 'approved');

  const describe = (label: string, list: typeof active) => {
    for (const visual of list) {
      console.log(`${label}: ${visual.appId} (${visual.designation ?? 'no designation'}) — ${visual.displayName}`);
    }
  };

  describe('PENDING', pending);
  describe('CHANGED', changed);
  describe('BROKEN', broken);
  describe('UNNAMED', unnamed);

  const counts = countVisuals(visuals);
  console.log('\nRelease Gate Summary:');
  console.log(`Active learner visuals: ${active.length}`);
  console.log(`Approved:               ${approved.length}`);
  console.log(`Pending:                ${pending.length}`);
  console.log(`Changed:                ${changed.length}`);
  console.log(`Broken:                 ${broken.length}`);
  console.log(`Unresolved names:       ${unnamed.length}`);
  console.log(`(whole gallery: ${counts.total} visuals, ${counts.approved} approved)`);

  if (pending.length + changed.length + broken.length + unnamed.length > 0) {
    console.log('\nRELEASE GATE FAILED');
    console.log('Not all active learner visuals are approved and valid.');
    console.log('Run pnpm signs:gallery:review to approve visuals.');
    process.exit(1);
  }

  console.log('\nRELEASE GATE PASSED');
  console.log('All active learner visuals are approved and valid.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
