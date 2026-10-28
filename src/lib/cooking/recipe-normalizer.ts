import { normalizeIngredient } from "./ingredient-normalizer";
import type { Recipe, RecipeIngredient } from "./types";

/**
 * Converts TheMealDB records into the internal Recipe model. Pure and
 * defensive: malformed records return null, missing optional fields are left
 * undefined, and nothing is invented (no times, servings, or steps the source
 * didn't supply).
 */

export const MEALDB_SOURCE_NAME = "TheMealDB";

/** Only allow http(s) URLs through, so a bad record can't inject `javascript:`. */
export function safeHttpUrl(value: unknown): string | undefined {
  if (typeof value !== "string" || !value.trim()) return undefined;
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.toString()
      : undefined;
  } catch {
    return undefined;
  }
}

const text = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim() ? value.trim() : undefined;

/**
 * Split TheMealDB's single instruction blob into steps on line breaks.
 * This only segments the source text — it never rewrites or adds steps.
 * Drops empty lines and bare "STEP 3" headings, and strips leading numbering
 * ("1.", "Step 2:") since the UI numbers steps itself.
 */
export function splitInstructions(raw: unknown): string[] {
  if (typeof raw !== "string") return [];
  return raw
    .split(/\r?\n/)
    .map((line) =>
      line
        .trim()
        .replace(/^[▢•*-]\s*/, "")
        .replace(/^(step\s*)?\d+\s*[:.)-]\s*/i, "")
        .trim(),
    )
    .filter((line) => line && !/^step\s*\d+$/i.test(line));
}

/** Collect strIngredient1..20 / strMeasure1..20 pairs, skipping blanks. */
function extractIngredients(meal: Record<string, unknown>): RecipeIngredient[] {
  const out: RecipeIngredient[] = [];
  for (let i = 1; i <= 20; i++) {
    const name = text(meal[`strIngredient${i}`]);
    if (!name) continue;
    const normalizedName = normalizeIngredient(name);
    if (!normalizedName) continue;
    out.push({ name, normalizedName, quantity: text(meal[`strMeasure${i}`]) });
  }
  return out;
}

/** Normalize a full `lookup.php` meal record. Returns null if unusable. */
export function normalizeMealDbMeal(raw: unknown): Recipe | null {
  if (typeof raw !== "object" || raw === null) return null;
  const meal = raw as Record<string, unknown>;
  const id = text(meal.idMeal);
  const title = text(meal.strMeal);
  if (!id || !/^\d+$/.test(id) || !title) return null;

  return {
    id: `mealdb-${id}`,
    title,
    imageUrl: safeHttpUrl(meal.strMealThumb),
    sourceName: MEALDB_SOURCE_NAME,
    sourceUrl: safeHttpUrl(meal.strSource),
    providerUrl: `https://www.themealdb.com/meal/${id}`,
    category: text(meal.strCategory),
    area: text(meal.strArea),
    ingredients: extractIngredients(meal),
    instructions: splitInstructions(meal.strInstructions),
    // TheMealDB supplies no prep/cook time or servings; left undefined.
  };
}

/** Pull candidate ids out of a `filter.php` response. */
export function extractMealDbIds(raw: unknown): string[] {
  if (typeof raw !== "object" || raw === null) return [];
  const meals = (raw as { meals?: unknown }).meals;
  if (!Array.isArray(meals)) return [];
  return meals
    .map((m) =>
      typeof m === "object" && m !== null
        ? text((m as Record<string, unknown>).idMeal)
        : undefined,
    )
    .filter((id): id is string => !!id && /^\d+$/.test(id));
}
