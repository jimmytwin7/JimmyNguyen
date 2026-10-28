import { describe, expect, it } from "vitest";
import {
  ingredientMatchKey,
  normalizeIngredient,
} from "../ingredient-normalizer";

describe("normalizeIngredient", () => {
  it("normalizes casing, whitespace, and punctuation", () => {
    expect(normalizeIngredient("  Olive   OIL! ")).toBe("olive oil");
    expect(normalizeIngredient("Jalapeño")).toBe("jalapeno");
  });

  it("singularizes the last word", () => {
    expect(normalizeIngredient("Tomatoes")).toBe("tomato");
    expect(normalizeIngredient("eggs")).toBe("egg");
    expect(normalizeIngredient("berries")).toBe("berry");
    expect(normalizeIngredient("asparagus")).toBe("asparagus");
  });

  it("applies spelling aliases", () => {
    expect(normalizeIngredient("Scallions")).toBe("green onion");
    expect(normalizeIngredient("spring onions")).toBe("green onion");
    expect(normalizeIngredient("cornflour")).toBe("cornstarch");
  });

  it("keeps distinct ingredients distinct for de-duplication", () => {
    expect(normalizeIngredient("red onion")).not.toBe(
      normalizeIngredient("green onion"),
    );
    expect(normalizeIngredient("red onion")).not.toBe(
      normalizeIngredient("onion"),
    );
  });

  it("treats duplicates as the same", () => {
    expect(normalizeIngredient("Garlic")).toBe(normalizeIngredient("garlic "));
  });

  it("returns empty for punctuation-only input", () => {
    expect(normalizeIngredient("!!!")).toBe("");
  });
});

describe("ingredientMatchKey", () => {
  it("strips preparation and cut words", () => {
    expect(ingredientMatchKey("minced garlic")).toBe("garlic");
    expect(ingredientMatchKey("Garlic Cloves")).toBe("garlic");
    expect(ingredientMatchKey("Boneless chicken breasts")).toBe("chicken");
    expect(ingredientMatchKey("extra virgin olive oil")).toBe("olive oil");
    expect(ingredientMatchKey("tin of chopped tomatoes")).toBe("tomato");
  });

  it("does not merge ingredients that are different things", () => {
    expect(ingredientMatchKey("chicken stock")).not.toBe(
      ingredientMatchKey("chicken"),
    );
    expect(ingredientMatchKey("green onion")).not.toBe(
      ingredientMatchKey("onion"),
    );
    expect(ingredientMatchKey("bell pepper")).not.toBe(
      ingredientMatchKey("black pepper"),
    );
  });

  it("applies narrow match-only equivalences", () => {
    expect(ingredientMatchKey("red onions")).toBe("onion");
    expect(ingredientMatchKey("egg yolks")).toBe("egg");
    expect(ingredientMatchKey("basmati rice")).toBe("rice");
  });

  it("falls back when every word is a modifier", () => {
    expect(ingredientMatchKey("large")).toBe("large");
  });
});
