// Isometric geometry and board layout. World axes: +i runs right-down, +j
// left-down, +k up; one cube is one unit. A layout places each column's
// footprint on the ground grid (every position is a multiple of GRID, so the
// background grid lines run along the footprints' edges) and fits the whole
// board into the frame.
import { HEIGHT } from '../utils/rules';

export const C = Math.cos(Math.PI / 6);
export const S = 0.5;
/** The fine grid's step, in cube units. */
export const GRID = 0.5;
/** How far a lifted cube rises, in cube units. */
export const LIFT = 0.85;

export type Pt = [number, number];

export interface Place {
  i: number;
  j: number;
  row: number;
}

export interface Layout {
  /** 'diagonal': one row along +i, the blueprint view. 'rows': rows running
   *  straight across the screen, for narrow frames and many columns. */
  kind: 'diagonal' | 'rows';
  rows: number;
  places: Place[];
  /** Pixels per cube unit. */
  s: number;
  ox: number;
  oy: number;
  /** Screen distance between neighbouring columns: the tap target width. */
  advance: number;
  /** Labels lie on the ground (wide diagonal) or stand upright under each column. */
  groundLabels: boolean;
}

export function project(l: Pick<Layout, 's' | 'ox' | 'oy'>, i: number, j: number, k = 0): Pt {
  return [l.ox + (i - j) * C * l.s, l.oy + (i + j) * S * l.s - k * l.s];
}

/** The world point on the ground (k = 0) under a screen point. */
export function unproject(l: Pick<Layout, 's' | 'ox' | 'oy'>, x: number, y: number): [number, number] {
  const u = (x - l.ox) / (C * l.s);
  const v = (y - l.oy) / (S * l.s);
  return [(u + v) / 2, (v - u) / 2];
}

/** Gap between diagonal columns, along i. */
const DIAGONAL_PITCH = 2.5;
/** Gap between columns in a straight row, along i and -j each. */
const ROW_PITCH = 1.5;
/** Gap between straight rows, along i and j each: a full stack, its lift and labels. */
const ROW_GAP = 7;

function places(kind: Layout['kind'], n: number, rows: number): Place[] {
  if (kind === 'diagonal') return Array.from({ length: n }, (_, c) => ({ i: c * DIAGONAL_PITCH, j: 0, row: 0 }));
  const perRow = Math.ceil(n / rows);
  return Array.from({ length: n }, (_, c) => {
    const row = Math.floor(c / perRow);
    // Centre a short last row under the ones above it.
    const inRow = row === rows - 1 ? n - perRow * (rows - 1) : perRow;
    const q = (c % perRow) + (perRow - inRow) / 2;
    const at = Math.round((q * ROW_PITCH) / GRID) * GRID;
    return { i: at + row * ROW_GAP, j: -at + row * ROW_GAP, row };
  });
}

/** The extent of everything drawn for a column, at unit scale from the origin. */
function extent(kind: Layout['kind'], p: Place, groundLabels: boolean): Pt[] {
  const unit = { s: 1, ox: 0, oy: 0 };
  const pts: Pt[] = [
    project(unit, p.i - GRID, p.j - GRID),
    project(unit, p.i + 1 + GRID, p.j - GRID),
    project(unit, p.i + 1 + GRID, p.j + 1 + GRID),
    project(unit, p.i - GRID, p.j + 1 + GRID),
    // The top of a lifted cube on a full column.
    project(unit, p.i, p.j, HEIGHT + LIFT),
    project(unit, p.i + 1, p.j + 1, HEIGHT + LIFT + 0.4),
  ];
  if (kind === 'diagonal') pts.push(project(unit, p.i - 0.9, p.j + 1, HEIGHT));
  if (groundLabels) {
    pts.push(project(unit, p.i - 0.1, p.j + 2.6), project(unit, p.i + 2, p.j + 2.6));
  } else {
    const [x, y] = project(unit, p.i + 1, p.j + 1);
    pts.push([x, y + 1.1]);
  }
  return pts;
}

/** The layout for `n` columns in a W×H frame (pixels), with `pad` kept clear
 *  inside its edges. Prefers the diagonal blueprint row while its columns stay
 *  at least `minTap` pixels apart, and otherwise as many straight rows as
 *  make the cubes biggest. */
