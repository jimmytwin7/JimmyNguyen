# Requirements Document

## Introduction

A personal portfolio website for Jimmy Nguyen, built with Next.js (TypeScript) and Tailwind CSS. The site follows a mobile-first responsive design and consists of three primary pages: Resume/Skills/Experience, Travel, and Projects. The site serves as a professional and personal showcase, giving visitors a comprehensive view of Jimmy's background, skills, work, and adventures.

## Glossary

- **Portfolio_Site**: The Next.js TypeScript web application being built
- **Navigation**: The top-level nav bar providing links to all pages
- **Resume_Page**: The page displaying professional experience, skills, and education
- **Travel_Page**: The page showcasing travel history, destinations, and stories
- **Projects_Page**: The page showcasing personal and professional software projects
- **Visitor**: Any person viewing the portfolio website
- **Viewport**: The visible area of the browser window

## Requirements

---

### Requirement 1: Site Structure and Navigation

**User Story:** As a visitor, I want to navigate between the pages of the portfolio, so that I can easily find the information I am looking for.

#### Acceptance Criteria

1. THE Portfolio_Site SHALL include a persistent Navigation bar visible on all pages.
2. THE Navigation SHALL contain links to the Resume, Travel, and Projects pages.
3. WHEN a Visitor clicks a Navigation link, THE Portfolio_Site SHALL route to the corresponding page without a full page reload.
4. WHILE a Visitor is on a given page, THE Navigation SHALL visually distinguish the active page link from inactive links using a persistent visual indicator (e.g., underline, bold weight, or contrasting style).
5. THE Portfolio_Site SHALL include a home/landing section containing the site owner's name and a bio of no more than 300 characters, accessible at the root path (/).
6. IF a Visitor navigates to a route not defined in the application, THEN THE Portfolio_Site SHALL display a 404 page containing an error message and a navigable link to the root path (/).

---

### Requirement 2: Responsive and Mobile-First Layout

**User Story:** As a visitor on any device, I want the portfolio to display correctly on my screen, so that I can read content comfortably without horizontal scrolling or broken layouts.

#### Acceptance Criteria

1. THE Portfolio_Site SHALL apply a mobile-first CSS strategy using Tailwind CSS responsive breakpoints (sm, md, lg, xl).
2. THE Navigation SHALL collapse into a hamburger menu on viewports narrower than 768px.
3. WHEN the hamburger menu icon is activated, THE Navigation SHALL display the full menu as a dropdown or slide-in drawer within 300ms.
4. THE Portfolio_Site SHALL render all page layouts without horizontal overflow on viewports as narrow as 320px and as wide as 2560px.
5. THE Portfolio_Site SHALL use fluid typography such that body text renders at a minimum of 14px and a maximum of 20px across all supported viewport sizes.
6. WHEN the viewport width expands to 768px or above while the mobile menu is open, THE Navigation SHALL automatically dismiss the mobile menu and display the desktop navigation.
7. WHILE the mobile navigation drawer is open, THE Portfolio_Site SHALL trap keyboard focus within the drawer until it is dismissed.

---

### Requirement 3: Resume / Skills / Experience Page

**User Story:** As a recruiter or collaborator, I want to view the professional background, skills, and experience, so that I can assess the qualifications.

#### Acceptance Criteria

1. THE Resume_Page SHALL display a professional summary or bio section at the top of the page.
2. THE Resume_Page SHALL display a work experience section listing each role with job title, company name, employment dates, and a description of responsibilities or achievements.
3. THE Resume_Page SHALL display a skills section organized into named categories, where each category groups related skills under a distinct label (e.g., Languages, Frameworks, Tools).
4. THE Resume_Page SHALL display an education section listing institutions, degrees, and graduation years.
5. THE Resume_Page SHALL present work experience entries in reverse chronological order (most recent first).
6. THE Resume_Page SHALL include a visible download link that references a PDF version of the resume.
7. WHEN a Visitor clicks the download link, THE Portfolio_Site SHALL initiate a direct file download of the resume PDF without navigating away from the page.
8. IF the resume PDF file is unavailable when a Visitor clicks the download link, THEN THE Portfolio_Site SHALL display an error message indicating that the file could not be downloaded.

---

### Requirement 4: Travel Page

