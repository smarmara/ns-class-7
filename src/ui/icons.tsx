/* eslint-disable react-refresh/only-export-components --
 * This module is an icon barrel: every export is a component. The rule cannot
 * follow the `export { … } from './Icon'` re-exports below, and once it sees an
 * export it cannot classify it flags the rest of the file too. Fast Refresh on a
 * barrel of stateless icons has nothing to preserve anyway.
 *
 * Scoped to this file deliberately — the rule stays on everywhere else.
 */
/**
 * Icon layer.
 *
 * Two sources, for one licensing reason.
 *
 * **Free tier — bundled here.** Icons from `@fortawesome/free-*-svg-icons` are
 * imported one at a time, so the bundler tree-shakes everything else away and
 * only the handful of glyphs this app draws reaches production. Font Awesome
 * Free is CC BY 4.0, so the artwork can be redistributed with this repository,
 * and bundling means these icons work offline and on a first visit with no
 * network. The Font Awesome runtime packages are deliberately unused — an icon
 * definition is a path string, and rendering it needs the ten lines below
 * rather than another dependency.
 *
 * **Pro tier — loaded from the hosted Kit.** See `./Icon.tsx`. Pro artwork is
 * licensed per seat and cannot be redistributed through a public repository, so
 * none of it lives here; those icons are class names resolved at runtime by the
 * maintainer's Kit. They are the only part of the interface that depends on the
 * network, and the app is built to work without them.
 *
 * Style: Classic **Regular** throughout — one icon language, no mixed weights.
 *
 * Icons are decorative by default (`aria-hidden`). Every icon in the UI sits
 * beside real text, or the control carries its own accessible name — an icon is
 * never the only carrier of meaning, which is also what makes the Kit's absence
 * survivable.
 *
 * Font Awesome Free is licensed CC BY 4.0. See THIRD_PARTY_NOTICES.md.
 */

import type { SVGProps } from 'react';
import { faClipboard as farClipboardRegular } from '@fortawesome/free-regular-svg-icons/faClipboard';
import { faGem as farGem } from '@fortawesome/free-regular-svg-icons/faGem';
import { faChartBar as farChartBar } from '@fortawesome/free-regular-svg-icons/faChartBar';
import { faUser as farUser } from '@fortawesome/free-regular-svg-icons/faUser';
import { faHouse as farHouse } from '@fortawesome/free-regular-svg-icons/faHouse';
import { faBookmark as farBookmark } from '@fortawesome/free-regular-svg-icons/faBookmark';
import { faCircleCheck as farCircleCheck } from '@fortawesome/free-regular-svg-icons/faCircleCheck';
import { faCircleXmark as farCircleXmark } from '@fortawesome/free-regular-svg-icons/faCircleXmark';
import { faLightbulb as farLightbulb } from '@fortawesome/free-regular-svg-icons/faLightbulb';
import { faPenToSquare as farPenToSquare } from '@fortawesome/free-regular-svg-icons/faPenToSquare';

/** The shape of a Font Awesome icon definition, narrowed to what we render. */
interface IconDefinition {
  icon: [number, number, unknown, unknown, string | string[]];
}

export type IconProps = Omit<SVGProps<SVGSVGElement>, 'children'> & {
  /**
   * Accessible name. Supply it only when the icon is the sole carrier of
   * meaning; otherwise leave it off and the icon stays hidden from assistive
   * technology so the adjacent text is not announced twice.
   */
  title?: string;
};

function makeIcon(definition: IconDefinition) {
  const [width, height, , , path] = definition.icon;
  const d = Array.isArray(path) ? path.join(' ') : path;

  return function Icon({ title, ...props }: IconProps) {
    return (
      <svg
        viewBox={`0 0 ${width} ${height}`}
        fill="currentColor"
        focusable="false"
        role={title ? 'img' : undefined}
        aria-hidden={title ? undefined : true}
        aria-label={title}
        {...props}
      >
        {title && <title>{title}</title>}
        <path d={d} />
      </svg>
    );
  };
}

/*
 * Pro glyphs, re-exported from the hosted Kit layer.
 *
 * Re-exported rather than imported directly at each call site so that every
 * component keeps a single import from '@/ui/icons' and does not need to know
 * which tier a given icon comes from. Where an icon moves between tiers, this
 * is the only file that changes.
 */
export {
  ArrowRightIcon,
  AwardIcon,
  BackIcon,
  ChevronIcon,
  ExternalIcon,
  LearnIcon,
  MedalIcon,
  PracticeIcon,
  SignsIcon,
  StreakIcon,
  WeakAreaIcon,
  XpIcon,
} from './Icon';

/* --------------------------------------------------- bundled free-tier icons */

/* Primary navigation. Learn, Practice and Signs come from the Kit above. */
export const HomeIcon = makeIcon(farHouse);
export const ProgressIcon = makeIcon(farChartBar);
export const ProfileIcon = makeIcon(farUser);

/** Mastery — the stronger state above Complete. */
export const MasteryIcon = makeIcon(farGem);
export const FocusIcon = makeIcon(farLightbulb);

/* Content surfaces keep the Regular cut. */
export const MockIcon = makeIcon(farClipboardRegular);

/* Question and review surfaces */
export const BookmarkIcon = makeIcon(farBookmark);
export const CorrectIcon = makeIcon(farCircleCheck);
export const IncorrectIcon = makeIcon(farCircleXmark);
export const MistakeIcon = makeIcon(farPenToSquare);
