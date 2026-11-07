import { PANTRY_STAPLES } from "../config";
import { INGREDIENT_ASSET_KEYS } from "../ingredient-assets";
import { validateIngredientName } from "../validation";
import type { RecipeCatalog } from "./catalog";

/**
 * Server-only. Autocomplete suggestions built from the recipe catalog, so
 * every suggestion finds at least one recipe (the old hardcoded list offered
 * "pasta", which matched nothing).
 *
 * Imported by the /cooking server component, never by client components; the
 * result is a plain list of ingredient names passed down as a prop, not recipe
 * data. Built at prerender time, so the page stays static.
 */

/** Ingredients used by fewer recipes than this aren't suggested. */
export const MIN_SUGGESTION_RECIPES = 2;

/**
 * Catalog ingredient keys used by at least MIN_SUGGESTION_RECIPES recipes, plus
 * any ingredient with art that appears in the catalog at all. Staples are left
 * out (they're always assumed) and every name passes the same validation as
 * user input. Most-used first, then A–Z, so the combobox shows the likeliest
 * matches first. Empty when there's no catalog (search is unavailable then too).
 */
export function buildSuggestions(
  catalog: RecipeCatalog,
  minRecipes = MIN_SUGGESTION_RECIPES,
): string[] {
  if (!catalog.available) return [];

  const withArt = new Set(INGREDIENT_ASSET_KEYS);
  const counted: [string, number][] = [];
  for (const [key, recipes] of catalog.index) {
    const count = recipes.length;
    if (count < minRecipes && !(count > 0 && withArt.has(key))) continue;
    if (PANTRY_STAPLES.has(key)) continue;
    if (!validateIngredientName(key).ok) continue;
    counted.push([key, count]);
  }
  return counted
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([key]) => key);
}
