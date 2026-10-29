"use client";

import { useState } from "react";
import TravelMapClient from "./TravelMapClient";
import TravelTimeline from "./TravelTimeline";
import type { TravelLocation } from "@/lib/travel/types";

interface TravelViewsProps {
  locations: TravelLocation[];
}

type View = "map" | "timeline";

/**
 * Switches the travel page between the interactive map and the chronological
 * timeline. Both render the same locations; the toggle is a labelled segmented
 * control (radio-group semantics) so it's keyboard- and screen-reader-friendly.
 */
export default function TravelViews({ locations }: TravelViewsProps) {
  const [view, setView] = useState<View>("map");

  return (
    <div className="mt-14 sm:mt-20">
      <div className="mb-10 flex items-center justify-between gap-4 border-t border-line pt-4">
        <span className="font-mono text-xs uppercase tracking-[0.14em] text-muted">
          View
        </span>
        {/* Hard-edged segmented control: the active option inverts to ink. */}
        <div
          role="radiogroup"
          aria-label="Choose how to view my travels"
          className="inline-flex border border-[var(--accent-bold)]"
        >
          {(
            [
              ["map", "Map"],
              ["timeline", "Timeline"],
            ] as const
          ).map(([value, label]) => {
            const active = view === value;
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setView(value)}
                className={`px-4 py-2 font-mono text-xs font-medium uppercase tracking-[0.14em] transition-colors ${
                  active
                    ? "bg-[var(--accent-bold)] text-[var(--on-accent)]"
                    : "text-muted hover:text-app"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {view === "map" ? (
        <TravelMapClient locations={locations} />
      ) : (
        <TravelTimeline locations={locations} />
      )}
    </div>
  );
}
