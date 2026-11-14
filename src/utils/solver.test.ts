import { describe, expect, test } from 'vitest';
import { generateLevel } from './generator';
import { isSolved, move, type Level } from './rules';
import { solve } from './solver';

function replay(level: Level, moves: [number, number][]): Level {
  return moves.reduce((current, [from, to]) => {
    const next = move(current, from, to);
    expect(next, `move ${from} → ${to}`).not.toBeNull();
    return next!;
  }, level);
}

/** Plain breadth-first search with no heuristic and no pruning: slow, but
 *  plainly right, to check the A* lengths against. */
function bfsLength(level: Level): number | null {
  const key = (l: Level) => l.map((c) => c.join('')).sort().join('|');
  let frontier = [level];
  const seen = new Set([key(level)]);
  for (let depth = 0; frontier.length; depth++) {
    const next: Level[] = [];
    for (const state of frontier) {
      if (isSolved(state)) return depth;
      for (let from = 0; from < state.length; from++) {
        for (let to = 0; to < state.length; to++) {
          const child = move(state, from, to);
          if (!child) continue;
          const k = key(child);
          if (seen.has(k)) continue;
          seen.add(k);
          next.push(child);
        }
      }
    }
    frontier = next;
  }
  return null;
}

describe('solve', () => {
  test('a solved level needs no moves', () => {
    expect(solve([[0, 0, 0, 0], [], []])!.moves).toEqual([]);
  });

  test('finds a one-move finish', () => {
    expect(solve([[0, 0, 0], [0], []])!.moves).toHaveLength(1);
  });

  test('reports a level with no solution as null', () => {
    // Two full mixed columns and no room to move anything.
    expect(solve([[0, 1, 0, 1], [1, 0, 1, 0]])).toBeNull();
  });

  test('gives up at its cap', () => {
    const level = generateLevel({ difficulty: 'expert', seed: 1 });
    expect(solve(level, { maxExpanded: 5 })).toBeNull();
  });

  test('its moves are legal and solve the level', () => {
    for (let seed = 1; seed <= 10; seed++) {
      const level = generateLevel({ difficulty: 'hard', seed });
      const { moves } = solve(level)!;
      expect(isSolved(replay(level, moves))).toBe(true);
    }
  });

  test('matches plain BFS, so its counts are optimal', () => {
    for (let seed = 1; seed <= 12; seed++) {
      const level = generateLevel({ difficulty: 'easy', seed });
      expect(solve(level)!.moves.length, `easy seed ${seed}`).toBe(bfsLength(level));
    }
    for (let seed = 1; seed <= 3; seed++) {
      const level = generateLevel({ difficulty: 'medium', seed });
      expect(solve(level)!.moves.length, `medium seed ${seed}`).toBe(bfsLength(level));
    }
  }, 60_000);
});
