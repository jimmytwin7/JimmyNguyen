"use client";

import { memo, useEffect, useRef, useState } from "react";
import { animate, motion, useReducedMotion } from "framer-motion";
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
import {
  fadeBetween,
  MIN_ZOOM,
  planFlight,
  viewAt,
  type CameraView,
} from "@/lib/travel/camera";

const GEO_URL = "/geo/countries-110m.json";
const US_STATES_URL = "/geo/states-10m.json";
const CITIES_URL = "/geo/cities-1m.json";

/** City dots and labels fade in between these zoom levels, so they don't pop
 *  in mid-flight (and the world view stays clean). */
const CITY_FADE_START = 3.5;
const CITY_FADE_END = 4.5;

const MAX_ZOOM = 12;

// Map pins are bare footprints (the page is "Footprints"): a right foot, heel
// down and toes up, centred on the place. Drawn small and scaled by
// FOOTPRINT_SCALE; tilted a little so it reads as a step, not a symbol.
const FOOTPRINT_SOLE =
  "M-1.8 7.8 C-3.9 7.8 -4.4 5.6 -4.1 3.4 C-3.8 1.4 -4.5 -0.6 -4.3 -2.6 " +
  "C-4.1 -5.2 -2.3 -6.4 0 -6.4 C2.4 -6.4 4.1 -5 3.9 -2.8 " +
  "C3.7 -0.6 2.3 1.2 1.9 3.4 C1.5 5.8 0.4 7.8 -1.8 7.8 Z";
/** Toes from big to little: [cx, cy, r]. */
const FOOTPRINT_TOES: [number, number, number][] = [
  [-2.5, -8.6, 1.6],
  [0.2, -9.3, 1],
  [1.9, -8.8, 0.9],
  [3.3, -7.8, 0.8],
  [4.3, -6.4, 0.7],
];
const FOOTPRINT_SCALE = 1.2;
const FOOTPRINT_TILT = -8;
/** The camera eases in and out of every flight. */
const FLIGHT_EASE = "easeInOut";

interface City {
  name: string;
  pop: number;
  coordinates: [number, number];
}

/** Zoomed-out default view */
const DEFAULT_CENTER: [number, number] = [0, 20];
const DEFAULT_ZOOM = 1;
const DEFAULT_VIEW: CameraView = {
  coordinates: DEFAULT_CENTER,
  zoom: DEFAULT_ZOOM,
};

const sameView = (a: CameraView, b: CameraView) =>
  a.zoom === b.zoom &&
  a.coordinates[0] === b.coordinates[0] &&
  a.coordinates[1] === b.coordinates[1];

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
  pin: string;
  pinSelected: string;
  tooltipBg: string;
  tooltipText: string;
}

// Light: a quiet paper map under the photographs. The ocean matches the beige
// page so countries sit directly on it; land is the lighter cream with
// hairline borders, visited countries a brand-blue tint, and pins brand blue
// (brand-700) to match the travel stage's accent (see .travel-stage in
// globals.css).
const LIGHT_PALETTE: MapPalette = {
  ocean: "#f4f3ef",
  land: "#fbfaf7",
  landHover: "#f0eee9",
  landStroke: "#d9d6cf",
  visited: "#b9d7ea",
  visitedHover: "#a5cbe3",
  visitedStroke: "#fbfaf7",
  stateLine: "#fbfaf7",
  graticule: "#e9e7e1",
  cityDot: "#333333",
  pin: "#0369a1",
  pinSelected: "#0c4a6e",
  tooltipBg: "#0369a1",
  tooltipText: "#ffffff",
};

// Dark: the same map as a night gallery. The ocean matches the warm charcoal
// page so countries sit directly on it; land is a lifted charcoal, visited
// countries a deep brand-blue tint, and pins the brighter dark-mode brand blue
// (brand-500).
const DARK_PALETTE: MapPalette = {
  ocean: "#15130f",
  land: "#24211c",
  landHover: "#2c2822",
  landStroke: "#15130f",
  visited: "#0c4a6e",
  visitedHover: "#0f5a85",
  visitedStroke: "#15130f",
  stateLine: "#15130f",
  graticule: "#1c1a16",
  cityDot: "#a8a196",
  pin: "#0ea5e9",
  pinSelected: "#7dd3fc",
  tooltipBg: "#0ea5e9",
  tooltipText: "#0a0a0a",
};

