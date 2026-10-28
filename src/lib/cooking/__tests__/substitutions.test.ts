import { describe, expect, it } from "vitest";
import { getSubstitutions } from "../server/substitution-service";
import { fallbackSubstitutions, FOOD_SAFETY_REASON } from "../substitutions";

describe("fallbackSubstitutions", () => {
  it("returns known swaps", () => {
    const { suggestions } = fallbackSubstitutions(["Garlic Cloves"]);
    expect(suggestions[0]).toMatchObject({
      ingredient: "Garlic Cloves",
      substitute: "garlic powder",
    });
  });

  it("returns nothing for unknown ingredients", () => {
    expect(fallbackSubstitutions(["dragonfruit"]).suggestions).toEqual([]);
  });

  it("skips raw meat, seafood, and eggs", () => {
    const { suggestions, skipped } = fallbackSubstitutions([
      "chicken breasts",
      "eggs",
    ]);
    expect(suggestions).toEqual([]);
    expect(skipped).toEqual([
      { ingredient: "chicken breasts", reason: FOOD_SAFETY_REASON },
      { ingredient: "eggs", reason: FOOD_SAFETY_REASON },
    ]);
  });

  it("drops swaps that conflict with dietary filters", () => {
    // heavy cream → "milk mixed with melted butter" isn't vegan
    expect(
      fallbackSubstitutions(["heavy cream"], ["vegan"]).suggestions,
    ).toEqual([]);
    expect(fallbackSubstitutions(["heavy cream"]).suggestions).toHaveLength(1);
  });
});

describe("getSubstitutions", () => {
  const req = {
    recipeTitle: "Test",
    missing: ["butter", "chicken"],
    available: [],
    diet: [],
  };

  it("returns dictionary suggestions and skips unsafe items", async () => {
    const res = await getSubstitutions(req);
    expect(res.suggestions.find((s) => s.ingredient === "butter")).toBeTruthy();
    expect(res.skipped.map((s) => s.ingredient)).toEqual(["chicken"]);
  });

  it("respects dietary filters", async () => {
    const res = await getSubstitutions({
      ...req,
      missing: ["heavy cream"],
      diet: ["vegan"],
    });
    expect(res.suggestions).toEqual([]);
  });
});
