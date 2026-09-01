import { createHash } from 'node:crypto';

export interface ContentVersionInput {
  name: string;
  data: Uint8Array;
}

/**
 * Deterministic content digest shared by the build (vite.config.ts) and the
 * test suite.
 *
 * Inputs are hashed in name order so the digest is stable regardless of how a
 * directory is enumerated, and any byte change to any input changes the digest
 * — which is how a build is proven to reflect a changed official crop.
 */
export function computeContentVersion(inputs: readonly ContentVersionInput[]): string {
  const hash = createHash('sha256');
  for (const { name, data } of [...inputs].sort((a, b) => a.name.localeCompare(b.name))) {
    hash.update(name);
    hash.update(data);
  }
  return hash.digest('hex').slice(0, 10);
}