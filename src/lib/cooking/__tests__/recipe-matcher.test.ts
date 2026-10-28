import { describe, expect, it } from "vitest";
import { scoreRecipe, sortMatches } from "../recipe-matcher";
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

  it("counts staples only when assumed", () => {
    const r = recipe("a", ["Rice", "Salt", "Water"]);
    expect(scoreRecipe(r, pantry("rice")).matchPercentage).toBe(33);
    const assumed = scoreRecipe(r, pantry("rice"), { assumeStaples: true });
    expect(assumed.matchPercentage).toBe(100);
    expect(assumed.assumedIngredients.map((i) => i.name)).toEqual([
      "Salt",
      "Water",
    ]);
    expect(assumed.scoreExplanation).toContain("2 assumed pantry staples");
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
  const a = scoreRecipe(recipe("a", ["Rice", "Leek"], { title: "Banana" }), p); // 50
  const b = scoreRecipe(recipe("b", ["Rice"], { title: "Apple" }), p); // 100
  const c = scoreRecipe(
    recipe("c", ["Rice", "X", "Y", "Z"], { title: "Cherry" }),
    p,
  ); // 25

  it("sorts by match descending", () => {
    expect(sortMatches([a, b, c], "match").map((m) => m.recipe.id)).toEqual([
      "b",
      "a",
      "c",
    ]);
  });

  it("sorts by fewest missing", () => {
    expect(
      sortMatches([c, a, b], "fewest-missing").map((m) => m.recipe.id),
    ).toEqual(["b", "a", "c"]);
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
