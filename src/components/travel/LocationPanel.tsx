"use client";

import { useState } from "react";
import Image from "next/image";
import type { TravelLocation } from "@/lib/travel/types";
import { formatTravelDate } from "@/lib/travel/dates";
import { cloudinaryLoader } from "@/lib/travel/cloudinary-loader";
import { frameFor, type Frame } from "@/lib/travel/masonry";
import Lightbox from "./Lightbox";

interface LocationPanelProps {
  location: TravelLocation | null;
  /** 1-based position in the location index, shown as "No. 03". */
  number?: number;
  onClear: () => void;
}

const pad = (n: number) => String(n).padStart(2, "0");

// Literal class names (Tailwind can't see interpolated ones). Mobile is a
// 2-column grid where wide frames span the row; grid-flow-dense fills holes.
const SM_COLS: Record<Frame["cols"], string> = {
  2: "sm:col-span-2",
  3: "sm:col-span-3",
  4: "sm:col-span-4",
  6: "sm:col-span-6",
};
const frameClass = (f: Frame) =>
  [
    f.wide ? "col-span-2" : "col-span-1",
    SM_COLS[f.cols],
    f.rows === 2 ? "sm:row-span-2" : "",
  ].join(" ");

export default function LocationPanel({
  location,
  number,
  onClear,
}: LocationPanelProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Nothing selected yet — prompt the user
  if (!location) {
    return (
      <div className="border-t-2 border-[var(--accent-bold)] pt-5">
        <p className="text-sm text-muted">
          Pick a pin on the map, or a place from the index, to see where
          I&apos;ve been.
        </p>
      </div>
    );
  }

  const hasPhotos = location.photos.length > 0;

  return (
    <section aria-labelledby="location-heading">
      {/* Swiss header: metadata column on the left, title + text on the right. */}
      <div className="grid grid-cols-12 gap-x-6 gap-y-4 border-t-2 border-[var(--accent-bold)] pt-5">
        <dl className="col-span-12 grid grid-cols-3 gap-4 text-xs lg:col-span-3 lg:grid-cols-1 lg:content-start">
          {number !== undefined && (
            <div>
              <dt className="font-mono uppercase tracking-[0.14em] text-faint">
                No.
              </dt>
              <dd className="mt-0.5 font-mono font-medium tabular-nums text-accent">
                {pad(number)}
              </dd>
            </div>
          )}
          <div>
            <dt className="font-mono uppercase tracking-[0.14em] text-faint">
              Place
            </dt>
            <dd className="mt-0.5 text-app">
              {location.region}, {location.country}
            </dd>
          </div>
          <div>
            <dt className="font-mono uppercase tracking-[0.14em] text-faint">
              Visited
            </dt>
            <dd className="mt-0.5 text-app">
              {formatTravelDate(location.date)}
            </dd>
          </div>
        </dl>

        <div className="col-span-12 lg:col-span-9">
          <div className="flex items-start justify-between gap-6">
            <h2
              id="location-heading"
              className="text-[clamp(2.25rem,6vw,4.5rem)] font-semibold leading-[0.92] tracking-[-0.035em] text-app"
            >
              {location.name}
            </h2>
            <button
              type="button"
              onClick={onClear}
              className="mt-2 shrink-0 border border-line px-3 py-1.5 font-mono text-xs font-medium uppercase tracking-[0.14em] text-muted transition-colors hover:border-app hover:text-app"
            >
              Reset map
            </button>
          </div>
          <p className="mt-5 max-w-[56ch] text-lg leading-snug text-app">
            {location.blurb}
          </p>
        </div>
      </div>

      {hasPhotos ? (
        <ul className="mt-10 grid grid-flow-dense grid-cols-2 gap-2 auto-rows-[11rem] sm:grid-cols-6 sm:gap-3 sm:auto-rows-[12rem] lg:auto-rows-[15rem]">
          {location.photos.map((photo, i) => {
            const frame = frameFor(i, location.photos.length);
            return (
              <li key={photo.id} className={frameClass(frame)}>
                <button
                  type="button"
                  onClick={() => setLightboxIndex(i)}
                  aria-label={`View ${location.name} photo ${i + 1} full screen`}
                  className="group relative block h-full w-full overflow-hidden bg-surface-raised bg-cover bg-center"
                  // The tiny blurred Cloudinary variant shows until the photo
                  // decodes (a CSS background, so no data-URL conversion).
                  style={{
                    cursor: "zoom-in",
                    backgroundImage: `url(${photo.blurUrl})`,
                  }}
                >
                  <Image
                    src={photo.url}
                    loader={cloudinaryLoader}
                    alt={`${location.name} — ${photo.label}`}
                    fill
                    sizes={
                      frame.wide
                        ? "(min-width: 1024px) 60vw, 100vw"
                        : "(min-width: 640px) 30vw, 50vw"
                    }
                    className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                  />
                  {/* Hard-edged figure label, revealed on hover/focus. */}
                  <span className="pointer-events-none absolute bottom-0 left-0 max-w-full bg-[var(--accent-bold)] px-2 py-1 text-left text-[11px] leading-tight text-[var(--on-accent)] opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
                    <span className="font-mono tabular-nums">{pad(i + 1)}</span>
                    {photo.caption && (
                      <span className="ml-2">{photo.caption}</span>
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-10 border border-line p-8 text-sm text-muted">
          Photos from {location.name} coming soon.
        </p>
      )}

      <Lightbox
        photos={location.photos}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onIndexChange={setLightboxIndex}
        locationName={location.name}
      />
    </section>
  );
}
