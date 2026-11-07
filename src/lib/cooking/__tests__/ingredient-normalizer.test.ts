import { describe, expect, it } from "vitest";
import { PANTRY_STAPLES } from "../config";
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

describe("pantry staple keys", () => {
  it("resolves TheMealDB's staple spellings to PANTRY_STAPLES keys", () => {
    for (const name of [
      "Salt",
      "Sea Salt",
      "Kosher Salt",
      "Pepper",
      "Black Pepper",
      "Ground Black Pepper",
      "Water",
      "Cold Water",
      "Warm Water",
      "Hot Water",
      "Boiling Water",
      "Oil",
      "Olive Oil",
      "Extra Virgin Olive Oil",
      "Vegetable Oil",
      "Sunflower Oil",
      "Canola Oil",
      "Rapeseed Oil",
    ]) {
      expect(PANTRY_STAPLES.has(ingredientMatchKey(name)), name).toBe(true);
    }
  });

  it("does not treat flavoring oils as staples", () => {
    for (const name of [
      "Sesame Seed Oil",
      "Sesame Oil",
      "Chilli Oil",
      "Chili Oil",
      "Truffle Oil",
    ]) {
      expect(PANTRY_STAPLES.has(ingredientMatchKey(name)), name).toBe(false);
    }
  });

  it("normalizes “Egg Plants” to eggplant", () => {
    expect(normalizeIngredient("Egg Plants")).toBe("eggplant");
    expect(ingredientMatchKey("Egg Plants")).toBe("eggplant");
  });
});

describe("generic match keys for TheMealDB's qualified names", () => {
  it("resolves pasta shapes and 'X Pasta' lines to pasta", () => {
    for (const name of [
      "Pasta",
      "Spaghetti",
      "Penne Pasta",
      "penne rigate",
      "Linguine Pasta",
      "Bowtie Pasta",
      "Paccheri Pasta",
      "Vermicelli Pasta",
      "Macaroni",
      "Fettuccine",
      "farfalle",
      "rigatoni",
      "Spaghetti noodles",
    ]) {
      expect(ingredientMatchKey(name), name).toBe("pasta");
    }
  });

  it("keeps lasagne sheets and noodles distinct from pasta", () => {
    expect(ingredientMatchKey("Lasagne Sheets")).toBe("lasagne sheet");
    expect(ingredientMatchKey("Rice Noodles")).toBe("rice noodle");
    expect(ingredientMatchKey("Rice Vermicelli")).toBe("rice vermicelli");
  });

  it("maps UK and qualified names to the generic that cooks the dish", () => {
    expect(ingredientMatchKey("Red Pepper")).toBe("bell pepper");
    expect(ingredientMatchKey("Green Pepper")).toBe("bell pepper");
    expect(ingredientMatchKey("Red Chilli")).toBe("chili");
    expect(ingredientMatchKey("Chilli")).toBe("chili");
    expect(ingredientMatchKey("Sweetcorn")).toBe("corn");
    expect(ingredientMatchKey("Tomato Purée")).toBe("tomato paste");
    expect(ingredientMatchKey("Double Cream")).toBe("cream");
    expect(ingredientMatchKey("White Fish")).toBe("fish");
    expect(ingredientMatchKey("Brown Lentils")).toBe("lentil");
  });

  it("never merges words that change what the ingredient is", () => {
    expect(ingredientMatchKey("Chicken Stock")).not.toBe("chicken");
    expect(ingredientMatchKey("Green Onion")).not.toBe("onion");
    expect(ingredientMatchKey("Cayenne Pepper")).not.toBe("bell pepper");
    expect(ingredientMatchKey("Red Pepper Flakes")).not.toBe("bell pepper");
    expect(ingredientMatchKey("Chilli Powder")).not.toBe("chili");
    expect(ingredientMatchKey("Sour Cream")).not.toBe("cream");
    expect(ingredientMatchKey("Fish Sauce")).not.toBe("fish");
    expect(ingredientMatchKey("Corn Flour")).not.toBe("corn");
    // "pepper" alone stays the staple, not a bell pepper.
    expect(ingredientMatchKey("Pepper")).toBe("pepper");
  });

  it("leaves pantry de-duplication names alone", () => {
    // Match aliases only: the pantry still treats these as different items.
    expect(normalizeIngredient("Spaghetti")).toBe("spaghetti");
    expect(normalizeIngredient("Red Pepper")).toBe("red pepper");
  });
});
