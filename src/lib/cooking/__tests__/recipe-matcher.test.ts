import { describe, expect, it } from "vitest";
import {
  boardItemsUsed,
  compareBestMatch,
  namedList,
  scoreRecipe,
  sortMatches,
} from "../recipe-matcher";
import { ing, pantry, recipe } from "./fixtures";

describe("scoreRecipe", () => {
  it("scores 100 when everything is on hand", () => {
    const m = scoreRecipe(
      recipe("a", ["Chicken", "Rice"]),
      pantry("chicken", "rice"),
    );
    expect(m.matchPercentage).toBe(100);
    expect(m.missingIngredients).toHaveLength(0);
    expect(m.scoreExplanation).toBe("You have 2 of 2 listed ingredients.");
  });

  it("scores 0 when nothing matches", () => {
    const m = scoreRecipe(recipe("a", ["Beef", "Potatoes"]), pantry("tofu"));
    expect(m.matchPercentage).toBe(0);
    expect(m.missingIngredients.map((i) => i.name)).toEqual([
      "Beef",
      "Potatoes",
    ]);
  });

  it("rounds partial coverage", () => {
    // 2 of 3 = 66.67 → 67
    const m = scoreRecipe(
      recipe("a", ["Chicken", "Rice", "Leek"]),
      pantry("chicken", "rice"),
    );
    expect(m.matchPercentage).toBe(67);
    expect(m.scoreExplanation).toBe("You have 2 of 3 listed ingredients.");
  });

  it("matches through prep words and aliases", () => {
    const m = scoreRecipe(
      recipe("a", ["minced garlic", "Spring Onions", "chicken breasts"]),
      pantry("garlic", "scallions", "chicken"),
    );
    expect(m.matchPercentage).toBe(100);
  });

  it("handles an empty ingredient list", () => {
    const m = scoreRecipe(recipe("a", []), pantry("rice"));
    expect(m.matchPercentage).toBe(0);
    expect(m.scoreExplanation).toMatch(/no ingredient list/i);
  });

  it("counts duplicate recipe lines once", () => {
    const m = scoreRecipe(
      recipe("a", ["Olive Oil", "olive oil", "Lemon"]),
      pantry("olive oil"),
    );
    expect(m.matchPercentage).toBe(50);
    expect(m.matchedIngredients).toHaveLength(1);
  });

  it("excludes optional ingredients from the denominator", () => {
    const m = scoreRecipe(
      recipe("a", ["Rice", ing("Parsley", { optional: true })]),
      pantry("rice"),
    );
    expect(m.matchPercentage).toBe(100);
    expect(m.optionalIngredients.map((i) => i.name)).toEqual(["Parsley"]);
  });

  it("weights core ingredients 20% when the source marks them", () => {
    // required 2/3, core 0/1 → 0.8 * 0.6667 + 0.2 * 0 = 53.3 → 53
    const m = scoreRecipe(
      recipe("a", [ing("Salmon", { core: true }), "Lemon", "Dill"]),
      pantry("lemon", "dill"),
    );
    expect(m.matchPercentage).toBe(53);
  });

  it("always assumes pantry staples", () => {
    const r = recipe("a", [
      "Rice",
      "Sea Salt",
      "Cold Water",
      "Extra Virgin Olive Oil",
      "Sesame Seed Oil",
    ]);
    const m = scoreRecipe(r, pantry("rice"));
    expect(m.assumedIngredients.map((i) => i.name)).toEqual([
      "Sea Salt",
      "Cold Water",
      "Extra Virgin Olive Oil",
    ]);
    // Flavoring oils aren't staples.
    expect(m.missingIngredients.map((i) => i.name)).toEqual([
      "Sesame Seed Oil",
    ]);
    expect(m.matchPercentage).toBe(80);
    expect(m.scoreExplanation).toBe(
      "You have 4 of 5 listed ingredients (sea salt, cold water and 1 more assumed).",
    );
  });

  it("names one or two assumed staples in full", () => {
    const one = scoreRecipe(recipe("a", ["Rice", "Salt"]), pantry("rice"));
    expect(one.scoreExplanation).toBe(
      "You have 2 of 2 listed ingredients (salt assumed).",
    );
    const two = scoreRecipe(
      recipe("b", ["Rice", "Salt", "Olive Oil"]),
      pantry("rice"),
    );
    expect(two.scoreExplanation).toBe(
      "You have 3 of 3 listed ingredients (salt and olive oil assumed).",
    );
  });

  it("matches a board 'pasta' against qualified pasta lines", () => {
    const m = scoreRecipe(
      recipe("a", ["Penne Pasta", "Red Onions", "Tomato Purée"]),
      pantry("pasta", "onion", "tomato paste"),
    );
    expect(m.missingIngredients).toEqual([]);
    expect(m.matchedIngredients.map((i) => i.name)).toEqual([
      "Penne Pasta",
      "Red Onions",
      "Tomato Purée",
    ]);
  });

  it("formats name lists with at most two names", () => {
    expect(namedList([])).toBe("");
    expect(namedList(["salt"])).toBe("salt");
    expect(namedList(["salt", "oil"])).toBe("salt and oil");
    expect(namedList(["salt", "oil", "water", "pepper"])).toBe(
      "salt, oil and 2 more",
    );
  });

  it("counts a staple on the board as matched, not assumed", () => {
    const m = scoreRecipe(recipe("a", ["Rice", "Salt"]), pantry("salt"));
    expect(m.matchedIngredients.map((i) => i.name)).toEqual(["Salt"]);
    expect(m.assumedIngredients).toHaveLength(0);
  });

  it("keeps matched + missing consistent with the score", () => {
    const m = scoreRecipe(recipe("a", ["A", "B", "C", "D"]), pantry("a", "c"));
    const total =
      m.matchedIngredients.length +
      m.assumedIngredients.length +
      m.missingIngredients.length;
    expect(total).toBe(4);
    expect(m.matchPercentage).toBe(
      Math.round((100 * m.matchedIngredients.length) / total),
    );
  });

  it("is deterministic", () => {
    const r = recipe("a", ["Chicken", "Rice", "Garlic"]);
    expect(scoreRecipe(r, pantry("rice", "garlic"))).toEqual(
      scoreRecipe(r, pantry("rice", "garlic")),
    );
  });
});

