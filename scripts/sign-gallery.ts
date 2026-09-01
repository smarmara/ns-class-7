/**
 * Sign visual QA gallery generator.
 *
 * Generates a standalone developer-only HTML gallery showing every visual in
 * the sign system with its canonical name, so a human can compare artwork,
 * name and designation and approve each one individually.
 *
 * The gallery is static HTML. Approving writes through the localhost review
 * server (`pnpm signs:gallery:review`); the repository JSON is the only source
 * of truth. Opening the file directly still shows every card and its state —
 * the approve buttons simply report that the server is not running.
 *
 * Usage: pnpm signs:gallery
 */

import { copyFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { assetFsPath, buildVisualInventory, countVisuals } from './lib/sign-visuals';
import { generateGalleryHtml } from './lib/sign-gallery-html';
import { ROOT } from './lib/content';

const GALLERY_OUTPUT_DIR = path.join(ROOT, 'reports', 'sign-gallery');
const GALLERY_ASSETS_DIR = path.join(GALLERY_OUTPUT_DIR, 'assets');

/** Copies an asset next to the report so the HTML opens without a server. */
async function copyAssetToGallery(browserPath: string): Promise<boolean> {
  const relative = browserPath.startsWith('/') ? browserPath.slice(1) : browserPath;
  const destination = path.join(GALLERY_ASSETS_DIR, decodeURIComponent(relative));
  try {
    await mkdir(path.dirname(destination), { recursive: true });
    await copyFile(assetFsPath(browserPath), destination);
    return true;
  } catch {
    return false;
  }
}

async function main(): Promise<void> {
  console.log('Generating sign visual QA gallery…');
  const visuals = await buildVisualInventory();

  await mkdir(GALLERY_OUTPUT_DIR, { recursive: true });
  await writeFile(
    path.join(GALLERY_OUTPUT_DIR, 'index.html'),
    generateGalleryHtml(visuals),
    'utf8',
  );

  let copied = 0;
  const failed: string[] = [];
  for (const visual of visuals) {
    if (visual.artworkType !== 'png' || !visual.assetPath) continue;
    if (await copyAssetToGallery(visual.assetPath)) copied += 1;
    else failed.push(visual.assetPath);
  }

  const counts = countVisuals(visuals);
  console.log(`Gallery generated: ${path.join(GALLERY_OUTPUT_DIR, 'index.html')}`);
  console.log(`Assets copied: ${copied}${failed.length ? `, failed: ${failed.join(', ')}` : ''}`);
  console.log(`Total visuals:     ${counts.total}`);
  console.log(`Active:            ${counts.active}`);
  console.log(`Unused:            ${counts.unused}`);
  console.log(`Approved:          ${counts.approved}`);
  console.log(`Pending:           ${counts.pending}`);
  console.log(`Changed:           ${counts.changed}`);
  console.log(`Broken:            ${counts.broken}`);
  console.log(`Source review:     ${counts.sourceReview}`);
  console.log(`Unresolved names:  ${counts.unresolvedNames}`);

  if (failed.length > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
