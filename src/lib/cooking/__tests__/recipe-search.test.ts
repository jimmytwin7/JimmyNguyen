import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { MAX_RESULTS, PANTRY_STAPLES } from "../config";
import { filterByDiet } from "../dietary-filter";
import { ingredientMatchKey } from "../ingredient-normalizer";
import { compareBestMatch, scoreRecipe } from "../recipe-matcher";
import { buildCatalog } from "../server/catalog";
import { searchRecipes, toPantry } from "../server/recipe-search";
import type { DietaryFilter } from "../types";
import { mealDbMeal } from "./fixtures";

type Line = [string, string];
const meal = (
  id: string,
  title: string,
  names: string[],
  extra: Record<string, unknown> = {},
) =>
  mealDbMeal(
    id,
    title,
    names.map((n): Line => [n, "1"]),
    extra,
  );

const catalogOf = (meals: Record<string, unknown>[]) =>
  buildCatalog({
    generatedAt: "2025-01-01T00:00:00.000Z",
    source: "test-key",
    meals,
  });

const ids = (r: ReturnType<typeof searchRecipes>) =>
  r.matches.map((m) => m.recipe.id);

describe("searchRecipes", () => {
  it("ranks board items used first, then match %, then fewest missing, then title", () => {
    const catalog = catalogOf([
      // 1 missing, 2 of 3 = 67%
      meal("1", "Zucchini Rice", ["Rice", "Zucchini", "Leek"]),
      // 0 missing
      meal("2", "Plain Rice", ["Rice", "Salt"]),
      // 1 missing, 1 of 2 = 50%
      meal("3", "Leek Rice", ["Rice", "Leek"]),
      // 1 missing, 67%, ties with #1 on everything but the title
      meal("4", "Apple Rice", ["Rice", "Zucchini", "Apple"]),
    ]);
    const result = searchRecipes(
      { ingredients: ["rice", "zucchini"], diet: [] },
      catalog,
    );
    expect(ids(result)).toEqual([
      "mealdb-4",
      "mealdb-1",
      "mealdb-2",
      "mealdb-3",
    ]);
    expect(result.meta).toEqual({
      provider: "TheMealDB",
      recipeCount: 4,
      candidateCount: 4,
      filteredOutCount: 0,
      catalogDate: "2025-01-01T00:00:00.000Z",
    });
  });

  it("needs at least one real (non-staple) board match", () => {
    const catalog = catalogOf([
      meal("1", "Salted Water", ["Salt", "Water", "Olive Oil"]),
      meal("2", "Rice", ["Rice", "Salt"]),
    ]);
    // Staples on the board don't make a recipe relevant.
    expect(
      ids(
        searchRecipes(
          { ingredients: ["salt", "olive oil"], diet: [] },
          catalog,
        ),
      ),
    ).toEqual([]);
    expect(
      ids(searchRecipes({ ingredients: ["salt", "rice"], diet: [] }, catalog)),
    ).toEqual(["mealdb-2"]);
  });

  it("applies diet filters across the catalog before taking the top results", () => {
    // 15 perfect beef matches would fill the top 12 on their own, then two
    // vegetarian ones that only rank below them.
    const beef = Array.from({ length: 15 }, (_, i) =>
      meal(String(100 + i), `Beef ${i}`, ["Rice", "Beef"], {
        strCategory: "Beef",
      }),
    );
    const veg = [
      meal("200", "Veg A", ["Rice", "Leek"], { strCategory: "Vegetarian" }),
      meal("201", "Veg B", ["Rice", "Leek", "Kale"], {
        strCategory: "Vegetarian",
      }),
    ];
    const catalog = catalogOf([...beef, ...veg]);
    const all = searchRecipes(
      { ingredients: ["rice", "beef"], diet: [] },
      catalog,
    );
    expect(all.matches).toHaveLength(MAX_RESULTS);
    expect(ids(all)).not.toContain("mealdb-200");

    const vegetarian = searchRecipes(
      { ingredients: ["rice", "beef"], diet: ["vegetarian"] },
      catalog,
    );
    expect(ids(vegetarian)).toEqual(["mealdb-200", "mealdb-201"]);
    expect(vegetarian.meta.filteredOutCount).toBe(15);
    expect(vegetarian.meta.candidateCount).toBe(17);
  });

  it("returns at most MAX_RESULTS", () => {
    const catalog = catalogOf(
      Array.from({ length: 40 }, (_, i) =>
        meal(String(i + 1), `Rice ${i}`, ["Rice"]),
      ),
    );
    const result = searchRecipes({ ingredients: ["rice"], diet: [] }, catalog);
    expect(result.matches).toHaveLength(MAX_RESULTS);
    expect(result.meta.candidateCount).toBe(40);
  });

  it("assumes staple variants but not flavoring oils", () => {
    const catalog = catalogOf([
      meal("1", "Pasta", [
        "Spaghetti",
        "Extra Virgin Olive Oil",
        "Sea Salt",
        "Cold Water",
      ]),
      meal("2", "Noodles", ["Spaghetti", "Sesame Seed Oil"]),
      meal("3", "Spicy", ["Spaghetti", "Chilli Oil"]),
    ]);
    const result = searchRecipes(
      { ingredients: ["spaghetti"], diet: [] },
      catalog,
    );
    expect(ids(result)).toEqual(["mealdb-1", "mealdb-2", "mealdb-3"]);
    const [pasta, noodles, spicy] = result.matches;
    expect(pasta.matchPercentage).toBe(100);
    expect(pasta.assumedIngredients).toHaveLength(3);
    expect(noodles.missingIngredients.map((i) => i.name)).toEqual([
      "Sesame Seed Oil",
    ]);
    expect(spicy.missingIngredients.map((i) => i.name)).toEqual(["Chilli Oil"]);
  });

  it("returns nothing for an empty catalog", () => {
    const result = searchRecipes(
      { ingredients: ["rice"], diet: [] },
      buildCatalog({ source: "test-key", meals: [] }),
    );
    expect(result.matches).toEqual([]);
    expect(result.meta.recipeCount).toBe(0);
  });
});

