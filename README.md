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
`public/geo/countries-110m.json` so there's no runtime dependency. Clicking a
pin animates the map to that location at its `zoom` level.

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

Photos live in Cloudinary and are referenced through a **cached manifest**
(`src/lib/travel/photos.manifest.json`) that's committed to the repo. The app
reads that file at build time — it does **not** call Cloudinary on every build.
You regenerate the manifest with a script whenever photos change. This keeps
builds instant and avoids hitting Cloudinary's Admin API rate limit.

Cloudinary uses **dynamic folders** here: photos are found by their display
folder (`travel/<id>`), so filenames can be anything.

**One-time setup**

1. Create a free Cloudinary account. From the dashboard, note your **cloud
   name**, **API key**, and **API secret**.
2. Copy `.env.example` to `.env.local` and fill in:

   ```bash
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key        # secret — used only by the refresh script
   CLOUDINARY_API_SECRET=your-api-secret  # secret — no NEXT_PUBLIC_ prefix
   ```

   `.env.local` is gitignored. The key/secret are read only by
   `scripts/refresh-photos.mjs` (never bundled into the app). The cloud name is
   public and appears in delivery URLs.

3. `res.cloudinary.com` is already whitelisted in `next.config.ts`.

**Adding / changing photos**

1. In the Cloudinary Media Library, upload into the folder `travel/<locationId>`
   (the folder name must match the location's `id`).
2. Regenerate the manifest:

   ```bash
   npm run refresh:photos
   ```

   This lists every location's folder once and writes
   `src/lib/travel/photos.manifest.json`. Commit that file.

3. Rebuild / redeploy — the gallery now shows the new photos.

Notes:

- **Order:** photos are sorted by name, so prefix them (`01-`, `02-`, …) for a
  specific sequence.
- **Captions:** fill a photo's **Description** in Cloudinary; it's read into the
  manifest and shown in the lightbox.
- **HEIC is fine** — Cloudinary converts it to WebP/AVIF on delivery, and the
  gallery renders `<Image unoptimized>` since Cloudinary already optimizes.
- A location with no photos in the manifest renders a "photos coming soon"
  state, so it's safe to add a pin before uploading pictures.

### Accessibility notes

Map pins are real focusable controls (`tabIndex`, `role="button"`, Enter/Space
handlers, `aria-label`, `aria-pressed`). The pill buttons below the map select
the same locations, so the feature is fully usable without interacting with the
SVG.

### Known rough edges

- The SVG basemap shows country outlines only — no roads, rivers, or state
  lines. It's a stylized pin map, not a detailed atlas.
- Visited countries are highlighted from a hardcoded set of ISO codes in
  `locations.ts` (`visitedCountryIds`); add new countries there manually.
