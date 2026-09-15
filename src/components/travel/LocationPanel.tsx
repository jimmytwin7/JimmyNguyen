"use client";

import { useState } from "react";
import Image from "next/image";
import type { TravelLocation } from "@/lib/travel/types";
import Lightbox from "./Lightbox";

interface LocationPanelProps {
  location: TravelLocation | null;
  onClear: () => void;
}

export default function LocationPanel({
  location,
  onClear,
}: LocationPanelProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Nothing selected yet — prompt the user
  if (!location) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 bg-white/60 p-8 text-center">
        <p className="text-gray-500">
          Pick a pin on the map to see where I&apos;ve been.
        </p>
      </div>
    );
  }

  const hasPhotos = location.photos.length > 0;

  return (
    <section
      aria-labelledby="location-heading"
      className="rounded-2xl border border-gray-100 bg-white p-6 sm:p-8 shadow-sm"
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h2
            id="location-heading"
            className="text-xl font-bold tracking-tight text-gray-900"
          >
            {location.name}
          </h2>
          <p className="text-sm text-gray-500">
            {location.region} · {location.country}
          </p>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="shrink-0 rounded-lg px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
        >
          Reset map
        </button>
      </div>

      <p className="text-gray-700 leading-relaxed mb-6">{location.blurb}</p>

      {hasPhotos ? (
        <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {location.photos.map((photo, i) => (
            <li key={photo.id}>
              <button
                type="button"
                onClick={() => setLightboxIndex(i)}
                aria-label={`View ${location.name} photo ${i + 1} full screen`}
                className="group relative block aspect-square w-full overflow-hidden rounded-lg bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{ cursor: "zoom-in" }}
              >
                <Image
                  src={photo.thumbUrl}
                  alt={`${location.name} — ${photo.label}`}
                  fill
                  sizes="(min-width: 640px) 33vw, 50vw"
                  unoptimized
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center">
          <p className="text-sm text-gray-500">
            Photos from {location.name} coming soon.
          </p>
        </div>
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
