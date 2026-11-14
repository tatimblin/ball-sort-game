// The eight fills that tell cubes apart: tone and pattern only, no colour, so
// they read the same to every eye and in greyscale. Ordered so each tier adds
// the next most distinct one: easy uses the first three, expert all eight.
// Kept light: three tones (paper, pale grey, mid grey) and fine pattern ink
// whose strokes thin out on small cubes, so phones don't turn the board dark.
import type { ReactNode } from 'react';
import { C, S } from './iso';

export const INK = '#151515';
/** Pattern strokes: a touch softer than the outlines. */
const LINE = '#3a3a37';

type Tone = { top: string; left: string; right: string };
const PAPER: Tone = { top: '#fefefc', left: '#f3f3f0', right: '#e9e9e5' };
const GREY: Tone = { top: '#e0e0dc', left: '#d3d3ce', right: '#c6c6c1' };
const MID: Tone = { top: '#a9a9a5', left: '#999995', right: '#8b8b87' };

export interface Fill {
  name: string;
  tone: Tone;
  /** A pattern over the tone: its tile size in face-local pixels, and its
   *  drawing for a stroke weight `w` (1 on a full-size cube, less on small ones). */
  pattern?: { size: number; draw: (w: number) => ReactNode };
}

const sw = (base: number, w: number) => String(Math.round(base * w * 100) / 100);

export const FILLS: Fill[] = [
  { name: 'SOLID', tone: GREY },
  { name: 'HATCH', tone: PAPER, pattern: { size: 6, draw: (w) => <path d="M-1,1 l2,-2 M0,6 l6,-6 M5,7 l2,-2" stroke={LINE} strokeWidth={sw(0.75, w)} /> } },
  { name: 'DOT', tone: PAPER, pattern: { size: 6, draw: (w) => <circle cx="3" cy="3" r={sw(1, Math.max(w, 0.75))} fill={LINE} /> } },
  { name: 'CROSS', tone: PAPER, pattern: { size: 6, draw: (w) => <path d="M0,0.5 H6 M0.5,0 V6" stroke={LINE} strokeWidth={sw(0.6, w)} /> } },
  { name: 'INK', tone: MID },
  { name: 'WHITE', tone: PAPER },
  { name: 'CHECK', tone: PAPER, pattern: { size: 8, draw: () => <path d="M0,0h4v4h-4z M4,4h4v4h-4z" fill={LINE} fillOpacity="0.32" /> } },
  { name: 'RULE', tone: PAPER, pattern: { size: 6, draw: (w) => <path d="M3,0 V6" stroke={LINE} strokeWidth={sw(1.3, w)} /> } },
];

/** Pattern stroke weight for a cube `s` pixels on a side. */
export const patternWeight = (s: number) => Math.min(1, Math.max(0.55, s / 48));

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
 *  (or a host page) never share them. Tiles keep their pixel size, so small
 *  cubes get fewer, finer lines rather than a denser, darker texture. */
export function FillDefs({ prefix, fills, weight = 1 }: { prefix: string; fills: number[]; weight?: number }) {
  return (
    <>
      {fills.flatMap((v) => {
        const pattern = FILLS[v].pattern;
        if (!pattern) return [];
        return FACES.map((face) => (
          <pattern
            key={patternId(prefix, v, face)}
            id={patternId(prefix, v, face)}
            width={pattern.size}
            height={pattern.size}
            patternUnits="userSpaceOnUse"
            patternTransform={MATRIX[face]}
          >
            {pattern.draw(weight)}
          </pattern>
        ));
      })}
    </>
  );
}
