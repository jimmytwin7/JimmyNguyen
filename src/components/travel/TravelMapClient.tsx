"use client";

import { useRef, useState } from "react";
import { AnimatePresence, useReducedMotion } from "framer-motion";
import WorldMap from "./WorldMap";
import LocationPanel from "./LocationPanel";
import PhotoHandoff, { panelScrollTarget } from "./PhotoHandoff";
import type { TravelLocation } from "@/lib/travel/types";

/** One photo hand-off: mounted on selection, started when the map lands. */
interface Handoff {
  /** Increments per selection, so each one is a fresh component. */
  seq: number;
  locationId: string;
  started: boolean;
}

interface TravelMapClientProps {
  locations: TravelLocation[];
}

/** "03" — two-digit index numbers for the Swiss-style location index. */
const pad = (n: number) => String(n).padStart(2, "0");

export default function TravelMapClient({ locations }: TravelMapClientProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [handoff, setHandoff] = useState<Handoff | null>(null);
  const seqRef = useRef(0);
  const mapRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  const selectedIndex = locations.findIndex((l) => l.id === selectedId);
  const selected = selectedIndex >= 0 ? locations[selectedIndex] : null;
  const handoffLocation = handoff
    ? locations.find((l) => l.id === handoff.locationId)
    : undefined;

  // Pins, the location index, and "Reset map" all come through here, so they
  // behave identically. A new place mounts a fresh hand-off right away (its
  // photo starts loading during the flight) and replaces any running one.
  const select = (id: string | null) => {
    if (id === selectedId) return;
    setSelectedId(id);
    if (id === null || reduceMotion) {
      setHandoff(null);
      return;
    }
    seqRef.current += 1;
    setHandoff({ seq: seqRef.current, locationId: id, started: false });
  };

  // The camera has landed on the place: start the hand-off. Under reduced
  // motion there's none; jump straight to the photo panel instead.
  const handleArrival = (location: TravelLocation) => {
    if (reduceMotion) {
      const panel = panelRef.current;
      if (panel) {
        window.scrollTo({ top: panelScrollTarget(panel), behavior: "instant" });
      }
      return;
    }
    setHandoff((h) =>
      h && h.locationId === location.id ? { ...h, started: true } : h,
    );
  };

  return (
    <div className="grid grid-cols-12 gap-x-6 gap-y-10">
      {/* Map: 8 of 12 columns on desktop, full width below. */}
      <div ref={mapRef} className="col-span-12 lg:col-span-8">
        <WorldMap
          locations={locations}
          selected={selected}
          onSelect={(location) => select(location.id)}
          onFlightComplete={handleArrival}
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
                  onClick={() => select(location.id)}
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
      <div ref={panelRef} aria-live="polite" className="col-span-12">
        <LocationPanel
          location={selected}
          number={selected ? selectedIndex + 1 : undefined}
          onClear={() => select(null)}
        />
      </div>

      {/* Decorative photo that carries the eye from the pin to the panel. It's
          position: fixed, so it takes no grid cell. Replaced or removed with a
          short fade when the selection changes. */}
      <AnimatePresence>
        {handoff && handoffLocation && (
          <PhotoHandoff
            key={handoff.seq}
            location={handoffLocation}
            started={handoff.started}
            mapRef={mapRef}
            panelRef={panelRef}
            onDone={() =>
              setHandoff((h) => (h?.seq === handoff.seq ? null : h))
            }
          />
        )}
      </AnimatePresence>
    </div>
  );
}
