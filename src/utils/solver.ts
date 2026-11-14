// An A* solver for a level: the fewest moves that seal every fill.
//
// A state is its columns, each packed into one number (base fills+1, bottom
// digit first, 0 for no cube). States that differ only in column order are
// the same position, so the visited set keys on the sorted column codes.
//
// The heuristic counts moves no solution can avoid, and never overcounts (it
// drops by at most one per move, so the first path to reach a state is a
// shortest one):
// - every cube sitting above a cube of another fill must move at least once;
// - for each fill, the runs it has on column bottoms must merge into one
//   column, so every run but the longest must move off.
import { HEIGHT, type Level } from './rules';

export type Move = [from: number, to: number];

export interface Solution {
  /** The moves, as column indices of the level passed in. */
  moves: Move[];
  /** States the search expanded to find them. */
  expanded: number;
}

export interface SolveOptions {
  /** Give up after expanding this many states (default 250 000). */
  maxExpanded?: number;
}

interface Tables {
  base: number;
  len: Uint8Array;
  top: Int8Array;
  pop: Uint16Array;
  sorted: Uint8Array;
  /** Fill of the bottom run, -1 for an empty column. */
  runFill: Int8Array;
  runLen: Uint8Array;
  pow: number[];
}

const tableCache = new Map<number, Tables>();

function tables(fills: number): Tables {
  const cached = tableCache.get(fills);
  if (cached) return cached;
  const base = fills + 1;
  const size = base ** HEIGHT;
  const pow = Array.from({ length: HEIGHT + 1 }, (_, i) => base ** i);
  const t: Tables = {
    base,
    len: new Uint8Array(size),
    top: new Int8Array(size).fill(-1),
    pop: new Uint16Array(size),
    sorted: new Uint8Array(size),
    runFill: new Int8Array(size).fill(-1),
    runLen: new Uint8Array(size),
    pow,
  };
  for (let code = 0; code < size; code++) {
    const digits: number[] = [];
    let rest = code;
    for (let i = 0; i < HEIGHT; i++) {
      digits.push(rest % base);
      rest = Math.floor(rest / base);
    }
    // Only codes whose cubes are packed at the bottom are real columns.
    const len = digits.findIndex((d) => d === 0);
    const n = len === -1 ? HEIGHT : len;
    if (digits.slice(n).some((d) => d !== 0)) continue;
    t.len[code] = n;
    if (n === 0) continue;
    const cubes = digits.slice(0, n).map((d) => d - 1);
    t.top[code] = cubes[n - 1];
    t.pop[code] = code - (cubes[n - 1] + 1) * pow[n - 1];
    let run = 1;
    while (run < n && cubes[run] === cubes[0]) run++;
    t.runFill[code] = cubes[0];
    t.runLen[code] = run;
    t.sorted[code] = n === HEIGHT && run === HEIGHT ? 1 : 0;
  }
  tableCache.set(fills, t);
  return t;
}

function encode(level: Level, base: number): number[] {
  return level.map((column) => column.reduce((code, cube, i) => code + (cube + 1) * base ** i, 0));
}

function heuristic(codes: ArrayLike<number>, t: Tables, fills: number, sum: number[], max: number[]): number {
  sum.fill(0, 0, fills);
  max.fill(0, 0, fills);
  let h = 0;
  for (let c = 0; c < codes.length; c++) {
    const code = codes[c];
    const n = t.len[code];
    if (n === 0) continue;
    const run = t.runLen[code];
    h += n - run;
    const f = t.runFill[code];
    sum[f] += run;
    if (run > max[f]) max[f] = run;
  }
  for (let f = 0; f < fills; f++) h += sum[f] - max[f];
  return h;
}

function keyOf(codes: number[]): string {
  return String.fromCharCode(...codes.slice().sort((a, b) => a - b));
}

interface Node {
  codes: number[];
  g: number;
  f: number;
  parent: Node | null;
  move: Move | null;
  closed: boolean;
}

/** Binary min-heap on f, ties to the deeper node (it is nearer a goal). */
class Heap {
  private items: Node[] = [];
  get size() {
    return this.items.length;
  }
  private less(a: Node, b: Node) {
    return a.f < b.f || (a.f === b.f && a.g > b.g);
  }
  push(node: Node) {
    const items = this.items;
    items.push(node);
    let i = items.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (!this.less(items[i], items[p])) break;
      [items[i], items[p]] = [items[p], items[i]];
      i = p;
    }
  }
  pop(): Node {
    const items = this.items;
    const top = items[0];
    const last = items.pop()!;
    if (items.length) {
      items[0] = last;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1;
        const r = l + 1;
        let m = i;
        if (l < items.length && this.less(items[l], items[m])) m = l;
        if (r < items.length && this.less(items[r], items[m])) m = r;
        if (m === i) break;
        [items[i], items[m]] = [items[m], items[i]];
        i = m;
      }
    }
    return top;
  }
}

/** The shortest solution, `{ moves: [] }` for a solved level, or null when
 *  the level has no solution or the search hit its cap first. */
export function solve(level: Level, opts: SolveOptions = {}): Solution | null {
  const maxExpanded = opts.maxExpanded ?? 250_000;
  const fills = Math.max(0, ...level.flat()) + 1;
  const t = tables(fills);
  const sum = new Array<number>(fills);
  const max = new Array<number>(fills);

  const startCodes = encode(level, t.base);
  const start: Node = {
    codes: startCodes,
    g: 0,
    f: heuristic(startCodes, t, fills, sum, max),
    parent: null,
    move: null,
    closed: false,
  };
  const seen = new Map<string, Node>([[keyOf(startCodes), start]]);
  const open = new Heap();
  open.push(start);
  let expanded = 0;

  while (open.size) {
    const node = open.pop();
    if (node.closed) continue;
    node.closed = true;
    if (node.f === node.g) {
      // h = 0 only when every fill is sorted.
      const moves: Move[] = [];
      for (let n: Node | null = node; n && n.move; n = n.parent) moves.push(n.move);
      return { moves: moves.reverse(), expanded };
    }
    if (++expanded > maxExpanded) return null;

    const codes = node.codes;
    let firstEmpty = -1;
    for (let c = 0; c < codes.length; c++) {
      if (t.len[codes[c]] === 0) {
        firstEmpty = c;
        break;
      }
    }
    for (let from = 0; from < codes.length; from++) {
      const src = codes[from];
      const n = t.len[src];
      if (n === 0 || t.sorted[src]) continue;
      const cube = t.top[src];
      const uniform = t.runLen[src] === n;
      for (let to = 0; to < codes.length; to++) {
        if (to === from) continue;
        const dst = codes[to];
        const m = t.len[dst];
        if (m === 0) {
          // Empty columns are interchangeable, and splitting a column of one
          // fill across two never helps.
          if (to !== firstEmpty || uniform) continue;
        } else if (m >= HEIGHT || t.top[dst] !== cube) {
          continue;
        }
        const next = codes.slice();
        next[from] = t.pop[src];
        next[to] = dst + (cube + 1) * t.pow[m];
        const key = keyOf(next);
        const g = node.g + 1;
        const prev = seen.get(key);
        if (prev && (prev.closed || prev.g <= g)) continue;
        const child: Node = {
          codes: next,
          g,
          f: g + heuristic(next, t, fills, sum, max),
          parent: node,
          move: [from, to],
          closed: false,
        };
        if (prev) prev.closed = true; // a stale copy left in the heap
        seen.set(key, child);
        open.push(child);
      }
    }
  }
  return null;
}