/*
 * The country and US-state layers are hundreds of SVG paths. They're memoized
 * on the palette alone (country hover lives inside the layer), so the camera's
 * per-frame updates during a flight only re-render the pins and cities, not the
 * whole world. ZoomableGroup moves them with a single transform on their parent
 * <g>, and react-simple-maps' map context is memoized, so nothing else forces a
 * re-render.
 */
const CountriesLayer = memo(function CountriesLayer({
  palette,
}: {
  palette: MapPalette;
}) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  return (
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
              stroke={visited ? palette.visitedStroke : palette.landStroke}
              strokeWidth={visited ? 0.7 : 0.4}
              // Decorative: VoiceOver otherwise announces every country path
              // as "graphic symbol".
              aria-hidden="true"
              focusable="false"
              tabIndex={-1}
              style={{ outline: "none", transition: "fill 0.2s ease" }}
            />
          );
        })
      }
    </Geographies>
  );
});

/** US state borders: transparent fill, thin stroke, drawn on top of the
 *  country fills. Only noticeable when zoomed into the US. */
const StatesLayer = memo(function StatesLayer({
  palette,
}: {
  palette: MapPalette;
}) {
  return (
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
            style={{ outline: "none", pointerEvents: "none" }}
          />
        ))
      }
    </Geographies>
  );
});

interface WorldMapProps {
  locations: TravelLocation[];
  selected: TravelLocation | null;
  onSelect: (location: TravelLocation) => void;
  /**
   * Fired once the camera settles on a newly selected place (immediately under
   * reduced motion). Not fired on reset. The travel page starts the photo
   * hand-off from here.
   */
  onFlightComplete?: (location: TravelLocation) => void;
}

