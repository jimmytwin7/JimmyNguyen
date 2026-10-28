#!/usr/bin/env node
/**
 * Uploads the Pantry Quest ingredient icons to Cloudinary.
 *
 * The licensed pixel-art pack is kept out of the repo (git-ignored). The icons
 * live only on Cloudinary; the app references them by delivery URL from
 * src/lib/cooking/ingredient-assets.ts. Run this once after placing the PNGs in
 * public/images/ingredients/ locally (and again if you change/add icons):
 *
 *   npm run upload:ingredients
 *
 * Requires in .env.local:
 *   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
 *
 * Uploads as PNG with no format/quality transforms so 16x16 pixel art is never
 * re-encoded or blurred. The two fallback boxes (no-art.svg, unknown.svg) are
 * original work committed to the repo and are NOT uploaded.
 */

import { readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

dotenv.config({ path: path.join(ROOT, ".env.local") });
dotenv.config({ path: path.join(ROOT, ".env") });

const SRC_DIR = path.join(ROOT, "public", "images", "ingredients");
const FOLDER = "pantry-quest/ingredients";

const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

function fail(msg) {
  console.error(`[upload-ingredients] ${msg}`);
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

async function main() {
  let entries;
  try {
    entries = await readdir(SRC_DIR);
  } catch {
    fail(`Can't read ${path.relative(ROOT, SRC_DIR)}`);
  }

  const pngs = entries.filter((f) => f.toLowerCase().endsWith(".png"));
  if (pngs.length === 0) {
    fail(
      `No PNG icons in ${path.relative(ROOT, SRC_DIR)}. ` +
        "Place the licensed pack's icons there first.",
    );
  }

  let ok = 0;
  let failed = 0;
  for (const file of pngs.sort()) {
    const publicId = file.replace(/\.png$/i, "");
    try {
      await cloudinary.uploader.upload(path.join(SRC_DIR, file), {
        folder: FOLDER,
        public_id: publicId,
        resource_type: "image",
        overwrite: true,
        // Store the PNG as-is; no eager transforms, no format change.
        format: "png",
      });
      ok++;
      console.log(`  ✓ ${FOLDER}/${publicId}`);
    } catch (err) {
      failed++;
      const msg = err?.error?.message ?? err?.message ?? String(err);
      console.error(`  ✗ ${file} — ${msg}`);
    }
  }

  console.log(
    `\n[upload-ingredients] uploaded ${ok} icon(s)` +
      (failed ? `, ${failed} failed` : "") +
      ` → ${FOLDER}/`,
  );
  if (failed) process.exit(1);
}

main().catch((err) => {
  console.error("[upload-ingredients] failed:", err?.message ?? err);
  process.exit(1);
});
