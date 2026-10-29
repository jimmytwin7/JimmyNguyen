import type { ImageLoaderProps } from "next/image";

/**
 * The only widths ever requested from Cloudinary. Each distinct width is a
 * separate derived asset that counts toward Cloudinary's transformation quota
 * the first time it's generated, so the set is kept small. 1600 matches the
 * manifest's lightbox URL, so the largest size reuses an existing derivative.
 */
export const PHOTO_WIDTHS = [480, 800, 1200, 1600] as const;

/** Round up to the nearest allowed width, capped at the largest. */
export function snapWidth(width: number): number {
  return (
    PHOTO_WIDTHS.find((w) => w >= width) ??
    PHOTO_WIDTHS[PHOTO_WIDTHS.length - 1]
  );
}

/**
 * next/image loader for the travel photos. The manifest stores Cloudinary
 * delivery URLs with a fixed width transform (`…/f_auto,q_auto,w_1600,c_limit/…`).
 * Swapping that width per srcset entry lets Cloudinary serve a size close to
 * what each frame needs (it already handles format and quality), instead of
 * routing every photo through Next's image optimizer.
 *
 * Requested widths are snapped up to PHOTO_WIDTHS, so each photo has at most
 * four derivatives and nothing larger than 1600px is ever sent. `c_limit`
 * keeps Cloudinary from upscaling past the original. URLs without a width
 * transform are returned unchanged.
 */
export function cloudinaryLoader({ src, width }: ImageLoaderProps): string {
  return src.replace(/([,/])w_\d+/, `$1w_${snapWidth(width)}`);
}
