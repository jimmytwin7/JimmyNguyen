# Implementation Plan: Portfolio Website

## Overview

Build Jimmy Nguyen's personal portfolio as a statically-rendered Next.js (App
Router) application with TypeScript strict mode and Tailwind CSS v4. All content
is authored as typed TypeScript data files. Implementation proceeds from
scaffolding and the data layer, through shared navigation and the home/resume
pages, to the interactive travel map and its Cloudinary-backed photo pipeline.

> **Revision note.** This plan was updated to reflect the site as shipped. The
> original plan targeted a static destination-grid Travel page and a `/projects`
> page with tag filtering. The Travel page was reimagined as an interactive map
> with Cloudinary photos, and the Projects page was dropped. Tasks for the
> dropped work are marked **[dropped]**; test tasks that were scaffolded but not
> written are left unchecked.

## Tasks

- [x] 1. Scaffold project structure and configuration
  - [x] 1.1 Initialize Next.js App Router project (TypeScript strict, `--src-dir`)
    - Verify `tsconfig.json` has `"strict": true`
    - _Requirements: 7.1, 7.4_
  - [x] 1.2 Configure ESLint flat config
    - `eslint.config.mjs` spreads `eslint-config-next/core-web-vitals` + `/typescript`; lint runs via `npm run lint` (`eslint .`)
    - _Requirements: 7.3, 7.4_
  - [x] 1.3 Configure Tailwind v4 tokens and global styles
    - Declare the `brand` palette and font tokens with `@theme` in `src/app/globals.css` (no `tailwind.config.ts`)
    - _Requirements: 2.1, 6.5, 7.2_
  - [ ]\* 1.4 Set up the Vitest + Testing Library + fast-check + jsdom test environment
    - `vitest.config.ts` and `src/__tests__/setup.ts` exist; **no test files have been written**
    - _Requirements: 7.4_

- [x] 2. Build the typed data layer
  - [x] 2.1 `src/lib/data/experience.ts` — `Company` / `Role` interfaces and data
    - _Requirements: 3.2, 3.5_
  - [x] 2.2 `src/lib/data/skills.ts` — `Skill` / `SkillCategory` interfaces and data
    - _Requirements: 3.3_
  - [x] 2.3 `src/lib/data/education.ts` — `Education` interface and data
    - _Requirements: 3.4_
  - [x] 2.4 `src/lib/travel/locations.ts` + `types.ts` — `TravelLocationMeta` and `visitedCountryIds`
    - Replaces the original static `destinations.ts`; adds map coordinates, zoom, and visited-country codes
    - _Requirements: 4.1, 4.2, 4.3_
  - [x] 2.5 `src/lib/utils/sort.ts` — `reverseChronological` over companies
    - Sort key is the latest role `endDate`; `"present"` treated as newest
    - _Requirements: 3.5_
  - [ ]\* 2.6 Property test for `reverseChronological` (Requirements 3.5) — not written
  - **[dropped]** ~~`src/lib/data/projects.ts` — `Project` interface + tag tuple~~
    - The Projects page was cut; this orphaned file was later deleted.

- [x] 3. Build shared navigation
  - [x] 3.1 `src/components/ui/FocusTrapper.tsx` — keyboard focus trap (`active` prop)
    - _Requirements: 2.5_
  - [x] 3.2 `src/components/nav/NavLink.tsx` — active-state link with `aria-current`
    - _Requirements: 1.3, 1.4_
  - [x] 3.3 `src/components/nav/NavDesktop.tsx` — desktop nav (Home, Resume, Travel), `hidden md:flex`
    - _Requirements: 1.1, 1.2_
  - [x] 3.4 `src/components/nav/NavMobile.tsx` — portaled hamburger drawer
    - Slide-in ~300ms, focus trap, body-scroll lock, Escape to close; `portalReady` gates SSR
    - _Requirements: 2.2, 2.3, 2.5_
  - [x] 3.5 `src/components/nav/Nav.tsx` — server shell composing desktop + mobile
    - _Requirements: 1.1_
  - [x] 3.6 Wire `Nav`, `Footer`, `CursorDot`, and Vercel `Analytics` into `layout.tsx`
    - Semantic `<header>`/`<main>`/`<footer>`; Geist fonts via `next/font`
    - _Requirements: 1.1, 6.4_
  - [ ]\* 3.7 Property test for active NavLink (Requirements 1.4) — not written
  - [ ]\* 3.8 Tests for NavMobile open/close + focus trap (Requirements 2.2, 2.5) — not written

