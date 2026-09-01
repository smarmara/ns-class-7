import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';

/**
 * Merges the per-test viewport measurement shards into one report.
 *
 * Runs as Playwright's globalTeardown. Each measuring test writes its own file
 * because tests are spread across worker processes — a shared in-memory array
 * would only ever capture whichever worker happened to finish last.
 */

const OUT_DIR = 'test-results/ux-redesign';
const SHARD_DIR = `${OUT_DIR}/viewport`;

const ORDER = ['390x844', '375x812', '320x568'];
const SCREENS = ['Home', 'Text question', 'Sign question', 'Exam question'];

export default function mergeViewportMeasurements(): void {
  if (!existsSync(SHARD_DIR)) return;

  const measurements = readdirSync(SHARD_DIR)
    .filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(readFileSync(`${SHARD_DIR}/${f}`, 'utf8')) as Record<string, unknown>)
    .sort((a, b) => {
      const byViewport =
        ORDER.indexOf(String(a.viewport)) - ORDER.indexOf(String(b.viewport));
      if (byViewport !== 0) return byViewport;
      return SCREENS.indexOf(String(a.screen)) - SCREENS.indexOf(String(b.screen));
    });

  if (measurements.length === 0) return;

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(
    `${OUT_DIR}/viewport-measurements.json`,
    `${JSON.stringify(measurements, null, 2)}\n`,
    'utf8',
  );
  rmSync(SHARD_DIR, { recursive: true, force: true });
}
