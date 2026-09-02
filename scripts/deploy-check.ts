/**
 * Confirms a built artifact actually matches the base path it was meant for.
 *
 * A base-path mistake is a peculiarly nasty class of bug: the build succeeds,
 * every test passes, the audit is clean, and the deployed site is a blank page
 * because `/ns-class-7/assets/index-abc.js` does not exist on roadlearn.ca.
 * Nothing catches it except looking at the artifact, which is what this does.
 *
 * Checks the four places the base actually has to appear:
 *   - the script and stylesheet URLs in index.html
 *   - the PWA manifest's `scope`, `start_url` and `id`
 *   - the service worker's location and its navigation fallback
 *   - the absence of any leftover path from a different base
 *
 * Usage: pnpm deploy:check                 (expects the root production base)
 *        EXPECTED_BASE=/ns-class-7/ pnpm deploy:check
 *        pnpm deploy:check --base /ns-class-7/ --dist dist-pages
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { ROOT } from './lib/content';
import { normaliseBase } from './lib/deploy-base';

function flag(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? undefined : process.argv[index + 1];
}

const base = normaliseBase(flag('base') ?? process.env.EXPECTED_BASE ?? '/');
const distDir = path.join(ROOT, (flag('dist') ?? process.env.DIST_DIR ?? 'dist').trim());

const problems: string[] = [];
const notes: string[] = [];

function main(): void {
  if (!existsSync(distDir)) {
    console.error(`No ${path.relative(ROOT, distDir)}/ — run a build first.`);
    process.exit(1);
  }

  /* ------------------------------------------------------------ index.html */

  const indexPath = path.join(distDir, 'index.html');
  const html = readFileSync(indexPath, 'utf8');

  // Every local reference must sit under the base. Off-origin URLs are a
  // separate concern (the Font Awesome Kit is allowed, and is checked below).
  const localRefs = [...html.matchAll(/(?:src|href)="(\/[^"]*)"/g)].map((m) => m[1]!);
  const strays = localRefs.filter((ref) => !ref.startsWith(base));
  if (strays.length > 0) {
    problems.push(`index.html references ${strays.join(', ')}, which is outside the base ${base}`);
  } else {
    notes.push(`index.html: ${localRefs.length} local reference(s), all under ${base}`);
  }

  if (localRefs.length === 0) {
    problems.push('index.html has no local asset references — the build looks wrong.');
  }

  /* -------------------------------------------------------------- manifest */

  const manifestFile = readdirSync(distDir).find((f) => /\.webmanifest$/.test(f));
  if (!manifestFile) {
    problems.push('No .webmanifest in the build — the app would not be installable.');
  } else {
    const manifest = JSON.parse(readFileSync(path.join(distDir, manifestFile), 'utf8')) as {
      scope?: string;
      start_url?: string;
      id?: string;
      icons?: { src: string }[];
    };

    // Get `scope` wrong on a project site and the browser refuses to install the
    // app, or opens its own links in a browser tab instead of the app window.
    for (const key of ['scope', 'start_url', 'id'] as const) {
      const value = manifest[key];
      if (value !== base) {
        problems.push(`manifest ${key} is ${JSON.stringify(value)}, expected ${JSON.stringify(base)}`);
      }
    }
    if (!problems.some((p) => p.startsWith('manifest'))) {
      notes.push(`manifest: scope, start_url and id are all ${base}`);
    }

    // Icons are relative in the manifest, so they resolve against it; a
    // root-absolute icon would escape the base on a project site.
    const absoluteIcons = (manifest.icons ?? []).filter((icon) => icon.src.startsWith('/'));
    if (absoluteIcons.length > 0) {
      problems.push(
        `manifest icons use root-absolute paths: ${absoluteIcons.map((i) => i.src).join(', ')}`,
      );
    } else {
      notes.push(`manifest: ${(manifest.icons ?? []).length} icon(s), all base-relative`);
    }
  }

  /* -------------------------------------------------------- service worker */

  const swPath = path.join(distDir, 'sw.js');
  if (!existsSync(swPath)) {
    problems.push('No sw.js in the build — offline support would be missing.');
  } else {
    const sw = readFileSync(swPath, 'utf8');
    // Workbox resolves navigateFallback at build time; if it kept a different
    // base, a refresh on a deep link serves the wrong document or nothing.
    const fallback = /"(\/[^"]*index\.html)"/.exec(sw)?.[1];
    if (fallback && !fallback.startsWith(base)) {
      problems.push(`service worker navigateFallback is ${fallback}, outside the base ${base}`);
    } else {
      notes.push(`service worker: navigateFallback ${fallback ?? '(none found)'} — scope ${base}`);
    }
  }

  /* --------------------------------------------- no other base left behind */

  /*
   * The specific regression this guards: a root build that still carries
   * `/ns-class-7/` somewhere, or a project build that lost it. Looks for a
   * path segment that looks like a repository name at the start of a URL.
   */
  const OTHER_BASE = /["'(](\/[a-z0-9][a-z0-9._-]*\/)(?:assets|signs|icons|manifest|sw\.js)/gi;
  const foreign = new Set<string>();
  for (const file of readdirSync(distDir).filter((f) => /\.(html|js|css|webmanifest)$/.test(f))) {
    const text = readFileSync(path.join(distDir, file), 'utf8');
    for (const match of text.matchAll(OTHER_BASE)) {
      if (match[1] !== base) foreign.add(`${match[1]} (in ${file})`);
    }
  }
  if (foreign.size > 0) {
    problems.push(`Paths from a different base survive in the build: ${[...foreign].join(', ')}`);
  } else {
    notes.push('No paths from any other base path survive in the build');
  }

  /* ----------------------------------------------- the Font Awesome Kit URL */

  // The Kit is absolute by construction. If it were ever treated as a local
  // path it would be rebased to `<base>kit.fontawesome.com/…` and 404 silently,
  // leaving a deployment with no icons and no error explaining why.
  const kit = /<script[^>]+src="([^"]*fontawesome[^"]*)"/.exec(html)?.[1];
  if (kit) {
    if (!/^https:\/\/kit\.fontawesome\.com\//.test(kit)) {
      problems.push(`Font Awesome Kit URL is ${kit} — it must stay absolute`);
    } else {
      notes.push(`Font Awesome Kit loads from ${kit}`);
    }
  }

  /* ------------------------------------------------------------- report */

  console.log(`\nDeployment artifact check — ${path.relative(ROOT, distDir)}/ for base ${base}`);
  console.log('='.repeat(72));
  for (const note of notes) console.log(`  ok  ${note}`);
  if (problems.length > 0) {
    console.log('');
    for (const problem of problems) console.log(`  x   ${problem}`);
    console.log(`\n${problems.length} problem(s). This artifact would not work at ${base}.`);
    process.exit(1);
  }
  console.log(`\nThe artifact matches its deployment target.`);
}

main();
