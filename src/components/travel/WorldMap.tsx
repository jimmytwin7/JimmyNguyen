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
const US_STATES_URL = "/geo/states-10m.json";
const CITIES_URL = "/geo/cities-1m.json";

/** Show city name labels once zoomed in past this level (keeps the world view clean). */
const CITY_LABEL_ZOOM = 4;

interface City {
  name: string;
  pop: number;
  coordinates: [number, number];
}

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
const STATE_LINE = "#d97706"; // internal US state borders (on the amber US fill)
const GRATICULE = "#93c5fd";
const CITY_DOT = "#475569"; // slate-600, faint context dots for major cities

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
  const [view, setView] = useState<View>({
    coordinates: DEFAULT_CENTER,
    zoom: DEFAULT_ZOOM,
  });
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [hoveredPinId, setHoveredPinId] = useState<string | null>(null);
  const [cities, setCities] = useState<City[]>([]);
  // Gate the pin drop-in until after mount so SSR and first client render agree.
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Load the major-cities overlay (cities with population >= 1M).
  useEffect(() => {
    let cancelled = false;
    fetch(CITIES_URL)
      .then((r) => (r.ok ? r.json() : []))
      .then((data: City[]) => {
        if (!cancelled) setCities(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const targetLng = selected ? selected.coordinates[0] : DEFAULT_CENTER[0];
  const targetLat = selected ? selected.coordinates[1] : DEFAULT_CENTER[1];
  const targetZoom = selected ? selected.zoom : DEFAULT_ZOOM;

  useEffect(() => {
    const fromLng = view.coordinates[0];
    const fromLat = view.coordinates[1];
    const fromZoom = view.zoom;

    const controls = animate(0, 1, {
      duration: 0.8,
      ease: [0.22, 1, 0.36, 1],
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetLng, targetLat, targetZoom]);

  // The map's SVG projection can differ subtly between server and client, which
  // trips hydration. Render a matching placeholder until mounted.
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
                    style={{ outline: "none", transition: "fill 0.2s ease" }}
                  />
                );
              })
            }
          </Geographies>

          {/* US state borders — transparent fill, thin stroke, drawn on top of
              the country fills. Only visible when zoomed into the US. */}
          <Geographies geography={US_STATES_URL}>
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill="transparent"
                  stroke={STATE_LINE}
                  strokeWidth={0.3}
                  style={{
                    outline: "none",
                    pointerEvents: "none",
                  }}
                />
              ))
            }
          </Geographies>

          {/* Major cities (pop >= 1M): hidden at the world view, revealed (dot +
              label) once zoomed in, so they act as context rather than clutter.
              pointer-events off so they never intercept travel-pin clicks. */}
          {view.zoom >= CITY_LABEL_ZOOM &&
            cities.map((city) => {
              const s = 1 / view.zoom;
              return (
                <Marker
                  key={`city-${city.name}-${city.coordinates[0]}`}
                  coordinates={city.coordinates}
                  style={{ pointerEvents: "none" }}
                >
                  <g transform={`scale(${s})`} pointerEvents="none">
                    <circle r={1.6} fill={CITY_DOT} opacity={0.55} />
                    <text
                      x={3}
                      y={2.5}
                      fontSize={7}
                      fill={CITY_DOT}
                      opacity={0.8}
                    >
                      {city.name}
                    </text>
                  </g>
                </Marker>
              );
            })}

          {locations.map((location, index) => {
            const isSelected = selected?.id === location.id;
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
                    {isSelected && (
                      <circle r={12} fill="#ef4444" opacity={0.25} />
                    )}
                    <circle
                      r={5.5}
                      fill={isSelected ? "#dc2626" : "#ef4444"}
                      stroke="#ffffff"
                      strokeWidth={2}
                    />

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
