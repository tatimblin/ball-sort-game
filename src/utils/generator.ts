// Levels, dealt from a seed. generateLevel({ difficulty, seed }) always gives
// the same level for the same pair, and every level it gives is solvable:
// each deal is checked with the solver, and a deal that is unsolvable, starts
// with a sorted column, or falls short of its tier is dealt again from the
// same seeded stream.
import { mulberry32, hashSeed, shuffle } from './random';
import { HEIGHT, isSorted, type Level } from './rules';
import { solve, type Move } from './solver';

export const DIFFICULTIES = ['easy', 'medium', 'hard', 'expert'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export interface Tier {
  /** Fills in play; each fills one column of HEIGHT cubes. */
  fills: number;
  /** Empty columns to start. */
  spares: number;
  /** The longest run of one fill a column may start with. */
  maxRun: number;
  /** The fewest moves a deal must need. */
  minMoves: number;
}

export const TIERS: Record<Difficulty, Tier> = {
  easy: { fills: 3, spares: 2, maxRun: 3, minMoves: 8 },
  medium: { fills: 4, spares: 2, maxRun: 2, minMoves: 12 },
  hard: { fills: 6, spares: 2, maxRun: 2, minMoves: 20 },
  expert: { fills: 8, spares: 2, maxRun: 1, minMoves: 28 },
};

/** Deals to solve per seed before settling for the fallback. */
const MAX_ATTEMPTS = 24;
/** Shuffles per deal to find one mixed enough for the tier. */
const MAX_SHUFFLES = 1000;
/** The solver's cap per deal: past it a deal counts as too hard to check. */
const MAX_EXPANDED = 60_000;

export interface Puzzle {
  level: Level;
  difficulty: Difficulty;
  seed: number;
  /** The fewest moves that solve it. */
  optimalMoves: number;
  /** One shortest solution. */
  solution: Move[];
}

export function isDifficulty(value: unknown): value is Difficulty {
  return typeof value === 'string' && (DIFFICULTIES as readonly string[]).includes(value);
}

function longestRun(column: number[]): number {
  let best = 0;
  let run = 0;
  column.forEach((cube, i) => {
    run = i > 0 && cube === column[i - 1] ? run + 1 : 1;
    best = Math.max(best, run);
  });
  return best;
}

/** Shuffles until a deal is mixed enough for the tier (cheap: no solving),
 *  or null after MAX_SHUFFLES. Expert's no-repeats rule keeps about 1 in 12. */
function deal(tier: Tier, random: () => number): Level | null {
  const cubes = Array.from({ length: tier.fills * HEIGHT }, (_, i) => Math.floor(i / HEIGHT));
  for (let i = 0; i < MAX_SHUFFLES; i++) {
    shuffle(cubes, random);
    const level: Level = [];
    for (let c = 0; c < tier.fills; c++) level.push(cubes.slice(c * HEIGHT, (c + 1) * HEIGHT));
    if (level.some((column) => isSorted(column) || longestRun(column) > tier.maxRun)) continue;
    for (let c = 0; c < tier.spares; c++) level.push([]);
    return level;
  }
  return null;
}

/** The level, how short its solution can be, and one such solution. */
export function generatePuzzle({ difficulty, seed }: { difficulty: Difficulty; seed: number }): Puzzle {
  const tier = TIERS[difficulty];
  const random = mulberry32(hashSeed(DIFFICULTIES.indexOf(difficulty), seed));
  let fallback: Puzzle | null = null;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const level = deal(tier, random);
    if (!level) break;
    const solution = solve(level, { maxExpanded: MAX_EXPANDED });
    if (!solution) continue;
    const puzzle = { level, difficulty, seed, optimalMoves: solution.moves.length, solution: solution.moves };
    if (puzzle.optimalMoves >= tier.minMoves) return puzzle;
    fallback ??= puzzle;
  }
  // Every deal fell short of the tier: keep the first solvable one, or the
  // tier's known-good level.
  return fallback ?? FALLBACK[difficulty](seed);
}

export function generateLevel(opts: { difficulty: Difficulty; seed: number }): Level {
  return generatePuzzle(opts).level;
}

// Never reached by any seed the tests try; here so a pathological seed still
// gets a playable level instead of a hang.
const FALLBACK: Record<Difficulty, (seed: number) => Puzzle> = Object.fromEntries(
  DIFFICULTIES.map((difficulty) => [
    difficulty,
    (seed: number) => {
      const { fills, spares } = TIERS[difficulty];
      // Each column holds the fill below it on top: one rotation away from solved.
      const level: Level = Array.from({ length: fills }, (_, c) => [c, c, c, (c + 1) % fills]);
      for (let s = 0; s < spares; s++) level.push([]);
      const solution = solve(level)!.moves;
      return { level, difficulty, seed, optimalMoves: solution.length, solution };
    },
  ]),
) as Record<Difficulty, (seed: number) => Puzzle>;
