import { describe, expect, it, vi } from "vitest";
import { pickQueryIngredients, searchRecipes } from "../server/recipe-search";
import { UpstreamError, type RecipeProvider } from "../server/themealdb";
import { recipe } from "./fixtures";

function fakeProvider(overrides: Partial<RecipeProvider> = {}): RecipeProvider {
  const recipes: Record<string, ReturnType<typeof recipe>> = {
    "1": recipe("mealdb-1", ["Chicken", "Rice"], { title: "Chicken Rice" }),
    "2": recipe("mealdb-2", ["Chicken", "Beef", "Leek"], {
      title: "Mixed Grill",
    }),
    "3": recipe("mealdb-3", ["Rice", "Butter"], { title: "Buttered Rice" }),
  };
  const byIngredient: Record<string, string[]> = {
    chicken: ["1", "2"],
    rice: ["1", "3"],
  };
  return {
    name: "Fake",
    findCandidateIds: vi.fn(async (i: string) => byIngredient[i] ?? []),
    getRecipe: vi.fn(async (id: string) => recipes[id] ?? null),
    ...overrides,
  };
}

const params = {
  ingredients: ["chicken", "rice"],
  diet: [],
  assumeStaples: false,
};

describe("pickQueryIngredients", () => {
  it("prefers distinctive ingredients over staples and common items", () => {
    expect(
      pickQueryIngredients(
        ["salt", "garlic", "tofu", "onion", "kale", "rice"],
        3,
      ),
    ).toEqual(["tofu", "kale", "rice"]);
  });

  it("still uses common items when that's all there is", () => {
    expect(pickQueryIngredients(["salt", "garlic"], 3)).toEqual([
      "salt",
      "garlic",
    ]);
  });
});

describe("searchRecipes", () => {
  it("merges candidates, scores them, and sorts by match", async () => {
    const res = await searchRecipes(params, fakeProvider());
    expect(res.matches.map((m) => [m.recipe.title, m.matchPercentage])).toEqual(
      [
        ["Chicken Rice", 100],
        ["Buttered Rice", 50],
        ["Mixed Grill", 33],
      ],
    );
    expect(res.meta).toEqual({
      provider: "Fake",
      queriedIngredients: ["chicken", "rice"],
      filteredOutCount: 0,
      partial: false,
    });
  });

  it("applies dietary filters and reports the count", async () => {
    const res = await searchRecipes(
      { ...params, diet: ["vegetarian"] },
      fakeProvider(),
    );
    expect(res.matches.map((m) => m.recipe.title)).toEqual(["Buttered Rice"]);
    expect(res.meta.filteredOutCount).toBe(2);
  });

  it("returns empty results when nothing matches", async () => {
    const res = await searchRecipes(
      { ...params, ingredients: ["dragonfruit"] },
      fakeProvider(),
    );
    expect(res.matches).toEqual([]);
  });

  it("marks partial results when some upstream calls fail", async () => {
    const provider = fakeProvider({
      findCandidateIds: vi.fn(async (i: string) => {
        if (i === "rice") throw new UpstreamError("network");
        return ["1"];
      }),
    });
    const res = await searchRecipes(params, provider);
    expect(res.meta.partial).toBe(true);
    expect(res.matches).toHaveLength(1);
  });

  it("throws when the provider fails completely", async () => {
    const provider = fakeProvider({
      findCandidateIds: vi.fn(async () => {
        throw new UpstreamError("rate-limited", 429);
      }),
    });
    await expect(searchRecipes(params, provider)).rejects.toMatchObject({
      kind: "rate-limited",
    });
  });
});
