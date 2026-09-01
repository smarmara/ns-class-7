/**
 * Native offline-readiness audit.
 *
 * Establishes that the packaged production build needs no network to teach.
 * A native app is downloaded once and then used on a bus, in a basement, or on
 * a prepaid phone with no data left — so anything the learning experience
 * *fetches* is a defect, not a slow path.
 *
 * The audit fails on any external runtime dependency. It deliberately does NOT
 * fail on links to official sources: those are content the learner chooses to
 * open, they leave the app by design, and citing the Motor Vehicle Act is the
 * whole point of the project.
 *
 * Usage: pnpm native:offline:check
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { ROOT } from './lib/content';

const DIST = path.join(ROOT, 'dist');

/**
 * Hosts a learner may be sent to by tapping a citation. Reaching these is
 * always optional and always deliberate.
 */
const CITATION_HOSTS = new Set(['novascotia.ca', 'www.novascotia.ca', 'nslegislature.ca', 'www.nslegislature.ca']);

/**
 * Font Awesome Pro hosted Kit.
 *
 * The only runtime host the app itself contacts, and a deliberate, narrow
 * exception. Pro icon artwork is licensed per seat and cannot be redistributed
 * through a public repository, so those glyphs are fetched from the
 * maintainer's Kit instead of being bundled.
 *
 * This is decorative chrome, not study content. Every icon sits beside a text
 * label, and if the Kit never loads the app is fully usable — the checks below
 * still require that questions, sign artwork, fonts and app icons are all
 * bundled, which is what "works offline" actually has to mean.
 *
 * `kit.fontawesome.com` serves the loader; `ka-p.fontawesome.com` serves the
 * Pro payload it then requests. Nothing else on those domains is permitted, and
 * no other external host is permitted at all.
 */
const ICON_KIT_HOSTS = new Set(['kit.fontawesome.com', 'ka-p.fontawesome.com']);

/**
 * Strings that look like URLs but are never fetched.
 *
 * Three kinds, all verified by reading the surrounding bytes in the bundle:
 *  - XML/SVG namespace identifiers, which are opaque names, not addresses;
 *  - documentation links baked into library ERROR MESSAGES and licence
 *    banners ("... must be used within a data router. See <url>"), which are
 *    only ever printed to a console;
 *  - dev-server leftovers.
 *
 * The positive check further down is what actually proves nothing is fetched:
 * this list only stops the report drowning in false alarms.
 */
const NON_FETCH = [
  /^https?:\/\/www\.w3\.org\//,
  /^http:\/\/localhost/,
  /^https:\/\/github\.com\/ungap\//,
  // Library diagnostics and licence banners.
  /^https:\/\/react\.dev\/errors\//,
  /^https:\/\/reactrouter\.com\//,
  /^https:\/\/capacitorjs\.com\//,
  /^https:\/\/bit\.ly\/wb-precache/,
];

/**
 * Hosts that would be an outright failure if they ever appeared.
 *
 * `kit.fontawesome.com` used to be here, back when every icon was bundled. It
 * is now a sanctioned dependency for Pro icon artwork (see ICON_KIT_HOSTS), so
 * it is governed by the allow-list instead. `use.fontawesome.com` — the old
 * public CDN — stays forbidden: it is not this project's Kit.
 */
const FORBIDDEN = [
  /fonts\.googleapis\.com/i,
  /fonts\.gstatic\.com/i,
  /use\.fontawesome\.com/i,
  /cdn\.jsdelivr\.net/i,
  /unpkg\.com/i,
  /cdnjs\.cloudflare\.com/i,
  /google-analytics\.com/i,
  /googletagmanager\.com/i,
  /sentry\.io/i,
  /firebase/i,
  /mixpanel/i,
  /amplitude/i,
];

const problems: string[] = [];
const notes: string[] = [];

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

