/**
 * The Font Awesome Pro glyphs this app renders through the hosted Kit.
 *
 * Names only — these are identifiers, not artwork. Kept in a plain module
 * rather than beside the components in `Icon.tsx` so that file exports nothing
 * but components, which is what React Fast Refresh needs to work cleanly.
 *
 * Read by the tests that check the app's Pro-icon surface stays small and that
 * every name is still referenced.
 */
export const KIT_ICON_NAMES = [
  'book-open-cover',
  'diamond-turn-right',
  'ballot-check',
  'bolt',
  'fire',
  'medal',
  'award',
  'triangle-exclamation',
  'chevron-left',
  'chevron-right',
  'arrow-right',
  'up-right-from-square',
] as const;

export type KitIconName = (typeof KIT_ICON_NAMES)[number];
