import { PANTRY_STAPLES } from "./config";
import { ingredientMatchKey } from "./ingredient-normalizer";
import type {
  PantryIngredient,
  Recipe,
  RecipeIngredient,
  RecipeMatch,
} from "./types";

/**
 * "salt", "salt and olive oil", "salt, olive oil and 2 more": at most `max`
 * names, so the explanation stays one short line.
 */
export function namedList(names: string[], max = 2): string {
  if (names.length <= 1) return names[0] ?? "";
  if (names.length <= max) return names.join(" and ");
  return `${names.slice(0, max).join(", ")} and ${names.length - max} more`;
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
 * Pantry staples (PANTRY_STAPLES: salt, pepper, water, cooking oils) are
 * always assumed available; they count toward the score and are listed in
 * `assumedIngredients` unless the user put them on the board.
 *
 * This is *ingredient coverage* — not a prediction of taste or success.
 * Pure function: identical inputs always give identical output.
 */
export function scoreRecipe(
  recipe: Recipe,
  pantry: PantryIngredient[],
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
    else if (PANTRY_STAPLES.has(key)) assumedIngredients.push(ingredient);
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
      (u) => pantryKeys.has(u.key) || PANTRY_STAPLES.has(u.key),
    ).length;
    score = 0.8 * requiredCoverage + 0.2 * (coreHave / core.length);
  }

  const matchPercentage = Math.round(score * 100);
  const noun = total === 1 ? "ingredient" : "ingredients";
  let scoreExplanation = `You have ${have} of ${total} listed ${noun}`;
  if (assumedIngredients.length > 0) {
    scoreExplanation += ` (${namedList(
      assumedIngredients.map((i) => i.name.toLowerCase()),
    )} assumed)`;
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

/**
 * How many of the user's board items this recipe uses. Staples don't count
 * (they're assumed for every recipe, so they can't set one apart). Matched
 * lines are already de-duplicated by match key, so each is one board item.
 */
export function boardItemsUsed(match: RecipeMatch): number {
  return match.matchedIngredients.filter(
    (i) => !PANTRY_STAPLES.has(ingredientMatchKey(i.name)),
  ).length;
}

/**
 * "best": most board items used, then highest match %, then fewest missing,
 * then title, then id. "percentage": highest match % first. "title": A–Z. Ties
 * always fall back to title, then id, so every order is total and
 * deterministic.
 */
export type SortOrder = "best" | "percentage" | "title";

function byTitle(a: RecipeMatch, b: RecipeMatch): number {
  return (
    a.recipe.title.localeCompare(b.recipe.title) ||
    a.recipe.id.localeCompare(b.recipe.id)
  );
}

/**
 * The search ranking:
 * 1. most board items used (a recipe that uses your pasta AND your onion beats
 *    one that only uses the onion),
 * 2. highest ingredient match %,
 * 3. fewest ingredients left to buy,
 * 4. title, then id.
 */
export function compareBestMatch(a: RecipeMatch, b: RecipeMatch): number {
  return (
    boardItemsUsed(b) - boardItemsUsed(a) ||
    b.matchPercentage - a.matchPercentage ||
    a.missingIngredients.length - b.missingIngredients.length ||
    byTitle(a, b)
  );
}

/** Sorted copy of `matches`; the input is not mutated. */
export function sortMatches(
  matches: RecipeMatch[],
  order: SortOrder,
): RecipeMatch[] {
  return [...matches].sort((a, b) => {
    if (order === "best") return compareBestMatch(a, b);
    if (order === "percentage")
      return b.matchPercentage - a.matchPercentage || byTitle(a, b);
    return byTitle(a, b);
  });
}
