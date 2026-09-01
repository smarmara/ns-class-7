/**
 * Public-release audit.
 *
 * Things that are perfectly fine in a private working copy and are NOT fine in
 * a public repository. Running the app, testing it and deploying it are all
 * unaffected by these; publishing the source is not.
 *
 * This is deliberately a separate gate rather than part of `pnpm verify`: the
 * project must stay fully buildable and testable while a blocker is open, so
 * that the person resolving it can keep working. It is the last check before
 * `git remote add` — see docs/OPEN_SOURCE_RELEASE.md.
 *
 * Usage: pnpm release:audit
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { ROOT } from './lib/content';

interface Finding {
  level: 'blocker' | 'warning';
  what: string;
  where: string;
  why: string;
  options: string[];
}

const findings: Finding[] = [];

/* ------------------------------------------------------------ file walking */

const SKIP_DIRS = new Set([
  'node_modules', '.git', 'dist', 'dist-pages', 'android', 'ios',
  '.sources', 'reports', 'test-results', 'playwright-report', '.scratch',
]);

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

const files = walk(ROOT);
const textFiles = files.filter((f) =>
  /\.(ts|tsx|js|jsx|mjs|cjs|json|md|yml|yaml|css|html|txt)$/.test(f),
);
const rel = (f: string) => path.relative(ROOT, f).split(path.sep).join('/');

/* ------------------------------------------ 1. licensed third-party artwork */

/*
 * Font Awesome Pro.
 *
 * The distinction that matters is ARTWORK versus REFERENCE.
 *
 * The deployed site is entitled to render Pro icons: they come from the
 * maintainer's hosted Kit, loaded at runtime under their own Pro licence. A Kit
 * URL, a Kit id and an icon name like `fa-book-open-cover` are all references —
 * a Kit id is specifically designed to appear in public page markup — and none
 * of them redistribute anything. Flagging them would be noise that trains
 * people to ignore this tool.
 *
 * What must never enter a public repository is the Pro ARTWORK: extracted path
 * data, downloaded SVGs, webfonts, or the licensed npm packages. Those are the
 * things someone without a Pro licence could take and use.
 */

/** Pro npm packages: they contain the artwork and need a licensed registry token. */
const PRO_PACKAGES = [
  '@fortawesome/pro-solid-svg-icons',
  '@fortawesome/pro-regular-svg-icons',
  '@fortawesome/pro-light-svg-icons',
  '@fortawesome/pro-thin-svg-icons',
  '@fortawesome/pro-duotone-svg-icons',
  '@fortawesome/sharp-solid-svg-icons',
  '@fortawesome/sharp-regular-svg-icons',
  '@fortawesome/sharp-light-svg-icons',
  '@fortawesome/kit-pro',
];

const packageJson = readFileSync(path.join(ROOT, 'package.json'), 'utf8');
for (const name of PRO_PACKAGES) {
  if (packageJson.includes(`"${name}"`)) {
    findings.push({
      level: 'blocker',
      what: `Font Awesome Pro package "${name}"`,
      where: 'package.json',
      why:
        'Pro packages carry the licensed artwork and need a private registry token to ' +
        'install. Depending on one both redistributes the artwork and breaks ' +
        '`pnpm install` for contributors.',
      options: ['Render these icons from the hosted Kit instead — see src/ui/Icon.tsx.'],
    });
  }
}

/**
 * Extracted icon artwork.
 *
 * The signature is a long quoted string that is nothing but SVG path syntax —
 * a moveto, then 150+ characters drawn only from the path-command and number
 * alphabet — in a file that also mentions Font Awesome. Real glyph geometry
 * looks exactly like that; a class name, a Kit URL, an icon id or a sentence
 * of prose does not, because ordinary text contains letters outside the path
 * command set.
 */
