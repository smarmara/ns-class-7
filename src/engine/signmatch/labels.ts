import learnerScopeJson from '@data/signs/learner-scope.json';

/**
 * Prompt labels for Sign Match.
 *
 * The catalogue name and the game prompt are not the same job. A catalogue
 * entry should say exactly what a sign is — "Warning Sign Shape — Diamond" is
 * the right label for someone browsing. As a game prompt it is useless: it
 * tells the player to pick the diamond.
 *
 * So the game derives its own label. Canonical names in
 * `data/signs/learner-scope.json` and `sign-names.json` are never modified.
 *
 * ## What the audit found
 *
 * 55 of the 155 targets carry an em-dash suffix, and the obvious rule — drop
 * everything after " — " — is wrong. It would collide **48 targets across 15
 * groups**: all eleven roundabout lane signs become "Roundabout Lane", all
 * eleven multi-lane diagrams become "Two-Lane Control", and `RB-57` collides
 * with the plain `no-stopping`.
 *
 * More importantly most of those suffixes *are* the rule being tested. "Keep
 * Left" against "Keep Right", "Left Exit Only" against "Through Only",
 * "Times Shown" against a plain prohibition — stripping those would not remove
 * a hint, it would remove the question.
 *
 * The suffix is only a giveaway when it names the artwork's geometry rather
 * than its meaning. That is the six Sign Shape concepts, and nothing else. For
 * those, the shortened label is still a complete question — "Warning Sign
 * Shape" asks the player to know that a warning sign is a diamond, which is
 * exactly the concept, instead of handing them the word "Diamond".
 */

const scope = learnerScopeJson as {
  classifications: Record<string, { scope: string; displayName: string }>;
};

const SEPARATOR = ' — ';

/**
 * Suffixes that describe the shape of the artwork rather than what the sign
 * means. Matched case-insensitively against the text after the em dash.
 */
const VISUAL_FORM_SUFFIXES = new Set([
  'octagon',
  'diamond',
  'pentagon',
  'inverted triangle',
  'vertical rectangle',
  'horizontal rectangle',
]);

/**
 * Explicit prompt overrides.
 *
 * Deliberately empty. The audit found no target that needed one: every label
 * either strips safely under the rule above or keeps its full name because the
 * suffix carries meaning. Kept as the documented escape hatch for a future sign
 * whose canonical name cannot serve as a fair prompt.
 */
const PROMPT_OVERRIDES: Record<string, string> = {};

function learnerNames(): Map<string, string> {
  const out = new Map<string, string>();
  for (const [id, entry] of Object.entries(scope.classifications)) {
    if (entry.scope !== 'core' && entry.scope !== 'reference') continue;
    out.set(id, entry.displayName);
  }
  return out;
}

let _labels: Map<string, string> | undefined;

function build(): Map<string, string> {
  const names = learnerNames();

  // A shortened label may not become the same as any other target's prompt,
  // nor the same as another target's full name.
  const shortened = new Map<string, string>();
  for (const [id, name] of names) {
    const index = name.indexOf(SEPARATOR);
    if (index === -1) continue;
    const suffix = name.slice(index + SEPARATOR.length).trim().toLowerCase();
    if (!VISUAL_FORM_SUFFIXES.has(suffix)) continue;
    shortened.set(id, name.slice(0, index).trim());
  }

  const labels = new Map<string, string>();
  for (const [id, name] of names) {
    const override = PROMPT_OVERRIDES[id];
    if (override) {
      labels.set(id, override);
      continue;
    }
    const candidate = shortened.get(id);
    if (!candidate) {
      labels.set(id, name);
      continue;
    }
    const clashes = [...names].some(
      ([otherId, otherName]) =>
        otherId !== id && (otherName === candidate || shortened.get(otherId) === candidate),
    );
    labels.set(id, clashes ? name : candidate);
  }
  return labels;
}

function labels(): Map<string, string> {
  if (!_labels) _labels = build();
  return _labels;
}

/** The prompt a Sign Match round shows for this sign. */
export function signMatchPromptLabel(signId: string): string {
  return labels().get(signId) ?? scope.classifications[signId]?.displayName ?? signId;
}

/** Whether this sign's prompt is shorter than its catalogue name. */
export function isPromptShortened(signId: string): boolean {
  const name = scope.classifications[signId]?.displayName;
  return name !== undefined && signMatchPromptLabel(signId) !== name;
}

/** Every prompt label, for auditing and tests. */
export function allPromptLabels(): ReadonlyMap<string, string> {
  return labels();
}
