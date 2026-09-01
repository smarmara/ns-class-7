import { create } from 'zustand';

/**
 * Appearance preference: Automatic, Light or Dark.
 *
 * The palette itself lives entirely in CSS custom properties (src/styles.css).
 * This store does one job: put the learner's choice on `<html data-theme>` so
 * those rules can resolve, and remember it.
 *
 * "Automatic" writes no attribute at all, which leaves the existing
 * `prefers-color-scheme` media query in charge. That is what makes the app
 * follow a system appearance change live, with no listener and no reload — the
 * browser re-evaluates the media query itself.
 *
 * Stored under its own small key rather than in the learner envelope: this is a
 * device preference, not learning data. Someone restoring a backup onto a
 * different device should not have that device's appearance changed, and the
 * value must be readable before React mounts to avoid a flash of the wrong
 * theme.
 */

export type Appearance = 'auto' | 'light' | 'dark';

export const APPEARANCE_KEY = 'ns-class7:appearance';
export const APPEARANCE_OPTIONS: readonly { value: Appearance; label: string }[] = [
  { value: 'auto', label: 'Automatic' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

function isAppearance(value: unknown): value is Appearance {
  return value === 'auto' || value === 'light' || value === 'dark';
}

/** Read the stored preference. Defaults to Automatic. */
export function readAppearance(): Appearance {
  try {
    const stored = localStorage.getItem(APPEARANCE_KEY);
    return isAppearance(stored) ? stored : 'auto';
  } catch {
    // Private mode, or storage disabled. Automatic is a safe default.
    return 'auto';
  }
}

/** Reflect a preference onto the document. Automatic removes the attribute. */
export function applyAppearance(appearance: Appearance): void {
  const root = document.documentElement;
  if (appearance === 'auto') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', appearance);
}

interface AppearanceState {
  appearance: Appearance;
  setAppearance: (appearance: Appearance) => void;
}

export const useAppearance = create<AppearanceState>((set) => ({
  appearance: typeof document === 'undefined' ? 'auto' : readAppearance(),
  setAppearance: (appearance) => {
    applyAppearance(appearance);
    try {
      localStorage.setItem(APPEARANCE_KEY, appearance);
    } catch {
      // A preference that cannot be saved still applies for this session.
    }
    set({ appearance });
  },
}));
