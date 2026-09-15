/**
 * Authored metadata for a travel destination. Photos are NOT listed here —
 * they're fetched from Cloudinary at build time (see cloudinaryPhotos.ts).
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
 * A location with its photos resolved. This is what the page and components
 * consume. `photos` is populated at load time from Cloudinary; an empty array
 * renders a "photos coming soon" state.
 */
export interface TravelLocation extends TravelLocationMeta {
  photos: TravelPhoto[];
}
