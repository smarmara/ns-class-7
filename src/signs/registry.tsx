import type { ReactNode } from 'react';
import { cropKeyFor, type CropArtworkRef } from './cropKey';
import { SIGN } from './palette';
import fidelityJson from '../../data/signs/sign-fidelity.json';
import {
  Rect,
  SignText,
} from './shapes';

/**
 * Original SVG artwork for each sign, keyed by sign id.
 *
 * The *meaning* and the accessible description of every sign live in
 * data/signs/sign-meta.json — that is content, and the question bank depends
 * on it. This file holds only the drawing, so that artwork can be redrawn
 * without touching the content layer and vice versa.
 *
 * Each drawing is constructed from the shapes and colours described in the
 * Traffic Signs Regulations (N.S. Reg. 165/2012) and the Driver's Handbook.
 * Nothing here is traced from, or copied out of, Crown illustrations.
 */
export const SIGN_ART: Readonly<Record<string, ReactNode>> = {
  'maximum-speed-80': (
    <Rect>
      <SignText size={15} y={31} letterSpacing={0.5}>
        MAXIMUM
      </SignText>
      <SignText size={58} y={73} weight={500}>
        80
      </SignText>
    </Rect>
  ),
  'guide-destination': (
    <Rect fill={SIGN.green} stroke={SIGN.green} x={4} y={26} w={112} h={68} rx={4}>
      <SignText size={18} y={50} fill={SIGN.white}>
        Downtown
      </SignText>
      <SignText size={15} y={74} fill={SIGN.white}>
        Airport →
      </SignText>
    </Rect>
  ),

  'pm-double-solid-yellow': (
    <g>
      <rect x="0" y="0" width="120" height="120" fill="#5b6068" />
      <rect x="54" y="0" width="5" height="120" fill={SIGN.yellow} />
      <rect x="63" y="0" width="5" height="120" fill={SIGN.yellow} />
      <rect x="12" y="0" width="4" height="120" fill={SIGN.white} />
      <rect x="106" y="0" width="4" height="120" fill={SIGN.white} />
    </g>
  ),
  'pm-broken-yellow': (
    <g>
      <rect x="0" y="0" width="120" height="120" fill="#5b6068" />
      <g fill={SIGN.yellow}>
        {[0, 30, 60, 90].map((y) => (
          <rect key={y} x="58" y={y + 4} width="5" height="20" />
        ))}
      </g>
      <rect x="12" y="0" width="4" height="120" fill={SIGN.white} />
      <rect x="106" y="0" width="4" height="120" fill={SIGN.white} />
    </g>
  ),
  'pm-solid-and-broken-yellow': (
    <g>
      <rect x="0" y="0" width="120" height="120" fill="#5b6068" />
      <rect x="54" y="0" width="5" height="120" fill={SIGN.yellow} />
      <g fill={SIGN.yellow}>
        {[0, 30, 60, 90].map((y) => (
          <rect key={y} x="63" y={y + 4} width="5" height="20" />
        ))}
      </g>
      <rect x="12" y="0" width="4" height="120" fill={SIGN.white} />
      <rect x="106" y="0" width="4" height="120" fill={SIGN.white} />
    </g>
  ),
  'pm-white-lane-line': (
    <g>
      <rect x="0" y="0" width="120" height="120" fill="#5b6068" />
      <g fill={SIGN.white}>
        {[0, 30, 60, 90].map((y) => (
          <rect key={y} x="58" y={y + 4} width="5" height="20" />
        ))}
      </g>
      <rect x="12" y="0" width="4" height="120" fill={SIGN.white} />
      <rect x="106" y="0" width="4" height="120" fill={SIGN.white} />
    </g>
  ),
};

export const SIGN_ART_IDS: readonly string[] = Object.keys(SIGN_ART);

/**
 * Official Nova Scotia Schedule image crops (all batches: RA-1 through RB-48S,
 * RB-49 through RB-107, RC-2 through RC-6, WC-1, and R-100 through R-204),
 * keyed by official designation. These are the authoritative artwork for signs
 * whose fidelity status is `official-crop`; the registry above holds only the
 * drawings for signs still on original SVG (`legacy-pending-crop`).
 *
 * The files are byte-for-byte the Province's Schedule images — no re-render,
 * no recolour, no aspect normalisation. Rendering must preserve the natural
 * aspect ratio (see SignArt) and apply no CSS filters.
 */
