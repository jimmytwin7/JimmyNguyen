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
    <div className="space-y-6">
      <div
        role="radiogroup"
        aria-label="Choose how to view my travels"
        className="inline-flex rounded-full border border-line bg-surface p-1"
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
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                active ? "text-white" : "text-muted hover:text-app"
              }`}
              style={active ? { backgroundColor: "var(--accent)" } : undefined}
            >
              {label}
            </button>
          );
        })}
      </div>

      {view === "map" ? (
        <TravelMapClient locations={locations} />
      ) : (
        <TravelTimeline locations={locations} />
      )}
    </div>
  );
}
