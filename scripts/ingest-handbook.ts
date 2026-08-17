/**
 * Extracts plain text, page by page, from the locally cached official
 * Nova Scotia Driver's Handbook PDFs in `.sources/handbook/`.
 *
 * The extracted text is a *research artifact* only. It is never shipped in the
 * app bundle and is never republished — see LEGAL_AND_SOURCES.md. It exists so
 * that a maintainer writing or reviewing a question can cite an exact page.
 *
 * Usage: pnpm sources:ingest
 */
import { createRequire } from 'node:module';
import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC_DIR = path.join(ROOT, '.sources', 'handbook');
const OUT_DIR = path.join(ROOT, '.sources', 'handbook-text');

async function extract(pdfPath: string): Promise<string> {
  // pdfjs-dist legacy build runs in plain Node without a DOM.
  const pdfjs = require('pdfjs-dist/legacy/build/pdf.mjs');
  const data = new Uint8Array(await readFile(pdfPath));
  const doc = await pdfjs.getDocument({ data, useSystemFonts: true }).promise;

  const pages: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();

    // Group text items into visual lines by their y position so that the
    // handbook's multi-column layout stays readable.
    const rows = new Map<number, { x: number; s: string }[]>();
    for (const item of content.items) {
      if (typeof item.str !== 'string' || item.str.trim() === '') continue;
      const y = Math.round(item.transform[5] / 4) * 4;
      const x = item.transform[4];
      if (!rows.has(y)) rows.set(y, []);
      rows.get(y)!.push({ x, s: item.str });
    }

    const lines = [...rows.entries()]
      .sort((a, b) => b[0] - a[0])
      .map(([, items]) =>
        items
          .sort((a, b) => a.x - b.x)
          .map((it) => it.s)
          .join('')
          .replace(/\s+/g, ' ')
          .trim(),
      )
      .filter(Boolean);

    pages.push(`\n===== PAGE ${i} =====\n${lines.join('\n')}`);
  }
  return pages.join('\n');
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const files = (await readdir(SRC_DIR)).filter((f) => f.toLowerCase().endsWith('.pdf'));
  if (files.length === 0) {
    console.error(`No PDFs found in ${SRC_DIR}`);
    process.exitCode = 1;
    return;
  }
  for (const file of files) {
    const text = await extract(path.join(SRC_DIR, file));
    const out = path.join(OUT_DIR, file.replace(/\.pdf$/i, '.txt'));
    await writeFile(out, text, 'utf8');
    console.log(`${file} -> ${path.relative(ROOT, out)} (${text.length} chars)`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
