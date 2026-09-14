# Implementation Plan: Portfolio Website

## Overview

Build Jimmy Nguyen's personal portfolio as a statically-rendered Next.js (App Router) application with TypeScript strict mode and Tailwind CSS. All content is authored as typed TypeScript data files. The implementation proceeds from project scaffolding and data layer, through shared navigation and UI components, through each page, and finishes with testing and accessibility validation.

## Tasks

- [x] 1. Scaffold project structure and configuration
  - [x] 1.1 Initialize Next.js App Router project with TypeScript strict mode and `--src-dir` flag
    - Run `npx create-next-app@latest` with flags: `--typescript`, `--tailwind`, `--app`, `--src-dir`, `--no-eslint` (ESLint configured manually in next step)
    - Verify `tsconfig.json` has `"strict": true`
    - _Requirements: 7.1, 7.2, 7.4_

  - [x] 1.2 Configure ESLint with `next/core-web-vitals` ruleset and fail-on-error build setting
    - Create `eslint.config.mjs` using the `next/core-web-vitals` flat config
    - Set `next.config.ts` to `eslint: { ignoreDuringBuilds: false }` so lint errors fail `next build`
    - _Requirements: 7.3, 7.4_

  - [x] 1.3 Configure Tailwind CSS theme tokens, fluid typography, and global focus styles
    - Extend `tailwind.config.ts` with `brand` color palette and `fontFamily` tokens
    - Add `clamp(0.875rem, 1.5vw, 1.25rem)` body font-size and `*:focus-visible` outline rule to `src/app/globals.css`
    - _Requirements: 2.1, 2.5, 6.5_

  - [x] 1.4 Set up Vitest, React Testing Library, fast-check, and jsdom test environment
    - Install `vitest`, `@vitejs/plugin-react`, `@testing-library/react`, `@testing-library/user-event`, `fast-check`, `jsdom`, `axe-core`
    - Create `vitest.config.ts` with jsdom environment, globals, and `@` path alias
    - Create `src/__tests__/setup.ts` with any global test setup (e.g., jest-dom matchers)
    - _Requirements: 7.4_

- [x] 2. Build the typed data layer
  - [x] 2.1 Create `src/lib/data/experience.ts` — `WorkExperience` interface and sample data array
    - Define `WorkExperience` interface with `title`, `company`, `startDate`, `endDate`, `description`, `location?` fields
    - Export a `experience: WorkExperience[]` constant with at least 2 placeholder entries
    - _Requirements: 3.2, 3.5_

  - [x] 2.2 Create `src/lib/data/skills.ts` — `Skill`, `SkillCategory` interfaces and sample data
    - Define `Skill` and `SkillCategory` interfaces
    - Export a `skillCategories: SkillCategory[]` constant with at least 3 named categories
    - _Requirements: 3.3_

  - [x] 2.3 Create `src/lib/data/education.ts` — `Education` interface and sample data array
    - Define `Education` interface with `institution`, `degree`, `graduationYear`, `fieldOfStudy?` fields
    - Export an `education: Education[]` constant with at least 1 entry
    - _Requirements: 3.4_

  - [x] 2.4 Create `src/lib/data/destinations.ts` — `Destination` interface and sample data array
    - Define `Destination` interface with `name`, `description` (max 300 chars), `imagePath: string | null`, `imageAlt?` fields
    - Export a `destinations: Destination[]` constant with at least 3 entries (mix of with and without `imagePath`)
    - _Requirements: 4.1, 4.2, 4.3, 4.6_

  - [x] 2.5 Create `src/lib/data/projects.ts` — `Project` interface with tuple tag type and sample data
    - Define `Project` interface with `name`, `description` (max 200 chars), tuple `tags` type `[string, ...string[]] & { length: 1 | 2 | 3 | 4 | 5 }`, `demoUrl?`, `repoUrl?` fields
    - Export a `projects: Project[]` constant with at least 4 entries covering varied tags, demo, and repo URLs
    - _Requirements: 5.1, 5.2, 5.3_

  - [x] 2.6 Create `src/lib/utils/sort.ts` — `reverseChronological` utility function
    - Implement `reverseChronological(entries: WorkExperience[]): WorkExperience[]` treating `"present"` as `Number.MAX_SAFE_INTEGER`
    - _Requirements: 3.5_

  - [ ]* 2.7 Write property test for `reverseChronological` sort utility
    - **Property 5: Work experience entries are sorted reverse-chronologically**
    - **Validates: Requirements 3.5**
    - Use `fc.array(workExperienceArb, { minLength: 1 })` and assert each adjacent pair satisfies the ordering invariant
    - File: `src/__tests__/unit/sort.test.ts`

  - [ ]* 2.8 Write property tests for data constraint invariants (description lengths and tag count)
    - **Property 7: Destination description length ≤ 300 chars**
    - **Property 10: Project description ≤ 200 chars and tags count 1–5**
    - **Validates: Requirements 4.1, 5.1**
    - Assert over the actual exported data arrays (not generated data)
    - File: `src/__tests__/unit/data-constraints.test.ts`

