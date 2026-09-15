# JimmyNguyen

Personal portfolio site — resume, projects, and an interactive travel map.

Built with Next.js 16 (App Router), React 19, TypeScript, and Tailwind CSS v4.

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
```

Other scripts:

```bash
npm run build    # production build
npm start        # serve the production build
npm test         # vitest, single run
```

## Project structure

```
src/
  app/                  # App Router pages (/, /resume, /travel, /projects)
  components/
    home/               # CurrentlySection (rotating "currently" card)
    nav/                # desktop + mobile nav
    resume/             # experience, skills, education sections
    travel/             # world map feature
    ui/                 # shared: SectionCard, CursorDot, DownloadButton
  lib/
    data/               # typed content (experience, skills, education)
    travel/             # travel locations, types, loader
    photos.ts           # photo URL resolution
    utils/
public/
  geo/                  # world TopoJSON for the map
```

Page content lives in `src/lib/` as typed constants rather than a CMS. To
update the resume, edit `src/lib/data/`; for travel locations, edit
`src/lib/travel/locations.ts`.

---

## Travel map feature

`/travel` renders an interactive world map. Clicking a pin zooms to that
location and shows its photos below.

### How it fits together

| File                                    | Role                                                     |
| --------------------------------------- | -------------------------------------------------------- |
| `src/app/travel/page.tsx`               | Server component; loads location data and passes it down |
| `components/travel/TravelMapClient.tsx` | Owns the selected-location state                         |
| `components/travel/WorldMap.tsx`        | SVG map, pins, zoom behavior                             |
| `components/travel/LocationPanel.tsx`   | Detail panel and photo grid                              |
| `lib/travel/locations.ts`               | The locations themselves (single source of truth)        |
| `lib/travel/types.ts`                   | `TravelLocation` type                                    |
| `lib/travel/loader.ts`                  | `loadTravelLocations()` — the page's data entry point    |
| `lib/photos.ts`                         | Turns a location + filename into a Cloudinary URL        |

The map uses [react-simple-maps](https://www.react-simple-maps.io/) (SVG via
`d3-geo`) rather than a tile-based map. No API key, no usage costs, and the
styling is plain CSS/SVG. Country shapes come from
[world-atlas](https://github.com/topojson/world-atlas) TopoJSON, copied into
`public/geo/countries-110m.json` so there's no runtime dependency. (If the
coastlines look too coarse when zoomed in, swap in the `50m` variant — larger
but sharper.)

### Adding a location

Append an entry to `travelLocations` in `src/lib/travel/locations.ts`:

```ts
{
  id: "kyoto-japan",              // also the Cloudinary folder: travel/kyoto-japan/
  name: "Kyoto",
  region: "Kyoto Prefecture",
  country: "Japan",
  coordinates: [135.7681, 35.0116], // [longitude, latitude] — note the order
  zoom: 6,                          // 6 for cities/regions, 7 for parks
  blurb: "One or two sentences.",
}
```

No `photos` field — photos are discovered from Cloudinary automatically (see
below). Two things that trip people up:

- **Coordinates are `[longitude, latitude]`**, which is d3-geo's convention and
  the reverse of what Google Maps shows you.
- **`id` must match the Cloudinary folder** — that's how photos are found.

### Photos (Cloudinary, auto-discovered)

Photos live in Cloudinary, not in the repo. It stores the originals —
**including HEIC straight off an iPhone** — and delivers browser-friendly
WebP/AVIF via `f_auto,q_auto`, so no local conversion is needed.

Photos are **listed automatically at build time**. For each location, the build
asks Cloudinary for everything in the display folder `travel/<id>` (via
`resources_by_asset_folder`) and populates the gallery with the real delivery
URLs Cloudinary returns. You never hand-list filenames — just upload to the
right folder.

This uses Cloudinary's **dynamic folders**, where an asset's folder is separate
from its public ID. Photos are found by folder membership, not by a naming
convention, so filenames can be anything.

**One-time setup**

1. Create a free Cloudinary account. From the dashboard, note your **cloud
   name**, **API key**, and **API secret**.
2. Copy `.env.example` to `.env.local` and fill in:

   ```bash
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key       # secret — no NEXT_PUBLIC_ prefix
   CLOUDINARY_API_SECRET=your-api-secret  # secret — no NEXT_PUBLIC_ prefix
   ```

   `.env.local` is gitignored. The key/secret are used **only at build time**
   by `src/lib/travel/cloudinaryPhotos.ts` (marked `server-only`, so it can
   never be bundled to the browser). The cloud name is public.

3. `res.cloudinary.com` is already whitelisted in `next.config.ts`.

**Adding photos to a location**

In the Cloudinary Media Library, create/open the folder `travel/<locationId>`
(the folder name must match the location's `id`) and upload photos into it.
Rebuild and they appear.

- **Order:** photos are sorted by name, so prefix them (`01-`, `02-`, …) if you
  want a specific sequence.
- **HEIC is fine** — Cloudinary converts it to WebP/AVIF on delivery.
- Delivery uses `f_auto,q_auto`, and the gallery renders `<Image unoptimized>`
  since Cloudinary already optimizes (avoids double-processing).
- Missing Cloudinary env vars (e.g. a contributor without credentials) won't
  break the build; galleries just render their "photos coming soon" state.

Photos are fetched during the static build, so **new uploads appear after the
next deploy/rebuild**, not instantly.

### Accessibility notes

Map pins are real focusable controls (`tabIndex`, `role="button"`, Enter/Space
handlers, `aria-label`, `aria-pressed`). The pill buttons below the map select
the same locations, so the feature is fully usable without interacting with the
SVG.

### Known rough edges

- The 110m basemap gets blocky at high zoom; the `50m` world-atlas variant is
  sharper but larger.
- Visited-country highlighting uses a hardcoded set of ISO codes in
  `locations.ts` (`visitedCountryIds`); add new countries there manually.
