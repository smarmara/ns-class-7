/// <reference types="vitest" />
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'node:path';
import { computeContentVersion, type ContentVersionInput } from './scripts/lib/content-version';
import { normaliseBase } from './scripts/lib/deploy-base';
import { cropKeyFor } from './src/signs/cropKey';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));
const identity = JSON.parse(
  readFileSync(new URL('./app.identity.json', import.meta.url), 'utf8'),
) as {
  fontAwesomeKit: { url: string };
  web?: { customDomain?: string; productionUrl?: string };
};

/**
 * Font Awesome Pro hosted Kit.
 *
 * The deployed site loads Pro icons from the maintainer's Kit rather than
 * shipping Pro artwork, because Pro icon data cannot be redistributed through a
 * public repository. The Kit id is a public client-side identifier, so it lives
 * in app.identity.json alongside the rest of the app's identity; FA_KIT_URL
 * overrides it for a fork or a CI build without editing the file.
 *
 * Injected here rather than written into index.html so there is exactly one
 * source for it, and so a fork that clears the value simply gets no Kit — which
 * the app is built to tolerate.
 */
function fontAwesomeKitTag(): string {
  const url = (process.env.FA_KIT_URL ?? identity.fontAwesomeKit.url).trim();
  if (!url) return '';
  return `    <script src="${url}" crossorigin="anonymous" referrerpolicy="origin"></script>
`;
}

/**
 * Canonical and og:url for the production site.
 *
 * The same page will answer on more than one address — the apex domain, `www.`,
 * and the old `<owner>.github.io/<repo>/` project URL that GitHub keeps
 * redirecting. Declaring one canonical address is what stops those being
 * treated as separate pages, and gives a shared link a stable URL.
 *
 * Only emitted for a root build with a production URL declared. A project-site
 * build is a fork or a preview, not the canonical copy of anything, so it gets
 * no tag rather than a tag pointing at somebody else's domain. `SITE_URL`
 * overrides the declared value for a fork with its own domain.
 */
function canonicalTags(base: string): string {
  const url = (process.env.SITE_URL ?? identity.web?.productionUrl ?? '').trim();
  if (!url || base !== '/') return '';
  return `    <link rel="canonical" href="${url}" />
    <meta property="og:url" content="${url}" />
`;
}

/**
 * Content version is a digest of the learner-facing content at build time, so
 * a maintainer (and the Sources page) can tell two deployments apart without
 * diffing data files. It changes when the questions change, when the sign
 * artwork registry changes, or when any official Schedule crop that an active
 * question displays changes on disk.
 */
function contentVersion(): string {
  const inputs: ContentVersionInput[] = [];

  // The question bank.
  const questionsDir = new URL('./data/questions/', import.meta.url);
  for (const file of readdirSync(questionsDir).filter((f) => f.endsWith('.json')).sort()) {
    inputs.push({ name: `data/questions/${file}`, data: readFileSync(new URL(file, questionsDir)) });
  }
  // The artwork registry (SVG artwork and the official-crop mapping).
  inputs.push({
    name: 'src/signs/registry.tsx',
    data: readFileSync(new URL('./src/signs/registry.tsx', import.meta.url)),
  });
  // The fidelity registry, which decides which signs are on official crops.
  inputs.push({
    name: 'data/signs/sign-fidelity.json',
    data: readFileSync(new URL('./data/signs/sign-fidelity.json', import.meta.url)),
  });
  // Official crops referenced by active questions — only those actually shown
  // to learners, not arbitrary public/ files.
  for (const rel of activeOfficialCropFiles()) {
    inputs.push({ name: rel, data: readFileSync(new URL(rel, import.meta.url)) });
  }

  return computeContentVersion(inputs);
}

/**
 * Official-crop PNG files referenced by questions servable to a learner
 * (current legal status against an in-force law version). Sorted for
 * determinism.
 */