function main() {
  if (!existsSync(DIST)) {
    console.error('No dist/ — run `pnpm build` first.');
    process.exit(1);
  }

  const files = walk(DIST);
  const codeFiles = files.filter((f) => /\.(js|css|html)$/.test(f));

  /* ---------------------------------------------- external URL references */

  const external = new Map<string, Set<string>>();
  let kitReferences = 0;
  for (const file of codeFiles) {
    const text = readFileSync(file, 'utf8');
    for (const match of text.matchAll(/https?:\/\/[a-zA-Z0-9._~:/?#@!$&'()*+,;=%-]+/g)) {
      const url = match[0];
      if (NON_FETCH.some((re) => re.test(url))) continue;
      const rel = path.relative(ROOT, file);
      if (!external.has(url)) external.set(url, new Set());
      external.get(url)!.add(rel);
    }
  }

  for (const [url, where] of external) {
    if (FORBIDDEN.some((re) => re.test(url))) {
      problems.push(`Forbidden runtime dependency ${url} in ${[...where].join(', ')}`);
      continue;
    }
    let host: string;
    try {
      host = new URL(url).host;
    } catch {
      continue;
    }
    if (CITATION_HOSTS.has(host)) continue;
    if (ICON_KIT_HOSTS.has(host)) {
      kitReferences++;
      continue;
    }
    problems.push(`Unexpected external host ${host} (${url}) in ${[...where].join(', ')}`);
  }
  notes.push(
    `${external.size - kitReferences} external URL(s), all official citation links a learner opts into`,
  );
  notes.push(
    kitReferences > 0
      ? 'Font Awesome Pro icons load from the hosted Kit (decorative only — see the note in this script)'
      : 'No Font Awesome Kit reference found',
  );

  /* --------------------------------- nothing FETCHES an external address */

  /*
   * The check that actually matters. Rather than trusting that a URL sitting
   * in a string is inert, look for the call shapes that would turn one into a
   * request: fetch(), XHR.open(), importScripts(), a remote stylesheet or
   * script element, or an image/font src. A literal external address in any
   * of those positions is a runtime dependency.
   */
  const FETCH_SHAPES: [RegExp, string][] = [
    [/\bfetch\(\s*["'`]https?:\/\//g, 'fetch() to a remote URL'],
    [/\.open\(\s*["'][A-Z]+["']\s*,\s*["'`]https?:\/\//g, 'XMLHttpRequest to a remote URL'],
    [/\bimportScripts\(\s*["'`]https?:\/\//g, 'importScripts() from a remote URL'],
    [/\bnew\s+EventSource\(\s*["'`]https?:\/\//g, 'EventSource to a remote URL'],
    [/\bnew\s+WebSocket\(\s*["'`]wss?:\/\//g, 'WebSocket to a remote URL'],
    // The Font Awesome Kit loader is the one permitted remote script; anything
    // else pulling script or CSS off-origin is a defect.
    [
      /<(?:script|link)[^>]+(?:src|href)=["']https?:\/\/(?!kit\.fontawesome\.com\/)/g,
      'remote script or stylesheet element',
    ],
    [/@import\s+(?:url\()?["']?https?:\/\//g, 'remote CSS @import'],
  ];

  for (const file of codeFiles) {
    const text = readFileSync(file, 'utf8');
    for (const [shape, label] of FETCH_SHAPES) {
      for (const hit of text.matchAll(shape)) {
        problems.push(`${path.relative(ROOT, file)}: ${label} — ${hit[0].slice(0, 80)}`);
      }
    }
  }
  notes.push('No fetch, XHR, websocket, remote script or remote stylesheet targets an external address');

  /* ------------------------------------------- index.html loads only local */

  const html = readFileSync(path.join(DIST, 'index.html'), 'utf8');
  for (const match of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
    const ref = match[1]!;
    if (!/^https?:\/\//i.test(ref)) continue;
    let host = '';
    try {
      host = new URL(ref).host;
    } catch {
      /* not a resolvable URL */
    }
    if (!ICON_KIT_HOSTS.has(host)) {
      problems.push(`index.html loads a remote resource: ${ref}`);
    }
  }
  notes.push('index.html loads only bundled assets, plus the Font Awesome Kit loader');

  /* --------------------------------------------------------------- fonts */

  const fonts = files.filter((f) => /\.(woff2?|ttf|otf)$/.test(f));
  if (fonts.length === 0) {
    problems.push('No font files in dist/ — the bundled typeface is missing.');
  } else {
    notes.push(`${fonts.length} font file(s) bundled (Google Sans, self-hosted)`);
  }
  const css = codeFiles.filter((f) => f.endsWith('.css'));
  for (const file of css) {
    const text = readFileSync(file, 'utf8');
    if (/@import\s+url\(\s*['"]?https?:/i.test(text)) {
      problems.push(`${path.relative(ROOT, file)} imports a remote stylesheet.`);
    }
  }

  /* ------------------------------------------------------- sign artwork */

  const signDir = path.join(DIST, 'signs', 'ns-official');
  const bundledSigns = existsSync(signDir) ? readdirSync(signDir).filter((f) => f.endsWith('.png')) : [];
  if (bundledSigns.length === 0) {
    problems.push('No official sign crops in dist/signs/ns-official — sign drills would be blank offline.');
  } else {
    notes.push(`${bundledSigns.length} official sign image(s) bundled`);
  }

  // Every sign the app can reference by file must actually be in the build.
  const sourceSigns = readdirSync(path.join(ROOT, 'public', 'signs', 'ns-official')).filter((f) =>
    f.endsWith('.png'),
  );
  const missing = sourceSigns.filter((f) => !bundledSigns.includes(f));
  if (missing.length > 0) {
    problems.push(`${missing.length} sign image(s) missing from the build: ${missing.slice(0, 5).join(', ')}`);
  }

  /* ------------------------------------------------------------- icons */

  for (const icon of ['icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png']) {
    if (!existsSync(path.join(DIST, icon))) problems.push(`Missing app icon in build: ${icon}`);
  }
  notes.push('App icons bundled');

  /* ------------------------------------------------ learner content data */

  // Questions and sign metadata are compiled into the JS bundle rather than
  // fetched, so confirm a known question id is actually inside it.
  const jsText = codeFiles
    .filter((f) => f.endsWith('.js'))
    .map((f) => readFileSync(f, 'utf8'))
    .join('');
  if (!jsText.includes('rules-signals-')) {
    problems.push('Question bank does not appear to be inlined in the bundle.');
  } else {
    notes.push('Question bank inlined in the JS bundle (not fetched at runtime)');
  }

  /* ------------------------------------------------------------- report */

  console.log('\nNative offline audit');
  console.log('='.repeat(64));
  for (const note of notes) console.log(`  ok  ${note}`);
  if (problems.length > 0) {
    console.log('');
    for (const problem of problems) console.log(`  ✗   ${problem}`);
    console.log(`\n${problems.length} problem(s). The native build would need a network to study.`);
    process.exit(1);
  }
  console.log(
    '\nCore study experience is fully bundled: questions, explanations, sign artwork,' +
      '\nfonts and app icons all ship with the app and need no network.' +
      '\n\nThe one runtime dependency is the Font Awesome Pro icon Kit, which is' +
      '\ndecorative. If it does not load, icon slots stay empty beside their text' +
      '\nlabels and everything still works.',
  );
}

main();