const GLYPH_PATH_DATA =
  /["'`][Mm]\s*-?[\d.][MmLlHhVvCcSsQqTtAaZz\d.,\s+-]{150,}["'`]/;

for (const file of textFiles) {
  const relative = rel(file);
  // This project's own sign artwork is original work and legitimately full of
  // path data, so only Font-Awesome-adjacent files are in scope.
  if (relative.startsWith('src/signs/') || relative.startsWith('data/signs/')) continue;

  const source = readFileSync(file, 'utf8');
  if (!/font\s*awesome|fontawesome|\bfa-[a-z]/i.test(source)) continue;
  if (!GLYPH_PATH_DATA.test(source)) continue;

  findings.push({
    level: 'blocker',
    what: 'Embedded Font Awesome icon path data',
    where: relative,
    why:
      'This file appears to hold extracted SVG glyph geometry alongside Font Awesome ' +
      'naming. Pro artwork is licensed per seat and cannot be redistributed through a ' +
      'public repository.',
    options: [
      'Render the icon from the hosted Kit (src/ui/Icon.tsx), which references the glyph',
      '  by name instead of shipping its artwork.',
    ],
  });
}

/** Downloaded webfonts or self-hosted Kit bundles. */
const SELF_HOSTED_FA = [
  /(^|\/)fa-(?:regular|solid|light|thin|duotone|sharp|brands)-\d+\.(?:woff2?|ttf|eot)$/i,
  /(^|\/)fontawesome[^/]*\.(?:woff2?|ttf|eot|css)$/i,
  /(^|\/)pro(?:-v[45]-shims)?\.min\.js$/i,
];
for (const file of files) {
  const relative = rel(file);
  if (SELF_HOSTED_FA.some((pattern) => pattern.test(relative))) {
    findings.push({
      level: 'blocker',
      what: 'Self-hosted Font Awesome asset',
      where: relative,
      why:
        'A downloaded Font Awesome webfont, stylesheet or Kit bundle redistributes the ' +
        'artwork. Pro assets must not be committed to a public repository.',
      options: ['Delete it and rely on the hosted Kit.'],
    });
  }
}

/* ------------------------------------------------------- 2. leaked secrets */

const SECRET_PATTERNS: [RegExp, string][] = [
  [/\b(gh[pousr]_[A-Za-z0-9]{16,})\b/, 'GitHub token'],
  [/\bAKIA[0-9A-Z]{16}\b/, 'AWS access key id'],
  [/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/, 'private key'],
  [/\bsk-[A-Za-z0-9]{20,}\b/, 'API secret key'],
  [/(?:password|passwd|secret)\s*[:=]\s*['"][^'"\s]{8,}['"]/i, 'hard-coded credential'],
];

for (const file of textFiles) {
  const source = readFileSync(file, 'utf8');
  for (const [pattern, label] of SECRET_PATTERNS) {
    if (pattern.test(source)) {
      findings.push({
        level: 'blocker',
        what: `Possible ${label}`,
        where: rel(file),
        // The value itself is deliberately not printed.
        why: 'A credential-shaped string was found. Its value is not shown here on purpose.',
        options: ['Remove it, rotate the credential, and rewrite history if it was ever committed.'],
      });
    }
  }
}

/* ------------------------------------------- 3. machine-specific paths in docs */

const PUBLIC_DOCS = textFiles.filter(
  (f) => /\.md$/.test(f) && !rel(f).startsWith('.sources/'),
);
for (const file of PUBLIC_DOCS) {
  const source = readFileSync(file, 'utf8');
  const match = /\b[A-Z]:[\\/](?:Users|dev)[\\/][^\s`)"']+/.exec(source);
  if (match) {
    findings.push({
      level: 'warning',
      what: 'Machine-specific path in public documentation',
      where: `${rel(file)} — ${match[0]}`,
      why: 'A reader cloning the repository has a different path. Use repo-relative commands.',
      options: ['Replace with a repo-relative path or a generic placeholder.'],
    });
  }
}

/* ----------------------------------------- 4. required open-source paperwork */

for (const required of [
  'LICENSE',
  'THIRD_PARTY_NOTICES.md',
  'CONTRIBUTING.md',
  'SECURITY.md',
  'CODE_OF_CONDUCT.md',
  'README.md',
]) {
  if (!existsSync(path.join(ROOT, required))) {
    findings.push({
      level: 'blocker',
      what: `Missing ${required}`,
      where: '(repository root)',
      why: 'A public repository needs this for contributors to know where they stand.',
      options: [`Add ${required}.`],
    });
  }
}

/* -------------------------------------------------------------- 5. report */

const blockers = findings.filter((f) => f.level === 'blocker');
const warnings = findings.filter((f) => f.level === 'warning');

console.log('\nPublic-release audit');
console.log('='.repeat(72));

if (findings.length === 0) {
  console.log('\nNothing found. The repository is safe to publish.\n');
  process.exit(0);
}

for (const finding of findings) {
  console.log(`\n${finding.level === 'blocker' ? 'BLOCKER' : 'warning'}  ${finding.what}`);
  console.log(`    where: ${finding.where}`);
  console.log(`    why:   ${finding.why}`);
  for (const option of finding.options) console.log(`    - ${option}`);
}

console.log('\n' + '-'.repeat(72));
console.log(`${blockers.length} blocker(s), ${warnings.length} warning(s)`);

if (blockers.length > 0) {
  console.log(
    '\nDo not publish this repository until the blockers above are resolved.\n' +
      'Everything else — build, tests, deployment — works regardless; these are\n' +
      'about what is safe to make public.\n',
  );
  process.exit(1);
}
console.log('\nNo blockers. Review the warnings above before publishing.\n');
