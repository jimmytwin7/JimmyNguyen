import { describe, expect, it } from "vitest";
import {
  cloudinaryLoader,
  PHOTO_WIDTHS,
  snapWidth,
} from "../cloudinary-loader";

const BASE = "https://res.cloudinary.com/mxlapddp/image/upload";

describe("snapWidth", () => {
  it("rounds up to the next allowed width", () => {
    expect(snapWidth(1)).toBe(480);
    expect(snapWidth(480)).toBe(480);
    expect(snapWidth(481)).toBe(800);
    expect(snapWidth(1080)).toBe(1200);
    expect(snapWidth(1600)).toBe(1600);
  });

  it("caps requests above the largest width", () => {
    expect(snapWidth(2048)).toBe(1600);
    expect(snapWidth(3840)).toBe(1600);
  });

  it("maps every next/image default width onto at most four sizes", () => {
    // next/image's default deviceSizes + imageSizes.
    const nextWidths = [
      16, 32, 48, 64, 96, 128, 256, 384, 640, 750, 828, 1080, 1200, 1920, 2048,
      3840,
    ];
    const used = new Set(nextWidths.map(snapWidth));
    expect([...used].sort((a, b) => a - b)).toEqual([...PHOTO_WIDTHS]);
  });
});

describe("cloudinaryLoader", () => {
  it("swaps the width transform for the snapped width", () => {
    expect(
      cloudinaryLoader({
        src: `${BASE}/f_auto,q_auto,w_1600,c_limit/IMG_0505`,
        width: 640,
      }),
    ).toBe(`${BASE}/f_auto,q_auto,w_800,c_limit/IMG_0505`);
  });

  it("reuses the manifest's 1600px URL for large requests", () => {
    const src = `${BASE}/f_auto,q_auto,w_1600,c_limit/IMG_0505`;
    expect(cloudinaryLoader({ src, width: 3840 })).toBe(src);
  });

  it("handles a width transform at the start of the segment", () => {
    expect(
      cloudinaryLoader({ src: `${BASE}/w_600,c_limit/IMG_1`, width: 1080 }),
    ).toBe(`${BASE}/w_1200,c_limit/IMG_1`);
  });

  it("leaves a public id that merely contains 'w_' alone", () => {
    expect(
      cloudinaryLoader({
        src: `${BASE}/f_auto,w_1600/view_w_2`,
        width: 320,
      }),
    ).toBe(`${BASE}/f_auto,w_480/view_w_2`);
  });

  it("returns URLs without a width transform unchanged", () => {
    const src = `${BASE}/f_auto,q_auto/IMG_9`;
    expect(cloudinaryLoader({ src, width: 750 })).toBe(src);
  });
});
