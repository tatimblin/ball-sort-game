import { useEffect, useId, useLayoutEffect, useReducer, useRef, useState } from 'react';
import { Board } from './board/Board';
import { FACES, FILLS, FillDefs, INK, patternId } from './board/fills';
import { cubeFaces, pts } from './board/iso';
import { DIFFICULTIES, type Difficulty } from './utils/generator';
import { fillCount, isSorted, sortedCount } from './utils/rules';
import { createGame, moveCount, reducer, type LogEntry } from './utils/state';

export interface AppProps {
  difficulty?: Difficulty;
  seed?: number;
  /** Hear keys anywhere on the page, not only while the game has focus: for
   *  a page that is the game. Typing in a field, and Enter/Space on another
   *  control, still belong to the page. */
  pageKeys?: boolean;
}

/** What the key handler reads from a key event, React's or the DOM's. */
type KeyLike = Pick<KeyboardEvent, 'key' | 'altKey' | 'ctrlKey' | 'metaKey' | 'shiftKey' | 'preventDefault' | 'stopPropagation'> & {
  target: EventTarget | null;
};

const editable = (el: Element) =>
  el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement || (el as HTMLElement).isContentEditable;
const control = (el: Element) => el.closest('button, a[href], [role="button"], summary') !== null;

const randomSeed = () => 1 + Math.floor(Math.random() * 999);
const pad2 = (n: number) => String(n).padStart(2, '0');
const col = (c: number) => `C${c + 1}`;

function logLines(log: LogEntry[]): string[] {
  return log.flatMap((e) => {
    if (e.kind === 'move') {
      const line = `${pad2(e.n)} · ${col(e.from)} → ${col(e.to)} · ${FILLS[e.fill].name}`;
      return e.sorted ? [line, `   ${col(e.to)} ✓`] : [line];
    }
    if (e.kind === 'invalid') return [`${col(e.from)} → ${col(e.to)} ✗ ${e.reason.toUpperCase()}`];
    return [`↶ UNDO ${pad2(e.n)} · ${col(e.from)} → ${col(e.to)}`];
  });
}

function announce(e: LogEntry | undefined, won: boolean): string {
  if (won) return 'All columns sorted. Level complete.';
  if (!e) return '';
  if (e.kind === 'move') return `Moved ${FILLS[e.fill].name.toLowerCase()} from column ${e.from + 1} to column ${e.to + 1}${e.sorted ? `. Column ${e.to + 1} sorted` : ''}.`;
  if (e.kind === 'invalid') return `Can't drop on column ${e.to + 1}: ${e.reason}.`;
  return `Undid move ${e.n}.`;
}

/** A legend cube: filled with its pattern once that fill is sorted, an empty
 *  outline until then, so the legend is also a progress row. */
function Swatch({ fill, prefix, sorted }: { fill: number; prefix: string; sorted: boolean }) {
  const faces = cubeFaces({ s: 14, ox: 13, oy: 1.5 }, 0, 0, -1);
  const p = `${prefix}lg${fill}`;
  const name = FILLS[fill].name.charAt(0) + FILLS[fill].name.slice(1).toLowerCase();
  const label = `${name}, ${sorted ? 'sorted' : 'not sorted'}`;
  return (
    <svg className={sorted ? 'on' : ''} width="26" height="30" viewBox="0 0 26 30" role="img" aria-label={label}>
      <title>{label}</title>
      {sorted && (
        <>
          <defs>
            <FillDefs prefix={p} fills={[fill]} />
          </defs>
          {FACES.map((face) => <polygon key={face} points={pts(faces[face])} fill={FILLS[fill].tone[face]} />)}
          {FILLS[fill].pattern && FACES.map((face) => <polygon key={`p${face}`} points={pts(faces[face])} fill={`url(#${patternId(p, fill, face)})`} />)}
        </>
      )}
      {FACES.map((face) => (
        <polygon key={`o${face}`} points={pts(faces[face])} fill="none" stroke={sorted ? INK : '#a5a5a0'} strokeWidth="1"
          strokeDasharray={sorted ? undefined : '2 2'} strokeLinejoin="round" />
      ))}
    </svg>
  );
}

