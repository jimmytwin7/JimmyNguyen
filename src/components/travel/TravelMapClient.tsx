"use client";

import { useState } from "react";
import WorldMap from "./WorldMap";
import LocationPanel from "./LocationPanel";
import type { TravelLocation } from "@/lib/travel/types";

interface TravelMapClientProps {
  locations: TravelLocation[];
}

/** "03" — two-digit index numbers for the Swiss-style location index. */
const pad = (n: number) => String(n).padStart(2, "0");

export default function TravelMapClient({ locations }: TravelMapClientProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedIndex = locations.findIndex((l) => l.id === selectedId);
  const selected = selectedIndex >= 0 ? locations[selectedIndex] : null;

  return (
    <div className="grid grid-cols-12 gap-x-6 gap-y-10">
      {/* Map: 8 of 12 columns on desktop, full width below. */}
      <div className="col-span-12 lg:col-span-8">
        <WorldMap
          locations={locations}
          selected={selected}
          onSelect={(location) => setSelectedId(location.id)}
        />
      </div>

      {/* Location index — the reliable keyboard/screen-reader path to every
          location, equivalent to clicking a pin. Labelled so it's discoverable
          rather than reading as a bare row of buttons. */}
      <nav
        aria-labelledby="quick-jump-heading"
        className="col-span-12 lg:col-span-4"
      >
        <h2
          id="quick-jump-heading"
          className="border-b border-[var(--accent-bold)] pb-2 font-mono text-xs font-medium uppercase tracking-[0.14em] text-muted"
        >
          Jump to a location
        </h2>
        <ul>
          {locations.map((location, i) => {
            const isSelected = location.id === selectedId;
            return (
              <li key={location.id} className="border-b border-line">
                <button
                  type="button"
                  onClick={() => setSelectedId(location.id)}
                  aria-pressed={isSelected}
                  className={`group grid w-full grid-cols-[2.25rem_1fr_auto] items-baseline gap-2 py-2 text-left text-sm transition-colors ${
                    isSelected ? "text-accent" : "text-app hover:text-accent"
                  }`}
                >
                  <span
                    className={`font-mono text-xs tabular-nums ${
                      isSelected ? "text-accent" : "text-faint"
                    }`}
                  >
                    {pad(i + 1)}
                  </span>
                  <span
                    className={isSelected ? "font-semibold" : "font-medium"}
                  >
                    {location.name}
                  </span>
                  <span className="text-xs text-faint">{location.country}</span>
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
      <div aria-live="polite" className="col-span-12">
        <LocationPanel
          location={selected}
          number={selected ? selectedIndex + 1 : undefined}
          onClear={() => setSelectedId(null)}
        />
      </div>
    </div>
  );
}
