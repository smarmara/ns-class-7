/**
 * Visual approval workflow, end to end through the real persistence layer.
 *
 * These tests call the same functions the localhost review server calls, so
 * what they prove is what actually happens when a reviewer clicks a button:
 *
 *   PENDING -> one approve -> APPROVED
 *   APPROVED -> one undo   -> PENDING
 *   artwork mutated        -> CHANGED, then one reapprove -> APPROVED (new fingerprint)
 *   canonical name changed materially -> CHANGED
 *   canonical name reformatted only   -> still APPROVED
 *
 * The repository approvals file is snapshotted and restored, so running the
 * suite never leaves an approval behind.
 */

import { readFile, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import {
  APPROVAL_SCHEMA_VERSION,
  VISUAL_APPROVALS_PATH,
  approveVisual,
  currentFingerprintOf,
  loadApprovals,
  normaliseSemanticName,
  resolveApprovalStatus,
  revokeVisual,
  saveApprovals,
  type GalleryVisual,
} from '../scripts/lib/sign-visuals';
import { ROOT } from '../scripts/lib/content';

const FIXTURE_ID = 'RB-999-TEST';
const FIXTURE_ASSET = `/signs/ns-official/${FIXTURE_ID}.png`;
const FIXTURE_PATH = path.join(ROOT, 'public', 'signs', 'ns-official', `${FIXTURE_ID}.png`);

// A second image for the same fixture sign, standing in for a variable-number
// designation's other variant (RB-1.png / RB-1A.png).
const SECOND_FIXTURE_ASSET = `/signs/ns-official/${FIXTURE_ID}A.png`;
const SECOND_FIXTURE_PATH = path.join(ROOT, 'public', 'signs', 'ns-official', `${FIXTURE_ID}A.png`);

// Two distinct, valid 1x1 and 2x2 PNGs — "the artwork changed on disk".
const PNG_A = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
  0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
  0x00, 0x00, 0x00, 0x0c, 0x49, 0x44, 0x41, 0x54, 0x08, 0xd7, 0x63, 0xf8, 0xcf, 0xc0, 0x00, 0x00,
  0x00, 0x02, 0x00, 0x01, 0xe2, 0x21, 0xbc, 0x33, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44,
  0xae, 0x42, 0x60, 0x82,
]);
const PNG_B = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
  0x00, 0x00, 0x00, 0x02, 0x00, 0x00, 0x00, 0x02, 0x08, 0x02, 0x00, 0x00, 0x00, 0xfc, 0x18, 0x9b,
  0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
]);

function fixtureVisual(overrides: Partial<GalleryVisual> = {}): GalleryVisual {
  return {
    appId: FIXTURE_ID,
    name: 'test fixture',
    displayName: 'Test Fixture Sign',
    nameResolved: true,
    category: 'test',
    visualDescription: 'test fixture artwork',
    designation: FIXTURE_ID,
    assetPath: FIXTURE_ASSET,
    assetFilename: `${FIXTURE_ID}.png`,
    provenance: 'NS Schedule PNG',
    artworkType: 'png',
    isActive: false,
    questionIds: [],
    questionImageCount: 0,
    correctChoiceCount: 0,
    distractorCount: 0,
    approvalStatus: 'pending',
    issues: [],
    isSourceReview: false,
    ...overrides,
  };
}

/** Resolves the fixture's state the way the gallery and the checker do. */
async function statusOf(visual: GalleryVisual) {
  const approvals = await loadApprovals();
  const record = approvals.approvals[visual.appId];
  const fingerprint = await currentFingerprintOf(visual);
  return resolveApprovalStatus(
    record,
    fingerprint,
    fingerprint === null,
    record?.schemaVersion ?? approvals.schemaVersion,
  );
}

let originalApprovals: string;

beforeAll(async () => {
  originalApprovals = await readFile(VISUAL_APPROVALS_PATH, 'utf8');
});

afterAll(async () => {
  await writeFile(VISUAL_APPROVALS_PATH, originalApprovals, 'utf8');
  await unlink(FIXTURE_PATH).catch(() => {});
  await unlink(SECOND_FIXTURE_PATH).catch(() => {});
});