export const OFFICIAL_CROPS: Readonly<Record<string, string>> = {
  'RA-1': '/signs/ns-official/RA-1.png',
  'RA-1B': '/signs/ns-official/RA-1B.png',
  'RA-1S1': '/signs/ns-official/RA-1S1.png',
  'RA-1S2': '/signs/ns-official/RA-1S2.png',
  'RA-1S3': '/signs/ns-official/RA-1S3.png',
  'RA-1S4': '/signs/ns-official/RA-1S4.png',
  'RA-1S5': '/signs/ns-official/RA-1S5.png',
  'RA-2': '/signs/ns-official/RA-2.png',
  'RA-3L': '/signs/ns-official/RA-3L.png',
  'RA-3R': '/signs/ns-official/RA-3R.png',
  'RA-4L': '/signs/ns-official/RA-4L.png',
  'RA-4R': '/signs/ns-official/RA-4R.png',
  'RA-5L': '/signs/ns-official/RA-5L.png',
  'RA-5R': '/signs/ns-official/RA-5R.png',
  'RA-8': '/signs/ns-official/RA-8.png',
  'RB-1': '/signs/ns-official/RB-1.png',
  // Not a Schedule designation: the 50 km/h image of the variable-number RB-1.
  'RB-1A': '/signs/ns-official/RB-1A.png',
  'RB-2': '/signs/ns-official/RB-2.png',
  'RB-3': '/signs/ns-official/RB-3.png',
  'RB-4': '/signs/ns-official/RB-4.png',
  'RB-5': '/signs/ns-official/RB-5.png',
  'RB-9S': '/signs/ns-official/RB-9S.png',
  'RB-10': '/signs/ns-official/RB-10.png',
  'RB-11L': '/signs/ns-official/RB-11L.png',
  'RB-11R': '/signs/ns-official/RB-11R.png',
  'RB-11S1': '/signs/ns-official/RB-11S1.png',
  'RB-14L': '/signs/ns-official/RB-14L.png',
  'RB-14R': '/signs/ns-official/RB-14R.png',
  'RB-15': '/signs/ns-official/RB-15.png',
  'RB-15A': '/signs/ns-official/RB-15A.png',
  'RB-16': '/signs/ns-official/RB-16.png',
  'RB-17L': '/signs/ns-official/RB-17L.png',
  'RB-17R': '/signs/ns-official/RB-17R.png',
  'RB-18': '/signs/ns-official/RB-18.png',
  'RB-21': '/signs/ns-official/RB-21.png',
  'RB-23': '/signs/ns-official/RB-23.png',
  'RB-24': '/signs/ns-official/RB-24.png',
  'RB-25': '/signs/ns-official/RB-25.png',
  'RB-31': '/signs/ns-official/RB-31.png',
  'RB-32': '/signs/ns-official/RB-32.png',
  'RB-33': '/signs/ns-official/RB-33.png',
  'RB-33S1': '/signs/ns-official/RB-33S1.png',
  'RB-33S2': '/signs/ns-official/RB-33S2.png',
  'RB-34': '/signs/ns-official/RB-34.png',
  'RB-35': '/signs/ns-official/RB-35.png',
  'RB-36': '/signs/ns-official/RB-36.png',
  'RB-37': '/signs/ns-official/RB-37.png',
  'RB-38': '/signs/ns-official/RB-38.png',
  'RB-39': '/signs/ns-official/RB-39.png',
  'RB-40': '/signs/ns-official/RB-40.png',
  'RB-41L': '/signs/ns-official/RB-41L.png',
  'RB-41R': '/signs/ns-official/RB-41R.png',
  'RB-42L': '/signs/ns-official/RB-42L.png',
  'RB-42R': '/signs/ns-official/RB-42R.png',
  'RB-43': '/signs/ns-official/RB-43.png',
  'RB-44': '/signs/ns-official/RB-44.png',
  'RB-45': '/signs/ns-official/RB-45.png',
  'RB-46L': '/signs/ns-official/RB-46L.png',
  'RB-46R': '/signs/ns-official/RB-46R.png',
  'RB-46A': '/signs/ns-official/RB-46A.png',
  'RB-46B': '/signs/ns-official/RB-46B.png',
  'RB-47L': '/signs/ns-official/RB-47L.png',
  'RB-47R': '/signs/ns-official/RB-47R.png',
  'RB-47A': '/signs/ns-official/RB-47A.png',
  'RB-47B': '/signs/ns-official/RB-47B.png',
  'RB-47C': '/signs/ns-official/RB-47C.png',
  'RB-47D': '/signs/ns-official/RB-47D.png',
  'RB-47E': '/signs/ns-official/RB-47E.png',
  'RB-48': '/signs/ns-official/RB-48.png',
  'RB-48S': '/signs/ns-official/RB-48S.png',
  'RB-49': '/signs/ns-official/RB-49.png',
  'RB-51': '/signs/ns-official/RB-51.png',
  'RB-52': '/signs/ns-official/RB-52.png',
  'RB-52A': '/signs/ns-official/RB-52A.png',
  'RB-52B': '/signs/ns-official/RB-52B.png',
  'RB-53': '/signs/ns-official/RB-53.png',
  'RB-55': '/signs/ns-official/RB-55.png',
  'RB-57': '/signs/ns-official/RB-57.png',
  'RB-57A': '/signs/ns-official/RB-57A.png',
  'RB-61': '/signs/ns-official/RB-61.png',
  'RB-61SA': '/signs/ns-official/RB-61SA.png',
  'RB-61SB': '/signs/ns-official/RB-61SB.png',
  'RB-61SC': '/signs/ns-official/RB-61SC.png',
  'RB-62': '/signs/ns-official/RB-62.png',
  'RB-63': '/signs/ns-official/RB-63.png',
  'RB-63A': '/signs/ns-official/RB-63A.png',
  'RB-63B': '/signs/ns-official/RB-63B.png',
  'RB-64': '/signs/ns-official/RB-64.png',
  'RB-65': '/signs/ns-official/RB-65.png',
  'RB-66': '/signs/ns-official/RB-66.png',
  'RB-67': '/signs/ns-official/RB-67.png',
  'RB-68': '/signs/ns-official/RB-68.png',
  'RB-69': '/signs/ns-official/RB-69.png',
  'RB-70': '/signs/ns-official/RB-70.png',
  'RB-73L': '/signs/ns-official/RB-73L.png',
  'RB-73R': '/signs/ns-official/RB-73R.png',
  'RB-76': '/signs/ns-official/RB-76.png',
  'RB-77': '/signs/ns-official/RB-77.png',
  'RB-78': '/signs/ns-official/RB-78.png',
  'RB-79': '/signs/ns-official/RB-79.png',
  'RB-79T': '/signs/ns-official/RB-79T.png',
  'RB-80': '/signs/ns-official/RB-80.png',
  'RB-80A': '/signs/ns-official/RB-80A.png',
  'RB-80S1': '/signs/ns-official/RB-80S1.png',
  'RB-80S2': '/signs/ns-official/RB-80S2.png',
  'RB-81': '/signs/ns-official/RB-81.png',
  'RB-81A': '/signs/ns-official/RB-81A.png',
  'RB-84': '/signs/ns-official/RB-84.png',
  'RB-85': '/signs/ns-official/RB-85.png',
  'RB-86': '/signs/ns-official/RB-86.png',
  'RB-87': '/signs/ns-official/RB-87.png',
  'RB-88': '/signs/ns-official/RB-88.png',
  'RB-89': '/signs/ns-official/RB-89.png',
  'RB-90': '/signs/ns-official/RB-90.png',
  'RB-91': '/signs/ns-official/RB-91.png',
  'RB-92': '/signs/ns-official/RB-92.png',
  'RB-93': '/signs/ns-official/RB-93.png',
  'RB-94L': '/signs/ns-official/RB-94L.png',
  'RB-94R': '/signs/ns-official/RB-94R.png',
  'RB-96': '/signs/ns-official/RB-96.png',
  'RB-97': '/signs/ns-official/RB-97.png',
  'RB-98': '/signs/ns-official/RB-98.png',
  'RB-99': '/signs/ns-official/RB-99.png',
  'RB-100': '/signs/ns-official/RB-100.png',
  'RB-100S': '/signs/ns-official/RB-100S.png',
  'RB-101': '/signs/ns-official/RB-101.png',
  'RB-102': '/signs/ns-official/RB-102.png',
  'RB-102S': '/signs/ns-official/RB-102S.png',
  'RB-103': '/signs/ns-official/RB-103.png',
  'RB-104': '/signs/ns-official/RB-104.png',
  'RB-104S': '/signs/ns-official/RB-104S.png',
  'RB-105': '/signs/ns-official/RB-105.png',
  'RB-106': '/signs/ns-official/RB-106.png',
  'RB-107': '/signs/ns-official/RB-107.png',
  'RC-2': '/signs/ns-official/RC-2.png',
  'RC-4L': '/signs/ns-official/RC-4L.png',
  'RC-4R': '/signs/ns-official/RC-4R.png',
  'RC-5': '/signs/ns-official/RC-5.png',
  'RC-6': '/signs/ns-official/RC-6.png',
  'RC-6-OPTIONAL': '/signs/ns-official/RC-6%20(OPTIONAL).png',
  'WC-1': '/signs/ns-official/WC-1.png',
  'R-100': '/signs/ns-official/R-100.png',
  'R-101': '/signs/ns-official/R-101.png',
  'R-102': '/signs/ns-official/R-102.png',
  'R-102T': '/signs/ns-official/R-102T.png',
  'R-103T': '/signs/ns-official/R-103T.png',
  'R-104T': '/signs/ns-official/R-104T.png',
  'R-105': '/signs/ns-official/R-105.png',
  'R-107': '/signs/ns-official/R-107.png',
  'R-108': '/signs/ns-official/R-108.png',
  'R-109': '/signs/ns-official/R-109.png',
  'R-110': '/signs/ns-official/R-110.png',
  'R-112': '/signs/ns-official/R-112.png',
  'R-113': '/signs/ns-official/R-113.png',
  'R-114': '/signs/ns-official/R-114.png',
  'R-115': '/signs/ns-official/R-115.png',
  'R-116': '/signs/ns-official/R-116.png',
  'R-117': '/signs/ns-official/R-117.png',
  'R-118': '/signs/ns-official/R-118.png',
  'R-119': '/signs/ns-official/R-119.png',
  'R-120': '/signs/ns-official/R-120.png',
  'R-121': '/signs/ns-official/R-121.png',
  'R-122': '/signs/ns-official/R-122.png',
  'R-123': '/signs/ns-official/R-123.png',
  'R-124': '/signs/ns-official/R-124.png',
  'R-125': '/signs/ns-official/R-125.png',
  'R-126': '/signs/ns-official/R-126.png',
  'R-127': '/signs/ns-official/R-127.png',
  'R-128': '/signs/ns-official/R-128.png',
  'R-129': '/signs/ns-official/R-129.png',
  'R-130': '/signs/ns-official/R-130.png',
  'R-200': '/signs/ns-official/R-200.png',
  'R-201': '/signs/ns-official/R-201.png',
  'R-202': '/signs/ns-official/R-202.png',
  'R-203': '/signs/ns-official/R-203.png',
  'R-204': '/signs/ns-official/R-204.png',
  'guide-route-102': '/signs/ns-official/guide-route-102.png',
  'railway-crossbuck': '/signs/ns-official/railway-crossbuck.png',
  'railway-tracks-tab': '/signs/ns-official/railway-tracks-tab.png',
  'warning-slippery-when-wet': '/signs/ns-official/warning-slippery-when-wet.png',
  'warning-traffic-signal-ahead': '/signs/ns-official/warning-traffic-signal-ahead.png',
  'warning-stop-sign-ahead': '/signs/ns-official/warning-stop-sign-ahead.png',
  'warning-merge': '/signs/ns-official/warning-merge.png',
  'warning-road-narrows': '/signs/ns-official/warning-road-narrows.png',
  'warning-hidden-intersection': '/signs/ns-official/warning-hidden-intersection.png',
  'warning-steep-decline': '/signs/ns-official/warning-steep-decline.png',
  'warning-bump': '/signs/ns-official/warning-bump.png',
  'warning-divided-highway-ends': '/signs/ns-official/warning-divided-highway-ends.png',
  'warning-divided-highway-ahead': '/signs/ns-official/warning-divided-highway-ahead.png',
  'warning-right-curve': '/signs/ns-official/warning-right-curve.png',
  'warning-sharp-turn-right': '/signs/ns-official/warning-sharp-turn-right.png',
  'warning-chevron-right': '/signs/ns-official/warning-chevron-right.png',
  'warning-low-clearance': '/signs/ns-official/warning-low-clearance.png',
  'warning-right-lane-ends': '/signs/ns-official/warning-right-lane-ends.png',
  'warning-narrow-structure': '/signs/ns-official/warning-narrow-structure.png',
  'warning-truck-entering': '/signs/ns-official/warning-truck-entering.png',
  'warning-railway-crossing-ahead': '/signs/ns-official/warning-railway-crossing-ahead.png',
  'warning-fire-truck-entrance': '/signs/ns-official/warning-fire-truck-entrance.png',
  'warning-bridge-opening': '/signs/ns-official/warning-bridge-opening.png',
  'regulatory-hazard-marker-keep-right': '/signs/ns-official/regulatory-hazard-marker-keep-right.png',
  'regulatory-hazard-marker-keep-left': '/signs/ns-official/regulatory-hazard-marker-keep-left.png',
  'work-construction-zone': '/signs/ns-official/work-construction-zone.png',
  'work-end-construction': '/signs/ns-official/work-end-construction.png',
  'work-construction-distance': '/signs/ns-official/work-construction-distance.png',
  'work-uneven-lanes': '/signs/ns-official/work-uneven-lanes.png',
  'work-workers-ahead': '/signs/ns-official/work-workers-ahead.png',
  'work-traffic-control-person': '/signs/ns-official/work-traffic-control-person.png',
  'work-flashing-directional-arrow': '/signs/ns-official/work-flashing-directional-arrow.png',
  'work-tar': '/signs/ns-official/work-tar.png',
  'work-right-lane-ends': '/signs/ns-official/work-right-lane-ends.png',
  'work-prepare-to-stop': '/signs/ns-official/work-prepare-to-stop.png',
  'work-road-surface-hazard': '/signs/ns-official/work-road-surface-hazard.png',
  'work-road-narrows': '/signs/ns-official/work-road-narrows.png',
  'work-construction-traffic': '/signs/ns-official/work-construction-traffic.png',
  'work-blasting-ahead': '/signs/ns-official/work-blasting-ahead.png',
  'work-survey-work': '/signs/ns-official/work-survey-work.png',
  'work-overhead-work': '/signs/ns-official/work-overhead-work.png',
  'work-flashing-double-arrow': '/signs/ns-official/work-flashing-double-arrow.png',
  'warning-animal-crossing': '/signs/ns-official/warning-animal-crossing.png',
  'warning-playground': '/signs/ns-official/warning-playground.png',
  'guide-bicycle-route': '/signs/ns-official/guide-bicycle-route.png',
};

export const OFFICIAL_CROP_IDS: readonly string[] = Object.keys(OFFICIAL_CROPS);

export { cropKeyFor };

/**
 * Resolves a sign id to its official Schedule crop when the sign is wired to
 * one (fidelity status `official-crop`). Signs without a crop resolve to
 * undefined and fall back to the original SVG above.
 *
 * A few Schedule signs are *variable-number* designs: the Regulations fix the
 * layout and let the numeral change per location, so one designation covers
 * several real images. RB-1 "Maximum speed" is one — RB-1.png reads MAXIMUM 80
 * and RB-1A.png reads MAXIMUM 50. Those signs carry an `asset` key naming the
 * image for their variant; resolving by designation alone would show every
 * speed variant the same picture.
 */
type FidelityEntry = CropArtworkRef & {
  variant?: string;
  sourceId: string;
  status: string;
};

export function officialCropFor(signId: string): string | undefined {
  const fidelity = fidelityJson.signs[signId as keyof typeof fidelityJson.signs] as FidelityEntry | undefined;
  if (!fidelity || fidelity.status !== 'official-crop') return undefined;
  const key = cropKeyFor(fidelity);
  if (!key) return undefined;
  return OFFICIAL_CROPS[key];
}
