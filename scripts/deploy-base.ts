/**
 * Prints the base path this deployment should build for, and why.
 *
 * Used by .github/workflows/deploy-pages.yml to set VITE_BASE_PATH, so the
 * decision lives in a testable module (scripts/lib/deploy-base.ts) rather than
 * in shell inside a YAML file. Also runnable by hand:
 *
 *   pnpm deploy:base                          what production will build for
 *   pnpm deploy:base --derived /ns-class-7/   what a fork would build for
 *
 * Writes `base=<value>` to $GITHUB_OUTPUT when running in Actions. Prints no
 * credentials: the only inputs are a public domain name and a public URL path.
 */
import { appendFileSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { ROOT } from './lib/content';
import { resolveDeployBase } from './lib/deploy-base';

function flag(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? undefined : process.argv[index + 1];
}

const identity = JSON.parse(
  readFileSync(path.join(ROOT, 'app.identity.json'), 'utf8'),
) as { web?: { customDomain?: string; productionUrl?: string } };

const customDomain = process.env.CUSTOM_DOMAIN ?? identity.web?.customDomain;
const derivedBasePath = flag('derived') ?? process.env.DERIVED_BASE_PATH;

const { base, reason } = resolveDeployBase({ customDomain, derivedBasePath });

console.log('Deployment target');
console.log('='.repeat(64));
console.log(`  repository         ${process.env.GITHUB_REPOSITORY ?? '(local)'}`);
console.log(`  custom domain      ${customDomain?.trim() || '(none declared)'}`);
console.log(`  Pages reports      ${derivedBasePath?.trim() || '(not available)'}`);
console.log(`  production URL     ${identity.web?.productionUrl ?? '(none declared)'}`);
console.log('');
console.log(`  VITE_BASE_PATH     ${base}`);
console.log(`  because            ${reason}`);

if (process.env.GITHUB_OUTPUT) {
  appendFileSync(process.env.GITHUB_OUTPUT, `base=${base}\n`);
}
