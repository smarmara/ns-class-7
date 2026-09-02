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
 * C0/C1 control characters, plus the Unicode bidirectional overrides and
 * isolates (U+200E/200F, U+202A-202E, U+2066-2069).
 *
 * Written as escapes rather than literal characters so the pattern stays
 * readable and cannot be mangled by an editor or a copy-paste.
 */
// eslint-disable-next-line no-control-regex
const CONTROL_AND_BIDI = /[\u0000-\u001F\u007F-\u009F\u200E\u200F\u202A-\u202E\u2066-\u2069]/g;

/**
 * Clean a name typed into the profile form.
 *
 * Returns null when nothing usable remains, which is how "no profile" is
 * represented — an empty name is not a profile.
 */
export function normaliseDisplayName(raw: string): string | null {
  /*
   * Control and bidirectional-override characters are stripped first.
   *
   * Not an escaping concern — React renders this as text, so markup in a name
   * is inert and shows up literally. The problem is display: U+202E and its
   * relatives reverse the direction of everything that follows them, so a name
   * containing one can visually rearrange the interface around it, and NUL and
   * friends render as nothing while still counting toward the length. Neither
   * belongs in a name someone chose for themselves.
   *
   * Stripped rather than rejected: a learner who pastes a name with a stray
   * character gets the name they meant, not an error they cannot interpret.
   */
  const withoutControls = raw.replace(CONTROL_AND_BIDI, '');
  const trimmed = withoutControls.trim().replace(/\s+/g, ' ');
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
