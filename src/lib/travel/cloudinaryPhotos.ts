import "server-only";
import { v2 as cloudinary } from "cloudinary";
import type { TravelPhoto } from "./types";

/**
 * Server-only Cloudinary photo listing (dynamic-folder mode).
 *
 * Lists assets by their display folder (`travel/<id>`) via the Admin API's
 * `resources_by_asset_folder`, so photos are found by folder membership rather
 * than by a naming convention baked into the public ID. This matches accounts
 * using dynamic folders, where an asset's public_id (e.g. "IMG_1066") is
 * decoupled from the folder it lives in.
 *
 * Runs at build time (the travel page is statically rendered). Requires the
 * server-side secrets CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET. If they're
 * missing, this returns empty results rather than throwing — the page still
 * builds; galleries render their "coming soon" state.
 *
 * The `server-only` import guarantees this module can't be bundled into client
 * code, so the API secret can't leak to the browser.
 */

const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

/** Placeholder values from .env.example that shouldn't trigger real API calls. */
const PLACEHOLDERS = new Set([
  "your-cloud-name",
  "your-api-key",
  "your-api-secret",
  "",
]);

function isRealValue(v: string | undefined): v is string {
  return Boolean(v) && !PLACEHOLDERS.has(v as string);
}

const isConfigured =
  isRealValue(cloudName) && isRealValue(apiKey) && isRealValue(apiSecret);

if (isConfigured) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
}

interface CloudinaryResource {
  public_id: string;
  format?: string;
  display_name?: string;
  filename?: string;
  // Context metadata. The Media Library "Description" field maps to
  // context.caption; alt text to context.alt. Shape can be either flat
  // ({ caption }) or nested under `custom` depending on API version.
  context?: {
    caption?: string;
    alt?: string;
    custom?: { caption?: string; alt?: string };
  };
}

/** Pull a caption out of the various shapes Cloudinary context can take. */
function captionFrom(r: CloudinaryResource): string | undefined {
  const ctx = r.context;
  if (!ctx) return undefined;
  const value =
    ctx.caption ?? ctx.custom?.caption ?? ctx.alt ?? ctx.custom?.alt;
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

/**
 * Build a delivery URL for a public ID with our standard optimizations.
 * f_auto (best format, incl. HEIC→WebP/AVIF), q_auto (quality), plus optional
 * width and c_limit to keep aspect ratio.
 */
function deliveryUrl(publicId: string, width?: number): string {
  const transforms = ["f_auto", "q_auto"];
  if (width) transforms.push(`w_${width}`, "c_limit");
  return `https://res.cloudinary.com/${cloudName}/image/upload/${transforms.join(",")}/${publicId}`;
}

/** A tiny (~24px), blurred, low-quality URL for the blur-up placeholder. */
function blurUrl(publicId: string): string {
  return `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto:low,w_24,e_blur:400/${publicId}`;
}

/** A label for alt text / sorting, from the asset's own name. */
function labelFor(r: CloudinaryResource): string {
  return (
    r.display_name ?? r.filename ?? r.public_id.split("/").pop() ?? r.public_id
  );
}

/**
 * List photos for a single location by its display folder `travel/<id>`.
 * Sorted by label so a `01-`, `02-` filename prefix controls order.
 */
export async function listLocationPhotos(
  locationId: string,
): Promise<TravelPhoto[]> {
  if (!isConfigured) return [];

  const assetFolder = `travel/${locationId}`;
  try {
    const res = await cloudinary.api.resources_by_asset_folder(assetFolder, {
      max_results: 500,
      context: true, // include context metadata (caption / description)
    });

    const resources: CloudinaryResource[] = res.resources ?? [];

    return resources
      .map((r) => ({
        id: r.public_id,
        label: labelFor(r),
        // Screen-sized viewing image (~1600px): sharp on most displays but far
        // fewer bytes than the original, so navigation and decode stay fast.
        url: deliveryUrl(r.public_id, 1600),
        thumbUrl: deliveryUrl(r.public_id, 600),
        blurUrl: blurUrl(r.public_id),
        caption: captionFrom(r),
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  } catch (err) {
    console.warn(
      `[cloudinaryPhotos] failed to list folder ${assetFolder}:`,
      err instanceof Error ? err.message : err,
    );
    return [];
  }
}

/**
 * List photos for many locations at once (in parallel). Returns a map of
 * locationId → TravelPhoto[].
 */
export async function listPhotosForLocations(
  locationIds: string[],
): Promise<Record<string, TravelPhoto[]>> {
  if (!isConfigured) {
    return Object.fromEntries(locationIds.map((id) => [id, []]));
  }

  const entries = await Promise.all(
    locationIds.map(async (id) => [id, await listLocationPhotos(id)] as const),
  );
  return Object.fromEntries(entries);
}
