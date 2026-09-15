import type { TravelLocation } from "./types";
import { travelLocations } from "./locations";
import { listPhotosForLocations } from "./cloudinaryPhotos";

/**
 * Loads travel locations with their photos resolved from Cloudinary.
 *
 * Location metadata comes from `locations.ts`; the photos (with their delivery
 * URLs) are fetched from each location's Cloudinary folder at build time. If
 * Cloudinary isn't configured, every location comes back with empty `photos`.
 *
 * Async + server-only (it imports the Cloudinary listing module). The travel
 * page awaits this during static rendering.
 */
export async function loadTravelLocations(): Promise<TravelLocation[]> {
  const ids = travelLocations.map((l) => l.id);
  const photosById = await listPhotosForLocations(ids);

  return travelLocations.map((meta) => ({
    ...meta,
    photos: photosById[meta.id] ?? [],
  }));
}
