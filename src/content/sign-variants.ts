import approvalsJson from '@data/signs/visual-approvals.json';
import learnerScopeJson from '@data/signs/learner-scope.json';

/**
 * Related sign variants, grouped under the catalogue concept they belong to.
 *
 * The 22 Phase 6A Variant visuals are not missing from the catalogue and are
 * not independent learner objectives — every one of them is a supplementary
 * tab plate that mounts below a parent sign ("All Way", "Except Bicycles",
 * "Reserved Lane Begins"). They enrich the parent concept, so the catalogue
 * shows them under it rather than as 22 more top-level cards.
 *
 * The parent link is *derived from the official designation*, not invented:
 * Schedule tabs are numbered after the sign they attach to, so `RA-1S4` belongs
 * to `RA-1` and `RB-80S1` to `RB-80`. A variant whose base designation has no
 * learner-visible parent is left ungrouped rather than being attached to a
 * plausible-looking neighbour.
 *
 * Nothing here affects scope, assessment or progression: these visuals stay
 * classified as Variant, stay out of the 155 top-level count, and stay out of
 * every denominator.
 */

const approvals = approvalsJson as {
  approvals: Record<string, { designation?: string; displayName: string; status: string }>;
};
const scope = learnerScopeJson as {
  classifications: Record<string, { scope: string; displayName: string }>;
};

export interface SignVariant {
  /** App id of the variant visual. */
  id: string;
  /** Learner-facing label, e.g. "All Way Tab". */
  displayName: string;
  /** Official designation, where the visual has one. */
  designation?: string;
}

/** Strip a Schedule tab suffix: RA-1S4 -> RA-1, RB-79T -> RB-79. */
function baseDesignation(designation: string): string | null {
  const match = /^(.*?)(?:S\d*|T)$/.exec(designation);
  return match && match[1] ? match[1] : null;
}

function buildIndex(): Map<string, SignVariant[]> {
  const learnerByDesignation = new Map<string, string>();
  for (const [id, entry] of Object.entries(scope.classifications)) {
    if (entry.scope !== 'core' && entry.scope !== 'reference') continue;
    const designation = approvals.approvals[id]?.designation;
    // First match wins; a designation maps to at most one learner concept in
    // the current catalogue, and ties would be ambiguous anyway.
    if (designation && !learnerByDesignation.has(designation)) {
      learnerByDesignation.set(designation, id);
    }
  }

  const index = new Map<string, SignVariant[]>();
  for (const [id, entry] of Object.entries(scope.classifications)) {
    if (entry.scope !== 'variant') continue;
    const approval = approvals.approvals[id];
    if (!approval || approval.status !== 'approved') continue;

    const designation = approval.designation ?? id;
    const base = baseDesignation(designation);
    if (!base) continue;
    const parent = learnerByDesignation.get(base);
    if (!parent) continue;

    const list = index.get(parent) ?? [];
    list.push({
      id,
      displayName: entry.displayName || approval.displayName,
      designation: approval.designation,
    });
    index.set(parent, list);
  }

  // Stable, reviewable order.
  for (const list of index.values()) list.sort((a, b) => a.id.localeCompare(b.id));
  return index;
}

let _index: Map<string, SignVariant[]> | undefined;

function index(): Map<string, SignVariant[]> {
  if (!_index) _index = buildIndex();
  return _index;
}

/** Related variant plates for a catalogue concept, or an empty list. */
export function variantsFor(signId: string): readonly SignVariant[] {
  return index().get(signId) ?? [];
}

/** Every catalogue concept that has related variants, with their variants. */
export function signVariantIndex(): ReadonlyMap<string, readonly SignVariant[]> {
  return index();
}

/** How many Variant visuals are reachable from a catalogue parent. */
export function groupedVariantCount(): number {
  let total = 0;
  for (const list of index().values()) total += list.length;
  return total;
}