describe("sortMatches", () => {
  const p = pantry("rice");
  const a = scoreRecipe(recipe("a", ["Rice", "Leek"], { title: "Banana" }), p); // 50, 1 missing
  const b = scoreRecipe(recipe("b", ["Rice"], { title: "Apple" }), p); // 100, 0 missing
  const c = scoreRecipe(
    recipe("c", ["Rice", "X", "Y", "Z"], { title: "Cherry" }),
    p,
  ); // 25, 3 missing
  // 1 missing but a higher % than `a`: 2 of 3.
  const d = scoreRecipe(
    recipe("d", ["Rice", "Salt", "Leek"], { title: "Date" }),
    p,
  ); // 67, 1 missing

  it("ranks best match: board items used, then %, then fewest missing, then title", () => {
    expect(sortMatches([c, a, b, d], "best").map((m) => m.recipe.id)).toEqual([
      "b",
      "d",
      "a",
      "c",
    ]);
  });

  it("sorts by highest match %", () => {
    expect(
      sortMatches([c, a, b, d], "percentage").map((m) => m.recipe.id),
    ).toEqual(["b", "d", "a", "c"]);
  });

  it("prefers more board items used over a higher %", () => {
    const board = pantry("rice", "leek");
    // Uses both board items but only 2 of 5 lines = 40%.
    const both = scoreRecipe(
      recipe("both", ["Rice", "Leek", "X", "Y", "Z"], { title: "Both" }),
      board,
    );
    // Uses one board item, 100%.
    const one = scoreRecipe(recipe("one", ["Rice"], { title: "One" }), board);
    expect(one.matchPercentage).toBeGreaterThan(both.matchPercentage);
    expect(compareBestMatch(both, one)).toBeLessThan(0);
    expect(
      sortMatches([one, both], "percentage").map((m) => m.recipe.id),
    ).toEqual(["one", "both"]);
  });

  it("uses title when board items, % and missing all tie", () => {
    const x = scoreRecipe(recipe("x", ["Rice", "Leek"], { title: "Z" }), p);
    const y = scoreRecipe(recipe("y", ["Rice", "Leek"], { title: "A" }), p);
    expect(compareBestMatch(y, x)).toBeLessThan(0);
  });

  it("counts board items used without staples", () => {
    const board = pantry("rice", "salt");
    const m = scoreRecipe(recipe("s", ["Rice", "Salt", "Leek"]), board);
    expect(boardItemsUsed(m)).toBe(1);
  });

  it("breaks ties by title, then id", () => {
    const x = scoreRecipe(recipe("x", ["Rice"], { title: "Same" }), p);
    const y = scoreRecipe(recipe("y", ["Rice"], { title: "Same" }), p);
    expect(sortMatches([y, x], "best").map((m) => m.recipe.id)).toEqual([
      "x",
      "y",
    ]);
  });

  it("sorts by title without mutating the input", () => {
    const input = [a, b, c];
    expect(sortMatches(input, "title").map((m) => m.recipe.title)).toEqual([
      "Apple",
      "Banana",
      "Cherry",
    ]);
    expect(input[0]).toBe(a);
  });
});
