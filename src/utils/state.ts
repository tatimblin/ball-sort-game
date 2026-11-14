// The game as a reducer: the level in play, where it came from (difficulty
// and seed), what's lifted, the moves so far and how to undo them. Pure, so
// the tests drive it the way the UI does.
import { generatePuzzle, type Difficulty } from './generator';
import { isSorted, isSolved, move, moveError, type Level, type MoveError } from './rules';

export type LogEntry =
  /** A move; `sorted` when it completed `to`. */
  | { kind: 'move'; n: number; from: number; to: number; fill: number; sorted: boolean }
  /** A drop the rules refused. */
  | { kind: 'invalid'; from: number; to: number; reason: MoveError }
  /** Move `n` taken back. */
  | { kind: 'undo'; n: number; from: number; to: number };

export interface GameState {
  difficulty: Difficulty;
  seed: number;
  /** The level as dealt, for restart. */
  start: Level;
  level: Level;
  /** The fewest moves that solve `start`. */
  optimalMoves: number;
  /** Each move so far, oldest first; undo pops the last. */
  history: { from: number; to: number; before: Level }[];
  /** The column whose top cube is lifted. It stays lifted until dropped or cancelled. */
  selected: number | null;
  log: LogEntry[];
  /** Counts refused drops, so the UI can flash on each one. */
  errors: number;
  won: boolean;
}

export type Action =
  /** Lift a column's top cube, or drop the lifted one onto the column. */
  | { type: 'tap'; column: number }
  /** Lift-and-drop in one step, as a drag does. */
  | { type: 'move'; from: number; to: number }
  | { type: 'cancel' }
  | { type: 'undo' }
  | { type: 'restart' }
  /** After a win: the next seed at the same difficulty. */
  | { type: 'next' }
  | { type: 'new'; seed: number }
  | { type: 'difficulty'; difficulty: Difficulty; seed: number };

/** Log entries kept: enough for any panel, bounded for a long session. */
const LOG_LIMIT = 50;

export function createGame(difficulty: Difficulty, seed: number): GameState {
  const { level, optimalMoves } = generatePuzzle({ difficulty, seed });
  return {
    difficulty, seed, start: level, level, optimalMoves,
    history: [], selected: null, log: [], errors: 0, won: false,
  };
}

export function moveCount(state: GameState): number {
  return state.history.length;
}

export function canLift(level: Level, column: number): boolean {
  const cubes = level[column];
  return !!cubes && cubes.length > 0 && !isSorted(cubes);
}

function logged(state: GameState, entry: LogEntry): LogEntry[] {
  return [...state.log, entry].slice(-LOG_LIMIT);
}

function tryMove(state: GameState, from: number, to: number): GameState {
  const level = move(state.level, from, to);
  if (!level) {
    const reason = moveError(state.level, from, to)!;
    return { ...state, errors: state.errors + 1, log: logged(state, { kind: 'invalid', from, to, reason }) };
  }
  const history = [...state.history, { from, to, before: state.level }];
  const fill = level[to][level[to].length - 1];
  const entry: LogEntry = { kind: 'move', n: history.length, from, to, fill, sorted: isSorted(level[to]) };
  return { ...state, level, history, selected: null, log: logged(state, entry), won: isSolved(level) };
}

export function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'tap': {
      if (state.won) return state;
      const { selected } = state;
      const { column } = action;
      if (!state.level[column]) return state;
      if (selected === null) {
        return canLift(state.level, column) ? { ...state, selected: column } : state;
      }
      if (selected === column) return { ...state, selected: null };
      return tryMove(state, selected, column);
    }
    case 'move':
      if (state.won || action.from === action.to) return state;
      return tryMove({ ...state, selected: null }, action.from, action.to);
    case 'cancel':
      return state.selected === null ? state : { ...state, selected: null };
    case 'undo': {
      const last = state.history[state.history.length - 1];
      if (!last || state.won) return state;
      return {
        ...state,
        level: last.before,
        history: state.history.slice(0, -1),
        selected: null,
        log: logged(state, { kind: 'undo', n: state.history.length, from: last.from, to: last.to }),
      };
    }
    case 'restart':
      return { ...createGameFrom(state), errors: state.errors };
    case 'next':
      return state.won ? createGame(state.difficulty, state.seed + 1) : state;
    case 'new':
      return createGame(state.difficulty, action.seed);
    case 'difficulty':
      return createGame(action.difficulty, action.seed);
  }
}

function createGameFrom(state: GameState): GameState {
  return { ...state, level: state.start, history: [], selected: null, log: [], won: isSolved(state.start) };
}
