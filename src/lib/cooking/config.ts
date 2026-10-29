import type { DietaryFilter } from "./types";

/** Display name — kept in one place so it's easy to rename. */
export const PROJECT_NAME = "Scrambl";

/** Input limits, enforced in the UI and again on the server. */
export const MAX_PANTRY_INGREDIENTS = 15;
export const MAX_INGREDIENT_LENGTH = 40;

/**
 * TheMealDB's free tier only filters by one ingredient per request, so a search
 * fans out to at most this many pantry ingredients, merges the candidates, and
 * scores them locally.
 */
export const MAX_PROVIDER_QUERIES = 3;

/** Candidate recipes whose full details are fetched and scored per search. */
export const MAX_DETAIL_LOOKUPS = 12;

export const UPSTREAM_TIMEOUT_MS = 6000;

export const DIETARY_FILTERS: { value: DietaryFilter; label: string }[] = [
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
  { value: "dairy-free", label: "Dairy-free" },
  { value: "gluten-free", label: "Gluten-free" },
];

export const DIETARY_FILTER_VALUES: ReadonlySet<string> = new Set(
  DIETARY_FILTERS.map((f) => f.value),
);

/**
 * Pantry staples that may be assumed available when the user opts in. Kept
 * deliberately tiny: things nearly every kitchen has and that rarely define a
 * dish. Expressed as match keys (see ingredient-normalizer.ts).
 */
export const PANTRY_STAPLES: ReadonlySet<string> = new Set([
  "salt",
  "pepper",
  "black pepper",
  "water",
]);
