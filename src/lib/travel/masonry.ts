/**
 * Frame sizes for the travel photo masonry: an asymmetric layout on a
 * 6-column grid. A full block of seven photos tiles exactly, with no gaps:
 *
 *   ┌───────────────┬───────┐
 *   │               │   1   │
 *   │       0       ├───────┤
 *   │               │   2   │
 *   ├───────┬───────┴───────┤
 *   │       │       4       │
 *   │   3   ├───────┬───────┤
 *   │       │   5   │   6   │
 *   └───────┴───────┴───────┘
 *
 * A trailing partial block keeps the first three (they tile on their own) and
 * fills the rest with half-width pairs, closing with a full-width frame when
 * the count is odd — so any photo count fills complete rows.
 */

export const MASONRY_COLUMNS = 6;

export interface Frame {
  /** Columns spanned on the 6-column grid. */
  cols: 2 | 3 | 4 | 6;
  /** Rows spanned. */
  rows: 1 | 2;
  /** Large frame — spans the full row on the 2-column mobile grid. */
  wide: boolean;
}

const BLOCK: Frame[] = [
  { cols: 4, rows: 2, wide: true },
  { cols: 2, rows: 1, wide: false },
  { cols: 2, rows: 1, wide: false },
  { cols: 2, rows: 2, wide: false },
  { cols: 4, rows: 1, wide: true },
  { cols: 2, rows: 1, wide: false },
  { cols: 2, rows: 1, wide: false },
];

/**
 * `sizes` for a frame's next/image. Shared by the photo panel and the photo
 * hand-off, so both request the same Cloudinary derivative and the hand-off
 * photo is already cached when the real tile appears.
 */
export function frameSizes(frame: Frame): string {
  return frame.wide
    ? "(min-width: 1024px) 60vw, 100vw"
    : "(min-width: 640px) 30vw, 50vw";
}

/** Frame for photo `i` (0-based) in a set of `total` photos. */
export function frameFor(i: number, total: number): Frame {
  const blockStart = Math.floor(i / BLOCK.length) * BLOCK.length;
  const remaining = total - blockStart;
  const k = i - blockStart;
  if (remaining >= BLOCK.length) return BLOCK[k];
  if (remaining >= 3 && k < 3) return BLOCK[k];

  const restStart = remaining >= 3 ? 3 : 0;
  const restCount = remaining - restStart;
  if (restCount % 2 === 1 && k - restStart === restCount - 1) {
    return { cols: 6, rows: 1, wide: true };
  }
  return { cols: 3, rows: 1, wide: false };
}