function App({ difficulty = 'medium', seed = 1, pageKeys = false }: AppProps) {
  const [state, dispatch] = useReducer(reducer, null, () => createGame(difficulty, seed));
  const { level, selected, won, log } = state;
  const prefix = `bsg${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const root = useRef<HTMLDivElement>(null);
  const next = useRef<HTMLButtonElement>(null);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const cursor = useRef(0);
  const [narrow, setNarrow] = useState(false);

  useLayoutEffect(() => {
    const el = root.current!;
    const measure = () => setNarrow(el.clientWidth < 720);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // A win hands focus to "next level", so Enter carries on.
  useEffect(() => {
    if (won && root.current?.contains(document.activeElement)) next.current?.focus();
  }, [won]);

  const fills = fillCount(state.start);
  const sorted = sortedCount(level);
  const progress = Math.round((100 * sorted) / fills);
  const moves = moveCount(state);
  const used = [...new Set(state.start.flat())].sort((a, b) => a - b);
  const sortedFills = new Set(level.filter(isSorted).map((c) => c[0]));

  const focusColumn = (c: number) => {
    const n = level.length;
    cursor.current = ((c % n) + n) % n;
    buttons.current[cursor.current]?.focus();
  };

  // Keys reach the game while it has focus: the handler sits on the game's
  // root. With `pageKeys`, a listener on the document passes it the keys
  // pressed anywhere else too (see below).
  const onKeyDown = (e: KeyLike) => {
    if (e.altKey) return;
    const target = e.target as HTMLElement;
    const at = buttons.current.indexOf(target as HTMLButtonElement);
    const onColumn = at !== -1;
    if (onColumn) cursor.current = at;
    const handled = () => {
      e.preventDefault();
      e.stopPropagation();
    };
    if (e.ctrlKey || e.metaKey) {
      if (e.key.toLowerCase() === 'z' && !e.shiftKey) {
        dispatch({ type: 'undo' });
        handled();
      }
      return;
    }
    const key = e.key;
    if ((key === 'ArrowLeft' || key === 'ArrowRight') && (onColumn || target === root.current)) {
      focusColumn(onColumn ? at + (key === 'ArrowLeft' ? -1 : 1) : cursor.current);
      return handled();
    }
    if ((key === 'Enter' || key === ' ') && target === root.current) {
      dispatch({ type: 'tap', column: cursor.current });
      focusColumn(cursor.current);
      return handled();
    }
    if (key === 'Escape') {
      // Only claim Esc when it cancels something; otherwise it's the host's.
      if (selected !== null) {
        dispatch({ type: 'cancel' });
        handled();
      }
      return;
    }
    if (/^[0-9]$/.test(key)) {
      const c = key === '0' ? 9 : Number(key) - 1;
      if (c < level.length) {
        focusColumn(c);
        dispatch({ type: 'tap', column: c });
        handled();
      }
      return;
    }
    switch (key.toLowerCase()) {
      case 'u':
        dispatch({ type: 'undo' });
        return handled();
      case 'r':
        dispatch({ type: 'restart' });
        return handled();
      case 'n':
        dispatch({ type: 'new', seed: randomSeed() });
        return handled();
    }
  };

  // The latest handler, for the page listener (which is added once).
  const keys = useRef(onKeyDown);
  keys.current = onKeyDown;
  useEffect(() => {
    if (!pageKeys) return;
    const onPageKey = (e: KeyboardEvent) => {
      const at = e.target instanceof Element ? e.target : null;
      // Inside the game, the root's own handler already has it.
      if (!root.current || (at && root.current.contains(at))) return;
      if (e.defaultPrevented || (at && editable(at))) return;
      // Enter and Space on the page's own buttons and links stay theirs.
      if ((e.key === 'Enter' || e.key === ' ') && at && control(at)) return;
      // Anywhere else on the page, it's as if the game had focus.
      keys.current({
        key: e.key,
        altKey: e.altKey,
        ctrlKey: e.ctrlKey,
        metaKey: e.metaKey,
        shiftKey: e.shiftKey,
        preventDefault: () => e.preventDefault(),
        stopPropagation: () => e.stopPropagation(),
        target: root.current,
      });
    };
    document.addEventListener('keydown', onPageKey);
    return () => document.removeEventListener('keydown', onPageKey);
  }, [pageKeys]);

  const lines = logLines(log).slice(-7);
  const lifted = selected !== null && level[selected].length ? FILLS[level[selected][level[selected].length - 1]].name : null;

  return (
    <div ref={root} className={`bsg-app${narrow ? ' bsg-narrow' : ''}${won ? ' bsg-won' : ''}`} tabIndex={-1} onKeyDown={onKeyDown}>
      <header className="bsg-head">
        <h1>Ball Sort Game</h1>
        <p>Now as cubes! Sort the patterns into separate columns without stacking on a different pattern</p>
      </header>
      <section className="bsg-card" aria-label="Ball Sort Game">
        <div className="bsg-side">
          <div className="bsg-hd">
            <span>LEVEL {pad2(state.seed)}<br />SORT BY FILL</span>
            <span className="bsg-icon" aria-hidden="true">
              {'1001011011100101'.split('').map((b, i) => <i key={i} className={b === '1' ? '' : 'o'} />)}
            </span>
          </div>
          <div className="bsg-legend" role="list" aria-label="Fills sorted">
            {used.map((v) => (
              <span key={v} role="listitem"><Swatch fill={v} prefix={prefix} sorted={sortedFills.has(v)} /></span>
            ))}
          </div>
          <div className="bsg-log" aria-hidden="true">
            <div>LOG</div>
            {lines.map((line, i) => <span key={`${log.length}-${i}`} className={line.includes('✗') ? 'bad' : ''}>{line}</span>)}
            {lifted && <span className="cur">{col(selected!)} ↑ {lifted} …</span>}
            {!lines.length && !lifted && <span>—</span>}
          </div>
          <div className="bsg-keys" aria-hidden="true">
            <span>← → MOVE · ↵ LIFT/DROP · ESC CANCEL</span>
            <span>1–9 COLUMN · U UNDO · R RESTART · N NEW</span>
          </div>
          <div className="bsg-diff" role="radiogroup" aria-label="Difficulty">
            {DIFFICULTIES.map((d) => (
              <button
                key={d}
                type="button"
                role="radio"
                aria-checked={state.difficulty === d}
                className={state.difficulty === d ? 'on' : ''}
                onClick={() => d !== state.difficulty && dispatch({ type: 'difficulty', difficulty: d, seed: randomSeed() })}
              >
                {d.toUpperCase()}
              </button>
            ))}
          </div>
          <div className="bsg-stats">
            <div className="row bsg-lvl"><span>LEVEL</span><span>{pad2(state.seed)}</span></div>
            <div className="row"><span>MOVES</span><span>{moves}<em> / PAR {state.optimalMoves}</em></span></div>
            <div className="row"><span>SORTED</span><span>{sorted} / {fills}</span></div>
            <div className="row"><span>PROGRESS</span><span>{progress}%</span></div>
            <div className="bsg-bar" role="progressbar" aria-label="Progress" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
              <b style={{ width: `${progress}%` }} />
            </div>
            <div className="bsg-ticks" aria-hidden="true"><span>0</span><span>25</span><span>50</span><span>75</span><span>100</span></div>
          </div>
          <div className="bsg-actions">
            <button type="button" onClick={() => dispatch({ type: 'undo' })} disabled={!moves || won}>UNDO</button>
            <button type="button" onClick={() => dispatch({ type: 'restart' })} disabled={!moves && !log.length}>RESTART</button>
            <button type="button" onClick={() => dispatch({ type: 'new', seed: randomSeed() })}>NEW</button>
            <button ref={next} type="button" className="bsg-next" disabled={!won} onClick={() => dispatch({ type: 'next' })}>
              {narrow ? 'NEXT →' : 'NEXT LEVEL →'}
            </button>
          </div>
        </div>
        <Board
          idPrefix={prefix}
          level={level}
          selected={selected}
          lastEntry={log[log.length - 1]}
          errors={state.errors}
          won={won}
          narrow={narrow}
          buttons={buttons}
          onTap={(c) => {
            cursor.current = c;
            dispatch({ type: 'tap', column: c });
          }}
          onMove={(from, to) => dispatch({ type: 'move', from, to })}
          onCancel={() => dispatch({ type: 'cancel' })}
        />
      </section>
      <div className="bsg-sr" aria-live="polite">{announce(log[log.length - 1], won)}</div>
    </div>
  );
}

export default App;
