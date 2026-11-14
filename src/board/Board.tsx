// The board: an SVG drawing of the columns in the blueprint style, with a
// transparent button over each column for taps, clicks and keyboard focus,
// and mouse drag-and-drop on top. Everything is drawn from the level each
// render; nothing here holds game state.
import { useLayoutEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
import { HEIGHT, canMove, isSorted, type Level } from '../utils/rules';
import type { LogEntry } from '../utils/state';
import { FILLS, FACES, FillDefs, INK, patternId, patternWeight } from './fills';
import { GRID, LIFT, columnAt, cubeFaces, f, gridPath, hitRect, layoutBoard, project, pts, type Layout, type Pt } from './iso';

export interface BoardProps {
  idPrefix: string;
  level: Level;
  selected: number | null;
  lastEntry: LogEntry | undefined;
  errors: number;
  won: boolean;
  narrow: boolean;
  onTap(column: number): void;
  onMove(from: number, to: number): void;
  onCancel(): void;
  /** The column buttons, for the app's keyboard handling to focus. */
  buttons: React.MutableRefObject<(HTMLButtonElement | null)[]>;
}

const pad2 = (n: number) => String(n).padStart(2, '0');
const MONO = "Menlo, 'SFMono-Regular', Consolas, 'Courier New', monospace";

interface Drag {
  from: number;
  x0: number;
  y0: number;
  dx: number;
  dy: number;
  over: number | null;
  active: boolean;
  pointerId: number;
}

/** A cube, or with `height` a column of them drawn as one block: patterns are
 *  laid in screen space, so they run unbroken up each face. */
function Cube({ l, i, j, k, fill, prefix, dashed, weight = 1, height = 1, className, style }: {
  l: Layout; i: number; j: number; k: number; fill: number; prefix: string;
  dashed?: boolean; weight?: number; height?: number; className?: string; style?: CSSProperties;
}) {
  const faces = cubeFaces(l, i, j, k, height);
  const { tone, pattern } = FILLS[fill];
  const stroke = { fill: 'none', stroke: INK, strokeWidth: weight, strokeLinejoin: 'round' as const, strokeDasharray: dashed ? '3 2.5' : undefined };
  return (
    <g className={className} style={style}>
      {FACES.map((face) => (
        <polygon key={face} points={pts(faces[face])} fill={tone[face]} />
      ))}
      {pattern && FACES.map((face) => (
        <polygon key={`p${face}`} points={pts(faces[face])} fill={`url(#${patternId(prefix, fill, face)})`} />
      ))}
      {FACES.map((face) => (
        <polygon key={`o${face}`} points={pts(faces[face])} {...stroke} />
      ))}
    </g>
  );
}

function Ghost({ l, i, j, k }: { l: Layout; i: number; j: number; k: number }) {
  const b = cubeFaces(l, i, j, k);
  return (
    <g>
      <polygon points={pts(b.hull)} fill="none" stroke="#b9b9b4" strokeWidth="0.8" strokeDasharray="2 3" />
      <line x1={f(b.top[2][0])} y1={f(b.top[2][1])} x2={f(b.left[2][0])} y2={f(b.left[2][1])} stroke="#cfcfca" strokeWidth="0.8" strokeDasharray="2 3" />
    </g>
  );
}

/** A cube in motion between columns, drawn at its final place (column `c`,
 *  height `k`, `lifted` or not) and animated in from the path's start. */
interface Flight {
  id: number;
  c: number;
  k: number;
  lifted: boolean;
  fill: number;
  frames: Keyframe[];
  duration: number;
}

/** focus: keyboard focus, nothing lifted. source: where the lifted cube came
 *  from. target / invalid: where it would go, if it can or can't. */
type Highlight = 'focus' | 'source' | 'target' | 'invalid';

const HIGHLIGHT: Record<Highlight, { color: string; edge: number; dash: string; tick: number }> = {
  focus: { color: '#8a8a86', edge: 0.8, dash: '3 3', tick: 1.3 },
  target: { color: INK, edge: 1, dash: '4 3', tick: 2 },
  source: { color: '#77776f', edge: 0.8, dash: '1.5 2.5', tick: 1.2 },
  invalid: { color: '#a5a5a0', edge: 0.8, dash: '2 3', tick: 1.1 },
};

/** A flat highlight on the column's front face: the left visible face of its
 *  slot (the side facing the labels), four cubes high and as wide as its grid
 *  pad, so a parallelogram in the iso plane, with ticks at its corners. */
function isoHighlight(l: Layout, i: number, j: number, kind: Highlight) {
  const st = HIGHLIGHT[kind];
  const jf = j + 1 + GRID;
  const corners = [project(l, i - GRID, jf, 0), project(l, i + 1 + GRID, jf, 0), project(l, i + 1 + GRID, jf, HEIGHT), project(l, i - GRID, jf, HEIGHT)];
  const reach = Math.min(10, 0.3 * l.s);
  let ticks = '';
  corners.forEach((p, n) => {
    for (const q of [corners[(n + 1) % 4], corners[(n + 3) % 4]]) {
      const t = reach / Math.hypot(q[0] - p[0], q[1] - p[1]);
      ticks += `M${f(p[0])} ${f(p[1])}L${f(p[0] + (q[0] - p[0]) * t)} ${f(p[1] + (q[1] - p[1]) * t)}`;
    }
  });
  return (
    <g key="hl" className={`bsg-hl bsg-hl-${kind}`} fill="none" stroke={st.color} pointerEvents="none">
      <polygon points={pts(corners)} strokeWidth={st.edge} strokeDasharray={st.dash} opacity="0.85" />
      <path d={ticks} strokeWidth={st.tick} strokeLinecap="square" />
    </g>
  );
}

export function Board(props: BoardProps) {
  const { idPrefix: P, level, selected, lastEntry, errors, won, narrow, buttons } = props;
  const frame = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [focused, setFocused] = useState<number | null>(null);
  const [drag, setDrag] = useState<Drag | null>(null);
  /** The column under the mouse (never set by touch). */
  const [hover, setHover] = useState<number | null>(null);
  const [flight, setFlight] = useState<Flight | null>(null);
  const flyRef = useRef<SVGGElement>(null);
  const flightId = useRef(0);
  const dragDrop = useRef<{ from: number; to: number; dx: number; dy: number } | null>(null);
  const suppressClick = useRef(false);

  useLayoutEffect(() => {
    const el = frame.current!;
    const measure = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const n = level.length;
  const { w: W, h: H } = size;
  const l = layoutBoard(n, W || 600, H || 400, { pad: narrow ? 14 : 34, maxS: narrow ? 44 : 50, narrow });
  const s = l.s;
  // A grid line every half cube, or every cube when that would crowd a phone.
  const gridStep = GRID * s >= 14 ? GRID : 1;
  const fills = [...new Set(level.flat())].sort((a, b) => a - b);
  const outline = narrow ? 0.85 : 1;
  const lift = drag?.active ? drag.from : selected;
  const labelSize = Math.min(12.5, Math.max(10, 0.3 * s));

  const local = (e: { clientX: number; clientY: number }) => {
    const r = frame.current!.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top] as const;
  };

  // Mouse (and pen) drag. A press only becomes a drag once it moves, so a
  // plain click still reaches the column button underneath. Touch keeps
  // tap/tap and the page's own scrolling.
  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    suppressClick.current = false;
    if (e.pointerType === 'touch' || e.button !== 0 || won) return;
    const [x, y] = local(e);
    const c = columnAt(l, x, y);
    if (c === null || !level[c].length || isSorted(level[c])) return;
    setDrag({ from: c, x0: x, y0: y, dx: 0, dy: 0, over: c, active: false, pointerId: e.pointerId });
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' && !drag?.active) {
      const [hx, hy] = local(e);
      const over = columnAt(l, hx, hy);
      if (over !== hover) setHover(over);
    }
    if (!drag || e.pointerId !== drag.pointerId) return;
    const [x, y] = local(e);
    const dx = x - drag.x0;
    const dy = y - drag.y0;
    const active = drag.active || Math.hypot(dx, dy) > 6;
    if (active && !drag.active) {
      frame.current!.setPointerCapture(e.pointerId);
      if (selected !== null) props.onCancel();
    }
    setDrag({ ...drag, dx, dy, active, over: columnAt(l, x, y) });
  };
  const endDrag = (e: ReactPointerEvent<HTMLDivElement>, drop: boolean) => {
    if (!drag || e.pointerId !== drag.pointerId) return;
    if (drag.active) {
      suppressClick.current = true;
      const [x, y] = local(e);
      const to = columnAt(l, x, y);
      // Dropped on another column: move, or log why not and snap back. Note
      // where the cube was let go, so it settles from there.
      if (drop && to !== null && to !== drag.from) {
        dragDrop.current = { from: drag.from, to, dx: x - drag.x0, dy: y - drag.y0 };
        props.onMove(drag.from, to);
      }
    }
    setDrag(null);
  };

  // Moves animate: the game state has already changed, and a "flight" draws
  // the moving cube from where it was to where it now is while the real one
  // stays hidden. A new move replaces any flight in progress.
  useLayoutEffect(() => {
    const drop = dragDrop.current;
    dragDrop.current = null;
    const e = lastEntry;
    const reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!e || reduced) {
      setFlight(null);
      return;
    }
    const at = (c: number, k: number) => project(l, l.places[c].i, l.places[c].j, k);
    // A path clear of every stack between the two columns: up, across, down.
    const apex = (a: number, b: number) => {
      let y = Infinity;
      for (let c = Math.min(a, b); c <= Math.max(a, b); c++) y = Math.min(y, at(c, HEIGHT + LIFT + 0.3)[1]);
      return y;
    };
    const tr = (x: number, y: number) => `translate(${f(x)}px, ${f(y)}px)`;
    const arc = (start: Pt, end: Pt, top: number) => {
      const sx = start[0] - end[0];
      const sy = start[1] - end[1];
      const ay = top - end[1];
      const d1 = Math.abs(sy - ay);
      const d2 = Math.abs(sx);
      const d3 = Math.abs(ay);
      const total = d1 + d2 + d3 || 1;
      const o1 = (0.9 * d1) / total;
      const o2 = o1 + (0.9 * d2) / total;
      return {
        frames: [
          { transform: tr(sx, sy), offset: 0, easing: 'ease-out' },
          { transform: tr(sx, ay), offset: o1, easing: 'ease-in-out' },
          { transform: tr(0, ay), offset: o2, easing: 'ease-in' },
          // A 1.5px settle as it lands.
          { transform: tr(0, 1.5), offset: 0.9, easing: 'ease-out' },
          { transform: tr(0, 0), offset: 1 },
        ],
        duration: Math.round(Math.min(350, Math.max(250, 220 + total * 0.12))),
      };
    };
    const settle = (sx: number, sy: number, duration: number) => ({
      frames: [
        { transform: tr(sx, sy), offset: 0, easing: 'ease-out' },
        { transform: tr(0, 1.5), offset: 0.85, easing: 'ease-out' },
        { transform: tr(0, 0), offset: 1 },
      ],
      duration,
    });
    const id = ++flightId.current;
    const fromLen = level[e.from].length;
    const toLen = level[e.to].length;
    if (e.kind === 'move') {
      // The cube now tops `to`; it left `from` lifted, or from the pointer.
      const end = at(e.to, toLen - 1);
      const lifted = at(e.from, fromLen + LIFT);
      const path = drop && drop.from === e.from && drop.to === e.to
        ? settle(lifted[0] + drop.dx - end[0], lifted[1] + drop.dy - end[1], 180)
        : arc(lifted, end, apex(e.from, e.to));
      setFlight({ id, c: e.to, k: toLen - 1, lifted: false, fill: e.fill, ...path });
    } else if (e.kind === 'undo') {
      // Back from the slot it filled on `to` to the top of `from`.
      const end = at(e.from, fromLen - 1);
      const start = at(e.to, toLen);
      setFlight({ id, c: e.from, k: fromLen - 1, lifted: false, fill: level[e.from][fromLen - 1], ...arc(start, end, apex(e.from, e.to)) });
    } else if (drop && drop.from === e.from && drop.to === e.to) {
      // A refused drag drop: back from the pointer to its own column.
      const end = at(e.from, fromLen - 1);
      const lifted = at(e.from, fromLen - 1 + LIFT);
      setFlight({ id, c: e.from, k: fromLen - 1, lifted: false, fill: level[e.from][fromLen - 1], ...settle(lifted[0] + drop.dx - end[0], lifted[1] + drop.dy - end[1], 240) });
    } else if (fromLen) {
      // A refused click or key drop: the lifted cube goes out over the target
      // and comes back along the same path, still lifted.
      const home = at(e.from, fromLen - 1 + LIFT);
      const ay = apex(e.from, e.to) - home[1];
      const tx = at(e.to, 0)[0] - home[0];
      setFlight({
        id, c: e.from, k: fromLen - 1, lifted: true, fill: level[e.from][fromLen - 1],
        frames: [
          { transform: tr(0, 0), offset: 0, easing: 'ease-out' },
          { transform: tr(0, ay), offset: 0.2, easing: 'ease-in-out' },
          { transform: tr(tx, ay), offset: 0.5, easing: 'ease-in-out' },
          { transform: tr(0, ay), offset: 0.8, easing: 'ease-in' },
          { transform: tr(0, 0), offset: 1 },
        ],
        duration: 340,
      });
    } else {
      setFlight(null);
    }
    // Only a new log entry starts a flight.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastEntry]);

  useLayoutEffect(() => {
    if (!flight) return;
    const el = flyRef.current;
    if (!el || typeof el.animate !== 'function') {
      setFlight(null);
      return;
    }
    const anim = el.animate(flight.frames, { duration: flight.duration });
    anim.onfinish = () => setFlight((cur) => (cur && cur.id === flight.id ? null : cur));
    // Unmount (destroy) or a newer flight cancels this one.
    return () => anim.cancel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flight?.id]);

  const invalidAt = lastEntry?.kind === 'invalid' ? lastEntry.to : null;
  const droppedAt = lastEntry?.kind === 'move' ? lastEntry.to : null;
  const dragging = drag?.active ? drag : null;

  // At most two highlights: where the lifted cube came from, and where it
  // would go — the column under the dragged cube, else the keyboard-focused
  // column, else the one the mouse is over. Touch has no hover, so after a
  // lift only the source shows until the next tap.
  const goal = dragging
    ? dragging.over
    : lift !== null
      ? (focused !== null && focused !== lift ? focused : hover)
      : null;
  const target = goal !== null && goal !== lift ? goal : null;
  const targetOk = target !== null && lift !== null && canMove(level, lift, target);

  // With nothing lifted, the hovered or keyboard-focused column floats its top
  // cube a little: a preview of what a click or Enter would pick up. Empty
  // columns and sorted blocks don't float.
  const peekAt = !dragging && lift === null && !won ? (focused ?? hover) : null;
  // A cube still flying in lands at rest first, then may float.
  const peek = peekAt !== null && level[peekAt]?.length && !isSorted(level[peekAt]) && flight?.c !== peekAt ? peekAt : null;
  const float = Math.round(0.3 * s);
  const liftedFill = lift !== null && level[lift]?.length ? level[lift][level[lift].length - 1] : null;

  const columns = level.map((col, c) => {
    const { i, j } = l.places[c];
    const sorted = isSorted(col);
    const kind: Highlight | null = c === target
      ? (targetOk ? 'target' : 'invalid')
      : c === lift
        ? 'source'
        : c === focused && lift === null
          ? 'focus'
          : null;
    const hl = kind ? isoHighlight(l, i, j, kind) : null;
    const parts = [];
    // Footprint pad on the grid.
    parts.push(
      <polygon key="pad" points={pts([project(l, i - GRID, j - GRID), project(l, i + 1 + GRID, j - GRID), project(l, i + 1 + GRID, j + 1 + GRID), project(l, i - GRID, j + 1 + GRID)])}
        fill="none" stroke="#c4c4bf" strokeWidth="0.8" strokeDasharray="2 2" />,
    );

    const preview = c === target && targetOk && liftedFill !== null;
    for (let k = col.length; k < HEIGHT; k++) {
      // The drop preview: a dashed, faded copy of the lifted cube where it would land.
      if (preview && k === col.length) {
        parts.push(<Cube key={`pv${k}`} l={l} i={i} j={j} k={k} fill={liftedFill!} prefix={P} dashed weight={outline} className="bsg-preview" />);
      } else {
        parts.push(<Ghost key={`g${k}`} l={l} i={i} j={j} k={k} />);
      }
    }
    // A cube still flying in lands first; the block forms after.
    const landing = flight !== null && !flight.lifted && flight.c === c;
    const merged = sorted && !landing;
    if (merged) {
      // A sorted column is one block. Just sorted, its seams fade out.
      parts.push(<Cube key="prism" l={l} i={i} j={j} k={0} height={HEIGHT} fill={col[0]} prefix={P} weight={narrow ? 1.2 : 1.4} className="bsg-prism" />);
      if (droppedAt === c) {
        let d = '';
        for (let k = 1; k < HEIGHT; k++) {
          const a = project(l, i, j + 1, k);
          const b = project(l, i + 1, j + 1, k);
          const e = project(l, i + 1, j, k);
          d += `M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}L${f(e[0])} ${f(e[1])}`;
        }
        parts.push(<path key={`seam${lastEntry?.kind === 'move' ? lastEntry.n : 0}`} className="bsg-seam" d={d} fill="none" stroke={INK} strokeWidth="1" />);
      }
    }
    if (!merged) col.forEach((v, k) => {
      const top = k === col.length - 1;
      if (top && lift === c) {
        parts.push(<Ghost key={`g${k}`} l={l} i={i} j={j} k={k} />);
        if (dragging) return;
        // Dotted construction lines from the slot up to the lifted cube.
        for (const [a, b] of [[i, j + 1], [i + 1, j + 1], [i + 1, j]] as const) {
          const p = project(l, a, b, k + 1);
          const q = project(l, a, b, k + 1 + LIFT);
          parts.push(<line key={`cl${a}${b}`} x1={f(p[0])} y1={f(p[1])} x2={f(q[0])} y2={f(q[1])} stroke={INK} strokeWidth="0.7" strokeDasharray="1.5 2.5" />);
        }
        const away = flight !== null && flight.lifted && flight.c === c;
        parts.push(
          <g key={`lift${c}`} className="bsg-bob" style={away ? { visibility: 'hidden' } : undefined}>
            <Cube l={l} i={i} j={j} k={k + LIFT} fill={v} prefix={P} dashed weight={outline + 0.2}
              className="bsg-lift" style={{ ['--bsg-dy' as string]: `${f(LIFT * s)}px` }} />
          </g>,
        );
        return;
      }
      const inFlight = landing && k === flight!.k;
      const cube = (
        <Cube key={`c${k}`} l={l} i={i} j={j} k={k} fill={v} prefix={P} weight={outline}
          className={inFlight ? 'bsg-landing' : undefined} style={inFlight ? { visibility: 'hidden' } : undefined} />
      );
      if (!top) {
        parts.push(cube);
        return;
      }
      // The top cube sits in a group that floats on hover or focus, over a
      // faint shadow on the slot it would leave.
      const on = c === peek;
      parts.push(
        <polygon key="shadow" className={`bsg-shadow${on ? ' on' : ''}`} fill={INK}
          points={pts([project(l, i, j, k), project(l, i + 1, j, k), project(l, i + 1, j + 1, k), project(l, i, j + 1, k)])} />,
        <g key={`t${k}`} className={`bsg-float${on ? ' on' : ''}`} style={{ transform: `translateY(${on ? -float : 0}px)` }}>
          {cube}
        </g>,
      );
    });
    // Labels: COL 0n and n/4, or just ✓ once sorted.
    const name = `COL ${pad2(c + 1)}`;
    const count = sorted ? '✓' : `${col.length}/${HEIGHT}`;
    if (l.groundLabels) {
      const m = (a: number, b: number) => {
        const [x, y] = project(l, a, b);
        return `matrix(${f(Math.cos(Math.PI / 6))},0.5,${f(-Math.cos(Math.PI / 6))},0.5,${f(x)},${f(y)})`;
      };
      const fs = f(Math.min(12, Math.max(9.5, 0.27 * s)));
      parts.push(
        <text key="ln" transform={m(i - 0.05, j + 1.75)} fontFamily={MONO} fontSize={fs} fill={sorted ? INK : '#6e6e6a'} letterSpacing="0.4">{name}</text>,
        <text key="lc" transform={m(i - 0.05, j + 2.2)} fontFamily={MONO} fontSize={fs} fill={sorted ? INK : '#9a9a95'} letterSpacing="0.4">{count}</text>,
      );
    } else {
      const [x, y] = project(l, i + 1, j + 1);
      parts.push(
        <text key="ln" x={f(x)} y={f(y + 0.55 * s + 3)} fontFamily={MONO} fontSize={labelSize} textAnchor="middle" fill={sorted ? INK : '#6e6e6a'}>{`C${pad2(c + 1)}`}</text>,
        <text key="lc" x={f(x)} y={f(y + 0.55 * s + 3 + labelSize * 1.2)} fontFamily={MONO} fontSize={labelSize} textAnchor="middle" fill={sorted ? INK : '#9a9a95'}>{count}</text>,
      );
    }
    if (hl) parts.push(hl);
    // A refused drop: shake the column and mark it.
    const refused = invalidAt === c;
    return (
      <g key={`col${c}${refused ? `e${errors}` : ''}`} className={refused ? 'bsg-shake' : undefined}>
        {parts}
      </g>
    );
  });

  // Lanes: dashed construction lines along the diagonal row, on grid lines.
  const lanes = [];
  if (l.kind === 'diagonal') {
    const i0 = -1;
    const i1 = l.places[n - 1].i + 2;
    for (const [jj, dash, color] of [[-GRID, '4 4', '#c9c9c4'], [1 + GRID, '4 4', '#c9c9c4'], [0.5, '10 3 2 3', '#d8d8d3']] as const) {
      const a = project(l, i0, jj);
      const b = project(l, i1, jj);
      lanes.push(<line key={`lane${jj}`} x1={f(a[0])} y1={f(a[1])} x2={f(b[0])} y2={f(b[1])} stroke={color} strokeWidth="0.8" strokeDasharray={dash} />);
    }
  }

  // The lifted cube's leader label.
  let leader = null;
  const liftedName = selected !== null && level[selected]?.length ? FILLS[level[selected][level[selected].length - 1]].name : null;
  // Rows pack columns too close for a leader; the source highlight marks the lift there.
  if (selected !== null && !dragging && liftedName && l.kind === 'diagonal') {
    const { i, j } = l.places[selected];
    const k = level[selected].length - 1 + LIFT;
    const a = project(l, i + 1, j, k + 1);
    const reach = Math.max(18, 0.9 * s);
    const width = narrow ? 112 : 136;
    const flip = a[0] + reach + width > W - 6;
    const sign = flip ? -1 : 1;
    // Above the tallest stack this column could hold, so it clears the next one too.
    const clear = project(l, i, j, HEIGHT + LIFT + 0.9)[1];
    const mid: [number, number] = [a[0] + sign * reach, Math.max(narrow ? 22 : 26, Math.min(a[1] - reach, clear))];
    const end: [number, number] = [mid[0] + sign * width, mid[1]];
    const tx = flip ? end[0] : mid[0] + 4;
    leader = (
      <g key={`leader${selected}`} className="bsg-fade">
        <circle cx={f(a[0])} cy={f(a[1])} r="2.6" fill={INK} />
        <polyline points={pts([a, mid, end])} fill="none" stroke={INK} strokeWidth="0.9" />
        <rect x={f(tx - 2)} y={f(mid[1] - 17)} width={width - 4} height="13" fill="#fafaf8" opacity="0.85" />
        <rect x={f(tx - 2)} y={f(mid[1] + 3)} width={width - 30} height="13" fill="#fafaf8" opacity="0.85" />
        <text x={f(tx)} y={f(mid[1] - 6)} fontFamily={MONO} fontSize={narrow ? 10 : 11} fill={INK} letterSpacing="0.5">{`COL ${pad2(selected + 1)} · LIFTED`}</text>
        <text x={f(tx)} y={f(mid[1] + 13)} fontFamily={MONO} fontSize={narrow ? 10 : 10} fill="#66665f" letterSpacing="0.5">{`TOP: ${FILLS[level[selected][level[selected].length - 1]].name}`}</text>
      </g>
    );
  }

  const cross = (c: number, key: string, className?: string) => {
    const { i, j } = l.places[c];
    const [x, y] = project(l, i + 0.5, j + 0.5, HEIGHT + LIFT + 0.3);
    return (
      <text key={key} className={className} x={f(x)} y={f(y)} textAnchor="middle" fontFamily={MONO} fontSize={Math.max(14, 0.45 * s)} fontWeight="700" fill={INK}>✗</text>
    );
  };

  let ghost = null;
  if (dragging) {
    const { i, j } = l.places[dragging.from];
    const k = level[dragging.from].length - 1;
    ghost = (
      <g transform={`translate(${f(dragging.dx)},${f(dragging.dy)})`} style={{ pointerEvents: 'none' }}>
        <Cube l={l} i={i} j={j} k={k + LIFT} fill={level[dragging.from][k]} prefix={P} dashed weight={outline + 0.2} />
      </g>
    );
  }

  return (
    <div
      ref={frame}
      className={`bsg-frame${dragging ? ' bsg-dragging' : ''}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={(e) => endDrag(e, true)}
      onPointerCancel={(e) => endDrag(e, false)}
      onPointerLeave={() => setHover(null)}
      onClickCapture={(e) => {
        if (suppressClick.current) {
          suppressClick.current = false;
          e.stopPropagation();
        }
      }}
    >
      <svg className="bsg-board" width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
        <defs>
          <FillDefs prefix={P} fills={fills} weight={patternWeight(s)} />
        </defs>
        <path d={gridPath(l, W, H, gridStep)} fill="none" stroke={narrow ? '#ecece8' : '#e6e6e1'} strokeWidth="0.6" />
        {lanes}
        {columns}
        {target !== null && !targetOk && cross(target, 'overx')}
        {!dragging && invalidAt !== null && cross(invalidAt, `err${errors}`, 'bsg-flash')}
        {leader}
        {ghost}
        {flight && (
          <g key={`fly${flight.id}`} ref={flyRef} className="bsg-flight" pointerEvents="none">
            <Cube l={l} i={l.places[flight.c].i} j={l.places[flight.c].j} k={flight.k + (flight.lifted ? LIFT : 0)}
              fill={flight.fill} prefix={P} dashed={flight.lifted} weight={flight.lifted ? outline + 0.2 : outline} />
          </g>
        )}
      </svg>
      {level.map((col, c) => {
        const r = hitRect(l, c);
        const top = col[col.length - 1];
        const state = isSorted(col) ? ', sorted' : selected === c ? ', top cube lifted' : '';
        const label = `Column ${c + 1}: ${col.length ? `${col.length} of ${HEIGHT}, top ${FILLS[top].name.toLowerCase()}` : 'empty'}${state}`;
        return (
          <button
            key={c}
            ref={(el) => { buttons.current[c] = el; }}
            type="button"
            className="bsg-col"
            style={{ left: r.x, top: r.y, width: r.w, height: r.h }}
            aria-label={label}
            aria-pressed={selected === c}
            data-col={c}
            data-cubes={col.join(',')}
            onClick={() => props.onTap(c)}
            onFocus={(e) => setFocused(e.currentTarget.matches(':focus-visible') ? c : null)}
            onBlur={() => setFocused((cur) => (cur === c ? null : cur))}
          />
        );
      })}
    </div>
  );
}

