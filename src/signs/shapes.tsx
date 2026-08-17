import type { ReactNode } from 'react';
import { SIGN } from './palette';

/**
 * Reusable sign blanks. Every sign in the registry is composed from these so
 * that shapes stay consistent with the legal descriptions (octagon for stop
 * only, inverted triangle for yield, diamond for warning, pentagon for school).
 */

const STROKE = SIGN.black;

export function Octagon({ children }: { children?: ReactNode }) {
  // Regular octagon inscribed in the 120-box.
  const r = 56;
  const pts = Array.from({ length: 8 }, (_, i) => {
    const a = (Math.PI / 4) * i + Math.PI / 8;
    return `${(60 + r * Math.cos(a)).toFixed(2)},${(60 + r * Math.sin(a)).toFixed(2)}`;
  }).join(' ');
  return (
    <>
      <polygon points={pts} fill={SIGN.red} stroke={STROKE} strokeWidth="1.5" />
      <polygon
        points={pts}
        fill="none"
        stroke={SIGN.white}
        strokeWidth="4"
        transform="translate(60 60) scale(0.88) translate(-60 -60)"
      />
      {children}
    </>
  );
}

export function InvertedTriangle({ children }: { children?: ReactNode }) {
  return (
    <>
      <polygon points="6,16 114,16 60,112" fill={SIGN.red} stroke={STROKE} strokeWidth="1.5" />
      <polygon points="20,25 100,25 60,96" fill={SIGN.white} />
      {children}
    </>
  );
}

export function Diamond({
  fill = SIGN.yellow,
  children,
}: {
  fill?: string;
  children?: ReactNode;
}) {
  return (
    <>
      <polygon points="60,4 116,60 60,116 4,60" fill={fill} stroke={STROKE} strokeWidth="1.5" />
      {children}
    </>
  );
}

/** Five-sided school-area blank: pointed top, vertical sides, flat base. */
export function Pentagon({ children }: { children?: ReactNode }) {
  return (
    <>
      <polygon
        points="60,6 112,44 92,112 28,112 8,44"
        fill={SIGN.fluorGreen}
        stroke={STROKE}
        strokeWidth="1.5"
      />
      {children}
    </>
  );
}

export function Rect({
  fill = SIGN.white,
  stroke = STROKE,
  x = 14,
  y = 6,
  w = 92,
  h = 108,
  rx = 5,
  children,
}: {
  fill?: string;
  stroke?: string;
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  rx?: number;
  children?: ReactNode;
}) {
  return (
    <>
      <rect x={x} y={y} width={w} height={h} rx={rx} fill={fill} stroke={stroke} strokeWidth="1.5" />
      {children}
    </>
  );
}

/** The red ring + diagonal slash used by prohibition signs. */
export function ProhibitionRing({ children }: { children?: ReactNode }) {
  return (
    <>
      <circle cx="60" cy="60" r="44" fill={SIGN.white} stroke={SIGN.red} strokeWidth="11" />
      {children}
      <line
        x1="29"
        y1="91"
        x2="91"
        y2="29"
        stroke={SIGN.red}
        strokeWidth="11"
        strokeLinecap="round"
      />
    </>
  );
}

/** The green ring used by permissive signs ("this manoeuvre is allowed"). */
export function PermissionRing({ children }: { children?: ReactNode }) {
  return (
    <>
      <circle cx="60" cy="60" r="44" fill={SIGN.white} stroke={SIGN.permitGreen} strokeWidth="11" />
      {children}
    </>
  );
}

export function SignText({
  children,
  x = 60,
  y = 60,
  size = 26,
  fill = SIGN.black,
  weight = 700,
  letterSpacing = 0,
}: {
  children: ReactNode;
  x?: number;
  y?: number;
  size?: number;
  fill?: string;
  weight?: number;
  letterSpacing?: number;
}) {
  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      dominantBaseline="central"
      fontFamily="'Helvetica Neue', Helvetica, Arial, sans-serif"
      fontSize={size}
      fontWeight={weight}
      letterSpacing={letterSpacing}
      fill={fill}
    >
      {children}
    </text>
  );
}

/** Simple side-on car silhouette, used by the passing signs. */
export function Car({
  x = 0,
  y = 0,
  scale = 1,
  fill = SIGN.black,
}: {
  x?: number;
  y?: number;
  scale?: number;
  fill?: string;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} fill={fill}>
      <path d="M2 14 L8 5 L26 5 L34 14 L36 14 L36 21 L0 21 L0 14 Z" />
      <circle cx="9" cy="21.5" r="4" />
      <circle cx="28" cy="21.5" r="4" />
    </g>
  );
}

/** Adult pedestrian silhouette. */
export function Pedestrian({
  x = 0,
  y = 0,
  scale = 1,
  fill = SIGN.black,
}: {
  x?: number;
  y?: number;
  scale?: number;
  fill?: string;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} fill={fill}>
      <circle cx="12" cy="5" r="5" />
      <path d="M12 11 c-5 0 -8 3 -9 8 l-3 12 h4 l3 -9 v10 l-4 17 h5 l4 -15 l4 15 h5 l-4 -17 v-10 l3 9 h4 l-3 -12 c-1 -5 -4 -8 -9 -8 z" />
    </g>
  );
}

/** Arrow used by turn-prohibition and lane-use signs. */
export function TurnArrow({
  direction,
  fill = SIGN.black,
  x = 0,
  y = 0,
  scale = 1,
}: {
  direction: 'left' | 'right' | 'straight' | 'uturn';
  fill?: string;
  x?: number;
  y?: number;
  scale?: number;
}) {
  const paths: Record<string, string> = {
    straight: 'M14 44 L14 18 L4 18 L20 0 L36 18 L26 18 L26 44 Z',
    right: 'M6 44 L6 24 C6 12 14 8 24 8 L24 0 L40 14 L24 28 L24 20 C16 20 18 24 18 28 L18 44 Z',
    left: 'M34 44 L34 24 C34 12 26 8 16 8 L16 0 L0 14 L16 28 L16 20 C24 20 22 24 22 28 L22 44 Z',
    uturn:
      'M6 46 L6 20 C6 8 16 2 26 2 C36 2 46 8 46 20 L46 32 L54 32 L40 48 L26 32 L34 32 L34 20 C34 15 30 13 26 13 C22 13 18 15 18 20 L18 46 Z',
  };
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <path d={paths[direction]} fill={fill} />
    </g>
  );
}
