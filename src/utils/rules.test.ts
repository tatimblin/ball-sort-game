import { describe, expect, test } from 'vitest';
import { canMove, fillCount, isSorted, isSolved, move, sortedCount } from './rules';

describe('move rules', () => {
  test('a cube moves onto an empty column', () => {
    expect(move([[0, 1], []], 0, 1)).toEqual([[0], [1]]);
  });

  test('a cube moves onto its own fill', () => {
    expect(move([[0, 1], [1]], 0, 1)).toEqual([[0], [1, 1]]);
  });

  test('a cube does not move onto another fill or a full column', () => {
    expect(move([[0, 1], [0]], 0, 1)).toBeNull();
    expect(move([[1], [1, 0, 0, 1]], 0, 1)).toBeNull();
  });

  test('nothing moves from an empty column, onto itself, or out of range', () => {
    expect(canMove([[], [0]], 0, 1)).toBe(false);
    expect(canMove([[0], []], 0, 0)).toBe(false);
    expect(canMove([[0], []], 0, 5)).toBe(false);
    expect(canMove([[0], []], -1, 1)).toBe(false);
  });

  test('a sorted column is locked', () => {
    expect(canMove([[2, 2, 2, 2], []], 0, 1)).toBe(false);
    // A full column of mixed fills is not sorted and can give up its top.
    expect(canMove([[2, 2, 2, 1], []], 0, 1)).toBe(true);
  });

  test('moving leaves the old level untouched', () => {
    const level = [[0, 1], []];
    move(level, 0, 1);
    expect(level).toEqual([[0, 1], []]);
  });
});

describe('completion and win', () => {
  test('a column is sorted at four of one fill', () => {
    expect(isSorted([3, 3, 3, 3])).toBe(true);
    expect(isSorted([3, 3, 3])).toBe(false);
    expect(isSorted([3, 3, 3, 0])).toBe(false);
    expect(isSorted([])).toBe(false);
  });

  test('a level is solved when every column is sorted or empty', () => {
    expect(isSolved([[0, 0, 0, 0], [1, 1, 1, 1], [], []])).toBe(true);
    expect(isSolved([[0, 0, 0, 0], [1, 1, 1], [1], []])).toBe(false);
  });

  test('sortedCount and fillCount measure progress', () => {
    const level = [[0, 0, 0, 0], [1, 2, 1, 2], [2, 1, 2, 1], []];
    expect(sortedCount(level)).toBe(1);
    expect(fillCount(level)).toBe(3);
  });

  test('the last move wins', () => {
    const level = move([[0, 0, 0, 0], [1, 1, 1], [1]], 2, 1)!;
    expect(isSolved(level)).toBe(true);
  });
});
