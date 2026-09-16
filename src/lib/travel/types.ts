/**
 * Hand-authored metadata for a travel destination (see `locations.ts`).
 *
 * Photos are deliberately not listed here — they come from the generated
 * `photos.manifest.json` and are merged in by `loader.ts`.
 */
export interface TravelLocationMeta {
  /**
   * Slug identifying this location. Also the Cloudinary folder segment:
   * photos live at `travel/<id>/<filename>`.
   */
  id: string;
  /** Display name, e.g. "Banff" */
  name: string;
  /** Region / state / province */
  region: string;
  country: string;
  /** [longitude, latitude] — note the order, this is what d3-geo expects */
  coordinates: [number, number];
  /** Map zoom level applied when this location is selected */
  zoom: number;
  /** Short blurb shown in the detail panel */
  blurb: string;
}

/** A single resolved photo, ready to render. */
export interface TravelPhoto {
  /** Cloudinary public ID — stable identity, good for React keys. */
  id: string;
  /** Human-ish label (filename / display name), used for alt text + ordering. */
  label: string;
  /** Lightbox viewing URL (screen-sized, ~1600px). */
  url: string;
  /** Downscaled variant for the gallery grid. */
  thumbUrl: string;
  /** Tiny, heavily-blurred placeholder shown while the full image decodes. */
  blurUrl: string;
  /** Optional caption from Cloudinary metadata (the asset's Description). */
  caption?: string;
}

/**
 * A location with its photos resolved — what the page and components consume.
 * An empty `photos` array renders the "photos coming soon" state.
 */
export interface TravelLocation extends TravelLocationMeta {
  photos: TravelPhoto[];
}
