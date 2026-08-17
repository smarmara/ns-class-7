/**
 * Generic PDF -> text extractor for source research.
 *
 * Usage: tsx scripts/extract-pdf.ts <in.pdf> <out.txt>
 *
 * Like `ingest-handbook.ts`, the output is a local research artifact only and
 * is never shipped or republished. See LEGAL_AND_SOURCES.md.
 */
import { createRequire } from 'node:module';
import { readFile, writeFile } from 'node:fs/promises';

const require = createRequire(import.meta.url);

const [, , input, output] = process.argv;
if (!input || !output) {
  console.error('Usage: tsx scripts/extract-pdf.ts <in.pdf> <out.txt>');
  process.exit(1);
}

const pdfjs = require('pdfjs-dist/legacy/build/pdf.mjs');
const doc = await pdfjs.getDocument({
  data: new Uint8Array(await readFile(input)),
  useSystemFonts: true,
}).promise;

const out: string[] = [];
for (let i = 1; i <= doc.numPages; i++) {
  const content = await (await doc.getPage(i)).getTextContent();
  const rows = new Map<number, { x: number; s: string }[]>();
  for (const item of content.items) {
    if (typeof item.str !== 'string' || item.str.trim() === '') continue;
    const y = Math.round(item.transform[5] / 3) * 3;
    if (!rows.has(y)) rows.set(y, []);
    rows.get(y)!.push({ x: item.transform[4], s: item.str });
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
  out.push(`\n===== PAGE ${i} =====\n${lines.join('\n')}`);
}

await writeFile(output, out.join('\n'), 'utf8');
console.log(`${input} -> ${output} (${doc.numPages} pages)`);
