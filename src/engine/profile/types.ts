/**
 * The local learner profile.
 *
 * A display name and nothing else. There is no account, no sign-in, no email,
 * no server and no identifier that leaves the device — this is the learner
 * naming their own copy of the app, stored in the same local envelope as their
 * progress.
 *
 * Optional throughout, so a save written before profiles existed loads
 * untouched.
 */

export interface LearnerProfile {
  /** What the learner chose to be called. Trimmed, never empty when present. */
  displayName: string;
}

/** Longest name worth storing; enough for a name, short enough to render. */
export const MAX_DISPLAY_NAME = 24;

/**
 * Clean a name typed into the profile form.
 *
 * Returns null when nothing usable remains, which is how "no profile" is
 * represented — an empty name is not a profile.
 */
export function normaliseDisplayName(raw: string): string | null {
  const trimmed = raw.trim().replace(/\s+/g, ' ');
  if (trimmed.length === 0) return null;
  return trimmed.slice(0, MAX_DISPLAY_NAME);
}

/** Coerce a stored value, tolerating anything an older or edited save holds. */
export function normaliseProfile(raw: unknown): LearnerProfile | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const name = (raw as { displayName?: unknown }).displayName;
  if (typeof name !== 'string') return undefined;
  const clean = normaliseDisplayName(name);
  return clean ? { displayName: clean } : undefined;
}

/**
 * Initials for the avatar: one letter for a single name, two for more.
 *
 * Deliberately simple and local — no photo upload, no gravatar, no network.
 */
export function profileInitials(profile: LearnerProfile | undefined): string {
  if (!profile) return '';
  const words = profile.displayName.split(' ').filter(Boolean);
  if (words.length === 0) return '';
  if (words.length === 1) return words[0]!.slice(0, 1).toUpperCase();
  return (words[0]!.slice(0, 1) + words[words.length - 1]!.slice(0, 1)).toUpperCase();
}