beforeEach(async () => {
  await writeFile(FIXTURE_PATH, PNG_A);
  await saveApprovals({ schemaVersion: APPROVAL_SCHEMA_VERSION, approvals: {} });
});

describe('one-click approval', () => {
  it('goes PENDING -> APPROVED in a single approve call', async () => {
    const visual = fixtureVisual();
    expect(await statusOf(visual)).toBe('pending');

    const result = await approveVisual(visual);
    expect(result.ok).toBe(true);
    expect(await statusOf(visual)).toBe('approved');
  });

  it('persists the exact reviewed fingerprint, name and asset path', async () => {
    const visual = fixtureVisual();
    const result = await approveVisual(visual);
    expect(result.ok).toBe(true);

    const record = (await loadApprovals()).approvals[FIXTURE_ID];
    expect(record?.status).toBe('approved');
    expect(record?.assetPath).toBe(FIXTURE_ASSET);
    expect(record?.designation).toBe(FIXTURE_ID);
    expect(record?.displayName).toBe('Test Fixture Sign');
    expect(record?.schemaVersion).toBe(APPROVAL_SCHEMA_VERSION);
    expect(record?.fingerprint).toBe(await currentFingerprintOf(visual));
  });

  it('survives regeneration — state is re-derived from the repository file', async () => {
    const visual = fixtureVisual();
    await approveVisual(visual);

    // Nothing cached: read the file back from disk and resolve again.
    const reread = await loadApprovals();
    expect(reread.approvals[FIXTURE_ID]?.status).toBe('approved');
    expect(await statusOf(visual)).toBe('approved');
  });

  it('goes APPROVED -> PENDING in a single undo call', async () => {
    const visual = fixtureVisual();
    await approveVisual(visual);
    expect(await statusOf(visual)).toBe('approved');

    const result = await revokeVisual(FIXTURE_ID);
    expect(result.ok).toBe(true);
    expect(await statusOf(visual)).toBe('pending');
  });

  it('keeps the approval history across an undo', async () => {
    const visual = fixtureVisual();
    const approved = await approveVisual(visual);
    await revokeVisual(FIXTURE_ID);

    const record = (await loadApprovals()).approvals[FIXTURE_ID];
    expect(record?.status).toBe('pending');
    expect(record?.fingerprint).toBeUndefined();
    expect(record?.previousApprovals?.[0]?.fingerprint).toBe(
      approved.ok ? approved.fingerprint : undefined,
    );
  });

  it('refuses to approve a visual whose name is unresolved', async () => {
    const result = await approveVisual(
      fixtureVisual({ nameResolved: false, displayName: 'NAME REVIEW REQUIRED' }),
    );
    expect(result.ok).toBe(false);
    expect((await loadApprovals()).approvals[FIXTURE_ID]).toBeUndefined();
  });
});

