/**
 * Camera maths for the travel map's fly-to. Pure functions, so the motion can
 * be tested without rendering the map.
 *
 * A flight moves the centre in a straight line in longitude/latitude and the
 * zoom in log space (so zooming in and out feel equally paced), with a dip
 * mid-flight on long hops so the camera pulls out and settles back in.
 *
 * Longitude is deliberately not wrapped to the short way around. The map is a
 * flat, unrotated projection with edges, and d3 projects 190° at the far left
 * edge, so a camera crossing the antimeridian would jump from one side of the
 * map to the other. Panning across the map keeps the movement continuous.
 */

export interface CameraView {
  /** [longitude, latitude] */
  coordinates: [number, number];
  zoom: number;
}

export interface FlightPlan {
  /** Seconds. */
  duration: number;
  /** How far (in log zoom) the camera pulls out at the middle of the flight. */
  dip: number;
}

export const MIN_ZOOM = 1;
export const MIN_FLIGHT_SECONDS = 0.9;
export const MAX_FLIGHT_SECONDS = 1.6;

/** Degrees of longitude / latitude the map shows at zoom 1 (roughly). */
const WORLD_SPAN_LNG = 360;
const WORLD_SPAN_LAT = 180;
/** Mid-flight, a hop fills at most this share of the view. */
const FIT_SHARE = 0.7;
/** A hop this long (degrees) or a zoom change this large takes the full time. */
const FAR_HOP_DEGREES = 180;
const FAR_ZOOM_CHANGE = Math.log(12);

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n));

/** On-map distance of a hop in degrees, with longitude shrunk by latitude. */
export function hopDistance(from: CameraView, to: CameraView): number {
  const [lng0, lat0] = from.coordinates;
  const [lng1, lat1] = to.coordinates;
  const meanLat = (((lat0 + lat1) / 2) * Math.PI) / 180;
  return Math.hypot((lng1 - lng0) * Math.cos(meanLat), lat1 - lat0);
}

/** The zoom at which the whole hop fits comfortably on screen. */
function fitZoom(from: CameraView, to: CameraView): number {
  const [lng0, lat0] = from.coordinates;
  const [lng1, lat1] = to.coordinates;
  const meanLat = (((lat0 + lat1) / 2) * Math.PI) / 180;
  const dx = Math.abs(lng1 - lng0) * Math.cos(meanLat);
  const dy = Math.abs(lat1 - lat0);
  const zx = dx > 0 ? (WORLD_SPAN_LNG * FIT_SHARE) / dx : Infinity;
  const zy = dy > 0 ? (WORLD_SPAN_LAT * FIT_SHARE) / dy : Infinity;
  return Math.max(MIN_ZOOM, Math.min(zx, zy));
}

/**
 * The largest dip that keeps zoom at or above 1 for the whole flight, given the
 * endpoints' log zooms (both ≥ 0). Zoom stays ≥ 1 while
 * lerp(a, b, t) ≥ dip · sin(πt), so the dip is bounded by the smallest ratio of
 * the two. Sampled, plus the exact limits at an endpoint sitting at zoom 1.
 */
function maxDip(a: number, b: number): number {
  let bound = Infinity;
  if (a === 0) bound = Math.min(bound, b / Math.PI);
  if (b === 0) bound = Math.min(bound, a / Math.PI);
  for (let i = 1; i < 64; i++) {
    const t = i / 64;
    bound = Math.min(bound, lerp(a, b, t) / Math.sin(Math.PI * t));
  }
  return Math.max(0, bound);
}

export function planFlight(from: CameraView, to: CameraView): FlightPlan {
  const a = Math.log(Math.max(MIN_ZOOM, from.zoom));
  const b = Math.log(Math.max(MIN_ZOOM, to.zoom));
  const wanted = Math.max(0, (a + b) / 2 - Math.log(fitZoom(from, to)));
  const effort = Math.min(
    1,
    Math.max(
      hopDistance(from, to) / FAR_HOP_DEGREES,
      Math.abs(b - a) / FAR_ZOOM_CHANGE,
    ),
  );
  return {
    duration: lerp(MIN_FLIGHT_SECONDS, MAX_FLIGHT_SECONDS, effort),
    dip: Math.min(wanted, maxDip(a, b)),
  };
}

/** The camera at progress `t` (0–1, already eased) of a flight. */
export function viewAt(
  from: CameraView,
  to: CameraView,
  dip: number,
  t: number,
): CameraView {
  if (t <= 0) return from;
  if (t >= 1) return to;
  const a = Math.log(Math.max(MIN_ZOOM, from.zoom));
  const b = Math.log(Math.max(MIN_ZOOM, to.zoom));
  const logZoom = lerp(a, b, t) - dip * Math.sin(Math.PI * t);
  return {
    coordinates: [
      lerp(from.coordinates[0], to.coordinates[0], t),
      lerp(from.coordinates[1], to.coordinates[1], t),
    ],
    zoom: Math.max(MIN_ZOOM, Math.exp(logZoom)),
  };
}

/** 0 at or below `start`, 1 at or above `end`, linear between. */
export function fadeBetween(value: number, start: number, end: number) {
  return clamp((value - start) / (end - start), 0, 1);
}
