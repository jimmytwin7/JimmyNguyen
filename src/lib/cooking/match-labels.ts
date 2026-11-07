import { PANTRY_STAPLES } from "./config";
import { ingredientMatchKey } from "./ingredient-normalizer";
import { boardItemsUsed } from "./recipe-matcher";
import type { PantryIngredient, RecipeMatch } from "./types";

/**
 * Plain-language labels for a match. Pure, so the UI and tests agree.
 *
 * The search ranks by board items used first, then match %, then fewest missing
 * (see compareBestMatch). Cards still lead with the shopping count.
 */

/** "Ready to cook", "Need 1 more", or "Need N more". */
export function readinessLabel(missingCount: number): string {
  if (missingCount <= 0) return "Ready to cook";
  return `Need ${missingCount} more`;
}

/**
 * Board items this recipe doesn't use, by name as the user entered them.
 * Staples are left out: they're assumed for every recipe, so "not used" would
 * be noise. Compared by match key, the same rule the scorer uses, so a board
 * "spaghetti" counts as used by a "Penne Pasta" line.
 */
export function unusedBoardItems(
  match: RecipeMatch,
  board: PantryIngredient[],
): string[] {
  const used = new Set(
    match.matchedIngredients.map((i) => ingredientMatchKey(i.name)),
  );
  return board
    .filter((item) => {
      const key = ingredientMatchKey(item.name);
      return key && !used.has(key) && !PANTRY_STAPLES.has(key);
    })
    .map((item) => item.name);
}

/** Why the best match won, in one short sentence. */
export function bestMatchReason(
  match: RecipeMatch,
  board: PantryIngredient[] = [],
): string {
  const used = boardItemsUsed(match);
  const total = used + unusedBoardItems(match, board).length;
  if (total <= 1) {
    const missing = match.missingIngredients.length;
    if (missing === 0) return "You have everything you need.";
    return `Only ${missing} ${missing === 1 ? "ingredient" : "ingredients"} to buy.`;
  }
  if (used === total) return `Uses all ${total} of your ingredients.`;
  return `Uses ${used} of your ${total} ingredients.`;
}
