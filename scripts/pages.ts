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
 * The base defaults to the repository name declared in app.identity.json,
 * which is what GitHub Pages puts in a project-site URL, and can be overridden
 * with --base or PAGES_BASE_PATH. Nothing in src/ reads any of this — the only
 * consumer is `base` in vite.config.ts.
 *
 * Written in Node rather than as a shell one-liner because `VAR=x cmd` is not
 * valid on Windows, and this repository is developed on Windows.
 */
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
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
 * The repository name, which is what GitHub Pages puts in a project-site URL.
 *
 * Read from app.identity.json rather than from the working directory, which
 * used to be the default and is simply whatever the folder happens to be called
 * — locally that is `driving`, so a bare `pnpm pages:build` built for the
 * meaningless base `/driving/`.
 */
function repositoryName(): string {
  const identity = JSON.parse(
    readFileSync(path.join(ROOT, 'app.identity.json'), 'utf8'),
  ) as { web?: { repository?: string } };
  const repository = identity.web?.repository?.trim();
  return repository ? (repository.split('/').at(-1) ?? path.basename(ROOT)) : path.basename(ROOT);
}

/**
 * Normalised to `/segment/` — the shape Vite, `scope` and Workbox all expect.
 *
 * The colon/backslash guard is for Git Bash on Windows, which "helpfully"
 * rewrites an environment value that looks like a Unix path into a Windows one:
 * `PAGES_BASE_PATH=/ns-class-7/` arrives as
 * `C:/Program Files/Git/ns-class-7/`. Taking the last real segment
 * recovers the intent instead of silently building for a nonsense base.
 */
function basePath(): string {
  const raw = (flag('base') ?? process.env.PAGES_BASE_PATH)?.trim();
  let name = raw && raw !== '/' ? raw : repositoryName();

  if (name.includes(':') || name.includes('\\')) {
    const segments = name.split(/[\\/]+/).filter(Boolean);
    name = segments.at(-1) ?? path.basename(ROOT);
  }
  return `/${name.replace(/^\/+|\/+$/g, '')}/`;
}

const base = basePath();

/*
 * Output directory, defaulting to `dist-pages`.
 *
 * It used to default to `dist`, and that was a trap. `dist/` is the ROOT build
 * — what production deploys and what the main end-to-end suite serves on :4173.
 * A bare `pnpm pages:build` would quietly replace it with a subpath build, and
 * the next test run would serve `/ns-class-7/assets/…` from the domain root and
 * fail ~200 tests with 404s that looked like application bugs.
 *
 * Nothing needed the old default: CI builds the deploy artifact with
 * `pnpm build`, not through this script. So the two builds now simply never
 * share a directory, and `--out dist` remains available if someone really means
 * to overwrite the root build.
 */
const outDir = (flag('out') ?? process.env.PAGES_OUT_DIR)?.trim() || 'dist-pages';
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
