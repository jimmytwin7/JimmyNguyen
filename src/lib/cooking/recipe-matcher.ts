import { PANTRY_STAPLES } from "./config";
import { ingredientMatchKey } from "./ingredient-normalizer";
import type {
  PantryIngredient,
  Recipe,
  RecipeIngredient,
  RecipeMatch,
} from "./types";

export interface MatchOptions {
  /** Treat PANTRY_STAPLES (salt, pepper, water) as available. */
  assumeStaples?: boolean;
}

/**
 * Deterministic ingredient-coverage score.
 *
 * Recipe ingredients are first de-duplicated by match key (a recipe listing
 * "olive oil" twice counts it once). Ingredients the source explicitly marks
 * `optional` are excluded from the denominator and listed separately.
 *
 *   requiredCoverage = matchedRequired / totalRequired
 *
 * If the source marks any ingredient as `core`, the score blends:
 *
 *   score = 0.8 * requiredCoverage + 0.2 * (matchedCore / totalCore)
 *
 * Otherwise (TheMealDB supplies neither flag) it's plain coverage:
 *
 *   matchPercentage = round(100 * matched / total)
 *
 * This is *ingredient coverage* — not a prediction of taste or success.
 * Pure function: identical inputs always give identical output.
 */
export function scoreRecipe(
  recipe: Recipe,
  pantry: PantryIngredient[],
  options: MatchOptions = {},
): RecipeMatch {
  const pantryKeys = new Set(pantry.map((p) => ingredientMatchKey(p.name)));

  // De-duplicate recipe lines by match key, keeping the first occurrence.
  const seen = new Set<string>();
  const unique: { ingredient: RecipeIngredient; key: string }[] = [];
  for (const ingredient of recipe.ingredients) {
    const key = ingredientMatchKey(ingredient.name);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    unique.push({ ingredient, key });
  }

  const required = unique.filter((u) => !u.ingredient.optional);
  const optionalIngredients = unique
    .filter((u) => u.ingredient.optional)
    .map((u) => u.ingredient);

  const matchedIngredients: RecipeIngredient[] = [];
  const assumedIngredients: RecipeIngredient[] = [];
  const missingIngredients: RecipeIngredient[] = [];

  for (const { ingredient, key } of required) {
    if (pantryKeys.has(key)) matchedIngredients.push(ingredient);
    else if (options.assumeStaples && PANTRY_STAPLES.has(key))
      assumedIngredients.push(ingredient);
    else missingIngredients.push(ingredient);
  }

  const total = required.length;
  const have = matchedIngredients.length + assumedIngredients.length;

  if (total === 0) {
    return {
      recipe,
      matchPercentage: 0,
      matchedIngredients,
      assumedIngredients,
      missingIngredients,
      optionalIngredients,
      scoreExplanation:
        "This recipe has no ingredient list to compare against.",
    };
  }

  const requiredCoverage = have / total;
  const core = required.filter((u) => u.ingredient.core);
  let score = requiredCoverage;
  if (core.length > 0) {
    const coreHave = core.filter(
      (u) =>
        pantryKeys.has(u.key) ||
        (options.assumeStaples && PANTRY_STAPLES.has(u.key)),
    ).length;
    score = 0.8 * requiredCoverage + 0.2 * (coreHave / core.length);
  }

  const matchPercentage = Math.round(score * 100);
  const noun = total === 1 ? "ingredient" : "ingredients";
  let scoreExplanation = `You have ${have} of ${total} listed ${noun}`;
  if (assumedIngredients.length > 0) {
    scoreExplanation += ` (including ${assumedIngredients.length} assumed pantry ${
      assumedIngredients.length === 1 ? "staple" : "staples"
    })`;
  }
  scoreExplanation += ".";

  return {
    recipe,
    matchPercentage,
    matchedIngredients,
    assumedIngredients,
    missingIngredients,
    optionalIngredients,
    scoreExplanation,
  };
}

export type SortOrder = "match" | "fewest-missing" | "title";

/** Stable sort of matches. Ties fall back to title, then id. */
export function sortMatches(
  matches: RecipeMatch[],
  order: SortOrder,
): RecipeMatch[] {
  const byTitle = (a: RecipeMatch, b: RecipeMatch) =>
    a.recipe.title.localeCompare(b.recipe.title) ||
    a.recipe.id.localeCompare(b.recipe.id);
  return [...matches].sort((a, b) => {
    if (order === "match")
      return b.matchPercentage - a.matchPercentage || byTitle(a, b);
    if (order === "fewest-missing")
      return (
        a.missingIngredients.length - b.missingIngredients.length ||
        b.matchPercentage - a.matchPercentage ||
        byTitle(a, b)
      );
    return byTitle(a, b);
  });
}
