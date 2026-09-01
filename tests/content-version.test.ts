import { describe, expect, it } from 'vitest';
import { computeContentVersion } from '../scripts/lib/content-version';
import { activeQuestions } from '@/content';
import { cropKeyFor } from '@/signs/cropKey';
import fidelityJson from '@data/signs/sign-fidelity.json';

const baseInputs = [
  { name: 'data/questions/signs-basic.json', data: new Uint8Array([1, 2, 3]) },
  { name: 'data/signs/sign-fidelity.json', data: new Uint8Array([9, 9, 9]) },
  { name: 'public/signs/ns-official/RA-1.png', data: new Uint8Array([0x89, 0x50, 0x4e, 0x47]) },
  { name: 'public/signs/ns-official/RB-11L.png', data: new Uint8Array([0x89, 0x50, 0x4e, 0x47]) },
  { name: 'src/signs/registry.tsx', data: new Uint8Array([115, 114, 99]) },
];

describe('content version', () => {
  it('is deterministic for identical inputs', () => {
    expect(computeContentVersion(baseInputs)).toBe(computeContentVersion(baseInputs));
    expect(computeContentVersion(baseInputs)).toMatch(/^[0-9a-f]{10}$/);
  });

  it('does not depend on input ordering', () => {
    const shuffled = [...baseInputs].reverse();
    expect(computeContentVersion(shuffled)).toBe(computeContentVersion(baseInputs));
  });

  it('changes when an official crop an active question displays changes', () => {
    const changed = baseInputs.map((input) =>
      input.name === 'public/signs/ns-official/RA-1.png'
        ? { ...input, data: new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x01]) }
        : input,
    );
    expect(computeContentVersion(changed)).not.toBe(computeContentVersion(baseInputs));
  });

  it('changes when the sign registry or fidelity mapping changes', () => {
    const registryChanged = baseInputs.map((input) =>
      input.name === 'src/signs/registry.tsx' ? { ...input, data: new Uint8Array([1]) } : input,
    );
    const fidelityChanged = baseInputs.map((input) =>
      input.name === 'data/signs/sign-fidelity.json' ? { ...input, data: new Uint8Array([2]) } : input,
    );
    expect(computeContentVersion(registryChanged)).not.toBe(computeContentVersion(baseInputs));
    expect(computeContentVersion(fidelityChanged)).not.toBe(computeContentVersion(baseInputs));
  });
});

/**
 * The build hashes the crop files that active questions actually display,
 * chosen with the same `cropKeyFor` rule the app renders with (see
 * vite.config.ts). Deriving `<designation>.png` here instead would silently
 * hash RB-1.png for the 50 km/h sign, so a corrected RB-1A.png would ship
 * under an unchanged content version.
 */
describe('active crop selection', () => {
  const fidelity = fidelityJson.signs as Record<
    string,
    { status?: string; designation?: string; asset?: string }
  >;

  const activeCropFiles = (): Set<string> => {
    const files = new Set<string>();
    for (const question of activeQuestions) {
      for (const signId of [...(question.signId ? [question.signId] : []), ...(question.choiceSignIds ?? [])]) {
        const entry = fidelity[signId];
        if (entry?.status !== 'official-crop') continue;
        const key = cropKeyFor(entry);
        if (key) files.add(`public/signs/ns-official/${key}.png`);
      }
    }
    return files;
  };

  it('hashes RB-1A.png for the active 50 km/h sign and RB-1.png for the 80', () => {
    const files = activeCropFiles();
    expect(files.has('public/signs/ns-official/RB-1A.png')).toBe(true);
    expect(files.has('public/signs/ns-official/RB-1.png')).toBe(true);
  });

  it('changes the digest when the 50 km/h artwork changes', () => {
    const inputs = [...activeCropFiles()]
      .sort()
      .map((name) => ({ name, data: new Uint8Array([1]) }));
    const edited = inputs.map((input) =>
      input.name === 'public/signs/ns-official/RB-1A.png'
        ? { ...input, data: new Uint8Array([2]) }
        : input,
    );
    expect(computeContentVersion(edited)).not.toBe(computeContentVersion(inputs));
  });
});