- [x] 3. Build shared navigation components
  - [x] 3.1 Create `src/components/ui/FocusTrapper.tsx` — keyboard focus trap component
    - Implement a `"use client"` component that intercepts `Tab` / `Shift+Tab` `keydown` events and cycles focus among its focusable children
    - Accept `isActive: boolean` prop; only trap focus when `isActive` is true
    - _Requirements: 2.7_

  - [x] 3.2 Create `src/components/nav/NavLink.tsx` — active-state link wrapper
    - Mark as `"use client"` to use `usePathname()`
    - Apply bold weight and bottom-border active indicator class when `pathname === href`
    - _Requirements: 1.3, 1.4_

  - [x] 3.3 Create `src/components/nav/NavDesktop.tsx` — desktop horizontal nav
    - Server component; hidden below `md` breakpoint (`hidden md:flex`)
    - Render `NavLink` for `/`, `/resume`, `/travel`, `/projects`
    - _Requirements: 1.1, 1.2_

  - [x] 3.4 Create `src/components/nav/NavMobile.tsx` — hamburger menu with drawer
    - Mark as `"use client"`; manage `isOpen: boolean` state
    - Render `HamburgerButton` with `aria-expanded` and `aria-controls`; show/hide drawer within 300 ms using a CSS transition
    - Use `FocusTrapper` to trap keyboard focus within the drawer when open
    - Add a `useEffect` resize listener to auto-close the drawer at ≥ 768 px
    - Visible only below `md` breakpoint (`flex md:hidden`)
    - _Requirements: 2.2, 2.3, 2.6, 2.7_

  - [x] 3.5 Create `src/components/nav/Nav.tsx` — server component shell
    - Compose `NavDesktop` and `NavMobile` side by side in a `<nav>` element with `role="navigation"`
    - _Requirements: 1.1_

  - [x] 3.6 Wire `Nav` into `src/app/layout.tsx` root layout with semantic `<html>`, `<body>`, `<header>`, and `<main>` structure
    - Import Geist font variables; apply `font-sans` to body
    - Ensure `<Nav>` appears on every page
    - _Requirements: 1.1, 6.4_

  - [ ]* 3.7 Write property test for active NavLink indicator
    - **Property 1: Active navigation link matches current path**
    - **Validates: Requirements 1.4**
    - Mock `usePathname` with each of the four valid paths; assert exactly one `NavLink` has the active class, and its `href` equals the mocked pathname
    - File: `src/__tests__/unit/nav-active.test.tsx`

  - [ ]* 3.8 Write example tests for NavMobile open/close and hamburger accessibility
    - Verify hamburger button toggles `aria-expanded`; verify drawer appears/disappears; verify auto-close on resize to ≥ 768 px
    - **Property 4: Mobile nav drawer traps keyboard focus**
    - **Validates: Requirements 2.2, 2.3, 2.6, 2.7**
    - File: `src/__tests__/components/NavMobile.test.tsx`

- [x] 4. Implement the Home page
  - [x] 4.1 Create `src/app/page.tsx` — hero section with name and bio
    - Render a `<header>` with `<h1>Jimmy Nguyen</h1>` and a `<p>` bio (≤ 300 chars constant, can be inline or sourced from `src/lib/data/bio.ts`)
    - Use semantic HTML: `<main>` wrapping the hero content
    - _Requirements: 1.5, 6.4_

  - [ ] 4.2 Create `src/app/not-found.tsx` — 404 page
    - Render `<h1>404 – Page Not Found</h1>`, a descriptive message, and a `<Link href="/">Return home →</Link>`
    - _Requirements: 1.6_

