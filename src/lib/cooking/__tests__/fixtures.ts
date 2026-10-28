import { normalizeIngredient } from "../ingredient-normalizer";
import type { PantryIngredient, Recipe, RecipeIngredient } from "../types";

export function ing(
  name: string,
  extra: Partial<RecipeIngredient> = {},
): RecipeIngredient {
  return { name, normalizedName: normalizeIngredient(name), ...extra };
}

export function recipe(
  id: string,
  ingredients: (string | RecipeIngredient)[],
  extra: Partial<Recipe> = {},
): Recipe {
  return {
    id,
    title: `Recipe ${id}`,
    sourceName: "TheMealDB",
    ingredients: ingredients.map((i) => (typeof i === "string" ? ing(i) : i)),
    instructions: [],
    ...extra,
  };
}

export function pantry(...names: string[]): PantryIngredient[] {
  return names.map((name) => ({
    id: normalizeIngredient(name),
    name,
    normalizedName: normalizeIngredient(name),
  }));
}

/** A TheMealDB lookup.php meal record. */
export function mealDbMeal(
  id: string,
  title: string,
  ingredients: [string, string][],
  extra: Record<string, unknown> = {},
) {
  const meal: Record<string, unknown> = {
    idMeal: id,
    strMeal: title,
    strCategory: "Miscellaneous",
    strArea: "Unknown",
    strInstructions: "Step one.\r\nStep two.",
    strMealThumb: `https://www.themealdb.com/images/media/meals/${id}.jpg`,
    strSource: null,
    ...extra,
  };
  for (let i = 1; i <= 20; i++) {
    meal[`strIngredient${i}`] = ingredients[i - 1]?.[0] ?? "";
    meal[`strMeasure${i}`] = ingredients[i - 1]?.[1] ?? "";
  }
  return meal;
}
