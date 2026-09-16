import type { TravelLocation, TravelPhoto } from "./types";
import { travelLocations } from "./locations";
import manifest from "./photos.manifest.json";

interface PhotoManifest {
  /** ISO timestamp of the last `npm run refresh:photos`, or null if never run. */
  generatedAt: string | null;
  photosByLocation: Record<string, TravelPhoto[]>;
}

/**
 * Merges hand-authored location metadata with the generated photo manifest.
 *
 * Reads the committed `photos.manifest.json` rather than calling Cloudinary, so
 * builds are instant, need no credentials, and can't hit the Admin API rate
 * limit. Regenerate the manifest with `npm run refresh:photos` after changing
 * photos.
 *
 * Locations with no manifest entry come back with an empty `photos` array,
 * which renders the "photos coming soon" state.
 */
export function loadTravelLocations(): TravelLocation[] {
  const { photosByLocation } = manifest as PhotoManifest;

  return travelLocations.map((meta) => ({
    ...meta,
    photos: photosByLocation[meta.id] ?? [],
  }));
}
