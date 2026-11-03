import { describe, expect, it } from "vitest";
import { holdRect, lerpRect, scrollTargetFor, squareAt } from "../handoff";

describe("lerpRect and squareAt", () => {
  it("interpolates every edge", () => {
    const a = { left: 0, top: 0, width: 10, height: 10 };
    const b = { left: 100, top: 50, width: 30, height: 20 };
    expect(lerpRect(a, b, 0.5)).toEqual({
      left: 50,
      top: 25,
      width: 20,
      height: 15,
    });
  });

  it("centres a square on a point", () => {
    expect(squareAt(100, 50, 24)).toEqual({
      left: 88,
      top: 38,
      width: 24,
      height: 24,
    });
  });
});

describe("holdRect", () => {
  const viewport = { viewportWidth: 1280, viewportHeight: 800 };

  it("centres over the map at 60% of its width, in the tile's aspect", () => {
    const map = { left: 40, top: 100, width: 800, height: 400 };
    const r = holdRect({ map, aspect: 2, ...viewport });
    expect(r.width).toBeCloseTo(480);
    expect(r.height).toBeCloseTo(240);
    expect(r.left + r.width / 2).toBeCloseTo(440);
    expect(r.top + r.height / 2).toBeCloseTo(300);
  });

  it("centres on the visible part of a partly scrolled map", () => {
    const map = { left: 0, top: -100, width: 800, height: 400 };
    const r = holdRect({ map, aspect: 2, ...viewport });
    // Visible from 0 to 300, so the middle is 150.
    expect(r.top + r.height / 2).toBeCloseTo(150);
  });

  it("falls back to the viewport centre when the map is out of view", () => {
    const map = { left: 0, top: -900, width: 800, height: 400 };
    const r = holdRect({ map, aspect: 2, ...viewport });
    expect(r.left + r.width / 2).toBeCloseTo(640);
    expect(r.top + r.height / 2).toBeCloseTo(400);
  });

  it("keeps a tall frame within the screen height", () => {
    const map = { left: 0, top: 0, width: 1200, height: 600 };
    const r = holdRect({ map, aspect: 0.5, ...viewport });
    expect(r.height).toBeCloseTo(640);
    expect(r.width / r.height).toBeCloseTo(0.5);
  });
});

describe("scrollTargetFor", () => {
  const base = {
    viewportHeight: 800,
    maxScroll: 5000,
    topGap: 88,
    bottomGap: 24,
  };

  it("brings the panel just under the header", () => {
    expect(scrollTargetFor({ panelTop: 1000, ...base })).toBe(912);
  });

  it("scrolls further when the first photo would be below the fold", () => {
    // Panel at 1000; photo 1500–1700. Showing the photo needs 1700 + 24 − 800.
    expect(
      scrollTargetFor({
        panelTop: 1000,
        tileTop: 1500,
        tileBottom: 1700,
        ...base,
      }),
    ).toBe(924);
  });

  it("never pushes a very tall photo's top under the header", () => {
    expect(
      scrollTargetFor({
        panelTop: 1000,
        tileTop: 1500,
        tileBottom: 2600,
        ...base,
      }),
    ).toBe(1500 - 88);
  });

  it("stays within the page's scroll range", () => {
    expect(scrollTargetFor({ panelTop: 9000, ...base })).toBe(5000);
    expect(scrollTargetFor({ panelTop: 20, ...base })).toBe(0);
  });
});
