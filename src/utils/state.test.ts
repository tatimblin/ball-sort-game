import { describe, expect, test } from 'vitest';
import { generatePuzzle } from './generator';
import { createGame, moveCount, reducer, type GameState } from './state';

function play(state: GameState, moves: [number, number][]): GameState {
  return moves.reduce((s, [from, to]) => {
    s = reducer(s, { type: 'tap', column: from });
    return reducer(s, { type: 'tap', column: to });
  }, state);
}

/** A game on a fixed level, to test taps without depending on a deal. */
function fixed(level: number[][]): GameState {
  return { ...createGame('easy', 1), start: level, level };
}

describe('game state', () => {
  test('starts from the seeded level at its difficulty', () => {
    const state = createGame('hard', 5);
    const puzzle = generatePuzzle({ difficulty: 'hard', seed: 5 });
    expect(state).toMatchObject({ difficulty: 'hard', seed: 5, won: false, selected: null });
    expect(state.level).toEqual(puzzle.level);
    expect(state.optimalMoves).toBe(puzzle.optimalMoves);
    expect(moveCount(state)).toBe(0);
  });

  test('tap lifts, tap another drops, tap the same column or cancel puts it back', () => {
    let s = fixed([[0, 1], [1], []]);
    s = reducer(s, { type: 'tap', column: 0 });
    expect(s.selected).toBe(0);
    s = reducer(s, { type: 'tap', column: 0 });
    expect(s.selected).toBeNull();
    s = reducer(reducer(s, { type: 'tap', column: 0 }), { type: 'cancel' });
    expect(s.selected).toBeNull();
    s = play(s, [[0, 1]]);
    expect(s.level).toEqual([[0], [1, 1], []]);
    expect(moveCount(s)).toBe(1);
    expect(s.selected).toBeNull();
    expect(s.log).toEqual([{ kind: 'move', n: 1, from: 0, to: 1, fill: 1, sorted: false }]);
  });

  test('an empty or sorted column cannot be lifted', () => {
    const s = fixed([[0, 0, 0, 0], [1, 1], []]);
    expect(reducer(s, { type: 'tap', column: 0 }).selected).toBeNull();
    expect(reducer(s, { type: 'tap', column: 2 }).selected).toBeNull();
    expect(reducer(s, { type: 'tap', column: 9 })).toBe(s);
  });

  test('a refused drop keeps the cube lifted and logs why', () => {
    let s = fixed([[0, 1], [0], [1, 0, 1, 0], []]);
    s = reducer(s, { type: 'tap', column: 0 });
    s = reducer(s, { type: 'tap', column: 1 });
    expect(s.selected).toBe(0);
    expect(moveCount(s)).toBe(0);
    expect(s.errors).toBe(1);
    expect(s.log[s.log.length - 1]).toEqual({ kind: 'invalid', from: 0, to: 1, reason: 'fill mismatch' });
    s = reducer(s, { type: 'tap', column: 2 });
    expect(s.log[s.log.length - 1]).toMatchObject({ reason: 'column full' });
    expect(s.errors).toBe(2);
  });

  test('a drag-style move checks the rules too', () => {
    const s = fixed([[0, 1], [0], []]);
    expect(reducer(s, { type: 'move', from: 0, to: 1 }).log[0]).toMatchObject({ kind: 'invalid' });
    expect(reducer(s, { type: 'move', from: 0, to: 2 }).level).toEqual([[0], [0], [1]]);
  });

  test('the sorting move is logged as such', () => {
    const s = play(fixed([[0, 0, 0], [1, 0], []]), [[1, 0]]);
    expect(s.log[s.log.length - 1]).toMatchObject({ kind: 'move', to: 0, sorted: true });
  });

  test('undo takes moves back one at a time, as far as the start', () => {
    const start = createGame('medium', 2);
    const { solution } = generatePuzzle({ difficulty: 'medium', seed: 2 });
    const levels = [start.level];
    let s = start;
    for (const step of solution.slice(0, 5)) {
      s = play(s, [step]);
      levels.push(s.level);
    }
    for (let i = 5; i > 0; i--) {
      s = reducer(s, { type: 'undo' });
      expect(s.level).toEqual(levels[i - 1]);
      expect(moveCount(s)).toBe(i - 1);
    }
    expect(s.log[s.log.length - 1]).toMatchObject({ kind: 'undo', n: 1 });
    expect(reducer(s, { type: 'undo' })).toBe(s);
  });

  test('playing the solution wins; then only next, new, restart or difficulty change anything', () => {
    const puzzle = generatePuzzle({ difficulty: 'medium', seed: 3 });
    let s = play(createGame('medium', 3), puzzle.solution);
    expect(s.won).toBe(true);
    expect(moveCount(s)).toBe(puzzle.optimalMoves);
    expect(reducer(s, { type: 'tap', column: 0 })).toBe(s);
    expect(reducer(s, { type: 'move', from: 0, to: 1 })).toBe(s);
    expect(reducer(s, { type: 'undo' })).toBe(s);

    s = reducer(s, { type: 'next' });
    expect(s).toMatchObject({ difficulty: 'medium', seed: 4, won: false, log: [], history: [] });
    expect(s.level).toEqual(generatePuzzle({ difficulty: 'medium', seed: 4 }).level);
  });

  test('next does nothing before a win', () => {
    const s = createGame('easy', 1);
    expect(reducer(s, { type: 'next' })).toBe(s);
  });

  test('restart returns to the dealt level', () => {
    const start = createGame('easy', 2);
    const puzzle = generatePuzzle({ difficulty: 'easy', seed: 2 });
    let s = play(start, puzzle.solution.slice(0, 3));
    expect(moveCount(s)).toBe(3);
    s = reducer(s, { type: 'restart' });
    expect(s.level).toEqual(start.level);
    expect(s).toMatchObject({ history: [], log: [], selected: null, won: false, seed: 2 });
  });

  test('changing difficulty or asking for a new level deals a fresh one', () => {
    let s = createGame('easy', 1);
    s = reducer(s, { type: 'difficulty', difficulty: 'expert', seed: 42 });
    expect(s).toMatchObject({ difficulty: 'expert', seed: 42, history: [] });
    expect(s.level).toHaveLength(10);
    s = reducer(s, { type: 'new', seed: 43 });
    expect(s).toMatchObject({ difficulty: 'expert', seed: 43 });
  });
});
