"use client";

import { useState } from "react";
import WorldMap from "./WorldMap";
import LocationPanel from "./LocationPanel";
import type { TravelLocation } from "@/lib/travel/types";

interface TravelMapClientProps {
  locations: TravelLocation[];
}

export default function TravelMapClient({ locations }: TravelMapClientProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = locations.find((l) => l.id === selectedId) ?? null;

  return (
    <div className="space-y-6">
      <WorldMap
        locations={locations}
        selected={selected}
        onSelect={(location) => setSelectedId(location.id)}
      />

      {/* Quick-jump list — the reliable keyboard/screen-reader path to every
          location, equivalent to clicking a pin. Labelled so it's discoverable
          rather than reading as a bare row of buttons. */}
      <nav aria-labelledby="quick-jump-heading">
        <h2
          id="quick-jump-heading"
          className="text-sm font-semibold uppercase tracking-wide text-muted mb-2"
        >
          Jump to a location
        </h2>
        <ul className="flex flex-wrap gap-2">
          {locations.map((location) => {
            const isSelected = location.id === selectedId;
            return (
              <li key={location.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(location.id)}
                  aria-pressed={isSelected}
                  className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                    isSelected
                      ? "border-transparent text-white"
                      : "border-line bg-surface text-app hover:border-faint"
                  }`}
                  style={
                    isSelected
                      ? { backgroundColor: "var(--accent)" }
                      : undefined
                  }
                >
                  {location.name}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/*
       * Live region wrapper. The map itself is aria-hidden (see WorldMap), so
       * this panel is how a screen-reader user knows their selection landed.
       * The wrapper is always rendered — a live region added to the DOM at the
       * same moment as its content usually isn't announced.
       */}
      <div aria-live="polite">
        <LocationPanel
          location={selected}
          onClear={() => setSelectedId(null)}
        />
      </div>
    </div>
  );
}