describe('fingerprint locking', () => {
  it('invalidates an approval when the artwork bytes change', async () => {
    const visual = fixtureVisual();
    await approveVisual(visual);
    expect(await statusOf(visual)).toBe('approved');

    await writeFile(FIXTURE_PATH, PNG_B);
    expect(await statusOf(visual)).toBe('changed');
  });

  it('reapproves a CHANGED visual in one call, under a new fingerprint', async () => {
    const visual = fixtureVisual();
    const first = await approveVisual(visual);
    await writeFile(FIXTURE_PATH, PNG_B);
    expect(await statusOf(visual)).toBe('changed');

    const second = await approveVisual(visual);
    expect(second.ok).toBe(true);
    expect(await statusOf(visual)).toBe('approved');
    expect(first.ok && second.ok && second.fingerprint).not.toBe(first.ok && first.fingerprint);

    const record = (await loadApprovals()).approvals[FIXTURE_ID];
    expect(record?.previousApprovals?.length).toBe(1);
  });

  it('invalidates an approval when the artwork goes missing', async () => {
    const visual = fixtureVisual();
    await approveVisual(visual);
    await unlink(FIXTURE_PATH);
    expect(await statusOf(visual)).toBe('broken');
  });

  it('invalidates an approval when the app-id to artwork mapping moves', async () => {
    await approveVisual(fixtureVisual());
    // Same bytes, different designation: a remap must not stay approved.
    const remapped = fixtureVisual({ designation: 'RB-998-TEST' });
    expect(await statusOf(remapped)).toBe('changed');
  });

  it('invalidates an approval when a variant is re-pointed at a different asset', async () => {
    // The RB-1 case: same designation and same name, but the sign now draws
    // from a different image. That approval must not survive.
    const before = fixtureVisual({ assetPath: FIXTURE_ASSET, variant: '80 km/h' });
    await approveVisual(before);
    expect(await statusOf(before)).toBe('approved');

    await writeFile(SECOND_FIXTURE_PATH, PNG_B);
    const after = fixtureVisual({ assetPath: SECOND_FIXTURE_ASSET, variant: '50 km/h' });
    expect(await statusOf(after)).toBe('changed');
  });

  it('invalidates approvals written under an older schema', async () => {
    const visual = fixtureVisual();
    await approveVisual(visual);

    const approvals = await loadApprovals();
    approvals.approvals[FIXTURE_ID]!.schemaVersion = APPROVAL_SCHEMA_VERSION - 1;
    await saveApprovals(approvals);

    expect(await statusOf(visual)).toBe('changed');
  });
});

describe('semantic name locking', () => {
  it('invalidates an approval when the name changes meaning', async () => {
    await approveVisual(fixtureVisual({ displayName: 'Right Turn Only' }));
    const renamed = fixtureVisual({ displayName: 'Left Turn Only' });
    expect(await statusOf(renamed)).toBe('changed');
  });

  it('keeps an approval when the name is only reformatted', async () => {
    await approveVisual(fixtureVisual({ displayName: 'Right Turn Only' }));
    for (const variant of ['right turn only', '  Right   Turn  Only  ', 'RIGHT TURN ONLY']) {
      expect(await statusOf(fixtureVisual({ displayName: variant }))).toBe('approved');
      expect(normaliseSemanticName(variant)).toBe(normaliseSemanticName('Right Turn Only'));
    }
  });
});

describe('source review independence', () => {
  it('approving a visual does not clear its source-review flag', async () => {
    const visual = fixtureVisual({ isSourceReview: true });
    const result = await approveVisual(visual);

    expect(result.ok).toBe(true);
    expect(result.ok && result.visual.isSourceReview).toBe(true);
    expect(result.ok && result.visual.approvalStatus).toBe('approved');
    // Source review is a property of provenance, never stored on the approval.
    const record = (await loadApprovals()).approvals[FIXTURE_ID];
    expect(record && 'sourceReview' in record).toBe(false);
  });
});

describe('svg visuals', () => {
  const svgVisual = (markup: string, displayName = 'Stop Sign Shape — Octagon'): GalleryVisual =>
    fixtureVisual({
      appId: 'test-shape',
      designation: undefined,
      assetPath: undefined,
      assetFilename: undefined,
      artworkType: 'concept-svg',
      svgMarkup: markup,
      displayName,
    });

  it('fingerprints the rendered markup, not a placeholder', async () => {
    const a = await currentFingerprintOf(svgVisual('<svg><polygon points="1,2"/></svg>'));
    const b = await currentFingerprintOf(svgVisual('<svg><polygon points="9,9"/></svg>'));
    expect(a).toBeTruthy();
    expect(a).not.toBe(b);
  });

  it('ignores reindentation of the markup', async () => {
    // Runs of whitespace collapse, so indentation style cannot invalidate an
    // approval. Whitespace is not removed outright — that could hide a real
    // change to a sign's text content.
    const a = await currentFingerprintOf(svgVisual('<svg>  <rect x="1"/>  </svg>'));
    const b = await currentFingerprintOf(svgVisual('<svg>\n\t<rect x="1"/>\n</svg>'));
    expect(a).toBe(b);
  });
});
