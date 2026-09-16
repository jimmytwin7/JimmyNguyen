# JimmyNguyen

Personal portfolio site — a resume page and an interactive travel map, built as
a fully static Next.js app with no database, CMS, or API routes.

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 ·
react-simple-maps · Framer Motion

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
```

No environment variables are needed to run, build, or deploy the site. Cloudinary
credentials are only required if you want to re-sync travel photos — see
[Photos](#photos-cloudinary--committed-manifest).

| Script                   | What it does                                      |
| ------------------------ | ------------------------------------------------- |
| `npm run dev`            | Dev server with hot reload                        |
| `npm run build`          | Production build                                  |
| `npm start`              | Serve the production build                        |
| `npm run lint`           | ESLint (flat config, `eslint-config-next`)        |
| `npm run refresh:photos` | Re-sync the travel photo manifest from Cloudinary |

## Architecture

The whole site renders at build time. Every page is a React Server Component
that imports typed TypeScript constants directly — there's no data fetching at
request time, no API layer, and nothing to keep running besides static hosting.

Interactivity is added through small, targeted client components ("islands")
rather than making whole pages client-side:

| Route       | Rendering                                                               |
| ----------- | ----------------------------------------------------------------------- |
| `/`         | Static, with `Typewriter`, `CurrentlySection`, `InterestsBento` islands |
| `/resume`   | Static; only the PDF download button is interactive                     |
| `/travel`   | Static shell; the map and photo lightbox are one client island          |
| `not-found` | Static 404                                                              |

Content lives in `src/lib/` as typed constants instead of a CMS. To update the
resume, edit `src/lib/data/`. To add a travel location, edit
`src/lib/travel/locations.ts`. TypeScript is the schema — a malformed entry is a
build error, not a runtime surprise.

### Project structure

```
src/
  app/
    layout.tsx          # shell: header, nav, footer, cursor dot, analytics
    page.tsx            # home
    resume/page.tsx
    travel/page.tsx
    not-found.tsx
    globals.css         # Tailwind v4 + brand CSS custom properties
  components/
    home/               # Typewriter, CurrentlySection, InterestsBento
    nav/                # Nav + desktop/mobile variants, active-route NavLink
    resume/             # experience, skills, education sections
    travel/             # TravelMapClient, WorldMap, LocationPanel, Lightbox
    ui/                 # SectionCard, CursorDot, DownloadButton, FocusTrapper
    Footer.tsx
  lib/
    data/               # resume content (experience, skills, education)
    travel/             # locations, types, loader, photos.manifest.json
    utils/              # sort helpers
public/
  geo/                  # TopoJSON basemap layers (countries, US states, cities)
  Jimmy_Nguyen_Resume.pdf
  headshot.jpg
scripts/
  refresh-photos.mjs    # regenerates the photo manifest from Cloudinary
