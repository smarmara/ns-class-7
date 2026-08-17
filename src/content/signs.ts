import signMeta from '@data/signs/sign-meta.json';

export interface SignMeta {
  label: string;
  category: string;
  visualDescription: string;
  basis: string;
}

const SIGNS = signMeta.signs as Record<string, SignMeta>;

export function getSignMeta(id: string): SignMeta | undefined {
  return SIGNS[id];
}

export function allSignIds(): string[] {
  return Object.keys(SIGNS);
}

export function signsByCategory(): Map<string, string[]> {
  const out = new Map<string, string[]>();
  for (const [id, meta] of Object.entries(SIGNS)) {
    const list = out.get(meta.category) ?? [];
    list.push(id);
    out.set(meta.category, list);
  }
  return out;
}

export const SIGN_CATEGORY_LABELS: Record<string, string> = {
  regulatory: 'Regulatory',
  prohibition: 'Prohibition',
  warning: 'Warning',
  school: 'School',
  'work-zone': 'Work zone',
  guide: 'Guide and information',
  'lane-use': 'Lane use',
  railway: 'Railway',
  'pedestrian-cyclist': 'Pedestrian and cyclist',
  'pavement-marking': 'Pavement markings',
};
