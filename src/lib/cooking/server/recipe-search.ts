import {
  MAX_DETAIL_LOOKUPS,
  MAX_PROVIDER_QUERIES,
  PANTRY_STAPLES,
} from "../config";
import { filterByDiet } from "../dietary-filter";
import {
  ingredientMatchKey,
  normalizeIngredient,
} from "../ingredient-normalizer";
import { scoreRecipe, sortMatches } from "../recipe-matcher";
import type { PantryIngredient, RecipeSearchResponse } from "../types";
import type { RecipeSearchParams } from "../validation";
import { UpstreamError, type RecipeProvider } from "./themealdb";

/**
 * Ingredients so common they make poor search seeds (they appear in hundreds
 * of recipes and say little about the dish). Queried last, if at all.
 */
const LOW_SIGNAL = new Set([
  ...PANTRY_STAPLES,
  "oil",
  "olive oil",
  "vegetable oil",
  "sugar",
  "butter",
  "garlic",
  "onion",
  "flour",
]);

export function toPantry(names: string[]): PantryIngredient[] {
  return names.map((name) => {
    const normalizedName = normalizeIngredient(name);
    return { id: normalizedName.replace(/ /g, "-"), name, normalizedName };
  });
}

/** Pick the most distinctive pantry items to seed the provider queries. */
export function pickQueryIngredients(
  names: string[],
  max = MAX_PROVIDER_QUERIES,
): string[] {
  const distinctive = names.filter(
    (n) => !LOW_SIGNAL.has(ingredientMatchKey(n)),
  );
  const common = names.filter((n) => LOW_SIGNAL.has(ingredientMatchKey(n)));
  return [...distinctive, ...common].slice(0, max);
}

/**
 * Search → merge → detail → filter → score.
 *
 * 1. Query the provider once per seed ingredient (free tier = one at a time).
 * 2. Merge candidate ids, ranking those that appeared under more seeds first.
 * 3. Fetch details for the top candidates.
 * 4. Apply best-effort dietary filters, then score every recipe locally.
 *
 * Throws UpstreamError only if the provider failed completely; partial
 * failures are reported through `meta.partial`.
 */
export async function searchRecipes(
  params: RecipeSearchParams,
  provider: RecipeProvider,
): Promise<RecipeSearchResponse> {
  const seeds = pickQueryIngredients(params.ingredients);
  const seedResults = await Promise.allSettled(
    seeds.map((s) => provider.findCandidateIds(s)),
  );

  const fulfilled = seedResults.filter(
    (r): r is PromiseFulfilledResult<string[]> => r.status === "fulfilled",
  );
  if (fulfilled.length === 0) {
    const first = seedResults[0];
    throw first?.status === "rejected" && first.reason instanceof UpstreamError
      ? first.reason
      : new UpstreamError("network");
  }
  let partial = fulfilled.length < seedResults.length;

  // Rank candidates: appearance count desc, then first-seen order.
  const tally = new Map<string, { count: number; order: number }>();
  let order = 0;
  for (const { value } of fulfilled) {
    for (const id of new Set(value)) {
      const entry = tally.get(id);
      if (entry) entry.count += 1;
      else tally.set(id, { count: 1, order: order++ });
    }
  }
  const candidateIds = [...tally.entries()]
    .sort((a, b) => b[1].count - a[1].count || a[1].order - b[1].order)
    .slice(0, MAX_DETAIL_LOOKUPS)
    .map(([id]) => id);

  const emptyMeta = {
    provider: provider.name,
    queriedIngredients: seeds,
    filteredOutCount: 0,
    partial,
  };
  if (candidateIds.length === 0) return { matches: [], meta: emptyMeta };

  const detailResults = await Promise.allSettled(
    candidateIds.map((id) => provider.getRecipe(id)),
  );
  const recipes = detailResults.flatMap((r) =>
    r.status === "fulfilled" && r.value ? [r.value] : [],
  );
  if (detailResults.every((r) => r.status === "rejected")) {
    throw new UpstreamError("network");
  }
  if (detailResults.some((r) => r.status === "rejected")) partial = true;

  const { kept, removedCount } = filterByDiet(recipes, params.diet);
  const pantry = toPantry(params.ingredients);
  const matches = sortMatches(
    kept.map((recipe) =>
      scoreRecipe(recipe, pantry, { assumeStaples: params.assumeStaples }),
    ),
    "match",
  );

  return {
    matches,
    meta: { ...emptyMeta, filteredOutCount: removedCount, partial },
  };
}