```

---

## Travel map

`/travel` renders an interactive SVG world map. Clicking a pin zooms to that
location and shows its blurb and photo grid below; clicking a photo opens a
full-screen lightbox.

### How it fits together

| File                                    | Role                                                      |
| --------------------------------------- | --------------------------------------------------------- |
| `src/app/travel/page.tsx`               | Server component; loads locations and passes them down    |
| `components/travel/TravelMapClient.tsx` | Owns the selected-location state                          |
| `components/travel/WorldMap.tsx`        | SVG map, basemap layers, pins, zoom behavior              |
| `components/travel/LocationPanel.tsx`   | Detail panel and photo grid                               |
| `components/travel/Lightbox.tsx`        | Full-screen photo viewer                                  |
| `lib/travel/locations.ts`               | The locations themselves (single source of truth)         |
| `lib/travel/types.ts`                   | `TravelLocation` / `TravelPhoto` types                    |
| `lib/travel/loader.ts`                  | `loadTravelLocations()` — joins locations to the manifest |
| `lib/travel/photos.manifest.json`       | Committed Cloudinary photo index                          |

`loadTravelLocations()` is the seam worth understanding: it merges the
hand-written locations with the generated photo manifest, so location metadata
and photo data are maintained independently but arrive at the page as one array.

### Why an SVG map

The map uses [react-simple-maps](https://www.react-simple-maps.io/) (SVG
projections via `d3-geo`) instead of a tile provider. No API key, no usage
billing, no attribution overlay, and the styling is plain SVG that inherits the
site's palette. Three TopoJSON layers are committed to `public/geo/` so there's
no runtime data dependency:

- `countries-110m.json` — country outlines; visited countries are filled from a
  hardcoded ISO-code set (`visitedCountryIds` in `locations.ts`)
- `states-10m.json` — US state borders
- `cities-1m.json` — cities over 1M people, labeled once you zoom past a
  threshold so the world view stays uncluttered

Zoom and pan are handled by `react-zoom-pan-pinch`, which gives trackpad,
wheel, and pinch gestures for free.

### Adding a location

Append an entry to `travelLocations` in `src/lib/travel/locations.ts`:

```ts
{
  id: "kyoto-japan",                // also the Cloudinary folder: travel/kyoto-japan
  name: "Kyoto",
  region: "Kyoto Prefecture",
  country: "Japan",
  coordinates: [135.7681, 35.0116], // [longitude, latitude] — note the order
  zoom: 6,                          // ~6 for cities/regions, ~7 for parks
  blurb: "One or two sentences.",
}
```

There's no `photos` field — photos are attached from the manifest by `id`. Two
things that commonly trip people up:

- **Coordinates are `[longitude, latitude]`**, d3-geo's convention and the
  reverse of what Google Maps shows you.
- **`id` must match the Cloudinary folder name** — that's the join key.

If you visited a new country, also add its ISO numeric code to
`visitedCountryIds` so the country gets highlighted.

### Photos (Cloudinary + committed manifest)

Photos are stored in Cloudinary, not in the repo. Cloudinary holds the originals
— **including HEIC straight off an iPhone** — and delivers browser-friendly
WebP/AVIF through `f_auto,q_auto`, so there's no local conversion step.

The app never calls Cloudinary at build or request time. Instead,
`scripts/refresh-photos.mjs` queries the Admin API and writes
`src/lib/travel/photos.manifest.json`, which is **committed to the repo**. The
build reads that file. This keeps builds instant, makes deploys reproducible,
avoids the Admin API rate limit, and means **no Cloudinary credentials are
needed in CI or on Vercel**.

The manifest stores a full-size URL, a thumbnail URL, a tiny blurred
placeholder, a label, and an optional caption per photo.

**One-time setup** (only if you're re-syncing photos)

1. Create a Cloudinary account and note your **cloud name**, **API key**, and
   **API secret**.
2. Copy `.env.example` to `.env.local` and fill it in:

   ```bash
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   ```

   `.env.local` is gitignored. The key and secret are read only by the refresh
   script and are never bundled into the app. The cloud name is public — it
   appears in every delivery URL — and is already allow-listed in
   `next.config.ts`.

**Adding or changing photos**

1. Upload into the Cloudinary folder `travel/<locationId>`. Cloudinary is
   configured for **dynamic folders**, so photos are matched by display folder
   and filenames can be anything.
2. Regenerate and commit the manifest:

   ```bash
   npm run refresh:photos
   ```

3. Redeploy.

Notes:

- **Order:** photos sort by name — prefix them (`01-`, `02-`, …) to control the
  sequence.
- **Captions:** fill in a photo's **Description** in Cloudinary; it's picked up
  into the manifest and shown in the lightbox.
- The script refuses to overwrite the manifest if _every_ location fails, so a
  rate limit or bad credential can't silently blank your gallery.
- A location with no photos renders a "photos coming soon" state, so it's safe
  to add a pin before uploading pictures.

### Lightbox

`Lightbox.tsx` renders through a React portal and supports keyboard navigation
(arrows, Escape), pinch/scroll zoom, touch swipe between photos, captions, and
blur-up placeholders. It only preloads the neighbouring photos rather than the
whole set, so opening a large gallery doesn't pull down every full-size image.

---

## Other details

- **Nav** — `NavLink` marks the active route with `aria-current="page"`. The
  mobile menu traps focus via `FocusTrapper` and restores it on close.
- **`CurrentlySection`** — a vertically scrolling "currently" list that loops
  seamlessly by rendering three copies of the list and snapping back without a
  transition once it slides onto the duplicate.
- **`Typewriter`** — types out the hero heading, then the paragraph after a
  delay, so the two don't animate over each other.
- **`CursorDot`** — a custom trailing cursor, deliberately disabled on `/travel`
  where it would fight the map's own interactions.
- **Analytics** — `@vercel/analytics` mounted once in the root layout.

## Accessibility

Map pins are real focusable controls (`tabIndex`, `role="button"`, Enter/Space
handlers, `aria-label`, `aria-pressed`), and the pill buttons under the map
select the same locations — so the feature is fully usable without touching the
SVG. Interactive regions use `aria-labelledby` / `aria-live` where relevant, and
the mobile nav manages focus explicitly.

## Deployment

Deployed on Vercel. Because the photo manifest and basemap TopoJSON are both
committed, a deploy is just `npm install && npm run build` with **no environment
variables configured**.

## Data attribution

- Country and US state shapes: [world-atlas](https://github.com/topojson/world-atlas)
  and [us-atlas](https://github.com/topojson/us-atlas), derived from
  [Natural Earth](https://www.naturalearthdata.com/) (public domain).
- City points (population > 1M): derived from Natural Earth populated places.

Both atlas packages are devDependencies — they're only used to source the JSON
into `public/geo/`, never imported at runtime.

## Known limitations

- The basemap is a stylized pin map, not a detailed atlas — country outlines,
  US state borders, and major-city points only. No roads or rivers.
- Visited-country highlighting is a manually maintained ISO-code set, not
  derived from the location list.
- Photo captions and ordering are managed in Cloudinary rather than in the repo,
  so changing them requires a manifest refresh and a redeploy.