- [x] 5. Implement the Resume page
  - [x] 5.1 Create `src/components/resume/ExperienceItem.tsx` and `ExperienceList.tsx`
    - `ExperienceItem` renders job title, company, date range, optional location, and description using semantic HTML (`<article>` or `<li>`)
    - `ExperienceList` accepts `WorkExperience[]` and maps to `ExperienceItem` components
    - _Requirements: 3.2_

  - [x] 5.2 Create `src/components/resume/SkillsSection.tsx` — skills grouped by category
    - Render each `SkillCategory` as a named group with its skills listed beneath
    - _Requirements: 3.3_

  - [x] 5.3 Create `src/components/resume/EducationList.tsx` — education entries
    - Render each `Education` entry with institution, degree, optional field of study, and graduation year
    - _Requirements: 3.4_

  - [x] 5.4 Create `src/components/ui/DownloadButton.tsx` — PDF download with error handling
    - Mark as `"use client"`; manage `error: boolean` state
    - On click, send a `fetch` HEAD request to `/resume.pdf`; if non-2xx, call `e.preventDefault()` and set `error = true`, rendering an inline error message
    - Render as `<a href="/resume.pdf" download>` when no error
    - _Requirements: 3.6, 3.7, 3.8_

  - [x] 5.5 Assemble `src/app/resume/page.tsx` — wire all resume components
    - Import `experience`, `skillCategories`, `education` from data layer; sort experience with `reverseChronological`
    - Compose `<section>` regions for Summary, Experience, Skills, Education each with `aria-labelledby` headings
    - Include `<DownloadButton />`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

  - [ ]* 5.6 Write property tests for resume component field rendering
    - **Property 6: Resume data items render all required fields**
    - **Validates: Requirements 3.2, 3.3, 3.4**
    - Use `fast-check` arbitraries to generate `WorkExperience`, `SkillCategory`, and `Education` values; assert all required fields appear in rendered output
    - Files: `src/__tests__/components/ExperienceItem.test.tsx`, `SkillsSection.test.tsx`, `EducationItem.test.tsx`

  - [ ]* 5.7 Write example tests for DownloadButton behavior
    - Test that a successful HEAD response triggers the download anchor; test that a non-2xx response prevents default and shows the error message
    - File: `src/__tests__/integration/download.test.tsx`

- [ ] 6. Checkpoint — ensure project builds and existing tests pass
  - Run `next build` and verify zero TypeScript and ESLint errors; run `vitest --run` and verify all tests pass. Ask the user if any issues arise.

- [x] 7. Implement the Travel page
  - [x] 7.1 Create `src/components/travel/DestinationCard.tsx` — destination card with image/placeholder
    - Use Next.js `<Image>` for destinations where `imagePath` is non-null; fall back to a placeholder `<div>` when `imagePath` is null or image fails to load (`onError` handler with `useState`)
    - Render location name as `<h2>` and description as `<p>`
    - Provide non-empty `alt` for non-null images; decorative placeholder has `alt=""`
    - _Requirements: 4.1, 4.2, 4.3, 6.2, 6.3_

  - [x] 7.2 Create `src/components/travel/DestinationGrid.tsx` — responsive grid wrapper
    - Render `DestinationCard` components in a `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6` container
    - _Requirements: 4.4, 4.5_

  - [x] 7.3 Assemble `src/app/travel/page.tsx` — destination count header and grid
    - Import `destinations` from data layer; render destination count above the grid as `<p>{destinations.length} destinations visited</p>`
    - _Requirements: 4.6_

  - [ ]* 7.4 Write property tests for DestinationCard image and placeholder rendering
    - **Property 8: Destination cards render the correct image representation**
    - **Property 12: Non-decorative images have non-empty alt text**
    - **Validates: Requirements 4.2, 4.3, 6.3**
    - Use `fast-check` to generate `Destination` values with and without `imagePath`; assert correct `<Image>` vs placeholder rendering and `alt` attribute content
    - File: `src/__tests__/components/DestinationCard.test.tsx`

  - [ ]* 7.5 Write property test for destination count display
    - **Property 9: Destination count equals the size of the destinations array**
    - **Validates: Requirements 4.6**
    - Generate arbitrary `Destination[]` arrays and assert the rendered count matches `array.length`
    - File: `src/__tests__/components/DestinationCount.test.tsx`

