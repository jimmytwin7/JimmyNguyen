import { MAX_RESULTS, PANTRY_STAPLES } from "../config";
import { filterByDiet } from "../dietary-filter";
import {
  ingredientMatchKey,
  normalizeIngredient,
} from "../ingredient-normalizer";
import { MEALDB_SOURCE_NAME } from "../recipe-normalizer";
import { compareBestMatch, scoreRecipe } from "../recipe-matcher";
import type {
  PantryIngredient,
  Recipe,
  RecipeMatch,
  RecipeSearchResponse,
} from "../types";
import type { RecipeSearchParams } from "../validation";
import type { RecipeCatalog } from "./catalog";

export function toPantry(names: string[]): PantryIngredient[] {
  return names.map((name) => {
    const normalizedName = normalizeIngredient(name);
    return { id: normalizedName.replace(/ /g, "-"), name, normalizedName };
  });
}

/** True if the match uses a board ingredient that isn't an assumed staple. */
function hasRealMatch(match: RecipeMatch): boolean {
  return match.matchedIngredients.some(
    (i) => !PANTRY_STAPLES.has(ingredientMatchKey(i.name)),
  );
}

/**
 * Score the whole catalog against the board. No network calls.
 *
 * 1. Candidates: recipes sharing at least one non-staple match key with the
 *    board, found through the catalog's inverted index. (Staples are assumed
 *    for everyone, so they can't make a recipe relevant on their own.)
 * 2. Apply dietary filters to every candidate.
 * 3. Score each one with staples assumed.
 * 4. Keep recipes that match a real (non-staple) board ingredient.
 * 5. Rank with compareBestMatch and keep the top MAX_RESULTS.
 */
export function searchRecipes(
  params: RecipeSearchParams,
  catalog: RecipeCatalog,
): RecipeSearchResponse {
  const pantry = toPantry(params.ingredients);
  const boardKeys = new Set(
    pantry
      .map((p) => ingredientMatchKey(p.name))
      .filter((key) => key && !PANTRY_STAPLES.has(key)),
  );

  const candidateIndices = new Set<number>();
  for (const key of boardKeys) {
    for (const i of catalog.index.get(key) ?? []) candidateIndices.add(i);
  }
  const candidates: Recipe[] = [...candidateIndices]
    .sort((a, b) => a - b)
    .map((i) => catalog.recipes[i]);

  const { kept, removedCount } = filterByDiet(candidates, params.diet);
  const matches = kept
    .map((recipe) => scoreRecipe(recipe, pantry))
    .filter(hasRealMatch)
    .sort(compareBestMatch)
    .slice(0, MAX_RESULTS);

  return {
    matches,
    meta: {
      provider: MEALDB_SOURCE_NAME,
      recipeCount: catalog.recipes.length,
      candidateCount: candidates.length,
      filteredOutCount: removedCount,
      catalogDate: catalog.generatedAt,
    },
  };
}