function activeOfficialCropFiles(): string[] {
  const fidelity = JSON.parse(
    readFileSync(new URL('./data/signs/sign-fidelity.json', import.meta.url), 'utf8'),
  ) as {
    signs: Record<string, { status?: string; designation?: string; asset?: string }>;
  };
  const legal = JSON.parse(
    readFileSync(new URL('./data/exam-config/legal-status.json', import.meta.url), 'utf8'),
  ) as {
    activeLawVersion: string;
    lawVersions: { id: string; inForce: boolean }[];
  };
  const lawById = new Map(legal.lawVersions.map((v) => [v.id, v]));

  const crops = new Set<string>();
  const questionsDir = new URL('./data/questions/', import.meta.url);
  for (const file of readdirSync(questionsDir).filter((f) => f.endsWith('.json')).sort()) {
    const questions = JSON.parse(readFileSync(new URL(file, questionsDir), 'utf8')) as {
      legalStatus?: string;
      lawVersion?: string;
      signId?: string;
      choiceSignIds?: string[];
    }[];
    for (const q of questions) {
      if (q.legalStatus !== 'current') continue;
      const version = lawById.get(q.lawVersion ?? legal.activeLawVersion);
      if (!version?.inForce) continue;
      const signIds = [...(q.signId ? [q.signId] : []), ...(q.choiceSignIds ?? [])];
      for (const signId of signIds) {
        const entry = fidelity.signs[signId];
        if (entry?.status !== 'official-crop') continue;
        // Variable-number signs (RB-1 "Maximum speed") point at a variant image
        // rather than at `<designation>.png`, so hash what the learner is
        // actually served: maximum-speed-50 hashes RB-1A.png, not RB-1.png.
        const cropKey = cropKeyFor(entry);
        if (!cropKey) continue;
        const file = `public/signs/ns-official/${cropKey}.png`;
        if (existsSync(new URL(file, import.meta.url))) crops.add(file);
      }
    }
  }
  return [...crops].sort();
}

/**
 * Deployment base path.
 *
 * The app is a fully static bundle, so where it is mounted is a deployment
 * decision, not an application one — and nothing in src/ knows or cares which
 * host it is on. `VITE_BASE_PATH` is the single place that decision is made:
 *
 *   unset or `/`     a root deployment — the dev server, and production at
 *                    https://roadlearn.ca/ (also Netlify, Cloudflare Pages…)
 *   `/ns-class-7/`   a GitHub Pages *project* site, where the repository name
 *                    is part of the URL
 *
 * Production resolves this in the Pages workflow via `pnpm deploy:base`: a
 * custom domain declared in app.identity.json means a root build, and anything
 * else falls back to what GitHub Pages reports, so a fork deploys to its own
 * project URL with no edits.
 *
 * `normaliseBase` is shared with that resolver rather than reimplemented here.
 * The two had drifted: this copy lacked the Windows guard, so a hand-run
 * `VITE_BASE_PATH=/ pnpm build` in Git Bash silently produced a manifest scoped
 * to `/C:/Program Files/Git/` — a build that looks fine and is unusable.
 */
function basePath(): string {
  return normaliseBase(process.env.VITE_BASE_PATH);
}

const base = basePath();

export default defineConfig({
  base,
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __CONTENT_VERSION__: JSON.stringify(contentVersion()),
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
      '@data': path.resolve(import.meta.dirname, 'data'),
    },
  },
  plugins: [
    {
      // Injects the Font Awesome Kit script and the canonical URL into the
      // built HTML, so both have exactly one source (app.identity.json).
      name: 'deployment-head-tags',
      transformIndexHtml(html: string) {
        const tags = `${canonicalTags(base)}${fontAwesomeKitTag()}`;
        return tags ? html.replace('</head>', `${tags}  </head>`) : html;
      },
    },
    react(),
    VitePWA({
      // A released update must never yank the rug from under a learner in the
      // middle of a mock test. 'prompt' keeps the new service worker waiting
      // until the learner chooses to refresh; the update banner in the app is
      // what turns that into an obvious, safe "refresh to update" choice.
      registerType: 'prompt',
      // The app registers the worker itself via `virtual:pwa-register`
      // (see src/pwa.ts), so nothing is injected into the HTML.
      injectRegister: null,
      includeAssets: ['favicon.svg'],
      manifest: {
        name: "Nova Scotia Class 7 Study — unofficial",
        short_name: 'NS Class 7',
        description:
          "An independent, unofficial study aid for the Nova Scotia Class 7 Learner's Licence knowledge test.",
        theme_color: '#0f172a',
        background_color: '#f8fafc',
        display: 'standalone',
        orientation: 'portrait',
        /*
         * Scope and start_url must be the deployment base, not '/'.
         *
         * `scope` is what makes an installed PWA treat these URLs as "inside
         * the app": get it wrong on a GitHub Pages project site and the browser
         * refuses to install, or opens links in a browser tab instead of the
         * installed window. `id` pins the app's identity so that changing the
         * host later does not register a second, duplicate installed app.
         */
        id: base,
        start_url: base,
        scope: base,
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // Resolved against the base for the same reason as `scope`: under
        // /ns-class-7/ the fallback document is not at the domain root.
        navigateFallback: `${base}index.html`,
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
  },
});
