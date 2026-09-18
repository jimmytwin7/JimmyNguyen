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

/**
 * Tracks whether the dark theme is active by watching the `.dark` class on
 * <html>, so the SVG map (whose fills are JS values, not CSS) recolors live
 * when the user flips the theme toggle. Starts false so SSR and the first
 * client render match; the observer syncs it right after mount.
 */
function useIsDark(): boolean {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const sync = () => setIsDark(root.classList.contains("dark"));
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return isDark;
}

interface MapPalette {
  ocean: string;
  land: string;
  landHover: string;
  landStroke: string;
  visited: string;
  visitedHover: string;
  visitedStroke: string;
  stateLine: string;
  graticule: string;
  cityDot: string;
}

// Light: classic atlas — blue ocean + warm tan land, sage-green visited fills.
const LIGHT_PALETTE: MapPalette = {
  ocean: "#a9d3e8",
  land: "#e2cfa4",
  landHover: "#d8c092",
  landStroke: "#b89b6a",
  visited: "#6b9e5e",
  visitedHover: "#7fb271",
  visitedStroke: "#4f7a45",
  stateLine: "#4f7a45",
  graticule: "#8bbdd6",
  cityDot: "#6b5842",
};

// Dark: deep-slate night map — muted land against a deep-blue ocean, with a
// lightened sage so visited countries still read against the dark fills. The
// red travel pins are unchanged and pop nicely on this palette.
const DARK_PALETTE: MapPalette = {
  ocean: "#0b1f33",
  land: "#33415580", // slate-700 @ 50% so land sits just above the ocean
  landHover: "#3f4f68",
  landStroke: "#475569",
  visited: "#3f7d4e",
  visitedHover: "#4c9760",
  visitedStroke: "#6ee7a8",
  stateLine: "#6ee7a8",
  graticule: "#1e3a52",
  cityDot: "#94a3b8",
};

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
  const palette = useIsDark() ? DARK_PALETTE : LIGHT_PALETTE;

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
        className="overflow-hidden rounded-2xl border border-edge shadow-sm"
        style={{ backgroundColor: palette.ocean, aspectRatio: "900 / 450" }}
        aria-hidden="true"
      />
    );
  }

  return (
    /*
     * The map is hidden from assistive tech on purpose.
     *
     * react-simple-maps renders every country and US state as an SVG <path>,
     * and screen readers announce each one as "graphic symbol" — hundreds of
     * meaningless stops. There's no way to label them usefully, so the whole
     * visualisation is treated as presentational and the "Jump to a location"
     * button list in TravelMapClient is the accessible equivalent: it exposes
     * every location as a real button with the same behaviour.
     *
     * Because this subtree is aria-hidden, nothing inside it may be focusable
     * (a focusable aria-hidden element is an ARIA violation), so the pins are
     * mouse/touch only — see the Marker tabIndex={-1} below.
     */
    <div
      aria-hidden="true"
      className="overflow-hidden rounded-2xl border border-edge shadow-sm"
    >
      <ComposableMap
        projection="geoEqualEarth"
        width={900}
        height={450}
        className="w-full h-auto"
        style={{ backgroundColor: palette.ocean }}
        // aria-hidden on the wrapping <div> alone does not reliably suppress
        // SVG internals in Safari/VoiceOver, so it's repeated here on the <svg>
        // itself and on each shape below.
        aria-hidden="true"
        role="presentation"
        focusable="false"
      >
        <ZoomableGroup
          center={view.coordinates}
          zoom={view.zoom}
          minZoom={1}
          maxZoom={12}
        >
          <Sphere
            id="ocean-sphere"
            fill={palette.ocean}
            stroke={palette.graticule}
            strokeWidth={0.5}
            aria-hidden="true"
            focusable="false"
          />
          <Graticule
            stroke={palette.graticule}
            strokeWidth={0.5}
            aria-hidden="true"
            focusable="false"
          />

          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const id = String(geo.id);
                const visited = visitedCountryIds.has(id);
                const isHovered = hoveredId === id;
                const fill = visited
                  ? isHovered
                    ? palette.visitedHover
                    : palette.visited
                  : isHovered
                    ? palette.landHover
                    : palette.land;
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onMouseEnter={() => setHoveredId(id)}
                    onMouseLeave={() => setHoveredId(null)}
                    fill={fill}
                    stroke={
                      visited ? palette.visitedStroke : palette.landStroke
                    }
                    strokeWidth={visited ? 0.7 : 0.4}
                    // Decorative: VoiceOver otherwise announces every country
                    // path as "graphic symbol".
                    aria-hidden="true"
                    focusable="false"
                    tabIndex={-1}
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
                  stroke={palette.stateLine}
                  strokeWidth={0.3}
                  aria-hidden="true"
                  focusable="false"
                  tabIndex={-1}
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
                  aria-hidden="true"
                  focusable="false"
                  tabIndex={-1}
                  style={{ pointerEvents: "none" }}
                >
                  <g transform={`scale(${s})`} pointerEvents="none">
                    <circle r={1.6} fill={palette.cityDot} opacity={0.55} />
                    <text
                      x={3}
                      y={2.5}
                      fontSize={7}
                      fill={palette.cityDot}
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
                // Not focusable or exposed: the map is presentational and the
                // button list is the keyboard/screen-reader equivalent.
                aria-hidden="true"
                focusable="false"
                tabIndex={-1}
                className="cursor-pointer"
                // outline:none because tabIndex={-1} still lets a click focus
                // the node — selection is conveyed by the pin scaling up
                // instead of a focus ring.
                style={{ cursor: "pointer", outline: "none" }}
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
                    {/* Google-style teardrop pin, drawn as SVG so it renders
                        identically on every browser (unlike the 📍 emoji).
                        The path's tip is at (0,0), so it plants on the point.
                        Scaled up a touch when selected. */}
                    {/* Selection is shown by scaling the pin up — the only cue
                        now that there's no focus ring. Hover gets a smaller
                        bump so the map still feels responsive. */}
                    <g
                      transform={`scale(${
                        isSelected ? 2 : hoveredPinId === location.id ? 1.5 : 1
                      })`}
                      style={{ transition: "transform 0.2s ease" }}
                    >
                      {/* soft shadow under the tip */}
                      <ellipse
                        cx={0}
                        cy={0}
                        rx={2.2}
                        ry={0.8}
                        fill="#000"
                        opacity={0.2}
                      />
                      {/* teardrop body: rounded top tapering to a point at (0,0) */}
                      <path
                        d="M0 0 C -4.2 -6, -6 -8.6, -6 -12 A 6 6 0 1 1 6 -12 C 6 -8.6, 4.2 -6, 0 0 Z"
                        fill={isSelected ? "#b91c1c" : "#ef4444"}
                        stroke="#ffffff"
                        strokeWidth={1.2}
                      />
                      {/* inner hole */}
                      <circle cx={0} cy={-12} r={2.2} fill="#ffffff" />
                    </g>

                    {hoveredPinId === location.id &&
                      (() => {
                        const label = location.name;
                        const w = label.length * 6.5 + 14;
                        return (
                          <g transform="translate(0, -20)" pointerEvents="none">
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
