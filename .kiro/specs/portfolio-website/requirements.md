# Requirements Document

## Introduction

A personal portfolio website for Jimmy Nguyen, built with Next.js (App Router,
TypeScript) and Tailwind CSS v4. The site is mobile-first and statically
rendered, with three primary pages: a Home/landing page, a Resume page
(experience, skills, education), and a Travel page built around an interactive
world map. It serves as a professional and personal showcase.

> **Scope note.** An earlier revision of this spec included a fourth "Projects"
> page with tag filtering and a static destination-grid Travel page. The site
> shipped without the Projects page, and the Travel page was reimagined as an
> interactive map backed by photos hosted on Cloudinary. This document reflects
> what the site actually does.

## Glossary

- **Portfolio_Site**: The Next.js TypeScript web application
- **Navigation**: The top-level nav bar providing links to all pages
- **Home_Page**: The landing page at `/` with the hero, "Currently" card, and interests grid
- **Resume_Page**: The page displaying professional experience, skills, and education
- **Travel_Page**: The page presenting an interactive world map of visited places
- **Location**: A single travel destination (name, region, country, coordinates, blurb, photos)
- **Manifest**: The committed `photos.manifest.json` mapping each location to its Cloudinary photos
- **Visitor**: Any person viewing the portfolio website
- **Viewport**: The visible area of the browser window

## Requirements

---

### Requirement 1: Site Structure and Navigation

**User Story:** As a visitor, I want to navigate between the pages of the portfolio, so that I can easily find the information I am looking for.

#### Acceptance Criteria

1. THE Portfolio_Site SHALL include a persistent Navigation bar visible on all pages.
2. THE Navigation SHALL contain links to the Home, Resume, and Travel pages.
3. WHEN a Visitor clicks a Navigation link, THE Portfolio_Site SHALL route to the corresponding page without a full page reload.
4. WHILE a Visitor is on a given page, THE Navigation SHALL visually distinguish the active page link using a persistent visual indicator, and expose it to assistive technology via `aria-current="page"`.
5. THE Portfolio_Site SHALL include a home/landing section containing the site owner's name and a short bio, accessible at the root path (/).
6. IF a Visitor navigates to a route not defined in the application, THEN THE Portfolio_Site SHALL display a 404 page containing an error message and a navigable link to the root path (/).

---

### Requirement 2: Responsive and Mobile-First Layout

**User Story:** As a visitor on any device, I want the portfolio to display correctly on my screen, so that I can read content comfortably without horizontal scrolling or broken layouts.

#### Acceptance Criteria

1. THE Portfolio_Site SHALL apply a mobile-first CSS strategy using Tailwind CSS responsive breakpoints (sm, md, lg, xl).
2. THE Navigation SHALL collapse into a hamburger menu on viewports narrower than 768px.
3. WHEN the hamburger menu icon is activated, THE Navigation SHALL display the full menu as a slide-in drawer within roughly 300ms.
4. THE Portfolio_Site SHALL render all page layouts without horizontal overflow on viewports as narrow as 320px and as wide as 2560px.
5. WHILE the mobile navigation drawer is open, THE Portfolio_Site SHALL trap keyboard focus within the drawer, restore focus on close, lock body scroll, and close on Escape.

---

### Requirement 3: Resume / Skills / Experience Page

**User Story:** As a recruiter or collaborator, I want to view the professional background, skills, and experience, so that I can assess the qualifications.

#### Acceptance Criteria

1. THE Resume_Page SHALL display a professional summary section at the top of the page.
2. THE Resume_Page SHALL display a work experience section listing each company with its roles, each role showing title, employment dates, and bullet-point achievements.
3. THE Resume_Page SHALL display a skills section organized into named categories (e.g., Languages, Frameworks, Tools).
4. THE Resume_Page SHALL display an education section listing institutions, degrees, and dates.
5. THE Resume_Page SHALL present work experience in reverse chronological order (most recent first), keyed on the latest role end date per company, treating `"present"` as the most recent.
6. THE Resume_Page SHALL include a visible link that downloads a PDF version of the resume from `/Jimmy_Nguyen_Resume.pdf`.

