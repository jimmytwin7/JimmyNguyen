# JimmyNguyen

Personal portfolio site — an experience page, an interactive travel map, and
**Pantry Quest**, a recipe finder that matches what's in your kitchen against
real recipes. Built with Next.js; no database or CMS. Every page is static
except Pantry Quest's two small server routes.

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 ·
next-themes (light/dark) · react-simple-maps · Framer Motion · lucide-react

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
```

No environment variables are needed to run, build, or deploy the site. All of
them are optional (see `.env.example`): Cloudinary credentials only matter for
re-syncing travel photos ([Photos](#photos-cloudinary--committed-manifest)), and
`RECIPE_API_KEY` is an optional TheMealDB supporter key for Pantry Quest.

| Script                   | What it does                                      |
| ------------------------ | ------------------------------------------------- |
| `npm run dev`            | Dev server with hot reload                        |
| `npm run build`          | Production build                                  |
| `npm start`              | Serve the production build                        |
| `npm run lint`           | ESLint — `eslint-config-next` + full `jsx-a11y`   |
| `npm run format`         | Format the whole project with Prettier            |
| `npm run format:check`   | Check formatting without writing (CI / hook)      |
| `npm test`               | Vitest — unit, API route, and UI tests (one run)  |
| `npm run refresh:photos` | Re-sync the travel photo manifest from Cloudinary |

## Code quality

A Git **pre-commit hook** enforces linting and formatting so nothing
unformatted or lint-breaking lands in history.

- **[Husky](https://typicode.github.io/husky/)** manages the hook, and
  **[lint-staged](https://github.com/lint-staged/lint-staged)** runs the checks
  against only the files you've staged (fast — it doesn't scan the whole repo).
- On every `git commit`, staged files are checked with **ESLint** and
  **Prettier**. If either reports a problem, the commit is **blocked** until
  it's fixed.
- The hook is wired through the `prepare` script, so it installs automatically
  when someone runs `npm install` after cloning — no manual setup.

Prettier config lives in `.prettierrc.json` and the hook in `.husky/pre-commit`.
Run `npm run format` to auto-fix formatting before committing.

## Architecture

Pages render at build time. Every page is a React Server Component that imports
typed TypeScript constants directly — no request-time data fetching for page
content. The only server code is Pantry Quest's two route handlers
(`/api/recipes`, `/api/substitutions`), which run as serverless functions on
Vercel; see [docs/pantry-quest.md](docs/pantry-quest.md).

Interactivity is added through small, targeted client components ("islands")
rather than making whole pages client-side:

| Route         | Rendering                                                               |
| ------------- | ----------------------------------------------------------------------- |
| `/`           | Static, with `Typewriter`, `CurrentlySection`, `InterestsBento` islands |
| `/experience` | Static; only the PDF download button is interactive                     |
| `/travel`     | Static shell; the map + timeline views and lightbox are a client island |
| `/cooking`    | Static shell; Pantry Quest is one client island calling `/api/*`        |
| `not-found`   | Static 404                                                              |

Content lives in `src/lib/` as typed constants instead of a CMS. To update the
resume, edit `src/lib/data/`. To add a travel location, edit
`src/lib/travel/locations.ts`. TypeScript is the schema — a malformed entry is a
build error, not a runtime surprise.

### Theming (light & dark)

The site has a manual light/dark toggle (in the header, sun/moon icon), built on
a **semantic CSS-variable token layer** in `globals.css` rather than scattered
`dark:` utilities across every component.

The choice persists across visits, handled by
[next-themes](https://github.com/pacocoursey/next-themes) — it owns the
pre-paint script that restores the saved theme onto `<html>`, so there's no
flash of the wrong one. `enableSystem` is off, so it's an explicit light/dark
choice with light as the default rather than following the OS setting.

How it works:

- `@custom-variant dark (&:where(.dark, .dark *))` makes dark mode key off a
  `.dark` class on `<html>`, flipped by the toggle button.
- Semantic tokens (`--surface`, `--surface-muted`, `--text`, `--border`,
  `--accent`, …) are defined once with light values in `:root` and overridden
  under `.dark`, then registered as Tailwind `@theme` colors. Components use
  utilities like `bg-surface`, `text-muted`, or `border-edge`, so flipping the
  one class on `<html>` re-themes the whole site with no per-element variants.
- The brand blue stays constant, but `--accent` brightens from `brand-700`
  (light) to `brand-500` (dark) so it reads against the slate dark canvas.

Two implementation notes worth keeping:

- `next-themes` does the persistence rather than a hand-rolled inline script.
  Restoring a theme before hydration is genuinely fiddly — a hand-written script
  that mutates `<html>` too early breaks hydration, which silently kills
  interactivity on the page until a client-side navigation. The library handles
  that correctly.
- In `ThemeToggle`, both the sun and moon icons are always rendered and the
  `dark:` variant decides which is visible, so the button's markup is identical
  on the server and the client. Deriving the icon from React state reintroduces
  a server/client divergence.

Two border tokens exist on purpose:

- **`border-edge`** — transparent in light mode (so cards read as shadow-only,
  their original look) and a visible slate outline in dark mode.
- **`border-line`** — visible in both themes, for structural dividers (header,
  footer, résumé timeline) and outlined buttons.

The travel map is a special case: its colors are JavaScript values baked into
SVG fills, not CSS, so tokens can't reach them. `WorldMap.tsx` keeps a
`LIGHT_PALETTE`/`DARK_PALETTE` pair and a `useIsDark()` hook that watches the
`.dark` class with a `MutationObserver`, so the map recolors live when you
toggle.

### Project structure

```
src/
  app/
    layout.tsx          # shell: header, nav, footer, cursor dot, theme toggle, analytics
    page.tsx            # home
    experience/page.tsx
    travel/page.tsx
    cooking/page.tsx    # Pantry Quest recipe finder
    api/recipes/        # GET  — search TheMealDB, score against the pantry
    api/substitutions/  # POST — dictionary-based substitution ideas
    not-found.tsx
    globals.css         # Tailwind v4 @theme + light/dark semantic tokens
  components/
    home/               # Typewriter, CurrentlySection (lucide icon carousel), InterestsBento
    nav/                # Nav + desktop/mobile variants, active-route NavLink
    resume/             # experience, skills, education sections (used by /experience)
    travel/             # TravelViews (map/timeline toggle), TravelMapClient,
                        #   WorldMap, LocationPanel, Lightbox, TravelTimeline
    cooking/            # Pantry Quest: input, cutting board, results, detail,
                        #   substitutions, cooking mode
    ui/                 # SectionCard, CursorDot, DownloadButton, FocusTrapper,
                        #   ThemeToggle, ThemeProvider
    Footer.tsx
  lib/
    cooking/            # pure matching/normalizing/filter logic + server/ adapters
    data/               # resume content (experience, skills, education)
    travel/             # locations, types, loader, dates, photos.manifest.json
    hooks/              # useInView (scroll-reveal via IntersectionObserver)
    utils/              # sort helpers
public/
  geo/                  # TopoJSON basemap layers (countries, US states, cities)
  Jimmy_Nguyen_Resume.pdf
  headshot.jpg
  umn.png               # university logo used by the education section
scripts/
  refresh-photos.mjs    # regenerates the photo manifest from Cloudinary
```

---

## Travel map

`/travel` offers two views of the same data, switched by a toggle (`TravelViews`):

- **Map** — an interactive SVG world map. Clicking a pin zooms to that location
  and shows its blurb and photo grid below; clicking a photo opens a full-screen
  lightbox.
- **Timeline** — the same locations as a newest-first vertical timeline
  (`TravelTimeline`), each entry with its date, blurb, and a horizontal photo
  filmstrip. Entries reveal on scroll via the `useInView` hook (a no-op under
  `prefers-reduced-motion`); the photos still open the shared lightbox.

Dates live on each location (`MM-DD-YYYY`) and are parsed/formatted/sorted by
`lib/travel/dates.ts` — string-comparing that format would mis-sort, so the
timeline parses to real `Date`s.

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

Zoom and pan come from react-simple-maps' own `ZoomableGroup`. (The separate
`react-zoom-pan-pinch` dependency is used by the photo lightbox, not the map.)

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

## Pantry Quest (`/cooking`)

Add the ingredients you have to a virtual cutting board; Pantry Quest finds real
recipes from [TheMealDB](https://www.themealdb.com/), scores each with a
deterministic **ingredient-match percentage**, lists exactly what you have and
what's missing, suggests substitutions from a built-in dictionary, and walks you
through instructions in a one-step-at-a-time Cooking Mode.

Highlights: provider isolated behind an interface; scoring, normalization, and
dietary filtering are pure, tested functions; API keys stay server-side; the
whole flow works with no keys at all. Full write-up — architecture, scoring
formula, substitution safety rules, env vars, and limitations — in
**[docs/pantry-quest.md](docs/pantry-quest.md)**.

---

## Other details

- **Nav** — `NavLink` marks the active route with `aria-current="page"`. The
  mobile menu traps focus via `FocusTrapper` and restores it on close.
- **`CurrentlySection`** — a horizontal "currently" carousel with lucide-react
  icons and a pulsing live dot. Three items show at a time on desktop (center
  sharp, neighbors dimmed), falling back to a single centered item on mobile;
  it advances on a timer and loops seamlessly via clone-padding and a silent
  reset.
- **`Typewriter`** — types out the hero heading, then the paragraph after a
  delay, so the two don't animate over each other.
- **`CursorDot`** — a custom trailing cursor, deliberately disabled on `/travel`
  where it would fight the map's own interactions.
- **`ThemeToggle`** — the light/dark switch in the header; see
  [Theming](#theming-light--dark) for how the token layer works.
- **Analytics** — `@vercel/analytics` mounted once in the root layout.

## Accessibility

**The travel map is `aria-hidden` on purpose.** react-simple-maps renders every
country and US state as an SVG `<path>`, which screen readers announce as
"graphic symbol" — hundreds of unlabelled, meaningless stops that make the page
far worse to navigate. Those shapes can't be usefully labelled, so the whole
visualisation is marked presentational.

The accessible equivalent is the **"Jump to a location" list** beneath it: a
labelled `<nav>` of real `<button>`s, one per location, with `aria-pressed`
reflecting the current selection. It does everything the pins do. Because the
map subtree is `aria-hidden`, the pins are deliberately **not** focusable
(`tabIndex={-1}`) — a focusable element inside `aria-hidden` is an ARIA
violation — so they're a mouse/touch affordance only.

`LocationPanel` carries `aria-live="polite"`, so choosing a location announces
the resulting detail panel rather than changing silently.

Elsewhere: interactive regions use `aria-labelledby` where relevant, and the
mobile nav traps and restores focus explicitly.

Accessibility is also enforced in CI/commits: the ESLint config turns on the
full `eslint-plugin-jsx-a11y` **recommended** rule set as errors (not just the
small subset `eslint-config-next` enables by default), so a11y regressions fail
`npm run lint` and the pre-commit hook. The two deliberate exceptions — the
lightbox's click-outside-to-close backdrop and its click-swallowing image box —
are suppressed inline with explanations, since keyboard users already close with
Escape and navigate with arrows.

## Deployment

Deployed on Vercel. Because the photo manifest and basemap TopoJSON are both
committed, a deploy is just `npm install && npm run build` with **no environment
variables configured**. Pantry Quest's optional `RECIPE_API_KEY` can be set in
Vercel's project environment variables if you want it (see
[docs/pantry-quest.md](docs/pantry-quest.md#deployment)).

## Data attribution

- Country and US state shapes: [world-atlas](https://github.com/topojson/world-atlas)
  and [us-atlas](https://github.com/topojson/us-atlas), derived from
  [Natural Earth](https://www.naturalearthdata.com/) (public domain).
- City points (population > 1M): derived from Natural Earth populated places.
- Pantry Quest recipes and recipe photos: [TheMealDB](https://www.themealdb.com/).
  Each recipe links back to its TheMealDB page (and the original source when
  supplied).
- Pantry Quest ingredient illustrations: pixel-art icons from Pixeltier's
  Food & Cooking RPG Icons, used under the pack's license (no redistribution as
  a standalone pack). Full source and license notes are in
  `public/images/ingredients/CREDITS.md`.

Both atlas packages are devDependencies — they're only used to source the JSON
into `public/geo/`, never imported at runtime.

## Known limitations

- The basemap is a stylized pin map, not a detailed atlas — country outlines,
  US state borders, and major-city points only. No roads or rivers.
- Visited-country highlighting is a manually maintained ISO-code set, not
  derived from the location list.
- Photo captions and ordering are managed in Cloudinary rather than in the repo,
  so changing them requires a manifest refresh and a redeploy.