- [x] 8. Implement the Projects page
  - [x] 8.1 Create `src/components/projects/ProjectCard.tsx` — project card with links and tags
    - Render project name, description, up to 5 technology tags, and conditional `<a target="_blank" rel="noopener noreferrer">` links for `demoUrl` and `repoUrl`
    - _Requirements: 5.1, 5.2, 5.3_

  - [x] 8.2 Create `src/components/projects/TagFilter.tsx` — pill button tag filter UI
    - Derive unique tags from the passed `Project[]`; render one pill button per tag
    - Highlight the active tag; call `onTagSelect(tag)` / `onTagSelect(null)` on click
    - Accessible: each button has a descriptive `aria-label` or `aria-pressed` attribute
    - _Requirements: 5.6, 5.8_

  - [x] 8.3 Create `src/components/projects/ProjectsClient.tsx` — client island with filter state
    - Mark as `"use client"`; manage `activeTag: string | null` state
    - Compute filtered list inline on render (no `useEffect`)
    - Render `<TagFilter>`, filtered `<ProjectCard>` grid, and empty-state message (`role="status"`) when no projects match
    - Grid: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`
    - _Requirements: 5.4, 5.5, 5.6, 5.7, 5.8_

  - [x] 8.4 Assemble `src/app/projects/page.tsx` — pass full project list to client island
    - Import `projects` from data layer; pass as prop to `<ProjectsClient>`
    - _Requirements: 5.1_

  - [ ]* 8.5 Write property tests for tag filter correctness and invertibility
    - **Property 11: Tag filter is correct and invertible**
    - **Validates: Requirements 5.6, 5.7, 5.8**
    - Use `fast-check` to generate `Project[]` arrays and tag strings; assert filtering returns only matching projects and clearing restores full list
    - File: `src/__tests__/unit/filter.test.ts`

  - [ ]* 8.6 Write property tests for ProjectCard constraint and link rendering
    - **Property 10: Project data satisfies field-length and tag-count constraints**
    - **Validates: Requirements 5.1, 5.2, 5.3**
    - Generate `Project` values and assert `description.length ≤ 200`, `tags.length` between 1–5, and that `demoUrl`/`repoUrl` produce correct `<a>` elements
    - File: `src/__tests__/components/ProjectCard.test.tsx`

- [ ] 9. Checkpoint — ensure project builds and existing tests pass
  - Run `next build` and verify zero TypeScript and ESLint errors; run `vitest --run` and verify all tests pass. Ask the user if any issues arise.

- [ ] 10. Integration and accessibility tests
  - [ ] 10.1 Write page-level integration tests covering navigation presence, bio length, and 404
    - Assert `<Nav>` with correct links renders on each page
    - Assert bio text on Home page is ≤ 300 characters
    - Assert `not-found.tsx` renders the error message and home link
    - _Requirements: 1.1, 1.2, 1.5, 1.6_

  - [ ]* 10.2 Write property test for no horizontal overflow at any supported viewport width
    - **Property 2: No horizontal overflow at any supported viewport width**
    - **Validates: Requirements 2.4**
    - Generate integer viewport widths in [320, 2560]; render each page and assert `scrollWidth ≤ clientWidth`
    - File: `src/__tests__/integration/overflow.test.tsx`

  - [ ]* 10.3 Write property test for fluid body font-size bounds
    - **Property 3: Fluid body font size stays within bounds**
    - **Validates: Requirements 2.5**
    - Generate viewport widths in [320, 2560]; compute resolved `font-size` via CSS `clamp` and assert it falls within [14px, 20px]
    - File: `src/__tests__/integration/typography.test.tsx`

  - [ ]* 10.4 Write accessibility integration tests with axe-core and semantic HTML assertions
    - Run `axe-core` scan on each rendered page and assert zero violations
    - Assert presence of `<nav>`, `<main>`, `<header>`, `<footer>`, `<section>`, and `<article>` elements on appropriate pages
    - File: `src/__tests__/integration/a11y.test.tsx`
    - _Requirements: 6.3, 6.4, 6.5, 6.6_

- [ ] 11. Add placeholder public assets
  - [ ] 11.1 Add `public/resume.pdf` placeholder and destination/project image directories
    - Create `public/images/destinations/` and `public/images/projects/` directories with a `.gitkeep`
    - Add a minimal placeholder `public/resume.pdf` so the download link resolves during development
    - _Requirements: 3.6, 3.7, 4.2_

- [ ] 12. Final checkpoint — full build and test suite validation
  - Run `next build`; verify zero TypeScript errors, zero ESLint errors, and a clean build output. Run `vitest --run`; verify all tests pass. Ask the user if any issues arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness invariants using `fast-check` with a minimum of 100 iterations per property
- Checkpoints at steps 6, 9, and 12 provide incremental build/test validation gates
- Content in the data files (`experience.ts`, `skills.ts`, etc.) uses placeholder entries — Jimmy should replace them with real content before deploying
- The `public/resume.pdf` placeholder should be replaced with the actual resume PDF before deployment

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["1.3", "1.4"] },
    { "id": 2, "tasks": ["2.1", "2.2", "2.3", "2.4", "2.5"] },
    { "id": 3, "tasks": ["2.6", "3.1", "3.2"] },
    { "id": 4, "tasks": ["2.7", "2.8", "3.3", "3.4"] },
    { "id": 5, "tasks": ["3.5"] },
    { "id": 6, "tasks": ["3.6", "3.7", "3.8"] },
    { "id": 7, "tasks": ["4.1", "4.2", "5.1", "5.2", "5.3", "5.4"] },
    { "id": 8, "tasks": ["5.5", "7.1", "7.2", "8.1", "8.2"] },
    { "id": 9, "tasks": ["5.6", "5.7", "7.3", "8.3"] },
    { "id": 10, "tasks": ["7.4", "7.5", "8.4", "8.5", "8.6"] },
    { "id": 11, "tasks": ["10.1", "10.2", "10.3", "10.4", "11.1"] }
  ]
}
```
