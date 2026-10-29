import { describe, expect, it } from "vitest";
import { frameFor, MASONRY_COLUMNS, type Frame } from "../masonry";

/**
 * Place frames the way CSS grid auto-placement does (row-major, first fit) and
 * return the occupancy grid.
 */
function place(frames: Frame[]): boolean[][] {
  const grid: boolean[][] = [];
  const free = (r: number, c: number, f: Frame) => {
    if (c + f.cols > MASONRY_COLUMNS) return false;
    for (let dr = 0; dr < f.rows; dr++)
      for (let dc = 0; dc < f.cols; dc++)
        if (grid[r + dr]?.[c + dc]) return false;
    return true;
  };
  for (const f of frames) {
    let placed = false;
    for (let r = 0; !placed; r++) {
      for (let c = 0; c < MASONRY_COLUMNS && !placed; c++) {
        if (!free(r, c, f)) continue;
        for (let dr = 0; dr < f.rows; dr++) {
          grid[r + dr] ??= Array(MASONRY_COLUMNS).fill(false);
          for (let dc = 0; dc < f.cols; dc++) grid[r + dr][c + dc] = true;
        }
        placed = true;
      }
    }
  }
  return grid;
}

const framesFor = (n: number) =>
  Array.from({ length: n }, (_, i) => frameFor(i, n));

describe("frameFor", () => {
  it("lays out a full block as feature, pair, tall, wide, pair", () => {
    expect(framesFor(7).map((f) => [f.cols, f.rows])).toEqual([
      [4, 2],
      [2, 1],
      [2, 1],
      [2, 2],
      [4, 1],
      [2, 1],
      [2, 1],
    ]);
  });

  it("fills complete rows with no gaps for every photo count up to 40", () => {
    for (let n = 1; n <= 40; n++) {
      const grid = place(framesFor(n));
      const holes = grid.flat().filter((cell) => !cell).length;
      expect(holes, `${n} photos`).toBe(0);
    }
  });

  it("gives a lone photo the full width", () => {
    expect(frameFor(0, 1)).toEqual({ cols: 6, rows: 1, wide: true });
  });
});
