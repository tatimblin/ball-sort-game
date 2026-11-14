// The eight fills that tell cubes apart: tone and pattern only, no colour, so
// they read the same to every eye and in greyscale. Ordered so each tier adds
// the next most distinct one: easy uses the first three, expert all eight.
import type { ReactNode } from 'react';
import { C, S } from './iso';

export const INK = '#151515';

type Tone = { top: string; left: string; right: string };
const PAPER: Tone = { top: '#fdfdfb', left: '#ededea', right: '#dddcd8' };
const GREY: Tone = { top: '#cbcbc6', left: '#b8b8b3', right: '#a3a39e' };
const DARK: Tone = { top: '#4a4a47', left: '#343432', right: '#232321' };

export interface Fill {
  name: string;
  tone: Tone;
  /** A pattern drawn over the tone, in face-local pixels: [tile size, svg]. */
  pattern?: [number, ReactNode];
}

export const FILLS: Fill[] = [
  { name: 'SOLID', tone: GREY },
  { name: 'HATCH', tone: PAPER, pattern: [6, <path d="M-1,1 l2,-2 M0,6 l6,-6 M5,7 l2,-2" stroke={INK} strokeWidth="0.85" />] },
  { name: 'DOT', tone: PAPER, pattern: [5, <circle cx="2.5" cy="2.5" r="1.05" fill={INK} />] },
  { name: 'CROSS', tone: PAPER, pattern: [5, <path d="M0,0.5 H5 M0.5,0 V5" stroke={INK} strokeWidth="0.7" />] },
  { name: 'INK', tone: DARK },
  { name: 'WHITE', tone: PAPER },
  { name: 'CHECK', tone: PAPER, pattern: [8, <path d="M0,0h4v4h-4z M4,4h4v4h-4z" fill={INK} fillOpacity="0.5" />] },
  { name: 'RULE', tone: PAPER, pattern: [6, <path d="M3,0 V6" stroke={INK} strokeWidth="1.6" />] },
];

export const FACES = ['top', 'left', 'right'] as const;
type Face = (typeof FACES)[number];

// Each face gets its own copy of a pattern, sheared onto that face's plane.
const MATRIX: Record<Face, string> = {
  top: `matrix(${C},${S},${-C},${S},0,0)`,
  left: `matrix(${C},${S},0,1,0,0)`,
  right: `matrix(${-C},${S},0,1,0,0)`,
};

export const patternId = (prefix: string, fill: number, face: Face) => `${prefix}f${fill}${face}`;

/** <pattern>s for the given fills, ids namespaced by `prefix` so two games
 *  (or a host page) never share them. `scale` thins patterns on small cubes. */
export function FillDefs({ prefix, fills, scale = 1 }: { prefix: string; fills: number[]; scale?: number }) {
  return (
    <>
      {fills.flatMap((v) => {
        const pattern = FILLS[v].pattern;
        if (!pattern) return [];
        const [size, body] = pattern;
        return FACES.map((face) => (
          <pattern
            key={patternId(prefix, v, face)}
            id={patternId(prefix, v, face)}
            width={size}
            height={size}
            patternUnits="userSpaceOnUse"
            patternTransform={`${MATRIX[face]} scale(${scale})`}
          >
            {body}
          </pattern>
        ));
      })}
    </>
  );
}
