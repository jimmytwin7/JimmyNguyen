import { describe, expect, it } from "vitest";
import fc from "fast-check";
import {
  fadeBetween,
  MAX_FLIGHT_SECONDS,
  MIN_FLIGHT_SECONDS,
  planFlight,
  viewAt,
  type CameraView,
} from "../camera";

const view = (lng: number, lat: number, zoom: number): CameraView => ({
  coordinates: [lng, lat],
  zoom,
});

const arbView = fc.record({
  coordinates: fc.tuple(
    fc.double({ min: -180, max: 180, noNaN: true }),
    fc.double({ min: -60, max: 75, noNaN: true }),
  ),
  zoom: fc.double({ min: 1, max: 12, noNaN: true }),
});
const arbT = fc.double({ min: 0, max: 1, noNaN: true });

describe("viewAt", () => {
  it("starts and ends exactly on the endpoints", () => {
    const from = view(-115.6, 51.2, 6);
    const to = view(139.7, 35.7, 7);
    const { dip } = planFlight(from, to);
    expect(viewAt(from, to, dip, 0)).toEqual(from);
    expect(viewAt(from, to, dip, 1)).toEqual(to);
  });

  it("pans across the map, never wrapping past the antimeridian", () => {
    // The map is flat with edges: 170° → -170° must cross the map, because
    // the "short way" would jump the camera from one edge to the other.
    fc.assert(
      fc.property(arbView, arbView, arbT, (from, to, t) => {
        const { dip } = planFlight(from, to);
        const [lng] = viewAt(from, to, dip, t).coordinates;
        const lo = Math.min(from.coordinates[0], to.coordinates[0]);
        const hi = Math.max(from.coordinates[0], to.coordinates[0]);
        return lng >= lo - 1e-9 && lng <= hi + 1e-9;
      }),
    );
  });

  it("never zooms out past the world view", () => {
    fc.assert(
      fc.property(arbView, arbView, arbT, (from, to, t) => {
        const { dip } = planFlight(from, to);
        return viewAt(from, to, dip, t).zoom >= 1;
      }),
    );
  });

  it("pulls out mid-flight on a long hop, then settles in", () => {
    const from = view(-115.6, 51.2, 6);
    const to = view(139.7, 35.7, 6);
    const { dip } = planFlight(from, to);
    expect(dip).toBeGreaterThan(0);
    expect(viewAt(from, to, dip, 0.5).zoom).toBeLessThan(3);
  });

  it("doesn't pull out on a short hop", () => {
    const from = view(-115.6, 51.2, 6);
    const to = view(-116.2, 51.4, 6);
    expect(planFlight(from, to).dip).toBe(0);
  });
});

describe("planFlight", () => {
  it("takes longer the further the camera travels, within bounds", () => {
    const from = view(0, 0, 1);
    const durations = [0, 10, 45, 90, 135, 180, 270].map(
      (lng) => planFlight(from, view(lng, 0, 1)).duration,
    );
    for (let i = 1; i < durations.length; i++) {
      expect(durations[i]).toBeGreaterThanOrEqual(durations[i - 1]);
    }
    expect(durations[0]).toBeCloseTo(MIN_FLIGHT_SECONDS);
    expect(durations[5]).toBeCloseTo(MAX_FLIGHT_SECONDS);
    expect(durations[6]).toBeCloseTo(MAX_FLIGHT_SECONDS);
  });

  it("gives a big zoom change in place more time than a nudge", () => {
    const here = view(-115.6, 51.2, 1);
    const nudge = planFlight(here, view(-115.6, 51.2, 1.2)).duration;
    const dive = planFlight(here, view(-115.6, 51.2, 10)).duration;
    expect(dive).toBeGreaterThan(nudge);
  });
});

describe("fadeBetween", () => {
  it("ramps linearly from 0 to 1 across the range", () => {
    expect(fadeBetween(3, 3.5, 4.5)).toBe(0);
    expect(fadeBetween(4, 3.5, 4.5)).toBeCloseTo(0.5);
    expect(fadeBetween(6, 3.5, 4.5)).toBe(1);
  });
});
