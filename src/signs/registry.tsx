import type { ReactNode } from 'react';
import { SIGN } from './palette';
import {
  Car,
  Diamond,
  InvertedTriangle,
  Octagon,
  Pedestrian,
  Pentagon,
  PermissionRing,
  ProhibitionRing,
  Rect,
  SignText,
  TurnArrow,
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
  // ---------------------------------------------------------------- regulatory
  stop: (
    <Octagon>
      <SignText size={30} fill={SIGN.white} letterSpacing={1}>
        STOP
      </SignText>
    </Octagon>
  ),
  yield: (
    <InvertedTriangle>
      <SignText size={17} y={52} letterSpacing={0.5}>
        YIELD
      </SignText>
    </InvertedTriangle>
  ),
  'maximum-speed-50': (
    <Rect>
      <SignText size={15} y={28} letterSpacing={1}>
        MAXIMUM
      </SignText>
      <SignText size={44} y={64}>
        50
      </SignText>
      <SignText size={14} y={96}>
        km/h
      </SignText>
    </Rect>
  ),
  'maximum-speed-80': (
    <Rect>
      <SignText size={15} y={28} letterSpacing={1}>
        MAXIMUM
      </SignText>
      <SignText size={44} y={64}>
        80
      </SignText>
      <SignText size={14} y={96}>
        km/h
      </SignText>
    </Rect>
  ),
  'speed-limit-change-ahead': (
    <Diamond>
      <Rect x={34} y={30} w={52} h={60} rx={3}>
        <SignText size={9} y={44} letterSpacing={0.5}>
          MAXIMUM
        </SignText>
        <SignText size={26} y={64}>
          50
        </SignText>
        <SignText size={9} y={81}>
          km/h
        </SignText>
      </Rect>
    </Diamond>
  ),
  'one-way': (
    <Rect fill={SIGN.black} stroke={SIGN.black} x={4} y={34} w={112} h={52} rx={3}>
      <path
        d="M22 56 L84 56 M74 46 L86 56 L74 66"
        stroke={SIGN.white}
        strokeWidth="6"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <SignText size={11} x={60} y={76} fill={SIGN.white} letterSpacing={1}>
        ONE WAY
      </SignText>
    </Rect>
  ),
  'do-not-enter': (
    <Rect>
      <circle cx="60" cy="60" r="38" fill={SIGN.red} />
      <rect x="30" y="52" width="60" height="16" fill={SIGN.white} rx="2" />
    </Rect>
  ),
  'do-not-pass': (
    <Rect>
      <ProhibitionRing>
        <Car x={30} y={34} scale={0.72} />
        <Car x={54} y={58} scale={0.72} />
      </ProhibitionRing>
    </Rect>
  ),
  'passing-permitted': (
    <Rect>
      <PermissionRing>
        <Car x={30} y={34} scale={0.72} />
        <Car x={54} y={58} scale={0.72} />
      </PermissionRing>
    </Rect>
  ),
  'no-left-turn': (
    <Rect>
      <ProhibitionRing>
        <TurnArrow direction="left" x={42} y={38} scale={0.95} />
      </ProhibitionRing>
    </Rect>
  ),
  'no-right-turn': (
    <Rect>
      <ProhibitionRing>
        <TurnArrow direction="right" x={38} y={38} scale={0.95} />
      </ProhibitionRing>
    </Rect>
  ),
  'no-right-turn-on-red': (
    <Rect>
      <g transform="translate(10 -6) scale(0.82) translate(0 0)">
        <ProhibitionRing>
          <TurnArrow direction="right" x={38} y={38} scale={0.95} />
        </ProhibitionRing>
      </g>
      <SignText size={16} y={102} letterSpacing={1}>
        ON RED
      </SignText>
    </Rect>
  ),
  'no-u-turn': (
    <Rect>
      <ProhibitionRing>
        <TurnArrow direction="uturn" x={33} y={35} scale={0.92} />
      </ProhibitionRing>
    </Rect>
  ),
  'no-turns': (
    <Rect>
      <ProhibitionRing>
        <TurnArrow direction="left" x={22} y={42} scale={0.68} />
        <TurnArrow direction="right" x={62} y={42} scale={0.68} />
      </ProhibitionRing>
    </Rect>
  ),
  'no-parking': (
    <Rect>
      <g transform="translate(0 -8)">
        <ProhibitionRing>
          <SignText size={46} y={62}>
            P
          </SignText>
        </ProhibitionRing>
      </g>
      <path
        d="M26 104 L94 104 M32 98 L24 104 L32 110 M88 98 L96 104 L88 110"
        stroke={SIGN.black}
        strokeWidth="3.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Rect>
  ),
  'no-stopping': (
    <Rect>
      <g transform="translate(0 -8)">
        <ProhibitionRing>
          <SignText size={46} y={62}>
            S
          </SignText>
        </ProhibitionRing>
      </g>
      <path
        d="M26 104 L94 104 M32 98 L24 104 L32 110 M88 98 L96 104 L88 110"
        stroke={SIGN.black}
        strokeWidth="3.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Rect>
  ),
  'accessible-parking': (
    <Rect fill={SIGN.blue} stroke={SIGN.blue}>
      <g fill={SIGN.white}>
        <circle cx="48" cy="26" r="8" />
        <path d="M44 38 q10 -3 13 6 l5 15 h14 v8 h-20 l-4 -11 z" />
        <circle cx="56" cy="76" r="22" fill="none" stroke={SIGN.white} strokeWidth="7" />
        <rect x="42" y="42" width="8" height="26" rx="3" />
      </g>
    </Rect>
  ),
  'truck-route': (
    <Rect>
      <SignText size={13} y={26} letterSpacing={0.5}>
        TRUCK
      </SignText>
      <SignText size={13} y={42} letterSpacing={0.5}>
        ROUTE
      </SignText>
      <g fill={SIGN.black} transform="translate(28 56)">
        <rect x="0" y="6" width="34" height="17" rx="2" />
        <path d="M34 12 L46 12 L54 20 L54 23 L34 23 Z" />
        <circle cx="11" cy="25" r="5" />
        <circle cx="45" cy="25" r="5" />
      </g>
      <path
        d="M40 102 L82 102 M74 95 L84 102 L74 109"
        stroke={SIGN.black}
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Rect>
  ),
  'keep-right-of-island': (
    <Rect>
      <ellipse cx="42" cy="66" rx="14" ry="26" fill={SIGN.black} />
      <path
        d="M76 104 L76 60 q0 -20 -8 -30"
        stroke={SIGN.black}
        strokeWidth="8"
        fill="none"
        strokeLinecap="round"
      />
      <path d="M60 32 L76 16 L84 40 Z" fill={SIGN.black} />
    </Rect>
  ),
  'hazard-marker-keep-right': (
    <g>
      <rect x="34" y="6" width="52" height="108" rx="3" fill={SIGN.yellow} />
      <g stroke={SIGN.black} strokeWidth="9" clipPath="url(#hz-clip)">
        <line x1="34" y1="36" x2="86" y2="10" />
        <line x1="34" y1="62" x2="86" y2="36" />
        <line x1="34" y1="88" x2="86" y2="62" />
        <line x1="34" y1="114" x2="86" y2="88" />
      </g>
      <defs>
        <clipPath id="hz-clip">
          <rect x="34" y="6" width="52" height="108" rx="3" />
        </clipPath>
      </defs>
      <rect
        x="34"
        y="6"
        width="52"
        height="108"
        rx="3"
        fill="none"
        stroke={SIGN.black}
        strokeWidth="1.5"
      />
    </g>
  ),

  // ------------------------------------------------------------------ warning
  'slippery-when-wet': (
    <Diamond>
      <Car x={40} y={32} scale={1.05} />
      <path
        d="M38 78 q10 -8 20 0 t20 0 M38 92 q10 -8 20 0 t20 0"
        stroke={SIGN.black}
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
      />
    </Diamond>
  ),
  'traffic-signal-ahead': (
    <Diamond>
      <rect x="46" y="26" width="28" height="68" rx="6" fill={SIGN.black} />
      <circle cx="60" cy="42" r="8" fill={SIGN.red} />
      <circle cx="60" cy="60" r="8" fill={SIGN.yellow} />
      <circle cx="60" cy="78" r="8" fill={SIGN.permitGreen} />
    </Diamond>
  ),
  'stop-sign-ahead': (
    <Diamond>
      <g transform="translate(60 44) scale(0.4) translate(-60 -60)">
        <Octagon>
          <SignText size={30} fill={SIGN.white} letterSpacing={1}>
            STOP
          </SignText>
        </Octagon>
      </g>
      <path
        d="M60 98 L60 70 M52 78 L60 68 L68 78"
        stroke={SIGN.black}
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Diamond>
  ),
  merge: (
    <Diamond>
      <path d="M52 104 L52 40" stroke={SIGN.black} strokeWidth="8" strokeLinecap="round" />
      <path d="M36 44 L52 22 L68 44 Z" fill={SIGN.black} />
      <path
        d="M84 104 L84 72 q0 -16 -14 -22"
        stroke={SIGN.black}
        strokeWidth="8"
        fill="none"
        strokeLinecap="round"
      />
    </Diamond>
  ),
  'road-narrows': (
    <Diamond>
      <path
        d="M28 102 L28 74 L48 40 L48 20 M92 102 L92 74 L72 40 L72 20"
        stroke={SIGN.black}
        strokeWidth="7"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Diamond>
  ),
  'hidden-intersection': (
    <Diamond>
      <line x1="60" y1="20" x2="60" y2="100" stroke={SIGN.black} strokeWidth="9" />
      <line
        x1="20"
        y1="60"
        x2="100"
        y2="60"
        stroke={SIGN.black}
        strokeWidth="9"
        strokeDasharray="11 9"
      />
    </Diamond>
  ),
  'steep-decline': (
    <Diamond>
      <line x1="24" y1="42" x2="96" y2="94" stroke={SIGN.black} strokeWidth="5" />
      <g transform="translate(42 44) rotate(36)" fill={SIGN.black}>
        <rect x="0" y="0" width="30" height="15" rx="2" />
        <path d="M30 5 L42 5 L48 12 L48 15 L30 15 Z" />
        <circle cx="9" cy="17" r="4.5" />
        <circle cx="40" cy="17" r="4.5" />
      </g>
    </Diamond>
  ),
  bump: (
    <Diamond>
      <path
        d="M22 76 L44 76 q16 -34 32 0 L98 76"
        stroke={SIGN.black}
        strokeWidth="8"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Diamond>
  ),
  'divided-highway-ends': (
    <Diamond>
      <path
        d="M44 100 L44 66 q0 -14 16 -14 q16 0 16 14 L76 100"
        stroke={SIGN.black}
        strokeWidth="7"
        fill="none"
        strokeLinejoin="round"
      />
      <path d="M52 34 L60 16 L68 34 Z" fill={SIGN.black} />
      <line x1="60" y1="52" x2="60" y2="30" stroke={SIGN.black} strokeWidth="7" />
    </Diamond>
  ),
  'divided-highway-ahead': (
    <Diamond>
      <path
        d="M44 20 L44 54 q0 14 16 14 q16 0 16 -14 L76 20"
        stroke={SIGN.black}
        strokeWidth="7"
        fill="none"
        strokeLinejoin="round"
      />
      <line x1="60" y1="68" x2="60" y2="90" stroke={SIGN.black} strokeWidth="7" />
      <path d="M52 86 L60 104 L68 86 Z" fill={SIGN.black} />
    </Diamond>
  ),
  'right-curve': (
    <Diamond>
      <path
        d="M46 102 L46 66 q0 -22 22 -30"
        stroke={SIGN.black}
        strokeWidth="9"
        fill="none"
        strokeLinecap="round"
      />
      <path d="M58 22 L86 32 L62 50 Z" fill={SIGN.black} />
    </Diamond>
  ),
  'sharp-turn-right': (
    <Diamond>
      <path
        d="M46 82 L46 46 L74 46"
        stroke={SIGN.black}
        strokeWidth="9"
        fill="none"
        strokeLinejoin="round"
      />
      <path d="M68 32 L92 46 L68 60 Z" fill={SIGN.black} />
      <g>
        <rect
          x="30"
          y="90"
          width="60"
          height="16"
          fill={SIGN.white}
          stroke={SIGN.black}
          strokeWidth="1.5"
        />
        <rect x="30" y="90" width="15" height="8" fill={SIGN.black} />
        <rect x="60" y="90" width="15" height="8" fill={SIGN.black} />
        <rect x="45" y="98" width="15" height="8" fill={SIGN.black} />
        <rect x="75" y="98" width="15" height="8" fill={SIGN.black} />
      </g>
    </Diamond>
  ),
  'chevron-right': (
    <g>
      <rect x="26" y="16" width="68" height="88" rx="3" fill={SIGN.yellow} stroke={SIGN.black} strokeWidth="1.5" />
      <path
        d="M44 34 L72 60 L44 86"
        stroke={SIGN.black}
        strokeWidth="16"
        fill="none"
        strokeLinejoin="round"
      />
    </g>
  ),
  'low-clearance': (
    <Diamond>
      <path
        d="M18 46 L44 46 M36 38 L46 46 L36 54"
        stroke={SIGN.black}
        strokeWidth="6"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M102 46 L76 46 M84 38 L74 46 L84 54"
        stroke={SIGN.black}
        strokeWidth="6"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <SignText size={19} y={80}>
        4.0 m
      </SignText>
    </Diamond>
  ),
  'right-lane-ends': (
    <Diamond>
      <line x1="48" y1="102" x2="48" y2="24" stroke={SIGN.black} strokeWidth="8" strokeLinecap="round" />
      <path
        d="M82 102 L82 66 q0 -24 -20 -34"
        stroke={SIGN.black}
        strokeWidth="8"
        fill="none"
        strokeLinecap="round"
      />
    </Diamond>
  ),
  'narrow-structure': (
    <Diamond>
      <rect x="34" y="34" width="10" height="52" fill={SIGN.black} />
      <rect x="76" y="34" width="10" height="52" fill={SIGN.black} />
      <path
        d="M30 102 L44 86 M90 102 L76 86 M30 18 L44 34 M90 18 L76 34"
        stroke={SIGN.black}
        strokeWidth="6"
        strokeLinecap="round"
      />
    </Diamond>
  ),
  'truck-entering': (
    <Diamond>
      <line x1="40" y1="104" x2="40" y2="20" stroke={SIGN.black} strokeWidth="8" />
      <line x1="40" y1="62" x2="98" y2="62" stroke={SIGN.black} strokeWidth="6" />
      <g fill={SIGN.black} transform="translate(58 38)">
        <rect x="0" y="4" width="24" height="13" rx="2" />
        <path d="M24 8 L34 8 L40 14 L40 17 L24 17 Z" />
        <circle cx="7" cy="19" r="3.6" />
        <circle cx="33" cy="19" r="3.6" />
      </g>
    </Diamond>
  ),
  'animal-crossing': (
    <Diamond>
      <g fill={SIGN.black} transform="translate(24 28)">
        <path d="M30 18 q6 -10 18 -10 q12 0 16 12 l4 16 v26 h-6 l-2 -18 h-24 l-2 18 h-6 v-26 q-10 -6 -10 -18 z" />
        <path d="M28 12 l-12 -10 l4 -2 l10 8 z M64 12 l12 -10 l-4 -2 l-10 8 z" />
        <path d="M18 4 q-8 -6 -14 -4 q8 -6 16 0 z M74 4 q8 -6 14 -4 q-8 -6 -16 0 z" />
      </g>
    </Diamond>
  ),

  // ------------------------------------------------ school / pedestrian / cycle
  'school-area': (
    <Pentagon>
      <Pedestrian x={34} y={40} scale={0.82} />
      <Pedestrian x={62} y={48} scale={0.64} />
    </Pentagon>
  ),
  'school-crosswalk': (
    <Pentagon>
      <Pedestrian x={32} y={32} scale={0.7} />
      <Pedestrian x={58} y={38} scale={0.55} />
      <g fill={SIGN.black}>
        <rect x="24" y="94" width="72" height="4" />
        <rect x="24" y="102" width="72" height="4" />
      </g>
    </Pentagon>
  ),
  'pedestrian-crosswalk': (
    <Rect>
      <Pedestrian x={44} y={20} scale={1.0} />
      <g fill={SIGN.black}>
        <rect x="26" y="92" width="68" height="5" />
        <rect x="26" y="102" width="68" height="5" />
      </g>
    </Rect>
  ),
  playground: (
    <Diamond fill={SIGN.fluorGreen}>
      <g fill={SIGN.black} transform="translate(40 28)">
        <circle cx="18" cy="8" r="7" />
        <path d="M18 16 q-9 0 -11 9 l-4 14 h6 l3 -9 l0 10 l-7 18 h7 l6 -14 l6 14 h7 l-7 -18 l0 -10 l3 9 h6 l-4 -14 q-2 -9 -11 -9 z" />
      </g>
    </Diamond>
  ),
  'bicycle-route': (
    <Diamond>
      <g stroke={SIGN.black} fill="none" strokeWidth="5">
        <circle cx="38" cy="76" r="16" />
        <circle cx="82" cy="76" r="16" />
        <path d="M38 76 L54 48 L74 48 M54 48 L64 76 L82 76" strokeLinejoin="round" />
      </g>
      <rect x="48" y="42" width="18" height="4" fill={SIGN.black} />
    </Diamond>
  ),

  // ------------------------------------------------------------------- railway
  'railway-crossbuck': (
    <g>
      <g transform="rotate(32 60 60)">
        <rect
          x="4"
          y="50"
          width="112"
          height="20"
          rx="3"
          fill={SIGN.white}
          stroke={SIGN.red}
          strokeWidth="4"
        />
      </g>
      <g transform="rotate(-32 60 60)">
        <rect
          x="4"
          y="50"
          width="112"
          height="20"
          rx="3"
          fill={SIGN.white}
          stroke={SIGN.red}
          strokeWidth="4"
        />
      </g>
    </g>
  ),
  'railway-tracks-tab': (
    <Rect x={30} y={38} w={60} h={44} rx={3}>
      <SignText size={30} y={60}>
        2
      </SignText>
    </Rect>
  ),

  // ----------------------------------------------------------------- lane use
  'lane-right-turn-only': (
    <Rect>
      <TurnArrow direction="right" x={38} y={36} scale={1.1} />
    </Rect>
  ),
  'lane-straight-or-left': (
    <Rect>
      <TurnArrow direction="left" x={20} y={40} scale={0.85} />
      <TurnArrow direction="straight" x={66} y={40} scale={0.85} />
    </Rect>
  ),
  'two-way-left-turn-lane': (
    <Rect>
      <g transform="translate(22 10) scale(0.78)">
        <TurnArrow direction="left" x={0} y={0} scale={0.9} />
      </g>
      <g transform="translate(98 110) rotate(180) scale(0.78)">
        <TurnArrow direction="left" x={0} y={0} scale={0.9} />
      </g>
    </Rect>
  ),

  // ------------------------------------------------------------------- guide
  'route-102': (
    <g>
      <path
        d="M60 6 q34 6 50 6 q4 46 -50 102 q-54 -56 -50 -102 q16 0 50 -6 z"
        fill={SIGN.white}
        stroke={SIGN.black}
        strokeWidth="3"
      />
      <SignText size={11} y={38} letterSpacing={0.5}>
        NOVA SCOTIA
      </SignText>
      <SignText size={38} y={72}>
        102
      </SignText>
    </g>
  ),
  'guide-destination': (
    <Rect fill={SIGN.green} stroke={SIGN.green} x={4} y={26} w={112} h={68} rx={4}>
      <SignText size={18} y={50} fill={SIGN.white}>
        Halifax
      </SignText>
      <SignText size={15} y={74} fill={SIGN.white}>
        12 km
      </SignText>
    </Rect>
  ),
  'two-way-traffic': (
    <Diamond>
      <g transform="translate(24 38)">
        <TurnArrow direction="straight" x={0} y={0} scale={0.9} />
      </g>
      <g transform="translate(96 82) rotate(180)">
        <TurnArrow direction="straight" x={0} y={0} scale={0.9} />
      </g>
    </Diamond>
  ),

  // --------------------------------------------------------------- work zone
  'wz-construction-ahead': (
    <Diamond fill={SIGN.orange}>
      <g fill={SIGN.black} transform="translate(28 26)">
        <circle cx="30" cy="10" r="7" />
        <path d="M18 6 q12 -9 24 0 l2 3 h-28 z" />
        <path d="M28 18 q-10 1 -12 10 l-2 12 h6 l3 -8 l1 10 l-6 22 h7 l6 -18 l6 18 h7 l-6 -22 l1 -14 l8 8 l4 -4 l-10 -11 q-4 -3 -13 -3 z" />
      </g>
      <path d="M46 92 L86 64" stroke={SIGN.black} strokeWidth="4" />
      <path d="M82 56 L94 60 L90 72 Z" fill={SIGN.black} />
    </Diamond>
  ),
  'wz-workers-ahead': (
    <Diamond fill={SIGN.orange}>
      <g fill={SIGN.black} transform="translate(42 26)">
        <path d="M6 12 q12 -12 24 0 l2 4 h-28 z" />
        <circle cx="18" cy="10" r="7" />
        <path d="M18 20 q-10 0 -12 9 l-4 15 h6 l4 -11 v12 l-6 22 h7 l7 -18 l7 18 h7 l-6 -22 v-12 l4 11 h6 l-4 -15 q-2 -9 -12 -9 z" />
      </g>
      <path
        d="M16 98 L4 88 L16 86 Z M104 98 L116 88 L104 86 Z"
        fill={SIGN.orange}
        stroke={SIGN.black}
        strokeWidth="1.5"
      />
    </Diamond>
  ),
  'wz-traffic-control-person': (
    <Diamond fill={SIGN.orange}>
      <g fill={SIGN.black} transform="translate(32 28)">
        <path d="M6 12 q12 -12 24 0 l2 4 h-28 z" />
        <circle cx="18" cy="10" r="7" />
        <path d="M18 20 q-10 0 -12 9 l-4 15 h6 l4 -11 v12 l-6 22 h7 l7 -18 l7 18 h7 l-6 -22 v-12 l4 11 h6 l-4 -15 q-2 -9 -12 -9 z" />
      </g>
      <line x1="80" y1="34" x2="80" y2="92" stroke={SIGN.black} strokeWidth="4" />
      <circle cx="80" cy="36" r="12" fill={SIGN.black} />
    </Diamond>
  ),
  'wz-construction-distance-ahead': (
    <Diamond fill={SIGN.orange}>
      <SignText size={22} y={48}>
        1.5 km
      </SignText>
      <line x1="60" y1="62" x2="60" y2="88" stroke={SIGN.black} strokeWidth="7" />
      <path d="M50 84 L60 102 L70 84 Z" fill={SIGN.black} />
    </Diamond>
  ),
  'wz-end-construction': (
    <Rect fill={SIGN.orange} x={4} y={30} w={112} h={60} rx={4}>
      <SignText size={17} y={50} letterSpacing={0.5}>
        END
      </SignText>
      <SignText size={13} y={72} letterSpacing={0.5}>
        CONSTRUCTION
      </SignText>
    </Rect>
  ),
  'wz-uneven-lanes': (
    <Diamond fill={SIGN.orange}>
      <path
        d="M20 78 L58 78 L58 58 L100 58"
        stroke={SIGN.black}
        strokeWidth="8"
        fill="none"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <g fill={SIGN.black} transform="translate(32 30)">
        <rect x="0" y="0" width="26" height="13" rx="2" />
        <circle cx="7" cy="15" r="3.5" />
        <circle cx="21" cy="15" r="3.5" />
      </g>
    </Diamond>
  ),
  'wz-flashing-arrow-right': (
    <Rect fill={SIGN.black} stroke={SIGN.black} x={4} y={26} w={112} h={68} rx={5}>
      <g fill={SIGN.yellow}>
        {[24, 38, 52, 66].map((x) => (
          <circle key={x} cx={x} cy={60} r="5.5" />
        ))}
        <circle cx="80" cy="60" r="5.5" />
        <circle cx="80" cy="46" r="5.5" />
        <circle cx="80" cy="74" r="5.5" />
        <circle cx="94" cy="60" r="5.5" />
      </g>
    </Rect>
  ),

  // --------------------------------------------------------- pavement markings
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
