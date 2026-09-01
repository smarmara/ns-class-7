/**
 * Guards against packaging a stale `dist/` into a native binary.
 *
 * `cap sync` copies whatever is sitting in `dist/` into the Android and iOS
 * projects. It has no idea whether those files were built from the code
 * currently on disk, so running it after editing a question — or after
 * switching branches — quietly ships the previous build. On the web a stale
 * deploy is one refresh from being fixed; in a store binary it is a release.
 *
 * So: `pnpm native:sync` builds first and then stamps `dist/` with a digest of
 * everything the build was made from. `--check` recomputes that digest and
 * refuses to continue if it has moved.
 *
 * Usage:
 *   tsx scripts/native-build-guard.ts --stamp   after a build
 *   tsx scripts/native-build-guard.ts --check   before packaging
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { ROOT } from './lib/content';

const STAMP = path.join(ROOT, 'dist', 'build-stamp.json');

/** Everything a production build reads. Changing any of it invalidates dist/. */
const INPUT_DIRS = ['src', 'data', 'public'];
const INPUT_FILES = ['index.html', 'vite.config.ts', 'app.identity.json', 'pnpm-lock.yaml'];

function walk(dir: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir).sort()) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

/** Digest of the build inputs. Content-based, so it survives a fresh clone. */
function inputDigest(): string {
  const hash = createHash('sha256');

  for (const dir of INPUT_DIRS) {
    for (const file of walk(path.join(ROOT, dir))) {
      hash.update(path.relative(ROOT, file).split(path.sep).join('/'));
      hash.update(readFileSync(file));
    }
  }
  for (const file of INPUT_FILES) {
    const full = path.join(ROOT, file);
    if (!existsSync(full)) continue;
    hash.update(file);
    hash.update(readFileSync(full));
  }
  // The app version ends up baked into the bundle, so it is an input too.
  const pkg = JSON.parse(readFileSync(path.join(ROOT, 'package.json'), 'utf8')) as {
    version: string;
  };
  hash.update(`version:${pkg.version}`);

  return hash.digest('hex');
}

function stamp() {
  if (!existsSync(path.join(ROOT, 'dist', 'index.html'))) {
    console.error('No dist/index.html — build before stamping.');
    process.exit(1);
  }
  const digest = inputDigest();
  writeFileSync(
    STAMP,
    `${JSON.stringify({ inputDigest: digest, stampedAt: new Date().toISOString() }, null, 2)}\n`,
  );
  console.log(`Build stamped: ${digest.slice(0, 16)}…`);
}

function check() {
  if (!existsSync(STAMP)) {
    console.error(
      'dist/ has no build stamp.\n' +
        'Run `pnpm native:sync`, which builds and stamps before syncing, rather than\n' +
        'calling `cap sync` directly.',
    );
    process.exit(1);
  }
  const recorded = (JSON.parse(readFileSync(STAMP, 'utf8')) as { inputDigest: string }).inputDigest;
  const current = inputDigest();

  if (recorded !== current) {
    console.error(
      'dist/ is STALE — the source tree has changed since it was built.\n' +
        `  stamped: ${recorded.slice(0, 16)}…\n` +
        `  current: ${current.slice(0, 16)}…\n\n` +
        'Packaging this would ship the previous build. Run `pnpm native:sync`.',
    );
    process.exit(1);
  }
  console.log(`dist/ is current (${current.slice(0, 16)}…).`);
}

const mode = process.argv[2];
if (mode === '--stamp') stamp();
else if (mode === '--check') check();
else {
  console.error('Usage: native-build-guard.ts --stamp | --check');
  process.exit(1);
}
