import type { DietaryFilter } from "./types";

/** Display name — kept in one place so it's easy to rename. */
export const PROJECT_NAME = "Scrambl";

/** Input limits, enforced in the UI and again on the server. */
export const MAX_PANTRY_INGREDIENTS = 15;
export const MAX_INGREDIENT_LENGTH = 40;

/**
 * Recipes returned per search: the best match plus up to 11 others,
 * picked from the whole catalog after dietary filters.
 */
export const MAX_RESULTS = 12;

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
 * Pantry staples, always assumed available when scoring. Kept deliberately
 * small: things nearly every kitchen has and that rarely define a dish.
 * Flavoring oils (sesame, chilli, truffle) are not staples. Expressed as match
 * keys (see ingredient-normalizer.ts), so "Extra Virgin Olive Oil" and "Ground
 * Black Pepper" resolve to "olive oil" and "black pepper".
 */
export const PANTRY_STAPLES: ReadonlySet<string> = new Set([
  "salt",
  "sea salt",
  "kosher salt",
  "pepper",
  "black pepper",
  "water",
  "cold water",
  "warm water",
  "hot water",
  "boiling water",
  "oil",
  "olive oil",
  "vegetable oil",
  "sunflower oil",
  "canola oil",
  "rapeseed oil",
]);