**User Story:** As a visitor, I want to explore the travel history and stories, so that I can learn about the places visited and the experiences.

#### Acceptance Criteria

1. THE Travel_Page SHALL display a collection of visited destinations, each represented as a card or entry containing at minimum a location name and a description of no more than 300 characters.
2. WHERE a photo is available for a destination, THE Travel_Page SHALL display a representative image for that destination.
3. IF no photo is available for a destination, THEN THE Travel_Page SHALL display a placeholder image or a visually consistent fallback element in place of the destination image.
4. WHILE the viewport width is greater than or equal to 768px, THE Travel_Page SHALL present destination cards in a multi-column grid layout with a minimum of 2 columns.
5. WHILE the viewport width is less than 768px, THE Travel_Page SHALL stack destination cards in a single-column layout.
6. THE Travel_Page SHALL display the total number of unique destinations visited as a numeric count, placed above the destination collection.

---

### Requirement 5: Projects Page

**User Story:** As a recruiter or fellow developer, I want to view the portfolio of projects, so that I can evaluate the breadth and depth of the technical work.

#### Acceptance Criteria

1. THE Projects_Page SHALL display a collection of projects, each with a project name, a short description of no more than 200 characters, and up to 5 primary technology tags.
2. WHERE a live demo URL is available, THE Projects_Page SHALL display a link to the live demo that opens in a new browser tab.
3. WHERE a source code repository URL is available, THE Projects_Page SHALL display a link to the repository that opens in a new browser tab.
4. THE Projects_Page SHALL display projects in a card-based grid layout of at least 2 columns on desktop viewports (768px and above).
5. THE Projects_Page SHALL display projects in a single-column card layout on mobile viewports (below 768px).
6. WHEN a Visitor selects a single technology tag filter, THE Projects_Page SHALL update the displayed project list to show only projects that include that tag, without a full page reload.
7. IF no projects match the selected technology tag filter, THEN THE Projects_Page SHALL display a message indicating no projects were found for that selection.
8. WHEN a Visitor clears the active technology tag filter, THE Projects_Page SHALL restore the full unfiltered list of projects without a full page reload.

---

### Requirement 6: Performance and Accessibility

**User Story:** As a visitor, I want the portfolio to load quickly and be accessible, so that I have a good experience regardless of my connection speed or assistive technology.

#### Acceptance Criteria

1. THE Portfolio_Site SHALL achieve a Lighthouse performance score of 90 or above on desktop and 70 or above on mobile.
2. THE Portfolio_Site SHALL use Next.js Image component for all images to enable automatic optimization and lazy loading.
3. THE Portfolio_Site SHALL provide descriptive alt text for all non-decorative images, and decorative images SHALL have an empty alt attribute.
4. THE Portfolio_Site SHALL use semantic HTML elements (nav, main, section, article, header, footer) to structure each page.
5. THE Portfolio_Site SHALL ensure all interactive elements (links, buttons) have a focus indicator with a visible outline of at least 2px solid that meets WCAG 2.1 AA contrast requirements.
6. THE Portfolio_Site SHALL ensure color contrast between text and background meets WCAG 2.1 AA standards (minimum 4.5:1 ratio for normal text, and minimum 3:1 ratio for large text).
7. THE Portfolio_Site SHALL ensure all interactive elements are reachable and operable via keyboard navigation using the Tab key, and no keyboard focus trap exists except within modal dialogs.

---

### Requirement 7: Technology Stack and Build

**User Story:** As the developer, I want the project to use a well-defined, maintainable tech stack, so that the site is easy to build, extend, and deploy.

#### Acceptance Criteria

1. THE Portfolio_Site SHALL be built using Next.js App Router with TypeScript for all source files.
2. THE Portfolio_Site SHALL use Tailwind CSS as the sole styling solution, with no additional CSS-in-JS libraries.
3. THE Portfolio_Site SHALL use ESLint configured with the next/core-web-vitals ruleset, with lint errors configured to fail the build.
4. WHEN the build command (next build) is executed with TypeScript strict mode enabled, THE Portfolio_Site SHALL complete with zero TypeScript type errors and zero ESLint errors.
5. THE Portfolio_Site SHALL be deployable to Vercel with zero changes to Vercel build settings, framework preset, or output directory configuration beyond connecting the repository.
