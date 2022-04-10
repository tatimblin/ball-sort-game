import { Coordinate } from "./Coordinate";

test('Coordinate: create key at [1, 1]', () => {
  const coord = new Coordinate(1, 1);

  expect(coord.key).toEqual('x1y1');
});

test('Coordinate: create key at [1, 0]', () => {
  const coord = new Coordinate(1, 0);
console.log(coord);
  expect(coord.key).toEqual('x1y0');
});

test('Coordinate: create key at [0, 1]', () => {
  const coord = new Coordinate(0, 1);

  expect(coord.key).toEqual('x0y1');
});
