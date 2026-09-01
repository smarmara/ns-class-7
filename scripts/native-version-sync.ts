/**
 * Propagates the app version from package.json into the iOS project.
 *
 * Android reads package.json directly at build time (see android/app/build.gradle),
 * but Xcode keeps MARKETING_VERSION and CURRENT_PROJECT_VERSION inside
 * project.pbxproj, where nothing can read a JSON file. Rather than adding an
 * Xcode Run Script build phase — a native edit that then has to be preserved
 * across `cap` regenerations — this rewrites the two build settings from the
 * one authoritative source, and `pnpm native:sync` runs it.
 *
 * NOTE: this is the NATIVE APP version, not the learner-facing Content Version.
 * They are different concepts on different schedules; see docs/NATIVE_APP.md.
 *
 * Usage: pnpm native:version
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { ROOT } from './lib/content';

const PBXPROJ = path.join(ROOT, 'ios', 'App', 'App.xcodeproj', 'project.pbxproj');

const version = (
  JSON.parse(readFileSync(path.join(ROOT, 'package.json'), 'utf8')) as { version: string }
).version;

const [major = '0', minor = '0', patch = '0'] = version.split('-')[0]!.split('.');
/** Monotonic integer build number, matching the Android versionCode formula. */
const buildNumber = Number(major) * 10000 + Number(minor) * 100 + Number(patch);

if (!existsSync(PBXPROJ)) {
  console.log('No iOS project — skipping iOS version sync.');
  process.exit(0);
}

const original = readFileSync(PBXPROJ, 'utf8');
const updated = original
  .replace(/MARKETING_VERSION = [^;]+;/g, `MARKETING_VERSION = ${version};`)
  .replace(/CURRENT_PROJECT_VERSION = [^;]+;/g, `CURRENT_PROJECT_VERSION = ${buildNumber};`);

if (updated === original) {
  console.log(`iOS version already ${version} (build ${buildNumber}).`);
} else {
  writeFileSync(PBXPROJ, updated);
  console.log(`iOS version set to ${version} (build ${buildNumber}).`);
}
