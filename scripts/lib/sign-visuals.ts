/**
 * Shared model for the developer sign-visual QA gallery and the visual
 * approval system.
 *
 * Every tool that reads or writes an approval — the gallery generator, the
 * localhost review server, `signs:approval:check` and `signs:approval:release`
 * — goes through this module, so a fingerprint can only ever be computed one
 * way. Before this existed each script carried its own copy of the hashing and
 * path logic and they had already drifted apart.
 *
 * Approval fingerprints cover the *reviewed visual identity*:
 *
 *   PNG:  app id | artwork designation | source asset path | PNG bytes | name
 *   SVG:  app id | variant             | rendered markup   |           | name
 *
 * `name` is the canonical display name in a normalised form (see
 * `normaliseSemanticName`), so re-wording a sign's meaning invalidates its
 * approval while re-capitalising or re-spacing it does not.
 */

import { createHash } from 'node:crypto';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { cropKeyFor, type CropArtworkRef } from '../../src/signs/cropKey';
import { ROOT, QUESTIONS_DIR, SIGN_FIDELITY_PATH, SIGN_META_PATH } from './content';

export const SIGN_NAMES_PATH = path.join(ROOT, 'data', 'signs', 'sign-names.json');
export const VISUAL_APPROVALS_PATH = path.join(ROOT, 'data', 'signs', 'visual-approvals.json');
export const SIGN_REGISTRY_PATH = path.join(ROOT, 'src', 'signs', 'registry.tsx');

/**
 * Bumped from 1 to 2 when the canonical display name joined the fingerprint.
 * Records written under an older schema are treated as needing re-review.
 */
export const APPROVAL_SCHEMA_VERSION = 2;

/** Sentinel stored in sign-names.json for a name that could not be sourced. */
export const NAME_REVIEW_REQUIRED = 'NAME REVIEW REQUIRED';

export type ApprovalStatus = 'approved' | 'pending' | 'changed' | 'broken';

export interface VisualApproval {
  status: 'approved' | 'pending';
  approvedAt?: string;
  fingerprint?: string;
  assetPath?: string;
  designation?: string;
  /** Display name at the moment of approval, for the audit trail. */
  displayName?: string;
  schemaVersion?: number;
  previousApprovals?: Array<{ approvedAt: string; fingerprint: string; displayName?: string }>;
}

export interface VisualApprovals {
  schemaVersion: number;
  approvals: Record<string, VisualApproval>;
}

export interface FidelityEntry extends CropArtworkRef {
  variant?: string;
  schedulePage?: number;
  dimensions?: string;
  sourceId: string;
  status: string;
}

export interface GalleryVisual {
  appId: string;
  /** Sign-meta label — the learner-facing wording, kept for search. */
  name: string;
  /** Canonical human-readable name shown as the card's primary text. */
  displayName: string;
  nameResolved: boolean;
  category: string;
  visualDescription: string;
  designation?: string;
  /** Which image of a variable-number designation this is, e.g. "50 km/h". */
  variant?: string;
  assetPath?: string;
  assetFilename?: string;
  provenance: string;
  artworkType: 'png' | 'concept-svg';
  /** Rendered SVG markup for concept visuals (what the reviewer actually sees). */
  svgMarkup?: string;
  isActive: boolean;
  questionIds: string[];
  questionImageCount: number;
  correctChoiceCount: number;
  distractorCount: number;
  approvalStatus: ApprovalStatus;
  approvalFingerprint?: string;
  currentFingerprint?: string;
  approvedDisplayName?: string;
  pngDimensions?: { width: number; height: number };
  issues: string[];
  isSourceReview: boolean;
}

function sha256(data: string | Buffer): string {
  return createHash('sha256').update(data).digest('hex');
}

/**
 * Reduces a display name to the identity that approval depends on.
 *
 * Formatting churn — casing, padding, an em dash swapped for a hyphen, smart
 * quotes — normalises away and keeps existing approvals valid. A genuine
 * wording change ("Right Turn Only" -> "Left Turn Only") does not, so the
 * approval is invalidated and the sign comes back for re-review.
 */
