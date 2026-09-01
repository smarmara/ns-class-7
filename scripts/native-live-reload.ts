/**
 * Development live reload on a device or emulator.
 *
 * Points the native shell at the Vite dev server instead of the bundled
 * assets, so a code change appears on the phone without rebuilding. This is a
 * DEVELOPMENT convenience and is deliberately not expressible in
 * capacitor.config.ts: the config only sets `server.url` when CAP_SERVER_URL is
 * present in the environment, and only this script sets it. A release build can
 * therefore never inherit a developer's laptop address and become an app that
 * stops working the moment it leaves the house.
 *
 * Usage: pnpm native:live -- android    (or ios)
 */
import { networkInterfaces } from 'node:os';
import { spawnSync } from 'node:child_process';

const platform = process.argv[2] ?? 'android';
if (platform !== 'android' && platform !== 'ios') {
  console.error('Usage: pnpm native:live -- android|ios');
  process.exit(1);
}

/** The LAN address a phone can actually reach — not 127.0.0.1. */
function lanAddress(): string | undefined {
  for (const addresses of Object.values(networkInterfaces())) {
    for (const address of addresses ?? []) {
      if (address.family === 'IPv4' && !address.internal) return address.address;
    }
  }
  return undefined;
}

const host = lanAddress();
if (!host) {
  console.error('No LAN address found. Connect to a network the device can reach.');
  process.exit(1);
}

const url = `http://${host}:5173`;
console.log(`Live reload: pointing the ${platform} shell at ${url}`);
console.log('Start the dev server in another terminal:  pnpm dev --host\n');

const env = { ...process.env, CAP_SERVER_URL: url };
const run = (cmd: string, args: string[]) =>
  spawnSync(cmd, args, { stdio: 'inherit', env, shell: true });

// Sync writes the dev URL into the native project, then run it.
run('pnpm', ['exec', 'cap', 'sync', platform]);
run('pnpm', ['exec', 'cap', 'run', platform]);

console.log(
  '\nWhen you are finished, run `pnpm native:sync` to restore the bundled\n' +
    'assets before building anything you intend to install or ship.',
);
