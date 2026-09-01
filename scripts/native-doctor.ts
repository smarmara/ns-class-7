/**
 * Reports whether this machine can build the native apps, and what is missing.
 *
 * Capacitor's own `cap doctor` checks the JavaScript side. What actually stops
 * people is the platform toolchain — a JDK the Gradle version cannot parse, or
 * no Android SDK at all — and those failures surface as opaque Gradle errors
 * ("Unsupported class file major version 69") a long way from their cause.
 *
 * Usage: pnpm native:doctor
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { ROOT } from './lib/content';

interface Check {
  name: string;
  ok: boolean;
  detail: string;
  fix?: string;
}

const checks: Check[] = [];

/** Gradle 8.14.x parses class files up to Java 24; AGP 8.13 targets JDK 17-21. */
const MAX_SUPPORTED_JDK = 24;
const RECOMMENDED_JDK = 21;

function javaMajor(): number | null {
  try {
    const output = execFileSync('java', ['-version'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    const match = /version "(\d+)/.exec(output);
    return match ? Number(match[1]) : null;
  } catch {
    try {
      // `java -version` writes to stderr on some builds.
      const output = execFileSync('java', ['-version'], { encoding: 'utf8' }) as string;
      const match = /version "(\d+)/.exec(output);
      return match ? Number(match[1]) : null;
    } catch {
      return null;
    }
  }
}

function checkJdk() {
  const major = javaMajor() ?? jdkFromStderr();
  if (major === null) {
    checks.push({
      name: 'JDK',
      ok: false,
      detail: 'No `java` on PATH.',
      fix: `Install Temurin JDK ${RECOMMENDED_JDK} (LTS) and set JAVA_HOME.`,
    });
    return;
  }
  if (major > MAX_SUPPORTED_JDK) {
    checks.push({
      name: 'JDK',
      ok: false,
      detail: `Java ${major} found, but the Gradle version in android/ supports at most Java ${MAX_SUPPORTED_JDK}.`,
      fix:
        `Install Temurin JDK ${RECOMMENDED_JDK} and point JAVA_HOME at it for Android builds.\n` +
        `        Gradle fails with "Unsupported class file major version ${major + 44}" otherwise.`,
    });
    return;
  }
  if (major < 17) {
    checks.push({
      name: 'JDK',
      ok: false,
      detail: `Java ${major} found; Android Gradle Plugin 8.x needs Java 17+.`,
      fix: `Install Temurin JDK ${RECOMMENDED_JDK}.`,
    });
    return;
  }
  checks.push({ name: 'JDK', ok: true, detail: `Java ${major}` });
}

function jdkFromStderr(): number | null {
  try {
    const output = execFileSync(
      process.platform === 'win32' ? 'cmd' : 'sh',
      process.platform === 'win32' ? ['/c', 'java -version 2>&1'] : ['-c', 'java -version 2>&1'],
      { encoding: 'utf8' },
    );
    const match = /version "(\d+)/.exec(output);
    return match ? Number(match[1]) : null;
  } catch {
    return null;
  }
}

function checkAndroidSdk() {
  const home = process.env.ANDROID_HOME ?? process.env.ANDROID_SDK_ROOT;
  const localProps = path.join(ROOT, 'android', 'local.properties');
  const fromLocal =
    existsSync(localProps) && /sdk\.dir=(.+)/.exec(readFileSync(localProps, 'utf8'))?.[1];

  const sdk = home ?? (typeof fromLocal === 'string' ? fromLocal.trim() : undefined);
  if (!sdk) {
    checks.push({
      name: 'Android SDK',
      ok: false,
      detail: 'ANDROID_HOME / ANDROID_SDK_ROOT not set and android/local.properties has no sdk.dir.',
      fix:
        'Install Android Studio (it installs the SDK), then set ANDROID_HOME.\n' +
        '        Opening android/ once with `pnpm native:open:android` also writes local.properties.',
    });
    return;
  }
  if (!existsSync(sdk)) {
    checks.push({
      name: 'Android SDK',
      ok: false,
      detail: `SDK path does not exist: ${sdk}`,
      fix: 'Point ANDROID_HOME at a real SDK installation.',
    });
    return;
  }
  const platform = path.join(sdk, 'platforms', 'android-36');
  checks.push({
    name: 'Android SDK',
    ok: existsSync(platform),
    detail: existsSync(platform)
      ? `${sdk} (android-36 present)`
      : `${sdk} — but platform android-36 is missing.`,
    ...(existsSync(platform)
      ? {}
      : { fix: 'Install SDK Platform 36 in Android Studio > SDK Manager (compileSdk = 36).' }),
  });
}

function checkNativeProjects() {
  for (const platform of ['android', 'ios'] as const) {
    const dir = path.join(ROOT, platform);
    checks.push({
      name: `${platform} project`,
      ok: existsSync(dir),
      detail: existsSync(dir) ? `${platform}/ present` : `${platform}/ missing`,
      ...(existsSync(dir) ? {} : { fix: `pnpm exec cap add ${platform}` }),
    });
  }
}

function checkXcode() {
  if (process.platform !== 'darwin') {
    checks.push({
      name: 'Xcode',
      ok: false,
      detail: `Not available on ${process.platform}. iOS can only be built on macOS.`,
      fix: 'Build iOS on a Mac — see docs/NATIVE_APP.md, "iOS".',
    });
    return;
  }
  try {
    const version = execFileSync('xcodebuild', ['-version'], { encoding: 'utf8' }).split('\n')[0];
    checks.push({ name: 'Xcode', ok: true, detail: version ?? 'installed' });
  } catch {
    checks.push({ name: 'Xcode', ok: false, detail: 'xcodebuild not found.', fix: 'Install Xcode from the App Store.' });
  }
}

function checkBuildFreshness() {
  const stamp = path.join(ROOT, 'dist', 'build-stamp.json');
  checks.push({
    name: 'Web build',
    ok: existsSync(stamp),
    detail: existsSync(stamp) ? 'dist/ built and stamped' : 'dist/ not built or not stamped',
    ...(existsSync(stamp) ? {} : { fix: 'pnpm native:sync' }),
  });
}

checkNativeProjects();
checkBuildFreshness();
checkJdk();
checkAndroidSdk();
checkXcode();

console.log('\nNative build prerequisites');
console.log('='.repeat(64));
for (const check of checks) {
  console.log(`  ${check.ok ? 'ok  ' : '✗   '}${check.name.padEnd(16)} ${check.detail}`);
  if (!check.ok && check.fix) console.log(`      → ${check.fix}`);
}

const androidBlockers = checks.filter(
  (c) => !c.ok && ['JDK', 'Android SDK', 'android project', 'Web build'].includes(c.name),
);
console.log('');
console.log(
  androidBlockers.length === 0
    ? 'Android: ready to build (`pnpm native:android`).'
    : `Android: ${androidBlockers.length} blocker(s) above.`,
);
console.log(
  process.platform === 'darwin'
    ? 'iOS: see docs/NATIVE_APP.md.'
    : 'iOS: project is prepared, but building requires macOS with Xcode.',
);

// Informational by design: a machine without an Android SDK is not a broken
// repository, so this never fails a build.
