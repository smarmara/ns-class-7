import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import metaJson from '../data/signs/sign-meta.json';
import fidelityJson from '../data/signs/sign-fidelity.json';
import { QUESTIONS_DIR, ROOT } from './lib/content';

// The app uses the automatic JSX runtime; tsx's script loader uses the classic
// runtime for this standalone generator. Supplying React globally keeps the
// production artwork module unchanged.
(globalThis as typeof globalThis & { React: typeof React }).React = React;
const { officialCropFor, SIGN_ART } = await import('../src/signs/registry');

type QuestionRef = { id: string; signId?: string; choiceSignIds?: string[]; correctChoice: number };
type Fidelity = (typeof fidelityJson.signs)[keyof typeof fidelityJson.signs];

const questions = (
  await Promise.all(
    (await readdir(QUESTIONS_DIR))
      .filter((file) => file.endsWith('.json'))
      .map(async (file) => JSON.parse(await readFile(path.join(QUESTIONS_DIR, file), 'utf8')) as QuestionRef[]),
  )
).flat();

const activeUses = new Map<string, { id: string; role: 'correct' | 'distractor' | 'shown' }[]>();
for (const question of questions) {
  if (question.signId) {
    const uses = activeUses.get(question.signId) ?? [];
    uses.push({ id: question.id, role: 'shown' });
    activeUses.set(question.signId, uses);
  }
  question.choiceSignIds?.forEach((id, index) => {
    const uses = activeUses.get(id) ?? [];
    uses.push({ id: question.id, role: index === question.correctChoice ? 'correct' : 'distractor' });
    activeUses.set(id, uses);
  });
}

const escape = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[c]!);

// Official-crop signs render the Province's image; everything else renders the
// original SVG registry so the report mirrors exactly what a learner sees.
function renderArt(id: string, visualDescription: string): string {
  const crop = officialCropFor(id);
  if (crop) {
    return `<img src="${escape(crop)}" alt="${escape(visualDescription)}" role="img">`;
  }
  return renderToStaticMarkup(React.createElement('svg', {
    viewBox: '0 0 120 120', role: 'img', 'aria-label': visualDescription,
  }, SIGN_ART[id]));
}

const cardRows = [...activeUses.keys()]
  .sort((a, b) => metaJson.signs[a as keyof typeof metaJson.signs].category.localeCompare(metaJson.signs[b as keyof typeof metaJson.signs].category) || a.localeCompare(b))
  .map((id) => {
    const meta = metaJson.signs[id as keyof typeof metaJson.signs];
    const fidelity = fidelityJson.signs[id as keyof typeof fidelityJson.signs] as Fidelity;
    const sourceUrl = fidelityJson.sources[fidelity.sourceId];
    const uses = activeUses.get(id)!;
    const correct = uses.filter((use) => use.role === 'correct').length;
    const distractors = uses.filter((use) => use.role === 'distractor').length;
    const shown = uses.filter((use) => use.role === 'shown').length;
    const art = renderArt(id, meta.visualDescription);
    const refs = uses.map((use) => `${use.id} (${use.role})`).join(', ');
    const cropFile = officialCropFor(id) ?? null;
    const designation = ('designation' in fidelity && fidelity.designation) || 'Not in NS Schedule';
    return {
      category: meta.category,
      html: `<article><div class="art">${art}</div><div><h3>${escape(meta.label)}</h3><dl><dt>App ID / artwork</dt><dd><code>${escape(id)}</code> / <code>${cropFile ? `official crop ${escape(cropFile)}` : 'src/signs/registry.tsx (SVG)'}</code></dd><dt>Official designation</dt><dd>${escape(designation)}</dd><dt>Schedule</dt><dd>${escape(('schedulePage' in fidelity && fidelity.schedulePage) ? `page ${fidelity.schedulePage}` : '—')} · ${escape(('dimensions' in fidelity && fidelity.dimensions) || '—')}</dd><dt>Status</dt><dd><strong class="status">${escape(fidelity.status)}</strong></dd><dt>Question usage</dt><dd>${shown} shown · ${correct} correct · ${distractors} distractor</dd><dt>Questions</dt><dd>${escape(refs)}</dd><dt>Reference</dt><dd><a href="${escape(sourceUrl)}">Official source</a>${'schedulePage' in fidelity && fidelity.schedulePage ? ` · <a href="${escape(sourceUrl)}#Schedule">Schedule page ${escape(fidelity.schedulePage)}</a>` : ''}</dd></dl></div></article>`,
    };
  });

