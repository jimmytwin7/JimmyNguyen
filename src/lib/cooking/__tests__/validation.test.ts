import { describe, expect, it } from "vitest";
import { MAX_PANTRY_INGREDIENTS } from "../config";
import {
  parseSearchParams,
  parseSubstitutionRequest,
  validateIngredientName,
} from "../validation";

const qs = (s: string) => new URLSearchParams(s);

describe("validateIngredientName", () => {
  it("trims and collapses whitespace", () => {
    expect(validateIngredientName("  red   onion ")).toEqual({
      ok: true,
      value: "red onion",
    });
  });

  it("rejects empty, too long, and markup", () => {
    expect(validateIngredientName("   ").ok).toBe(false);
    expect(validateIngredientName("a".repeat(41)).ok).toBe(false);
    expect(validateIngredientName("<b>rice</b>").ok).toBe(false);
    expect(validateIngredientName(42).ok).toBe(false);
  });

  it("allows accented letters and light punctuation", () => {
    expect(validateIngredientName("jalapeño").ok).toBe(true);
    expect(validateIngredientName("mac & cheese").ok).toBe(true);
  });
});

describe("parseSearchParams", () => {
  it("parses ingredients, diet, and staples", () => {
    expect(
      parseSearchParams(
        qs("ingredients=Rice,eggs,rice&diet=vegan,vegan&staples=1"),
      ),
    ).toEqual({
      ok: true,
      value: {
        ingredients: ["Rice", "eggs"],
        diet: ["vegan"],
        assumeStaples: true,
      },
    });
  });

  it("requires at least one ingredient", () => {
    expect(parseSearchParams(qs("ingredients=")).ok).toBe(false);
    expect(parseSearchParams(qs("")).ok).toBe(false);
  });

  it("rejects too many ingredients and unknown filters", () => {
    const many = Array.from(
      { length: MAX_PANTRY_INGREDIENTS + 1 },
      (_, i) => `item${i}`,
    ).join(",");
    expect(parseSearchParams(qs(`ingredients=${many}`)).ok).toBe(false);
    expect(parseSearchParams(qs("ingredients=rice&diet=keto")).ok).toBe(false);
  });
});

describe("parseSubstitutionRequest", () => {
  const valid = {
    recipeTitle: "Stew",
    missing: ["butter"],
    available: ["rice"],
    diet: [],
  };

  it("accepts a valid body", () => {
    expect(parseSubstitutionRequest(valid)).toEqual({
      ok: true,
      value: {
        recipeTitle: "Stew",
        missing: ["butter"],
        available: ["rice"],
        diet: [],
      },
    });
  });

  it("rejects bad shapes", () => {
    expect(parseSubstitutionRequest(null).ok).toBe(false);
    expect(parseSubstitutionRequest([]).ok).toBe(false);
    expect(parseSubstitutionRequest({ ...valid, recipeTitle: "" }).ok).toBe(
      false,
    );
    expect(parseSubstitutionRequest({ ...valid, missing: [] }).ok).toBe(false);
    expect(parseSubstitutionRequest({ ...valid, missing: "butter" }).ok).toBe(
      false,
    );
    expect(
      parseSubstitutionRequest({ ...valid, missing: Array(11).fill("x") }).ok,
    ).toBe(false);
    expect(parseSubstitutionRequest({ ...valid, diet: ["paleo"] }).ok).toBe(
      false,
    );
    expect(
      parseSubstitutionRequest({ ...valid, recipeTitle: "x".repeat(121) }).ok,
    ).toBe(false);
  });
});
