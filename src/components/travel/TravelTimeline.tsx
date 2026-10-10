"use client";

import { useState } from "react";
import Image from "next/image";
import type { TravelLocation } from "@/lib/travel/types";
import { formatTravelDate, sortByDateDesc } from "@/lib/travel/dates";
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
 * One timeline row against the left rail. Observes itself and fades/slides in
 * the first time it scrolls into view (see useInView — a no-op under
 * reduced-motion).
 *
 * Photos render as a horizontal filmstrip rather than a grid: a single
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
        "relative transition-all duration-500 ease-out motion-reduce:transition-none",
        // Stays blurred (but clearly visible, so it signals "more below") until
        // it scrolls into view, then sharpens. Doesn't re-blur on scroll-up —
        // re-blurring already-read content is annoying.
        inView
          ? "opacity-100 blur-0"
          : "opacity-60 blur-[6px] motion-reduce:opacity-100 motion-reduce:blur-0",
      ].join(" ")}
    >
      {/* Node on the left rail (matches the resume rail). */}
      <span
        aria-hidden="true"
        className="absolute top-1.5 left-[calc(-1.5rem-7px+0.5px)] h-3 w-3 rounded-full ring-4"
        style={
          {
            backgroundColor: "var(--accent)",
            "--tw-ring-color": "var(--surface-muted)",
          } as React.CSSProperties
        }
      />

      <article>
        <time className="text-xs font-medium uppercase tracking-wide text-faint">
          {formatTravelDate(location.date)}
        </time>
        <h3 className="mt-1 text-lg font-bold tracking-tight text-app">
          {location.name}
        </h3>
        <p className="text-sm text-muted">
          {location.region} · {location.country}
        </p>
        <p className="mt-3 leading-relaxed text-app">{location.blurb}</p>

        {hasPhotos && (
          <div
            // Horizontal filmstrip: fixed-height row, scrolls sideways, with the
            // next photo peeking to hint there's more. snap for a tidy stop.
            className="mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2"
          >
            {location.photos.map((photo, i) => (
              <button
                key={photo.id}
                type="button"
                onClick={() => onOpenPhoto(location.id, i)}
                aria-label={`View ${location.name} photo ${i + 1} of ${location.photos.length} full screen`}
                className="group relative aspect-[4/3] h-32 shrink-0 snap-start overflow-hidden rounded-lg bg-surface-raised focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:h-40"
                style={{ cursor: "zoom-in" }}
              >
                <Image
                  src={photo.thumbUrl}
                  alt={`${location.name} — ${photo.label}`}
                  fill
                  sizes="(min-width: 640px) 213px, 171px"
                  unoptimized
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
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
 * alternative to the map. Shares the same data and lightbox. Single-column
 * left-rail timeline; entries reveal on scroll.
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
      <ol className="relative ml-2 space-y-10 border-l border-line pl-6">
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
