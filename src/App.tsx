import { useEffect, useId, useLayoutEffect, useReducer, useRef, useState, type KeyboardEvent } from 'react';
import { Board } from './board/Board';
import { FACES, FILLS, FillDefs, INK, patternId } from './board/fills';
import { cubeFaces, pts } from './board/iso';
import { DIFFICULTIES, type Difficulty } from './utils/generator';
import { fillCount, sortedCount } from './utils/rules';
import { createGame, moveCount, reducer, type LogEntry } from './utils/state';

export interface AppProps {
  difficulty?: Difficulty;
  seed?: number;
}

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

/** A small cube for the legend. */
function Swatch({ fill, prefix }: { fill: number; prefix: string }) {
  const faces = cubeFaces({ s: 11, ox: 10.5, oy: 1 }, 0, 0, -1);
  const p = `${prefix}lg${fill}`;
  return (
    <svg width="21" height="24" viewBox="0 0 21 24" aria-hidden="true">
      <defs>
        <FillDefs prefix={p} fills={[fill]} />
      </defs>
      {FACES.map((face) => <polygon key={face} points={pts(faces[face])} fill={FILLS[fill].tone[face]} />)}
      {FILLS[fill].pattern && FACES.map((face) => <polygon key={`p${face}`} points={pts(faces[face])} fill={`url(#${patternId(p, fill, face)})`} />)}
      {FACES.map((face) => <polygon key={`o${face}`} points={pts(faces[face])} fill="none" stroke={INK} strokeWidth="1" strokeLinejoin="round" />)}
    </svg>
  );
}

function App({ difficulty = 'medium', seed = 1 }: AppProps) {
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

  const focusColumn = (c: number) => {
    const n = level.length;
    cursor.current = ((c % n) + n) % n;
    buttons.current[cursor.current]?.focus();
  };

  // Keys reach the game only while it has focus: the handler sits on the
  // game's root, never on the document.
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
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

  const lines = logLines(log).slice(-7);
  const lifted = selected !== null && level[selected].length ? FILLS[level[selected][level[selected].length - 1]].name : null;

  return (
    <div ref={root} className={`bsg-app${narrow ? ' bsg-narrow' : ''}${won ? ' bsg-won' : ''}`} tabIndex={-1} onKeyDown={onKeyDown}>
      <header className="bsg-head">
        <h1>Ball Sort</h1>
        <p>Lift the top cube. Set it on a match or an empty column. Four of a fill sorts it.</p>
      </header>
      <section className="bsg-card" aria-label="Ball Sort">
        <div className="bsg-side">
          <div className="bsg-hd">
            <span>LEVEL {pad2(state.seed)}<br />SORT BY FILL</span>
            <span className="bsg-icon" aria-hidden="true">
              {'1001011011100101'.split('').map((b, i) => <i key={i} className={b === '1' ? '' : 'o'} />)}
            </span>
          </div>
          <div className="bsg-legend" aria-label="Fills">
            {used.map((v) => (
              <div key={v}><Swatch fill={v} prefix={prefix} />{String.fromCharCode(65 + v)} · {FILLS[v].name}</div>
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
