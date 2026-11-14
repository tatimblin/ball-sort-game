import { describe, expect, test } from 'vitest';
import { GRID, columnAt, hitRect, layoutBoard, project, unproject } from './iso';

// The frames the board gets: desktop 1280×800 and an iPhone 13 (390×844).
const FRAMES = [
  { name: 'desktop', W: 760, H: 630, narrow: false },
  { name: 'phone', W: 364, H: 470, narrow: true },
];

describe('layoutBoard', () => {
  for (const { name, W, H, narrow } of FRAMES) {
    for (let n = 5; n <= 10; n++) {
      test(`${name}, ${n} columns: fits, on the grid, tappable, no overlap`, () => {
        const l = layoutBoard(n, W, H, { narrow, pad: narrow ? 14 : 34 });
        expect(l.places).toHaveLength(n);
        // Every footprint sits on grid lines.
        for (const p of l.places) {
          expect(Number.isInteger(p.i / GRID)).toBe(true);
          expect(Number.isInteger(p.j / GRID)).toBe(true);
        }
        // Tap targets: at least 44px wide, inside the frame, never overlapping.
        expect(l.advance).toBeGreaterThanOrEqual(44);
        const rects = l.places.map((_, c) => hitRect(l, c));
        for (const r of rects) {
          expect(r.x).toBeGreaterThanOrEqual(-1);
          expect(r.x + r.w).toBeLessThanOrEqual(W + 1);
          expect(r.h).toBeGreaterThanOrEqual(44);
        }
        for (let a = 0; a < n; a++) {
          for (let b = a + 1; b < n; b++) {
            const A = rects[a];
            const B = rects[b];
            const overlap = A.x < B.x + B.w - 0.5 && B.x < A.x + A.w - 0.5 && A.y < B.y + B.h - 0.5 && B.y < A.y + A.h - 0.5;
            expect(overlap, `${a} and ${b}`).toBe(false);
          }
        }
        // The centre of each rect picks its own column.
        rects.forEach((r, c) => expect(columnAt(l, r.x + r.w / 2, r.y + r.h / 2)).toBe(c));
      });
    }
  }

  test('desktop keeps the diagonal row; a phone wraps many columns into rows', () => {
    expect(layoutBoard(10, 760, 630).kind).toBe('diagonal');
    const phone = layoutBoard(10, 364, 470, { narrow: true, pad: 14 });
    expect(phone.kind).toBe('rows');
    expect(phone.rows).toBe(2);
  });

  test('unproject inverts project on the ground', () => {
    const l = layoutBoard(6, 600, 400);
    const [x, y] = project(l, 3.5, -1.5);
    const [i, j] = unproject(l, x, y);
    expect(i).toBeCloseTo(3.5);
    expect(j).toBeCloseTo(-1.5);
  });
});
