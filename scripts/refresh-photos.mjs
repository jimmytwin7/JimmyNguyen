#!/usr/bin/env node
/**
 * Refreshes the travel photo manifest from Cloudinary.
 *
 * Lists each location's photos (by display folder `travel/<id>`) via the Admin
 * API and writes them to src/lib/travel/photos.manifest.json. The app reads
 * that committed file at build time instead of calling Cloudinary on every
 * build — so builds are instant and never hit the Admin API rate limit.
 *
 * Run this only when you add/change/remove photos:
 *   npm run refresh:photos
 *
 * Requires in .env.local:
 *   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
 */

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// Next.js keeps local secrets in .env.local (not .env), so load that first,
// then fall back to .env if present.
dotenv.config({ path: path.join(ROOT, ".env.local") });
dotenv.config({ path: path.join(ROOT, ".env") });
const LOCATIONS_FILE = path.join(ROOT, "src", "lib", "travel", "locations.ts");
const OUT_FILE = path.join(
  ROOT,
  "src",
  "lib",
  "travel",
  "photos.manifest.json",
);

const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

function fail(msg) {
  console.error(`[refresh-photos] ${msg}`);
  process.exit(1);
}

if (!cloudName || !apiKey || !apiSecret) {
  fail(
    "Missing credentials. Set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, " +
      "CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in .env.local.",
  );
}

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true,
});

function deliveryUrl(publicId, width) {
  const transforms = ["f_auto", "q_auto"];
  if (width) transforms.push(`w_${width}`, "c_limit");
  return `https://res.cloudinary.com/${cloudName}/image/upload/${transforms.join(",")}/${publicId}`;
}

function blurUrl(publicId) {
  return `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto:low,w_24,e_blur:400/${publicId}`;
}

function labelFor(r) {
  return (
    r.display_name ?? r.filename ?? r.public_id.split("/").pop() ?? r.public_id
  );
}

function captionFrom(r) {
  const ctx = r.context;
  if (!ctx) return undefined;
  const value =
    ctx.caption ?? ctx.custom?.caption ?? ctx.alt ?? ctx.custom?.alt;
  const trimmed = value?.trim?.();
  return trimmed ? trimmed : undefined;
}

/** Read the location ids straight from locations.ts (no TS compile needed). */
async function readLocationIds() {
  const src = await readFile(LOCATIONS_FILE, "utf8");
  // Grab id: "..." only within the travelLocations array region.
  const start = src.indexOf("travelLocations");
  const region = start === -1 ? src : src.slice(start);
  return [...region.matchAll(/id:\s*["'`]([^"'`]+)["'`]/g)].map((m) => m[1]);
}

async function listLocation(id) {
  const assetFolder = `travel/${id}`;
  const res = await cloudinary.api.resources_by_asset_folder(assetFolder, {
    max_results: 500,
    context: true,
  });
  const resources = res.resources ?? [];
  return resources
    .map((r) => ({
      id: r.public_id,
      label: labelFor(r),
      url: deliveryUrl(r.public_id, 1600),
      thumbUrl: deliveryUrl(r.public_id, 600),
      blurUrl: blurUrl(r.public_id),
      ...(captionFrom(r) ? { caption: captionFrom(r) } : {}),
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

async function main() {
  const ids = await readLocationIds();
  if (ids.length === 0) fail("No location ids found in locations.ts");

  /** @type {Record<string, unknown[]>} */
  const manifest = {};
  let total = 0;
  let failed = 0;

  for (const id of ids) {
    try {
      const photos = await listLocation(id);
      manifest[id] = photos;
      total += photos.length;
      console.log(`  ${id}: ${photos.length} photo(s)`);
    } catch (err) {
      failed++;
      const msg = err?.error?.message ?? err?.message ?? String(err);
      console.error(`  ${id}: ERROR — ${msg}`);
      // Keep any previous entry rather than blanking it on a transient error.
      manifest[id] = manifest[id] ?? [];
    }
  }

  if (failed === ids.length) {
    fail(
      "Every location failed (likely rate-limited or bad credentials). " +
        "Manifest not written.",
    );
  }

  const output = {
    generatedAt: new Date().toISOString(),
    photosByLocation: manifest,
  };
  await writeFile(OUT_FILE, JSON.stringify(output, null, 2) + "\n", "utf8");
  console.log(
    `\n[refresh-photos] wrote ${total} photo(s) across ${ids.length} location(s) → ${path.relative(ROOT, OUT_FILE)}`,
  );
}

main().catch((err) => {
  console.error("[refresh-photos] failed:", err?.message ?? err);
  process.exit(1);
});