export default function WorldMap({
  locations,
  selected,
  onSelect,
  onFlightComplete,
}: WorldMapProps) {
  const [view, setView] = useState<CameraView>(DEFAULT_VIEW);
  const [hoveredPinId, setHoveredPinId] = useState<string | null>(null);
  const [cities, setCities] = useState<City[]>([]);
  // Gate the pin drop-in until after mount so SSR and first client render agree.
  const [mounted, setMounted] = useState(false);
  const reduceMotion = useReducedMotion();
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

  // The camera as of the last frame, so a new flight (or an interruption)
  // starts exactly where the map is. Written only from effects and animation
  // callbacks, never during render.
  const viewRef = useRef<CameraView>(DEFAULT_VIEW);
  // The place whose arrival was already reported, so re-running the effect
  // for the same selection (e.g. the reduced-motion setting changing) doesn't
  // start the photo hand-off twice.
  const completedIdRef = useRef<string | null>(null);
  const onFlightCompleteRef = useRef(onFlightComplete);
  useEffect(() => {
    onFlightCompleteRef.current = onFlightComplete;
  }, [onFlightComplete]);

  const selectedId = selected?.id ?? null;

  /*
   * One continuous fly-to per selection: the centre glides across the map, the
   * zoom moves in log space and pulls out mid-flight on long hops, and the
   * whole thing eases in and out over 0.9–1.6s depending on distance (see
   * lib/travel/camera.ts). A new selection mid-flight stops this one and starts
   * from the current frame, so nothing jumps. Reset flies back the same way.
   */
  useEffect(() => {
    const target = selected;
    const to: CameraView = target
      ? { coordinates: target.coordinates, zoom: target.zoom }
      : DEFAULT_VIEW;
    const from = viewRef.current;

    if (target?.id !== completedIdRef.current) completedIdRef.current = null;
    const apply = (next: CameraView) => {
      viewRef.current = next;
      setView(next);
    };
    const arrive = () => {
      apply(to);
      if (target && completedIdRef.current !== target.id) {
        completedIdRef.current = target.id;
        onFlightCompleteRef.current?.(target);
      }
    };

    // Reduced motion: jump straight there. Already there: nothing to animate.
    if (reduceMotion || sameView(from, to)) {
      arrive();
      return;
    }

    const { duration, dip } = planFlight(from, to);
    const controls = animate(0, 1, {
      duration,
      ease: FLIGHT_EASE,
      onUpdate: (t) => apply(viewAt(from, to, dip, t)),
      onComplete: arrive,
    });
    return () => controls.stop();
    // Keyed on the selection's id; `selected` is derived from it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, reduceMotion]);

  const cityOpacity = fadeBetween(view.zoom, CITY_FADE_START, CITY_FADE_END);

  // The map's SVG projection can differ subtly between server and client, which
  // trips hydration. Render a matching placeholder until mounted.
  if (!mounted) {
    return (
      <div
        className="overflow-hidden border border-line"
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
    <div aria-hidden="true" className="overflow-hidden border border-line">
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
          minZoom={MIN_ZOOM}
          maxZoom={MAX_ZOOM}
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

          <CountriesLayer palette={palette} />
          <StatesLayer palette={palette} />

          {/* Major cities (pop >= 1M): hidden at the world view and faded in
              as the camera zooms past CITY_FADE_START, so they act as context
              rather than clutter and never pop in mid-flight. pointer-events
              off so they never intercept travel-pin clicks. */}
          {cityOpacity > 0 && (
            <g opacity={cityOpacity} pointerEvents="none">
              {cities.map((city) => {
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
            </g>
          )}

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
                {/* Pins drop in one after another, except under reduced
                    motion, where they're simply there. */}
                <motion.g
                  initial={reduceMotion ? false : { opacity: 0, y: -18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={
                    reduceMotion
                      ? { duration: 0 }
                      : {
                          type: "spring",
                          stiffness: 220,
                          damping: 20,
                          delay: index * 0.12,
                        }
                  }
                >
                  <g transform={`scale(${scale})`}>
                    {/* Footprint pin, drawn as SVG so it renders identically on
                        every browser, centred on the place. Selection is shown
                        by scaling it up, the only cue now that there's no
                        focus ring. Hover gets a smaller bump so the map still
                        feels responsive. */}
                    {/* data-pin-id lets the photo hand-off find this pin's
                        on-screen position. It's on the pin shape alone, so the
                        hover tooltip never changes the measured box. */}
                    <g
                      data-pin-id={location.id}
                      transform={`scale(${
                        isSelected ? 2 : hoveredPinId === location.id ? 1.5 : 1
                      })`}
                      style={{ transition: "transform 0.2s ease" }}
                    >
                      <g
                        transform={`rotate(${FOOTPRINT_TILT}) scale(${FOOTPRINT_SCALE})`}
                        fill={isSelected ? palette.pinSelected : palette.pin}
                        stroke="#ffffff"
                        strokeWidth={1}
                      >
                        {/* Invisible hit area over the whole foot, so the gaps
                            between the toes still take the click. */}
                        <ellipse
                          cx={0}
                          cy={-1}
                          rx={5.5}
                          ry={10.5}
                          fill="transparent"
                          stroke="none"
                        />
                        <path d={FOOTPRINT_SOLE} />
                        {FOOTPRINT_TOES.map(([cx, cy, r]) => (
                          <circle key={`${cx},${cy}`} cx={cx} cy={cy} r={r} />
                        ))}
                      </g>
                    </g>

                    {hoveredPinId === location.id &&
                      (() => {
                        const label = location.name;
                        const w = label.length * 6.5 + 14;
                        return (
                          // Clears the hovered (1.5×) footprint's toes.
                          <g transform="translate(0, -23)" pointerEvents="none">
                            <rect
                              x={-w / 2}
                              y={-19}
                              width={w}
                              height={18}
                              fill={palette.tooltipBg}
                            />
                            <polygon
                              points="-4,-1 4,-1 0,3"
                              fill={palette.tooltipBg}
                            />
                            <text
                              y={-7}
                              textAnchor="middle"
                              fontSize={11}
                              fontWeight={600}
                              fill={palette.tooltipText}
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
