/**
 * GitHub-Pages-style build and preview.
 *
 * A GitHub Pages *project* site is served from `https://<user>.github.io/<repo>/`,
 * not from the domain root. That single fact breaks a surprising amount: every
 * root-absolute asset path 404s, the PWA scope no longer matches the app, and
 * the service worker registers against the wrong scope. None of it shows up in
 * a normal `pnpm dev` or `pnpm preview`, both of which serve from `/`.
 *
 * So this exists to make the subdirectory case a thing you can actually run:
 *
 *   pnpm pages:build      build with VITE_BASE_PATH set
 *   pnpm pages:preview    build, then serve it at that subpath
 *
 * The base defaults to the repository directory name, which is what GitHub
 * Pages will use, and can be overridden with PAGES_BASE_PATH. Nothing in src/
 * reads any of this — the only consumer is `base` in vite.config.ts.
 *
 * Written in Node rather than as a shell one-liner because `VAR=x cmd` is not
 * valid on Windows, and this repository is developed on Windows.
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { ROOT } from './lib/content';

const mode = process.argv[2];
if (mode !== 'build' && mode !== 'preview') {
  console.error('Usage: tsx scripts/pages.ts build|preview [--base <name>] [--out <dir>]');
  process.exit(1);
}

/** CLI flags beat environment variables; both are optional. */
function flag(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? undefined : process.argv[index + 1];
}

/**
 * Normalised to `/segment/` — the shape Vite, `scope` and Workbox all expect.
 *
 * The colon/backslash guard is for Git Bash on Windows, which "helpfully"
 * rewrites an environment value that looks like a Unix path into a Windows one:
 * `PAGES_BASE_PATH=/ns-class-7-study/` arrives as
 * `C:/Program Files/Git/ns-class-7-study/`. Taking the last real segment
 * recovers the intent instead of silently building for a nonsense base.
 */
function basePath(): string {
  const raw = (flag('base') ?? process.env.PAGES_BASE_PATH)?.trim();
  let name = raw && raw !== '/' ? raw : path.basename(ROOT);

  if (name.includes(':') || name.includes('\\')) {
    const segments = name.split(/[\\/]+/).filter(Boolean);
    name = segments.at(-1) ?? path.basename(ROOT);
  }
  return `/${name.replace(/^\/+|\/+$/g, '')}/`;
}

const base = basePath();

/*
 * Output directory. Defaults to `dist`, which is what CI uploads as the Pages
 * artifact. The subpath regression suite overrides it so that building for
 * `/ns-class-7-study/` cannot clobber the root-hosted `dist/` that the main
 * end-to-end suite is serving.
 */
const outDir = (flag('out') ?? process.env.PAGES_OUT_DIR)?.trim() || 'dist';
const env = { ...process.env, VITE_BASE_PATH: base };

function run(args: string[]): number {
  const result = spawnSync('pnpm', args, { stdio: 'inherit', env, shell: true, cwd: ROOT });
  return result.status ?? 1;
}

console.log(`\nBuilding for a GitHub Pages project site at base "${base}"\n`);
const built = run(['exec', 'vite', 'build', '--outDir', outDir, '--emptyOutDir']);
if (built !== 0) process.exit(built);

if (mode === 'build') {
  console.log(`\nBuilt into ${outDir}/ for "${base}".`);
  console.log('Serving that folder from the domain root will 404 — use `pnpm pages:preview`.');
  process.exit(0);
}

console.log(`\nServing at http://localhost:4180${base}\n`);
// `vite preview` reads the same config, so it mounts the app at the same base.
process.exit(run(['exec', 'vite', 'preview', '--outDir', outDir, '--port', '4180', '--strictPort']));