- [x] 4. Implement the Home page
  - [x] 4.1 `src/app/page.tsx` — hero with headshot, plus `Typewriter`, `CurrentlySection`, `InterestsBento`
    - `Typewriter` types the `<h1>` then the bio paragraph after a delay
    - _Requirements: 1.5, 6.4_
  - [x] 4.2 `src/app/not-found.tsx` — 404 with message and home link
    - _Requirements: 1.6_

- [x] 5. Implement the Resume page
  - [x] 5.1 `ExperienceItem.tsx` / `ExperienceList.tsx` — company → roles → bullets
    - _Requirements: 3.2_
  - [x] 5.2 `SkillsSection.tsx` — category chips with stable hashed colors
    - _Requirements: 3.3_
  - [x] 5.3 `EducationList.tsx`
    - _Requirements: 3.4_
  - [x] 5.4 `DownloadButton.tsx` — links to `/Jimmy_Nguyen_Resume.pdf`
    - _Requirements: 3.6_
  - [x] 5.5 Assemble `src/app/resume/page.tsx` with `SectionCard` regions; sort experience
    - _Requirements: 3.1–3.6_
  - [ ]\* 5.6 Tests for resume field rendering (Requirements 3.2–3.4) — not written
  - [ ]\* 5.7 Tests for DownloadButton (Requirements 3.6) — not written

- [x] 6. Checkpoint — build + types + lint clean
  - `next build`, `npx tsc --noEmit`, and `eslint .` all pass; all routes prerender static

- [x] 7. Implement the Travel page (interactive map)
  - [x] 7.1 `WorldMap.tsx` — react-simple-maps SVG with pins, `react-zoom-pan-pinch` zoom/pan, and Framer Motion fly-to
    - Renders three TopoJSON layers: countries (visited fills), US states, >1M cities
    - _Requirements: 4.1, 4.2_
  - [x] 7.2 `TravelMapClient.tsx` + quick-jump button list — selected-location state, keyboard-accessible
    - _Requirements: 4.3, 4.6_
  - [x] 7.3 `LocationPanel.tsx` — blurb + responsive photo grid + "photos coming soon" fallback
    - _Requirements: 4.4, 4.5_
  - [x] 7.4 `Lightbox.tsx` — portaled full-screen viewer: arrows/Escape, zoom, swipe, captions, blur-up, windowed preload
    - _Requirements: 4.4, 4.7_
  - [x] 7.5 `src/app/travel/page.tsx` — calls `loadTravelLocations()`, shows location count
    - _Requirements: 4.1_
  - [ ]\* 7.6 Tests for the loader join + lightbox windowing (Requirements 4.4, 4.5) — not written

- [x] 8. Build the Cloudinary photo pipeline
  - [x] 8.1 `scripts/refresh-photos.mjs` — read ids from `locations.ts`, query the Admin API, write the manifest
    - Aborts without writing if every location fails; keeps prior entries on transient errors
    - _Requirements: 5.1, 5.3, 5.5_
  - [x] 8.2 `src/lib/travel/loader.ts` + committed `photos.manifest.json` — build-time read, no Cloudinary at build/runtime
    - _Requirements: 5.2, 5.4_
  - [x] 8.3 `next.config.ts` — allow-list `res.cloudinary.com` scoped to the account cloud name
    - _Requirements: 6.2_
  - **[dropped]** ~~8.x Projects page (`ProjectCard`, `TagFilter`, `ProjectsClient`, `app/projects/page.tsx`)~~
    - Cut from scope; corresponding components and route were never shipped / later removed.

- [x] 9. Checkpoint — build + types + lint clean (post-travel)
  - Re-verified after the map and pipeline landed

- [ ] 10. Testing and accessibility validation — **not implemented**
  - The test toolchain is installed but no tests exist. Either write the suite
    described in `design.md` or remove the harness and its `test` scripts before
    treating the repo as fully covered.

- [x] 11. Public assets
  - [x] 11.1 `public/Jimmy_Nguyen_Resume.pdf`, `headshot.jpg`, `umn.png`, and `public/geo/*.json`
    - _Requirements: 3.6, 4.1, 4.2_

- [x] 12. Public-release prep
  - README rewritten to match the shipped architecture; stale comments cleaned;
    orphaned `projects.ts` removed; ESLint repaired; `.env.example` added;
    data-source attribution documented. Test-harness decision still open.

## Notes

- Tasks marked `*` are optional test tasks; none have been written yet.
- Tasks marked **[dropped]** were planned but cut when the Projects page was
  removed and the Travel page became an interactive map.
- Content in the data files uses real content; the resume PDF in `public/` is
  the actual resume.
