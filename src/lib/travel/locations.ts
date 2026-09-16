import type { TravelLocationMeta } from "./types";

/**
 * Numeric ISO 3166-1 country codes for countries I've visited, used to
 * highlight them on the map. These match the `id` field in the world-atlas
 * TopoJSON (public/geo/countries-110m.json).
 *   124 = Canada, 704 = Vietnam, 840 = United States
 */
export const visitedCountryIds: ReadonlySet<string> = new Set([
  "124",
  "704",
  "840",
]);

/**
 * The travel map's locations — the single source of truth for names,
 * coordinates, and blurbs.
 *
 * Photos are not listed here. Upload them to the Cloudinary folder
 * `travel/<id>` and run `npm run refresh:photos`; the generated manifest is
 * merged in by `loader.ts`.
 *
 * Field notes:
 * - `id` must match the Cloudinary folder name — that's how photos are matched.
 * - `coordinates` are [longitude, latitude], the order d3-geo expects. This is
 *   the reverse of what Google Maps shows you.
 * - `zoom` is the react-simple-maps scale: 6 frames a city, 7 a park.
 */
export const travelLocations: TravelLocationMeta[] = [
  {
    id: "banff-alberta",
    name: "Banff National Park",
    region: "Alberta",
    country: "Canada",
    coordinates: [-115.5708, 51.1784],
    zoom: 7,
    blurb:
      "Turquoise glacial lakes and the Canadian Rockies rising straight out of the treeline.",
  },
  {
    id: "saigon-vietnam",
    name: "Saigon, Vietnam",
    region: "Ho Chi Minh City",
    country: "Vietnam",
    coordinates: [106.6297, 10.8231],
    zoom: 6,
    blurb: "Organized chaos, great food, so much to do",
  },
  {
    id: "hanoi-vietnam",
    name: "Hanoi, Vietnam",
    region: "Hanoi",
    country: "Vietnam",
    coordinates: [105.8342, 21.0278],
    zoom: 6,
    blurb:
      "Narrow Old Quarter alleys, egg coffee, salted cream coffee, and Bun Cha",
  },
  {
    id: "ha-giang-vietnam",
    name: "Ha Giang, Vietnam",
    region: "Ha Giang",
    country: "Vietnam",
    coordinates: [104.9784, 22.8233],
    zoom: 6,
    blurb:
      "The best experience in all of southeast asia, a 4 day 3 night motorbike tour",
  },
  {
    id: "ninh-binh-vietnam",
    name: "Ninh Binh, Vietnam",
    region: "Ninh Binh",
    country: "Vietnam",
    coordinates: [105.975, 20.2506],
    zoom: 6,
    blurb:
      "Limestone karsts rising out of the rice paddies — rowboat rides through river caves and endless green from the mountaintop pagodas.",
  },
  {
    id: "seattle-washington",
    name: "Seattle, USA",
    region: "Washington",
    country: "United States",
    coordinates: [-122.3321, 47.6062],
    zoom: 6,
    blurb: "When I got the one rainy weekend after 8 weeks of sunshine",
  },
  {
    id: "chicago",
    name: "Chicago, USA",
    region: "Illinois",
    country: "United States",
    coordinates: [-87.6298, 41.8781],
    zoom: 6,
    blurb: "The windy city",
  },
  {
    id: "new-york",
    name: "New York, USA",
    region: "New York",
    country: "United States",
    coordinates: [-74.006, 40.7128],
    zoom: 6,
    blurb: "The big apple",
  },
  {
    id: "zion-national-park",
    name: "Zion National Park",
    region: "Utah",
    country: "United States",
    coordinates: [-113.0263, 37.2982],
    zoom: 7,
    blurb:
      "Red sandstone canyon walls, the Narrows, and switchbacks up to Angels Landing.",
  },
  {
    id: "grand-canyon",
    name: "Grand Canyon National Park",
    region: "Arizona",
    country: "United States",
    coordinates: [-112.1129, 36.1069],
    zoom: 7,
    blurb:
      "A mile deep and impossible to photograph at scale. Worth seeing at sunrise.",
  },
  {
    id: "bryce-canyon",
    name: "Bryce Canyon National Park",
    region: "Utah",
    country: "United States",
    coordinates: [-112.1871, 37.593],
    zoom: 7,
    blurb: "Hoodoo amphitheaters that glow orange when the light hits right.",
  },
  {
    id: "sleeping-bear-dunes",
    name: "Sleeping Bear Dunes National Lakeshore",
    region: "Michigan",
    country: "United States",
    coordinates: [-86.0586, 44.8619],
    zoom: 7,
    blurb:
      "One of three National Lakeshores. Sand bluffs dropping straight into Lake Michigan, many enjoy the challenge",
  },
  {
    id: "mackinac-island",
    name: "Mackinac Island, Michigan",
    region: "Michigan",
    country: "United States",
    coordinates: [-84.6189, 45.8492],
    zoom: 7,
    blurb:
      "No cars allowed — just bikes, horse-drawn carriages, and fudge. Victorian charm on an island in Lake Huron.",
  },
];
