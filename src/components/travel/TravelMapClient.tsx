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

      {/* Quick-jump list — also the keyboard-friendly path to every location */}
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
                    : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                }`}
                style={
                  isSelected
                    ? { backgroundColor: "var(--color-brand-700)" }
                    : undefined
                }
              >
                {location.name}
              </button>
            </li>
          );
        })}
      </ul>

      <LocationPanel location={selected} onClear={() => setSelectedId(null)} />
    </div>
  );
}