describe("searchRecipes (property)", () => {
  const NAMES = [
    "Rice",
    "Chicken",
    "Beef",
    "Leek",
    "Kale",
    "Butter",
    "Eggs",
    "Flour",
    "Salt",
    "Olive Oil",
    "Water",
    "Sesame Seed Oil",
    "Egg Plants",
    "Tofu",
    "Milk",
  ];
  const CATEGORIES = ["Beef", "Vegetarian", "Dessert", "Seafood", "Side"];
  const DIETS: DietaryFilter[] = [
    "vegetarian",
    "vegan",
    "dairy-free",
    "gluten-free",
  ];

  const mealArb = fc.record({
    title: fc.constantFrom("Alpha", "Beta", "Gamma", "Delta", "Alpha"),
    names: fc.uniqueArray(fc.constantFrom(...NAMES), {
      minLength: 0,
      maxLength: 8,
    }),
    category: fc.constantFrom(...CATEGORIES),
  });

  it("equals a brute-force top 12 over the whole catalog", () => {
    fc.assert(
      fc.property(
        fc.array(mealArb, { maxLength: 40 }),
        fc.uniqueArray(fc.constantFrom(...NAMES.map((n) => n.toLowerCase())), {
          minLength: 1,
          maxLength: 6,
        }),
        fc.subarray(DIETS),
        (meals, board, diet) => {
          const catalog = catalogOf(
            meals.map((m, i) =>
              meal(String(i + 1), m.title, m.names, {
                strCategory: m.category,
              }),
            ),
          );
          const pantry = toPantry(board);
          const brute = filterByDiet([...catalog.recipes], diet)
            .kept.map((r) => scoreRecipe(r, pantry))
            .filter((m) =>
              m.matchedIngredients.some(
                (i) => !PANTRY_STAPLES.has(ingredientMatchKey(i.name)),
              ),
            )
            .sort(compareBestMatch)
            .slice(0, MAX_RESULTS);
          const result = searchRecipes({ ingredients: board, diet }, catalog);
          expect(ids(result)).toEqual(brute.map((m) => m.recipe.id));
          expect(result.matches).toEqual(brute);
        },
      ),
      { numRuns: 200 },
    );
  });
});