---

### Requirement 4: Travel Page (Interactive Map)

**User Story:** As a visitor, I want to explore an interactive map of the places visited, so that I can see where they are and browse photos from each.

#### Acceptance Criteria

1. THE Travel_Page SHALL render an interactive SVG world map with a pin for each Location.
2. THE Travel_Page SHALL highlight visited countries from a maintained set of ISO country codes, and overlay US state borders plus labeled major cities (population > 1M) at appropriate zoom levels.
3. WHEN a Visitor selects a pin (or its equivalent list control), THE Travel_Page SHALL animate the map to that Location and display its blurb and photo grid.
4. WHERE a Location has photos in the Manifest, THE Travel_Page SHALL display them in a responsive grid; WHEN a photo is selected, THE Portfolio_Site SHALL open a full-screen lightbox.
5. IF a Location has no photos in the Manifest, THEN THE Travel_Page SHALL display a "photos coming soon" fallback rather than an empty grid.
6. THE Travel_Page SHALL be fully operable by keyboard: pins are focusable controls, and a parallel list of buttons selects the same Locations.
7. THE lightbox SHALL support keyboard navigation (arrows, Escape), zoom, touch swipe, captions, and blur-up placeholders, and SHALL preload only neighbouring photos rather than the whole set.

---

### Requirement 5: Travel Content Pipeline

**User Story:** As the site owner, I want to manage travel photos without committing image binaries or slowing down builds, so that content updates are cheap and deploys stay reproducible.

#### Acceptance Criteria

1. THE Portfolio_Site SHALL store travel photos in Cloudinary, matched to a Location by a shared folder name (`travel/<locationId>`).
2. THE Portfolio_Site SHALL read photos from a committed Manifest at build time and SHALL NOT call Cloudinary during `build` or at request time.
3. THE Portfolio_Site SHALL provide a script (`npm run refresh:photos`) that regenerates the Manifest from Cloudinary and requires credentials only when run locally.
4. THE Portfolio_Site SHALL be deployable with no Cloudinary credentials configured in the hosting environment.
5. IF every Location fails during a refresh (e.g., rate limit or bad credentials), THEN the refresh script SHALL NOT overwrite the existing Manifest.

---

### Requirement 6: Performance and Accessibility

**User Story:** As a visitor, I want the portfolio to load quickly and be accessible, so that I have a good experience regardless of my connection speed or assistive technology.

#### Acceptance Criteria

1. THE Portfolio_Site SHALL statically prerender every route at build time.
2. THE Portfolio_Site SHALL use the Next.js Image component for photos and imagery.
3. THE Portfolio_Site SHALL provide descriptive alt text for non-decorative images and mark decorative images with an empty alt attribute or `aria-hidden`.
4. THE Portfolio_Site SHALL use semantic HTML elements (nav, main, section, article, header, footer) to structure each page.
5. THE Portfolio_Site SHALL provide a visible focus indicator on interactive elements meeting WCAG 2.1 AA contrast.
6. THE Portfolio_Site SHALL ensure all interactive elements are reachable and operable via keyboard, with no keyboard focus trap outside of the mobile nav drawer and the lightbox dialog.

---

### Requirement 7: Technology Stack and Build

**User Story:** As the developer, I want the project to use a well-defined, maintainable tech stack, so that the site is easy to build, extend, and deploy.

#### Acceptance Criteria

1. THE Portfolio_Site SHALL be built using Next.js App Router with TypeScript for all source files.
2. THE Portfolio_Site SHALL use Tailwind CSS v4 (CSS-first configuration via `@theme` in `globals.css`) as the styling solution, with no additional CSS-in-JS libraries.
3. THE Portfolio_Site SHALL lint with ESLint's flat config spreading `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`, run via `npm run lint`.
4. WHEN `next build` is executed with TypeScript strict mode enabled, THE Portfolio_Site SHALL complete with zero TypeScript type errors and zero ESLint errors.
5. THE Portfolio_Site SHALL be deployable to Vercel by connecting the repository, with no environment variables required.
