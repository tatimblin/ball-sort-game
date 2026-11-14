import { expect, test } from 'vitest';
import { Game } from './Game';

const game = new Game();

test('Game: a cube moves onto an empty column', () => {
  const { newLevel, didMove } = game.moveCell([[0, 1], []], 0, 1);
  expect(didMove).toBe(true);
  expect(newLevel).toEqual([[0], [1]]);
});

test('Game: a cube moves onto its own color', () => {
  const { newLevel, didMove } = game.moveCell([[0, 1], [1]], 0, 1);
  expect(didMove).toBe(true);
  expect(newLevel).toEqual([[0], [1, 1]]);
});

test('Game: a cube does not move onto another color or a full column', () => {
  expect(game.moveCell([[0, 1], [0]], 0, 1).didMove).toBe(false);
  expect(game.moveCell([[1], [1, 1, 1, 1]], 0, 1).didMove).toBe(false);
});

test('Game: moving leaves the old level untouched', () => {
  const level = [[0, 1], []];
  game.moveCell(level, 0, 1);
  expect(level).toEqual([[0, 1], []]);
});

test('Game: a level is its columns plus two empty ones', () => {
  const level = game.getLevel(0);
  expect(level.slice(-2)).toEqual([[], []]);
  expect(level.slice(0, -2).every((column) => column.length === 4)).toBe(true);
});
