// The puzzle's rules, as pure functions over a level: a list of columns, each
// listed bottom to top, holding fill ids. Every column holds up to HEIGHT
// cubes. Only the top cube moves, and only onto an empty column or a cube of
// the same fill with room above it. A column of HEIGHT cubes of one fill is
// sorted: it is done and its cubes no longer move.
export type Level = number[][];

export const HEIGHT = 4;

export function isSorted(column: readonly number[]): boolean {
  return column.length === HEIGHT && column.every((cube) => cube === column[0]);
}

export function isSolved(level: Level): boolean {
  return level.every((column) => column.length === 0 || isSorted(column));
}

export function sortedCount(level: Level): number {
  return level.filter(isSorted).length;
}

/** How many fills the level holds, which is how many columns it sorts when won. */
export function fillCount(level: Level): number {
  return new Set(level.flat()).size;
}

export type MoveError = 'no such column' | 'same column' | 'nothing to lift' | 'column sorted' | 'column full' | 'fill mismatch';

/** Why moving the top cube of `from` onto `to` breaks a rule, or null if it doesn't. */
export function moveError(level: Level, from: number, to: number): MoveError | null {
  const source = level[from];
  const target = level[to];
  if (!source || !target) return 'no such column';
  if (from === to) return 'same column';
  if (source.length === 0) return 'nothing to lift';
  if (isSorted(source)) return 'column sorted';
  if (target.length >= HEIGHT) return 'column full';
  if (target.length > 0 && target[target.length - 1] !== source[source.length - 1]) return 'fill mismatch';
  return null;
}

export function canMove(level: Level, from: number, to: number): boolean {
  return moveError(level, from, to) === null;
}

/** The level after moving the top cube of `from` onto `to`, or null if that
 *  move breaks a rule. The level passed in is left untouched. */
export function move(level: Level, from: number, to: number): Level | null {
  if (!canMove(level, from, to)) return null;
  const next = level.map((column) => column.slice());
  next[to].push(next[from].pop()!);
  return next;
}
