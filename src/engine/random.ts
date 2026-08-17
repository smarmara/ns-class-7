/**
 * Small seeded PRNG.
 *
 * Quiz selection and answer shuffling go through this so that a session can be
 * reproduced exactly from its seed — which is what makes the mock test
 * restorable after a browser refresh, and what makes the randomisation tests
 * deterministic instead of flaky.
 */

export interface Rng {
  /** Float in [0, 1). */
  next(): number;
  /** Integer in [0, maxExclusive). */
  int(maxExclusive: number): number;
}

/** mulberry32 — small, fast, good enough for shuffling a quiz. */
export function createRng(seed: number): Rng {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int: (maxExclusive: number) => Math.floor(next() * maxExclusive),
  };
}

export function randomSeed(): number {
  return (Math.random() * 0xffffffff) >>> 0;
}

/** Fisher-Yates. Returns a new array; the input is not mutated. */
export function shuffle<T>(items: readonly T[], rng: Rng): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = rng.int(i + 1);
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

/**
 * Weighted sampling WITHOUT replacement.
 *
 * Used by practice selection so that weak-area questions come up more often
 * while still guaranteeing no question appears twice in one session.
 */
export function weightedSampleWithoutReplacement<T>(
  items: readonly T[],
  weightOf: (item: T) => number,
  count: number,
  rng: Rng,
): T[] {
  const pool = items.map((item) => ({ item, weight: Math.max(weightOf(item), 1e-6) }));
  const picked: T[] = [];
  const want = Math.min(count, pool.length);

  for (let n = 0; n < want; n++) {
    const total = pool.reduce((sum, p) => sum + p.weight, 0);
    let target = rng.next() * total;
    let index = pool.length - 1;
    for (let i = 0; i < pool.length; i++) {
      target -= pool[i]!.weight;
      if (target <= 0) {
        index = i;
        break;
      }
    }
    picked.push(pool[index]!.item);
    pool.splice(index, 1);
  }
  return picked;
}
