import { describe, expect, it } from "vitest";
import {
  extractMealDbIds,
  normalizeMealDbMeal,
  safeHttpUrl,
  splitInstructions,
} from "../recipe-normalizer";
import { mealDbMeal } from "./fixtures";

describe("normalizeMealDbMeal", () => {
  it("maps a full record into the internal model", () => {
    const r = normalizeMealDbMeal(
      mealDbMeal(
        "52772",
        "Teriyaki Chicken",
        [
          ["soy sauce", "3/4 cup"],
          ["chicken breasts", "2"],
        ],
        { strSource: "https://example.com/teriyaki", strCategory: "Chicken" },
      ),
    )!;
    expect(r).toMatchObject({
      id: "mealdb-52772",
      title: "Teriyaki Chicken",
      sourceName: "TheMealDB",
      sourceUrl: "https://example.com/teriyaki",
      providerUrl: "https://www.themealdb.com/meal/52772",
      category: "Chicken",
      instructions: ["Step one.", "Step two."],
    });
    expect(r.ingredients).toEqual([
      { name: "soy sauce", normalizedName: "soy sauce", quantity: "3/4 cup" },
      {
        name: "chicken breasts",
        normalizedName: "chicken breast",
        quantity: "2",
      },
    ]);
  });

  it("leaves missing optional fields undefined instead of inventing them", () => {
    const r = normalizeMealDbMeal(
      mealDbMeal("1", "Plain", [["rice", ""]], {
        strSource: null,
        strMealThumb: "",
        strInstructions: null,
      }),
    )!;
    expect(r.sourceUrl).toBeUndefined();
    expect(r.imageUrl).toBeUndefined();
    expect(r.instructions).toEqual([]);
    expect(r.ingredients[0].quantity).toBeUndefined();
    expect(r.prepMinutes).toBeUndefined();
    expect(r.servings).toBeUndefined();
  });

  it("rejects malformed records", () => {
    expect(normalizeMealDbMeal(null)).toBeNull();
    expect(normalizeMealDbMeal({ strMeal: "No id" })).toBeNull();
    expect(
      normalizeMealDbMeal({ idMeal: "abc", strMeal: "Bad id" }),
    ).toBeNull();
  });

  it("drops unsafe URLs", () => {
    const r = normalizeMealDbMeal(
      mealDbMeal("2", "X", [], { strSource: "javascript:alert(1)" }),
    )!;
    expect(r.sourceUrl).toBeUndefined();
    expect(safeHttpUrl("ftp://x")).toBeUndefined();
    expect(safeHttpUrl("not a url")).toBeUndefined();
  });
});

describe("splitInstructions", () => {
  it("segments on line breaks and strips headings/numbering", () => {
    expect(
      splitInstructions(
        "STEP 1\r\n1. Boil water.\r\n\r\nStep 2: Add pasta.\n* Drain.",
      ),
    ).toEqual(["Boil water.", "Add pasta.", "Drain."]);
  });

  it("keeps a single paragraph as one step", () => {
    expect(splitInstructions("Mix everything and bake.")).toEqual([
      "Mix everything and bake.",
    ]);
  });

  it("returns empty for non-strings", () => {
    expect(splitInstructions(undefined)).toEqual([]);
  });
});

describe("extractMealDbIds", () => {
  it("handles null meals and junk", () => {
    expect(extractMealDbIds({ meals: null })).toEqual([]);
    expect(
      extractMealDbIds({ meals: [{ idMeal: "1" }, { idMeal: "x" }, null] }),
    ).toEqual(["1"]);
    expect(extractMealDbIds("junk")).toEqual([]);
  });
});
