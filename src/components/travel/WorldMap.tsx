"use client";

import { useEffect, useState } from "react";
import { animate, motion } from "framer-motion";
import {
  ComposableMap,
  Geographies,
  Geography,
  Graticule,
  Marker,
  Sphere,
  ZoomableGroup,
} from "react-simple-maps";
import type { TravelLocation } from "@/lib/travel/types";
import { visitedCountryIds } from "@/lib/travel/locations";

const GEO_URL = "/geo/countries-110m.json";

/** Zoomed-out default view */
const DEFAULT_CENTER: [number, number] = [0, 20];
const DEFAULT_ZOOM = 1;

// Vibrant palette
const OCEAN = "#dbeafe"; // sky-blue water
const LAND = "#bbf7d0"; // green land
const LAND_HOVER = "#86efac";
const LAND_STROKE = "#4ade80";
const VISITED = "#f59e0b"; // amber for places I've been
const VISITED_HOVER = "#fbbf24";
const VISITED_STROKE = "#d97706";
const GRATICULE = "#93c5fd";

interface WorldMapProps {
  locations: TravelLocation[];
  selected: TravelLocation | null;
  onSelect: (location: TravelLocation) => void;
}

interface View {
  coordinates: [number, number];
  zoom: number;
}

export default function WorldMap({
  locations,
  selected,
  onSelect,
}: WorldMapProps) {
  // Animated view state that eases toward the target on selection change.
  const [view, setView] = useState<View>({
    coordinates: DEFAULT_CENTER,
    zoom: DEFAULT_ZOOM,
  });
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [hoveredPinId, setHoveredPinId] = useState<string | null>(null);
  // Gate the pin drop-in until after mount so SSR and first client render
  // agree (avoids a hydration mismatch from framer-motion's initial styles).
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const targetLng = selected ? selected.coordinates[0] : DEFAULT_CENTER[0];
  const targetLat = selected ? selected.coordinates[1] : DEFAULT_CENTER[1];
  const targetZoom = selected ? selected.zoom : DEFAULT_ZOOM;

  useEffect(() => {
    // Read the current view once; don't list it as a dep or every animation
    // frame would restart the effect. The deps are the fixed-size primitive
    // target values below.
    const fromLng = view.coordinates[0];
    const fromLat = view.coordinates[1];
    const fromZoom = view.zoom;

    // Drive a 0→1 progress value and interpolate center + zoom together so the
    // pan and zoom stay in sync for a smooth glide.
    const controls = animate(0, 1, {
      duration: 0.8,
      ease: [0.22, 1, 0.36, 1], // easeOutQuint-ish
      onUpdate: (t) => {
        setView({
          coordinates: [
            fromLng + (targetLng - fromLng) * t,
            fromLat + (targetLat - fromLat) * t,
          ],
          zoom: fromZoom + (targetZoom - fromZoom) * t,
        });
      },
    });
    return () => controls.stop();
    // Only re-run when the target changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetLng, targetLat, targetZoom]);

  // The SVG projection math can differ subtly between server and client, which
  // trips React's hydration check. Render a matching placeholder on the server
  // and first client render, then swap in the real map after mount.
  if (!mounted) {
    return (
      <div
        className="overflow-hidden rounded-2xl border border-gray-100 shadow-sm"
        style={{ backgroundColor: OCEAN, aspectRatio: "900 / 450" }}
        aria-hidden="true"
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 shadow-sm">
      <ComposableMap
        projection="geoEqualEarth"
        width={900}
        height={450}
        className="w-full h-auto"
        style={{ backgroundColor: OCEAN }}
      >
        <ZoomableGroup
          center={view.coordinates}
          zoom={view.zoom}
          minZoom={1}
          maxZoom={12}
        >
          {/* Ocean sphere + lat/long grid for an atlas feel */}
          <Sphere
            id="ocean-sphere"
            fill={OCEAN}
            stroke={GRATICULE}
            strokeWidth={0.5}
          />
          <Graticule stroke={GRATICULE} strokeWidth={0.5} />

          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const id = String(geo.id);
                const visited = visitedCountryIds.has(id);
                const isHovered = hoveredId === id;

                const fill = visited
                  ? isHovered
                    ? VISITED_HOVER
                    : VISITED
                  : isHovered
                    ? LAND_HOVER
                    : LAND;

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onMouseEnter={() => setHoveredId(id)}
                    onMouseLeave={() => setHoveredId(null)}
                    fill={fill}
                    stroke={visited ? VISITED_STROKE : LAND_STROKE}
                    strokeWidth={visited ? 0.7 : 0.4}
                    style={{
                      outline: "none",
                      transition: "fill 0.2s ease",
                    }}
                  />
                );
              })
            }
          </Geographies>

          {locations.map((location, index) => {
            const isSelected = selected?.id === location.id;
            // Counter-scale the marker so pins stay the same visual size as we zoom
            const scale = 1 / view.zoom;

            return (
              <Marker
                key={location.id}
                coordinates={location.coordinates}
                onClick={() => onSelect(location)}
                onMouseEnter={() => setHoveredPinId(location.id)}
                onMouseLeave={() => setHoveredPinId(null)}
                onFocus={() => setHoveredPinId(location.id)}
                onBlur={() => setHoveredPinId(null)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelect(location);
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label={`${location.name}, ${location.country}`}
                aria-pressed={isSelected}
                className="cursor-pointer focus:outline-none"
                style={{ cursor: "pointer" }}
              >
                {/* Drop-in: fall from above and fade in, staggered per pin.
                    The map only renders after mount, so this is client-only —
                    safe to animate from the offset start with no SSR mismatch. */}
                <motion.g
                  initial={{ opacity: 0, y: -18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 220,
                    damping: 20,
                    delay: index * 0.12,
                  }}
                >
                  <g transform={`scale(${scale})`}>
                    {/* Halo on the selected pin */}
                    {isSelected && (
                      <circle r={12} fill="#ef4444" opacity={0.25} />
                    )}
                    <circle
                      r={5.5}
                      fill={isSelected ? "#dc2626" : "#ef4444"}
                      stroke="#ffffff"
                      strokeWidth={2}
                    />

                    {/* Name tooltip on hover/focus. Rendered last so it sits on
                        top; width is estimated from the label length. */}
                    {hoveredPinId === location.id &&
                      (() => {
                        const label = location.name;
                        const w = label.length * 6.5 + 14;
                        return (
                          <g transform="translate(0, -12)" pointerEvents="none">
                            <rect
                              x={-w / 2}
                              y={-19}
                              width={w}
                              height={18}
                              rx={4}
                              fill="#0f172a"
                              opacity={0.92}
                            />
                            <polygon
                              points="-4,-1 4,-1 0,3"
                              fill="#0f172a"
                              opacity={0.92}
                            />
                            <text
                              y={-7}
                              textAnchor="middle"
                              fontSize={11}
                              fontWeight={600}
                              fill="#ffffff"
                            >
                              {label}
                            </text>
                          </g>
                        );
                      })()}
                  </g>
                </motion.g>
              </Marker>
            );
          })}
        </ZoomableGroup>
      </ComposableMap>
    </div>
  );
}