export function layoutBoard(n: number, W: number, H: number, opts: { pad?: number; maxS?: number; minTap?: number; narrow?: boolean } = {}): Layout {
  const pad = opts.pad ?? 24;
  const maxS = opts.maxS ?? 52;
  const minTap = opts.minTap ?? 48;
  const candidates: Layout[] = [];
  const kinds: [Layout['kind'], number][] = [['diagonal', 1], [ 'rows', 1], ['rows', 2], ['rows', 3]];
  for (const [kind, rows] of kinds) {
    if (kind === 'rows' && rows > 1 && rows > Math.ceil(n / 2)) continue;
    const groundLabels = kind === 'diagonal' && !opts.narrow;
    const ps = places(kind, n, rows);
    const pts = ps.flatMap((p) => extent(kind, p, groundLabels));
    const x0 = Math.min(...pts.map((p) => p[0]));
    const x1 = Math.max(...pts.map((p) => p[0]));
    const y0 = Math.min(...pts.map((p) => p[1]));
    const y1 = Math.max(...pts.map((p) => p[1]));
    const s = Math.max(1, Math.min((W - 2 * pad) / (x1 - x0), (H - 2 * pad) / (y1 - y0), maxS));
    const advance = (kind === 'diagonal' ? DIAGONAL_PITCH : 2 * ROW_PITCH) * C * s;
    const ox = W / 2 - ((x0 + x1) / 2) * s;
    const oy = H / 2 - ((y0 + y1) / 2) * s;
    candidates.push({ kind, rows, places: ps, s, ox, oy, advance, groundLabels });
  }
  // The diagonal reads best: a wide frame keeps it while its columns are wide
  // enough to hit; a narrow one takes it only when its cubes stay about as big
  // as a grid of rows would give.
  if (!opts.narrow && candidates[0].advance >= minTap) return candidates[0];
  const score = (l: Layout) => (l.advance < minTap ? l.s / 10 : l.s) * (l.kind === 'diagonal' ? 1.35 : 1) - l.rows * 0.01;
  return candidates.reduce((best, l) => (score(l) > score(best) ? l : best));
}

/** The screen rectangle that picks a column: from midway to its neighbours,
 *  from above its lifted cube down to its labels. Rects never overlap. */
export function hitRect(l: Layout, c: number): { x: number; y: number; w: number; h: number } {
  const p = l.places[c];
  const [cx] = project(l, p.i + 0.5, p.j + 0.5);
  let top = project(l, p.i, p.j, HEIGHT + LIFT + 0.5)[1];
  let bottom = project(l, p.i + 1, p.j + 1)[1] + (l.groundLabels ? 1.2 : 1.15) * l.s;
  if (l.kind === 'rows') {
    // A row's labels and the next row's lifted cube share a band: split it.
    const overlap = Math.max(0, bottom - (top + ROW_GAP * l.s));
    if (p.row > 0) top += overlap / 2;
    if (p.row < l.rows - 1) bottom -= overlap / 2;
  }
  return { x: cx - l.advance / 2, y: top, w: l.advance, h: bottom - top };
}

export function columnAt(l: Layout, x: number, y: number): number | null {
  for (let c = 0; c < l.places.length; c++) {
    const r = hitRect(l, c);
    if (x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h) return c;
  }
  return null;
}

/** The visible faces of a box one cube wide and `dk` cubes tall at (i, j, k). */
export function cubeFaces(l: Pick<Layout, 's' | 'ox' | 'oy'>, i: number, j: number, k: number, dk = 1) {
  const P = (a: number, b: number, c: number) => project(l, a, b, c);
  const t = k + dk;
  return {
    top: [P(i, j, t), P(i + 1, j, t), P(i + 1, j + 1, t), P(i, j + 1, t)],
    left: [P(i, j + 1, t), P(i + 1, j + 1, t), P(i + 1, j + 1, k), P(i, j + 1, k)],
    right: [P(i + 1, j, t), P(i + 1, j + 1, t), P(i + 1, j + 1, k), P(i + 1, j, k)],
    hull: [P(i, j, t), P(i + 1, j, t), P(i + 1, j, k), P(i + 1, j + 1, k), P(i, j + 1, k), P(i, j + 1, t)],
  };
}

export const f = (n: number) => String(Math.round(n * 100) / 100);
export const pts = (a: Pt[]) => a.map((p) => `${f(p[0])},${f(p[1])}`).join(' ');

/** The grid lines across a W×H frame, as one path: lines of constant i and of
 *  constant j every `step` units, aligned to the layout's origin. */
export function gridPath(l: Layout, W: number, H: number, step: number): string {
  const corners = [unproject(l, 0, 0), unproject(l, W, 0), unproject(l, 0, H), unproject(l, W, H)];
  const lo = (v: number[]) => Math.floor(Math.min(...v) / step) * step;
  const hi = (v: number[]) => Math.ceil(Math.max(...v) / step) * step;
  const i0 = lo(corners.map((c) => c[0]));
  const i1 = hi(corners.map((c) => c[0]));
  const j0 = lo(corners.map((c) => c[1]));
  const j1 = hi(corners.map((c) => c[1]));
  let d = '';
  for (let i = i0; i <= i1 + 1e-9; i += step) {
    const a = project(l, i, j0);
    const b = project(l, i, j1);
    d += `M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}`;
  }
  for (let j = j0; j <= j1 + 1e-9; j += step) {
    const a = project(l, i0, j);
    const b = project(l, i1, j);
    d += `M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}`;
  }
  return d;
}
