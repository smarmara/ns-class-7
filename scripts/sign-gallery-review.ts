/**
 * Sign gallery review server.
 *
 * Developer-only localhost server that serves the generated gallery and
 * persists visual approvals into the repository. Binds explicitly to
 * 127.0.0.1, never 0.0.0.0.
 *
 * The server does not trust anything the page sends beyond the app id. It
 * rebuilds the visual from the same shared inventory the gallery was generated
 * from and fingerprints *that*, so the record on disk always describes the
 * artwork, mapping and name as they exist right now.
 *
 * Usage: pnpm signs:gallery:review
 */

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { generateGalleryHtml } from './lib/sign-gallery-html';
import {
  approveVisual,
  buildVisualInventory,
  countVisuals,
  loadApprovals,
  revokeVisual,
  type GalleryVisual,
} from './lib/sign-visuals';
import { ROOT } from './lib/content';

const GALLERY_OUTPUT_DIR = path.join(ROOT, 'reports', 'sign-gallery');

const HOST = '127.0.0.1';
const PORT = 3847;

async function findVisual(appId: string): Promise<GalleryVisual | undefined> {
  const visuals = await buildVisualInventory();
  return visuals.find((visual) => visual.appId === appId);
}

async function readBody(request: import('node:http').IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(chunk as Buffer);
  if (chunks.length === 0) return {};
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

function sendJson(
  response: import('node:http').ServerResponse,
  status: number,
  payload: unknown,
): void {
  response.writeHead(status, { 'Content-Type': 'application/json' });
  response.end(JSON.stringify(payload));
}

const server = createServer(async (request, response) => {
  // Same-origin only; the page is served from this server.
  response.setHeader('Access-Control-Allow-Origin', `http://${HOST}:${PORT}`);
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (request.method === 'OPTIONS') {
    response.writeHead(204);
    response.end();
    return;
  }

  const url = request.url ?? '/';

  try {
    if (url === '/' || url === '/index.html') {
      // Rendered live from the repository on every request, so a browser
      // refresh always shows the approvals that are actually on disk rather
      // than whatever state the last `pnpm signs:gallery` happened to capture.
      // The generated file stays on disk for reading the gallery offline.
      const html = generateGalleryHtml(await buildVisualInventory());
      response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      response.end(html);
      return;
    }

    if (url.startsWith('/assets/')) {
      const relative = decodeURIComponent(url.slice('/assets/'.length).split('?')[0] ?? '');
      const filePath = path.join(GALLERY_OUTPUT_DIR, 'assets', relative);
      // Refuse anything that escapes the generated assets directory.
      if (!filePath.startsWith(path.join(GALLERY_OUTPUT_DIR, 'assets'))) {
        response.writeHead(403, { 'Content-Type': 'text/plain' });
        response.end('Forbidden');
        return;
      }
      try {
        const buffer = await readFile(filePath);
        const type = path.extname(filePath).toLowerCase() === '.png' ? 'image/png' : 'application/octet-stream';
        response.writeHead(200, { 'Content-Type': type });
        response.end(buffer);
      } catch {
        response.writeHead(404, { 'Content-Type': 'text/plain' });
        response.end('Asset not found');
      }
      return;
    }

    if (url === '/api/approvals' && request.method === 'GET') {
      sendJson(response, 200, await loadApprovals());
      return;
    }

    if (url === '/api/state' && request.method === 'GET') {
      const visuals = await buildVisualInventory();
      sendJson(response, 200, {
        counts: countVisuals(visuals),
        visuals: visuals.map((visual) => ({
          appId: visual.appId,
          displayName: visual.displayName,
          designation: visual.designation,
          status: visual.approvalStatus,
          sourceReview: visual.isSourceReview,
        })),
      });
      return;
    }

    if (url === '/api/approve' && request.method === 'POST') {
      const body = (await readBody(request)) as { appId?: string };
      if (!body.appId) {
        sendJson(response, 400, { error: 'appId required' });
        return;
      }
      const visual = await findVisual(body.appId);
      if (!visual) {
        sendJson(response, 404, { error: `Unknown visual: ${body.appId}` });
        return;
      }
      const result = await approveVisual(visual);
      if (!result.ok) {
        sendJson(response, 409, { error: result.error });
        return;
      }
      sendJson(response, 200, {
        status: 'approved',
        appId: visual.appId,
        displayName: visual.displayName,
        fingerprint: result.fingerprint,
        counts: countVisuals(await buildVisualInventory()),
      });
      return;
    }

    if (url === '/api/revoke' && request.method === 'POST') {
      const body = (await readBody(request)) as { appId?: string };
      if (!body.appId) {
        sendJson(response, 400, { error: 'appId required' });
        return;
      }
      const result = await revokeVisual(body.appId);
      if (!result.ok) {
        sendJson(response, 404, { error: result.error });
        return;
      }
      const visuals = await buildVisualInventory();
      const visual = visuals.find((candidate) => candidate.appId === body.appId);
      sendJson(response, 200, {
        status: visual?.approvalStatus ?? 'pending',
        appId: body.appId,
        counts: countVisuals(visuals),
      });
      return;
    }

    response.writeHead(404, { 'Content-Type': 'text/plain' });
    response.end('Not found');
  } catch (error) {
    sendJson(response, 500, { error: String(error) });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Sign gallery review server running at http://${HOST}:${PORT}`);
  console.log('Approvals are written to data/signs/visual-approvals.json');
  console.log('Press Ctrl+C to stop');
});

process.on('SIGINT', () => {
  console.log('\nShutting down…');
  server.close(() => process.exit(0));
});

process.on('SIGTERM', () => {
  server.close(() => process.exit(0));
});