// Batch coverage: missing crops, legacy refs still in play, batch PNGs unused.
const batchFiles = (await readdir(path.join(ROOT, 'public', 'signs', 'ns-official'))).filter((f) => f.endsWith('.png')).sort();
const missingCrops = Object.entries(fidelityJson.signs)
  .filter(([, entry]) => entry.status === 'official-crop' && (!entry.designation || !batchFiles.includes(`${entry.designation}.png`)))
  .map(([id, entry]) => `${id} → ${entry.designation}.png`);
const legacyRefs = Object.entries(fidelityJson.signs)
  .filter(([signId, entry]) => entry.status === 'legacy-pending-crop' && activeUses.has(signId))
  .map(([signId]) => signId)
  .sort();
const usedCrops = new Set(
  Object.entries(fidelityJson.signs)
    .filter(([, entry]) => entry.status === 'official-crop' && entry.designation && batchFiles.includes(`${entry.designation}.png`))
    .map(([, entry]) => entry.designation),
);
const unmappedBatch = batchFiles.filter((file) => !usedCrops.has(file.replace(/\.png$/, '')));

function noticeList(title: string, items: string[]): string {
  if (items.length === 0) return '';
  return `<section><h2>${escape(title)}</h2><ul>${items.map((item) => `<li><code>${escape(item)}</code></li>`).join('')}</ul></section>`;
}

const grouped = new Map<string, string[]>();
for (const card of cardRows) grouped.set(card.category, [...(grouped.get(card.category) ?? []), card.html]);
const sections = [...grouped].map(([category, cards]) => `<section><h2>${escape(category)}</h2><div class="grid">${cards.join('\n')}</div></section>`).join('\n');
const notices = noticeList('Missing official crops (would block build)', missingCrops)
  + noticeList('Legacy artwork still in active questions', legacyRefs)
  + noticeList('Batch PNGs not mapped to an app sign', unmappedBatch);

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Nova Scotia sign-fidelity audit</title><style>
:root{font:14px/1.4 system-ui;color:#171717;background:#f4f5f7}body{margin:0}header{padding:2rem max(1rem,4vw);background:#102a43;color:#fff}main{padding:1.5rem max(1rem,4vw)}section{margin-bottom:2rem}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(520px,1fr));gap:1rem}article{display:grid;grid-template-columns:140px 1fr;gap:1rem;background:#fff;border:1px solid #ccd3da;border-radius:10px;padding:1rem}svg{display:block;width:125px;height:125px}.art{display:grid;place-items:center;background:#eef1f4;border-radius:8px}.art img{display:block;max-width:125px;max-height:125px;width:auto;height:auto;object-fit:contain}h1,h2,h3{margin:.1em 0 .5em}h2{text-transform:capitalize}h3{font-size:1.05rem}dl{display:grid;grid-template-columns:9rem 1fr;margin:0;gap:.25rem .6rem}dt{font-weight:700}dd{margin:0;overflow-wrap:anywhere}.status{color:#146c43}code{font-size:.84em}@media(max-width:600px){.grid{grid-template-columns:1fr}article{grid-template-columns:1fr}.art{min-height:150px}dl{grid-template-columns:1fr}dt{margin-top:.4rem}}@media(prefers-color-scheme:dark){:root{color:#eee;background:#101820}article{background:#18232d;border-color:#43515d}.art{background:#dfe4e8}a{color:#8dc7ff}}
</style></head><body><header><h1>Nova Scotia road-sign fidelity audit</h1><p>${activeUses.size} active artwork IDs · ${questions.filter((q) => q.signId || q.choiceSignIds).length} active sign questions · verified ${escape(fidelityJson.verifiedAt)}</p><p>Official Schedule crops (all batches: RA-1 through RB-107, RC-2 through RC-6, WC-1, and R-100 through R-204) are served as production artwork where a fidelity match is settled; remaining signs use original vector artwork. Images are rendered exactly as learners see them.</p></header><main>${notices}${sections}</main></body></html>`;

const outputDir = path.join(ROOT, 'reports', 'sign-fidelity');
await mkdir(outputDir, { recursive: true });
await writeFile(path.join(outputDir, 'index.html'), html, 'utf8');
console.log(`Wrote ${path.join(outputDir, 'index.html')} (${activeUses.size} signs).`);
