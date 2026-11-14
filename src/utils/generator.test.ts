import { describe, expect, test } from 'vitest';
import { DIFFICULTIES, TIERS, generateLevel, generatePuzzle, isDifficulty } from './generator';
import { HEIGHT, isSorted, isSolved, move, type Level } from './rules';
import { solve } from './solver';

const SEEDS = 150;

function counts(level: Level): Map<number, number> {
  const m = new Map<number, number>();
  for (const cube of level.flat()) m.set(cube, (m.get(cube) ?? 0) + 1);
  return m;
}

describe('generateLevel', () => {
  test('is deterministic for a difficulty and seed', () => {
    for (const difficulty of DIFFICULTIES) {
      for (const seed of [1, 2, 99, 123456]) {
        expect(generateLevel({ difficulty, seed })).toEqual(generateLevel({ difficulty, seed }));
      }
    }
  });

  test('different seeds and difficulties give different levels', () => {
    const seen = new Set<string>();
    for (const difficulty of DIFFICULTIES) {
      for (let seed = 1; seed <= 20; seed++) seen.add(JSON.stringify(generateLevel({ difficulty, seed })));
    }
    expect(seen.size).toBe(DIFFICULTIES.length * 20);
  });

  test('harder tiers have more columns', () => {
    const columns = DIFFICULTIES.map((difficulty) => generateLevel({ difficulty, seed: 1 }).length);
    expect(columns).toEqual([...columns].sort((a, b) => a - b));
    expect(new Set(columns).size).toBe(DIFFICULTIES.length);
  });

  for (const difficulty of DIFFICULTIES) {
    test(`${difficulty}: ${SEEDS} seeds deal well-formed, solvable, unsolved levels`, () => {
      const tier = TIERS[difficulty];
      for (let seed = 1; seed <= SEEDS; seed++) {
        const puzzle = generatePuzzle({ difficulty, seed });
        const { level } = puzzle;
        const where = `${difficulty} seed ${seed}`;
        // The tier's shape: full columns of every fill, then the spares.
        expect(level, where).toHaveLength(tier.fills + tier.spares);
        expect(level.slice(0, tier.fills).every((c) => c.length === HEIGHT), where).toBe(true);
        expect(level.slice(tier.fills), where).toEqual(Array(tier.spares).fill([]));
        expect([...counts(level)].sort(), where).toEqual(
          Array.from({ length: tier.fills }, (_, f) => [f, HEIGHT]),
        );
        // Mixed: nothing sorted or solved at the start.
        expect(isSolved(level), where).toBe(false);
        expect(level.some(isSorted), where).toBe(false);
        // Solvable, by the solution it reports, in no fewer moves than the tier asks.
        const end = puzzle.solution.reduce<Level>((l, [from, to]) => move(l, from, to)!, level);
        expect(isSolved(end), where).toBe(true);
        expect(puzzle.optimalMoves, where).toBe(puzzle.solution.length);
        expect(puzzle.optimalMoves, where).toBeGreaterThanOrEqual(tier.minMoves);
      }
    }, 60_000);
  }

  test('the reported move count is the optimum', () => {
    for (const difficulty of DIFFICULTIES) {
      const puzzle = generatePuzzle({ difficulty, seed: 7 });
      expect(solve(puzzle.level, { maxExpanded: 1_000_000 })!.moves.length).toBe(puzzle.optimalMoves);
    }
  });

  test('expert stays fast enough for the browser', () => {
    const times: number[] = [];
    for (let seed = 1; seed <= 100; seed++) {
      const t0 = performance.now();
      generateLevel({ difficulty: 'expert', seed });
      times.push(performance.now() - t0);
    }
    times.sort((a, b) => a - b);
    // Measured p95 is ~9 ms in node; this only catches a blow-up.
    expect(times[94]).toBeLessThan(150);
  }, 60_000);

  test('isDifficulty accepts only the four tiers', () => {
    expect(DIFFICULTIES.every(isDifficulty)).toBe(true);
    expect(isDifficulty('impossible')).toBe(false);
    expect(isDifficulty(undefined)).toBe(false);
  });
});
