import { describe, expect, it } from "vitest";
import { PANTRY_STAPLES } from "../config";
import { buildCatalog, UNAVAILABLE_CATALOG } from "../server/catalog";
import { buildSuggestions } from "../server/suggestions";
import { validateIngredientName } from "../validation";
import { mealDbMeal } from "./fixtures";

const meal = (id: string, names: string[]) =>
  mealDbMeal(
    id,
    `Recipe ${id}`,
    names.map((n) => [n, "1"]),
  );

const catalog = buildCatalog({
  source: "supporter",
  meals: [
    meal("1", ["Chicken", "Rice", "Salt", "Olive Oil", "Water"]),
    meal("2", ["Chicken", "Rice", "Spaghetti"]),
    meal("3", ["Chicken", "Penne Pasta", "Saffron"]),
    meal("4", ["Beef", "Rice"]),
    // Has art (asset key), used once: still suggested.
    meal("5", ["Mushrooms"]),
    // No art, used once: below the minimum, not suggested.
    meal("6", ["Asafoetida"]),
  ],
});

describe("buildSuggestions", () => {
  const list = buildSuggestions(catalog);

  it("orders by how many recipes use each ingredient, then A–Z", () => {
    // chicken 3, rice 3, pasta 2 (spaghetti + penne), then the ingredients
    // with art that are used once (beef, mushroom).
    expect(list).toEqual(["chicken", "rice", "pasta", "beef", "mushroom"]);
  });

  it("drops staples and rarely used ingredients without art", () => {
    for (const s of list) expect(PANTRY_STAPLES.has(s), s).toBe(false);
    expect(list).not.toContain("asafoetida");
    expect(list).not.toContain("saffron");
  });

  it("only suggests names that pass input validation", () => {
    for (const s of list) expect(validateIngredientName(s).ok, s).toBe(true);
  });

  it("is empty without a catalog", () => {
    expect(buildSuggestions(UNAVAILABLE_CATALOG)).toEqual([]);
  });
});