export function normaliseSemanticName(name: string): string {
  return name
    .normalize('NFKC')
    // Every dash-like character collapses to a plain hyphen.
    .replace(/[‐-―−]/g, '-')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * Filesystem location of a browser asset path such as
 * `/signs/ns-official/RC-6%20(OPTIONAL).png`. The path is percent-decoded:
 * a handful of Schedule crops have spaces in their file names.
 */
export function assetFsPath(browserPath: string): string {
  const relative = browserPath.startsWith('/') ? browserPath.slice(1) : browserPath;
  return path.join(ROOT, 'public', decodeURIComponent(relative));
}

export function pngFingerprint(input: {
  appId: string;
  artworkId: string;
  assetPath: string;
  pngBytes: Buffer;
  displayName: string;
}): string {
  const fileHash = sha256(input.pngBytes);
  const semantic = normaliseSemanticName(input.displayName);
  return sha256(
    `${input.appId}|${input.artworkId}|${input.assetPath}|${fileHash}|name:${semantic}`,
  );
}

export function svgFingerprint(input: {
  appId: string;
  variant: string;
  svgMarkup: string;
  displayName: string;
}): string {
  const markup = input.svgMarkup.replace(/\s+/g, ' ').trim();
  const semantic = normaliseSemanticName(input.displayName);
  return sha256(`${input.appId}|${input.variant}|${markup}|name:${semantic}`);
}

/**
 * The artwork identity an approval is locked to.
 *
 * The variant deliberately stays out of it. A variable-number designation like
 * RB-1 covers more than one image, but the variants are told apart by their
 * resolved asset path — which the fingerprint already covers — so re-pointing
 * maximum-speed-50 from RB-1.png to RB-1A.png invalidates it either way.
 * Hashing the variant label as well would additionally invalidate every sign
 * that merely carries a variant ("right", "both directions") whenever that
 * label is reworded, for no change in the picture a reviewer approved.
 */
function artworkIdOf(visual: { appId: string; designation?: string }): string {
  return visual.designation ?? visual.appId;
}

/** Fingerprint of whatever the visual currently is, or null if unreadable. */
export async function currentFingerprintOf(visual: {
  appId: string;
  designation?: string;
  /** Fidelity variant of a variable-number designation, e.g. "50 km/h". */
  variant?: string;
  assetPath?: string;
  svgMarkup?: string;
  /** Concept-SVG kind, e.g. "pavement-concept-svg". */
  svgVariant?: string;
  artworkType: 'png' | 'concept-svg';
  displayName: string;
}): Promise<string | null> {
  if (visual.artworkType === 'png') {
    if (!visual.assetPath) return null;
    try {
      const pngBytes = await readFile(assetFsPath(visual.assetPath));
      return pngFingerprint({
        appId: visual.appId,
        artworkId: artworkIdOf(visual),
        assetPath: visual.assetPath,
        pngBytes,
        displayName: visual.displayName,
      });
    } catch {
      return null;
    }
  }
  if (!visual.svgMarkup) return null;
  return svgFingerprint({
    appId: visual.appId,
    variant: visual.svgVariant ?? 'concept-svg',
    svgMarkup: visual.svgMarkup,
    displayName: visual.displayName,
  });
}

/* ------------------------------------------------------------------ names */

export interface SignNamesFile {
  description: string;
  names: Record<string, string>;
}

export async function loadSignNames(): Promise<SignNamesFile> {
  return JSON.parse(await readFile(SIGN_NAMES_PATH, 'utf8')) as SignNamesFile;
}

/**
 * Canonical display name for a visual.
 *
 * Looks up the app id first, then the official designation, so a sign wired to
 * a Schedule crop inherits the Schedule name without a second entry. Returns
 * the NAME REVIEW REQUIRED sentinel when neither is resolved — never a
 * prettified id, because an id-shaped label reads as a real name and would
 * quietly pass review.
 */
export function resolveDisplayName(
  names: Record<string, string>,
  appId: string,
  designation?: string,
): { displayName: string; resolved: boolean } {
  const candidate = names[appId] ?? (designation ? names[designation] : undefined);
  if (!candidate || candidate === NAME_REVIEW_REQUIRED) {
    return { displayName: NAME_REVIEW_REQUIRED, resolved: false };
  }
  return { displayName: candidate, resolved: true };
}

/* -------------------------------------------------------------- approvals */

export async function loadApprovals(): Promise<VisualApprovals> {
  try {
    const parsed = JSON.parse(await readFile(VISUAL_APPROVALS_PATH, 'utf8')) as VisualApprovals;
    return { schemaVersion: parsed.schemaVersion ?? 1, approvals: parsed.approvals ?? {} };
  } catch {
    return { schemaVersion: APPROVAL_SCHEMA_VERSION, approvals: {} };
  }
}

export async function saveApprovals(approvals: VisualApprovals): Promise<void> {
  await writeFile(VISUAL_APPROVALS_PATH, `${JSON.stringify(approvals, null, 2)}\n`, 'utf8');
}

/**
 * Resolves the approval state of a visual against what it is right now.
 *
 * The stored record is never trusted on its own: an `approved` record only
 * stays approved while its fingerprint still matches the artwork, the mapping
 * and the canonical name on disk.
 */
export function resolveApprovalStatus(
  approval: VisualApproval | undefined,
  currentFingerprint: string | null,
  fileMissing: boolean,
  schemaVersion: number,
): ApprovalStatus {
  if (!approval || approval.status !== 'approved') return 'pending';
  if (fileMissing) return 'broken';
  if (schemaVersion !== APPROVAL_SCHEMA_VERSION) return 'changed';
  if (!currentFingerprint) return 'broken';
  return approval.fingerprint === currentFingerprint ? 'approved' : 'changed';
}

/**
 * Writes an approval for the visual's current fingerprint.
 *
 * The caller supplies the visual from the shared inventory, so the fingerprint
 * that gets locked is computed from the same inputs the gallery card was
 * rendered from — there is no path where the reviewer approves one thing and
 * the repository records another.
 */
export async function approveVisual(visual: GalleryVisual): Promise<
  { ok: true; fingerprint: string; visual: GalleryVisual } | { ok: false; error: string }
> {
  if (!visual.nameResolved) {
    return { ok: false, error: 'Cannot approve a visual whose name is still NAME REVIEW REQUIRED' };
  }
  const fingerprint = visual.currentFingerprint ?? (await currentFingerprintOf(visual));
  if (!fingerprint) {
    return { ok: false, error: 'Could not compute a fingerprint for this visual' };
  }

  const approvals = await loadApprovals();
  const previous = approvals.approvals[visual.appId];
  const history = previous?.previousApprovals ? [...previous.previousApprovals] : [];
  if (previous?.fingerprint && previous.fingerprint !== fingerprint) {
    history.push({
      approvedAt: previous.approvedAt ?? new Date().toISOString(),
      fingerprint: previous.fingerprint,
      ...(previous.displayName ? { displayName: previous.displayName } : {}),
    });
  }

  approvals.schemaVersion = APPROVAL_SCHEMA_VERSION;
  approvals.approvals[visual.appId] = {
    status: 'approved',
    approvedAt: new Date().toISOString(),
    fingerprint,
    schemaVersion: APPROVAL_SCHEMA_VERSION,
    displayName: visual.displayName,
    ...(visual.assetPath ? { assetPath: visual.assetPath } : {}),
    ...(visual.designation ? { designation: visual.designation } : {}),
    previousApprovals: history,
  };
  await saveApprovals(approvals);

  return {
    ok: true,
    fingerprint,
    visual: {
      ...visual,
      approvalStatus: 'approved',
      approvalFingerprint: fingerprint,
      approvedDisplayName: visual.displayName,
    },
  };
}

/** Returns a visual to PENDING, keeping its approval history. */
export async function revokeVisual(appId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const approvals = await loadApprovals();
  const record = approvals.approvals[appId];
  if (!record) return { ok: false, error: 'No approval recorded for this visual' };

  const history = record.previousApprovals ? [...record.previousApprovals] : [];
  if (record.fingerprint) {
    history.push({
      approvedAt: record.approvedAt ?? new Date().toISOString(),
      fingerprint: record.fingerprint,
      ...(record.displayName ? { displayName: record.displayName } : {}),
    });
  }

  approvals.approvals[appId] = {
    status: 'pending',
    ...(record.assetPath ? { assetPath: record.assetPath } : {}),
    ...(record.designation ? { designation: record.designation } : {}),
    previousApprovals: history,
  };
  await saveApprovals(approvals);
  return { ok: true };
}

/* ------------------------------------------------------------ svg artwork */

type SvgRenderer = (appId: string) => string | null;
let svgRenderer: SvgRenderer | null = null;

/**
 * Renders the concept SVGs exactly as the learner app draws them, so an SVG
 * approval is tied to the real markup rather than to a placeholder.
 *
 * React and the artwork registry are imported lazily: the gallery and the
 * review server need them, but a plain data check should not have to pay for
 * loading the whole artwork module.
 */
async function getSvgRenderer(): Promise<SvgRenderer> {
  if (svgRenderer) return svgRenderer;

  const React = await import('react');
  const { renderToStaticMarkup } = await import('react-dom/server');
  // registry.tsx is compiled with the automatic JSX runtime by the app build;
  // under tsx's script loader it uses the classic runtime, which expects a
  // global React. Same shim as scripts/sign-fidelity-report.tsx.
  (globalThis as typeof globalThis & { React?: unknown }).React = React;
  const { SIGN_ART } = await import('../../src/signs/registry');
  const { SIGN_SHAPES } = await import('../../src/signs/SignShapeArt');

  svgRenderer = (appId: string) => {
    const shape = SIGN_SHAPES[appId];
    if (shape) return renderToStaticMarkup(shape({ size: 120 }) as React.ReactElement);
    const art = SIGN_ART[appId];
    if (!art) return null;
    return renderToStaticMarkup(
      React.createElement('svg', { viewBox: '0 0 120 120', role: 'img' }, art),
    );
  };
  return svgRenderer;
}

/* ------------------------------------------------------------- inventory */

interface SignMeta {
  label: string;
  category: string;
  visualDescription: string;
  basis: string;
}

interface Question {
  id: string;
  signId?: string;
  choiceSignIds?: string[];
  correctChoice: number;
}

interface Usage {
  questionIds: string[];
  questionImageCount: number;
  correctChoiceCount: number;
  distractorCount: number;
}

function emptyUsage(): Usage {
  return { questionIds: [], questionImageCount: 0, correctChoiceCount: 0, distractorCount: 0 };
}

/** Parses the OFFICIAL_CROPS map out of the artwork registry by regex. */
async function parseOfficialCrops(): Promise<Map<string, string>> {
  const source = await readFile(SIGN_REGISTRY_PATH, 'utf8');
  const crops = new Map<string, string>();
  const block = source.match(/export const OFFICIAL_CROPS[^{]+\{([\s\S]*?)\n\};/);
  if (!block?.[1]) return crops;
  for (const entry of block[1].matchAll(/^\s{2}'([^']+)':\s*'([^']+)'/gm)) {
    if (entry[1] && entry[2]) crops.set(entry[1], entry[2]);
  }
  return crops;
}

function provenanceLabel(entry: FidelityEntry): string {
  switch (entry.sourceId) {
    case 'ns-traffic-signs-regulations':
      return 'NS Schedule PNG';
    case 'ns-drivers-handbook':
      if (entry.status === 'pavement-concept-svg') return 'Pavement concept SVG';
      if (entry.status === 'handbook-concept-svg') return 'Handbook concept SVG';
      return "NS Driver's Handbook PNG";
    case 'ns-work-zone-manual':
      return 'NS Work Zone PNG';
    default:
      return 'Other sourced PNG';
  }
}

function pngDimensions(buffer: Buffer): { width: number; height: number } | undefined {
  // PNG signature is 8 bytes; the IHDR chunk puts width at 16 and height at 20.
  if (buffer.length < 24) return undefined;
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

async function readUsage(): Promise<Map<string, Usage>> {
  const files = (await readdir(QUESTIONS_DIR)).filter((f) => f.endsWith('.json')).sort();
  const usage = new Map<string, Usage>();
  for (const file of files) {
    const questions = JSON.parse(
      await readFile(path.join(QUESTIONS_DIR, file), 'utf8'),
    ) as Question[];
    for (const question of questions) {
      if (question.signId) {
        const entry = usage.get(question.signId) ?? emptyUsage();
        entry.questionIds.push(question.id);
        entry.questionImageCount += 1;
        usage.set(question.signId, entry);
      }
      question.choiceSignIds?.forEach((signId, index) => {
        const entry = usage.get(signId) ?? emptyUsage();
        if (!entry.questionIds.includes(question.id)) entry.questionIds.push(question.id);
        if (index === question.correctChoice) entry.correctChoiceCount += 1;
        else entry.distractorCount += 1;
        usage.set(signId, entry);
      });
    }
  }
  return usage;
}

/**
 * Every visual reachable from the sign system: the signs the question bank
 * uses, plus the unused Schedule crops kept in the library. Sorted by natural
 * designation order so the gallery reads like the Schedule itself.
 */
export async function buildVisualInventory(): Promise<GalleryVisual[]> {
  const fidelity = JSON.parse(await readFile(SIGN_FIDELITY_PATH, 'utf8')) as {
    signs: Record<string, FidelityEntry>;
  };
  const meta = JSON.parse(await readFile(SIGN_META_PATH, 'utf8')) as {
    signs: Record<string, SignMeta>;
  };
  const { names } = await loadSignNames();
  const crops = await parseOfficialCrops();
  const approvals = await loadApprovals();
  const usage = await readUsage();
  const render = await getSvgRenderer();

  const visuals: GalleryVisual[] = [];
  const seenAssetPaths = new Set<string>();

  const build = async (
    appId: string,
    entry: FidelityEntry,
    fromRegistryOnly: boolean,
  ): Promise<GalleryVisual> => {
    const signMeta = meta.signs[appId];
    const use = usage.get(appId) ?? emptyUsage();
    const isConceptSvg =
      entry.status === 'pavement-concept-svg' || entry.status === 'handbook-concept-svg';
    const artworkType: 'png' | 'concept-svg' = isConceptSvg ? 'concept-svg' : 'png';

    const cropKey = cropKeyFor(entry);
    const assetPath = cropKey
      ? (crops.get(cropKey) ?? `/signs/ns-official/${cropKey}.png`)
      : undefined;
    const assetFilename = assetPath ? decodeURIComponent(path.basename(assetPath)) : undefined;

    const issues: string[] = [];
    let dimensions: { width: number; height: number } | undefined;
    let fileMissing = false;
    if (artworkType === 'png') {
      if (!assetPath) {
        issues.push('NO ASSET');
        fileMissing = true;
      } else {
        try {
          const buffer = await readFile(assetFsPath(assetPath));
          dimensions = pngDimensions(buffer);
          if (dimensions && dimensions.width < 50 && dimensions.height < 50) {
            issues.push('LOW RESOLUTION');
          }
        } catch {
          issues.push('MISSING FILE');
          fileMissing = true;
        }
      }
    }

    const svgMarkup = artworkType === 'concept-svg' ? (render(appId) ?? undefined) : undefined;
    if (artworkType === 'concept-svg' && !svgMarkup) {
      issues.push('MISSING ARTWORK');
      fileMissing = true;
    }

    const { displayName, resolved } = resolveDisplayName(names, appId, entry.designation);
    if (!resolved) issues.push('NAME REVIEW REQUIRED');

    const currentFingerprint = await currentFingerprintOf({
      appId,
      designation: entry.designation,
      variant: entry.variant,
      assetPath,
      svgMarkup,
      svgVariant: entry.status,
      artworkType,
      displayName,
    });

    const approval = approvals.approvals[appId];
    const approvalStatus = resolveApprovalStatus(
      approval,
      currentFingerprint,
      fileMissing,
      approval?.schemaVersion ?? approvals.schemaVersion,
    );

    return {
      appId,
      name: signMeta?.label ?? appId,
      displayName,
      nameResolved: resolved,
      category: signMeta?.category ?? (fromRegistryOnly ? 'unused-schedule' : 'unknown'),
      visualDescription:
        signMeta?.visualDescription ??
        (entry.designation ? `Official Schedule sign ${entry.designation}` : ''),
      ...(entry.designation ? { designation: entry.designation } : {}),
      ...(entry.variant ? { variant: entry.variant } : {}),
      ...(assetPath ? { assetPath } : {}),
      ...(assetFilename ? { assetFilename } : {}),
      provenance: provenanceLabel(entry),
      artworkType,
      ...(svgMarkup ? { svgMarkup } : {}),
      isActive: use.questionIds.length > 0,
      questionIds: use.questionIds,
      questionImageCount: use.questionImageCount,
      correctChoiceCount: use.correctChoiceCount,
      distractorCount: use.distractorCount,
      approvalStatus,
      ...(approval?.fingerprint ? { approvalFingerprint: approval.fingerprint } : {}),
      ...(currentFingerprint ? { currentFingerprint } : {}),
      ...(approval?.displayName ? { approvedDisplayName: approval.displayName } : {}),
      ...(dimensions ? { pngDimensions: dimensions } : {}),
      issues,
      isSourceReview: entry.sourceId === 'source-review' || entry.status === 'source-review',
    };
  };

  for (const [appId, entry] of Object.entries(fidelity.signs)) {
    visuals.push(await build(appId, entry, false));
    const cropKey = cropKeyFor(entry);
    if (cropKey) {
      seenAssetPaths.add(crops.get(cropKey) ?? `/signs/ns-official/${cropKey}.png`);
    }
  }

  // Crop keys claimed as a variant image by some sign. These are asset file
  // names, not Schedule designations, so if one ever ends up unclaimed it must
  // still not be presented as an official designation.
  const variantAssetKeys = new Set(
    Object.values(fidelity.signs)
      .map((entry) => entry.asset)
      .filter((asset): asset is string => Boolean(asset)),
  );

  for (const [cropKey, assetPath] of crops) {
    if (seenAssetPaths.has(assetPath)) continue;
    seenAssetPaths.add(assetPath);
    const isVariantAsset = variantAssetKeys.has(cropKey);
    visuals.push(
      await build(
        cropKey,
        {
          ...(isVariantAsset ? { asset: cropKey } : { designation: cropKey }),
          sourceId: 'ns-traffic-signs-regulations',
          status: 'official-crop',
        },
        true,
      ),
    );
  }

  visuals.sort((a, b) => {
    if (a.designation && b.designation) return naturalSort(a.designation, b.designation);
    return a.appId.localeCompare(b.appId);
  });
  return visuals;
}

/** Orders `RB-2` before `RB-10`, the way the Schedule lists them. */
export function naturalSort(a: string, b: string): number {
  const parts = (value: string): Array<string | number> => {
    const out: Array<string | number> = [];
    for (const match of value.matchAll(/(\d+)|(\D+)/g)) {
      out.push(match[1] ? Number.parseInt(match[1], 10) : (match[2] ?? ''));
    }
    return out;
  };
  const ax = parts(a);
  const bx = parts(b);
  for (let i = 0; i < Math.max(ax.length, bx.length); i += 1) {
    const an = ax[i];
    const bn = bx[i];
    if (an === undefined) return -1;
    if (bn === undefined) return 1;
    if (typeof an === 'number' && typeof bn === 'number') {
      if (an !== bn) return an - bn;
    } else {
      const cmp = String(an).localeCompare(String(bn));
      if (cmp !== 0) return cmp;
    }
  }
  return 0;
}

export interface VisualCounts {
  total: number;
  active: number;
  unused: number;
  approved: number;
  pending: number;
  changed: number;
  broken: number;
  sourceReview: number;
  unresolvedNames: number;
}

export function countVisuals(visuals: GalleryVisual[]): VisualCounts {
  return {
    total: visuals.length,
    active: visuals.filter((v) => v.isActive).length,
    unused: visuals.filter((v) => !v.isActive).length,
    approved: visuals.filter((v) => v.approvalStatus === 'approved').length,
    pending: visuals.filter((v) => v.approvalStatus === 'pending').length,
    changed: visuals.filter((v) => v.approvalStatus === 'changed').length,
    broken: visuals.filter((v) => v.approvalStatus === 'broken').length,
    sourceReview: visuals.filter((v) => v.isSourceReview).length,
    unresolvedNames: visuals.filter((v) => !v.nameResolved).length,
  };
}
