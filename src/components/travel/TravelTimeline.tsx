"use client";

import { useState } from "react";
import Image from "next/image";
import type { TravelLocation } from "@/lib/travel/types";
import { formatTravelDate, sortByDateDesc } from "@/lib/travel/dates";
import { cloudinaryLoader } from "@/lib/travel/cloudinary-loader";
import { useInView } from "@/lib/hooks/useInView";
import Lightbox from "./Lightbox";

interface TravelTimelineProps {
  locations: TravelLocation[];
}

interface TimelineEntryProps {
  location: TravelLocation;
  onOpenPhoto: (locationId: string, index: number) => void;
}

/**
 * One journal entry on the 12-column grid: date and place in a narrow left
 * column, title, text and photographs in the wide right column. Observes
 * itself and sharpens the first time it scrolls into view (see useInView — a
 * no-op under reduced-motion).
 *
 * Photos render as a tall horizontal filmstrip rather than a grid: a single
 * sideways-scrolling row so a 12-photo stop reads as "a set" and doesn't
 * balloon the entry's height past a 2-photo one. Full size is one click away in
 * the lightbox.
 */
function TimelineEntry({ location, onOpenPhoto }: TimelineEntryProps) {
  // Fire once the entry is ~a fifth of the way up the viewport so the reveal is
  // visible without waiting too long.
  const { ref, inView } = useInView<HTMLLIElement>("0px 0px -20% 0px");
  const hasPhotos = location.photos.length > 0;

  return (
    <li
      ref={ref}
      className={[
        "grid grid-cols-12 gap-x-6 gap-y-4 border-t border-line pt-5 transition-all duration-500 ease-out motion-reduce:transition-none",
        // Stays blurred (but clearly visible, so it signals "more below") until
        // it scrolls into view, then sharpens. Doesn't re-blur on scroll-up —
        // re-blurring already-read content is annoying.
        inView
          ? "opacity-100 blur-0"
          : "opacity-60 blur-[6px] motion-reduce:opacity-100 motion-reduce:blur-0",
      ].join(" ")}
    >
      <div className="col-span-12 text-xs lg:col-span-3">
        <time className="block font-mono font-medium uppercase tracking-[0.14em] text-accent">
          {formatTravelDate(location.date)}
        </time>
        <p className="mt-1 text-muted">
          {location.region}, {location.country}
        </p>
      </div>

      <article className="col-span-12 min-w-0 lg:col-span-9">
        <h3 className="text-[clamp(1.75rem,4vw,3rem)] font-semibold leading-[0.95] tracking-[-0.03em] text-app">
          {location.name}
        </h3>
        <p className="mt-4 max-w-[56ch] leading-snug text-app">
          {location.blurb}
        </p>

        {hasPhotos && (
          <div
            // Horizontal filmstrip: fixed-height row, scrolls sideways, with the
            // next photo peeking to hint there's more. snap for a tidy stop.
            className="mt-6 flex snap-x snap-mandatory gap-2 overflow-x-auto pb-3 sm:gap-3"
          >
            {location.photos.map((photo, i) => (
              <button
                key={photo.id}
                type="button"
                onClick={() => onOpenPhoto(location.id, i)}
                aria-label={`View ${location.name} photo ${i + 1} of ${location.photos.length} full screen`}
                className="group relative aspect-[4/5] h-64 shrink-0 snap-start overflow-hidden bg-surface-raised bg-cover bg-center sm:h-80"
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
                  sizes="(min-width: 640px) 256px, 205px"
                  className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                />
              </button>
            ))}
          </div>
        )}
      </article>
    </li>
  );
}

/**
 * Chronological (newest-first) view of every location — a travelogue
 * alternative to the map. Shares the same data and lightbox. Entries reveal on
 * scroll.
 */
export default function TravelTimeline({ locations }: TravelTimelineProps) {
  // The lightbox works per location, so track which gallery is open + the index.
  const [open, setOpen] = useState<{ id: string; index: number } | null>(null);

  const ordered = sortByDateDesc(locations);
  const activeLocation = open
    ? (ordered.find((l) => l.id === open.id) ?? null)
    : null;

  return (
    <>
      <ol className="space-y-16 sm:space-y-20">
        {ordered.map((location) => (
          <TimelineEntry
            key={location.id}
            location={location}
            onOpenPhoto={(id, index) => setOpen({ id, index })}
          />
        ))}
      </ol>

      {/* One lightbox for the whole timeline, driven by whichever gallery is
          open. Rendered once rather than per-entry. */}
      <Lightbox
        photos={activeLocation?.photos ?? []}
        index={open?.index ?? null}
        onClose={() => setOpen(null)}
        onIndexChange={(i) =>
          setOpen((prev) => (prev ? { ...prev, index: i } : prev))
        }
        locationName={activeLocation?.name ?? ""}
      />
    </>
  );
}
