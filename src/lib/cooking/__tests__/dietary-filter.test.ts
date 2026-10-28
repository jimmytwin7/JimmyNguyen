import { describe, expect, it } from "vitest";
import {
  filterByDiet,
  isFoodSafetySensitive,
  passesDietaryFilters,
  textViolatesDiet,
} from "../dietary-filter";
import { recipe } from "./fixtures";

describe("textViolatesDiet", () => {
  it("flags meat and seafood for vegetarians", () => {
    expect(textViolatesDiet("Chicken thighs", ["vegetarian"])).toBe(true);
    expect(textViolatesDiet("fish sauce", ["vegetarian"])).toBe(true);
    expect(textViolatesDiet("Worcestershire sauce", ["vegetarian"])).toBe(true);
    expect(textViolatesDiet("Rice", ["vegetarian"])).toBe(false);
  });

  it("allows vegetarian look-alikes", () => {
    expect(textViolatesDiet("oyster mushrooms", ["vegetarian"])).toBe(false);
    expect(textViolatesDiet("goat cheese", ["vegetarian"])).toBe(false);
    expect(textViolatesDiet("vegan sausages", ["vegetarian"])).toBe(false);
  });

  it("flags dairy, eggs, and honey for vegans", () => {
    for (const item of [
      "butter",
      "Parmesan",
      "eggs",
      "honey",
      "mayonnaise",
      "goat cheese",
    ]) {
      expect(textViolatesDiet(item, ["vegan"]), item).toBe(true);
    }
    expect(textViolatesDiet("eggplant", ["vegan"])).toBe(false);
  });

  it("handles plant-based dairy exceptions", () => {
    for (const item of [
      "coconut milk",
      "peanut butter",
      "almond milk",
      "butter beans",
    ]) {
      expect(textViolatesDiet(item, ["dairy-free"]), item).toBe(false);
    }
    expect(textViolatesDiet("double cream", ["dairy-free"])).toBe(true);
  });

  it("flags gluten with exceptions", () => {
    for (const item of [
      "plain flour",
      "spaghetti",
      "soy sauce",
      "breadcrumbs",
      "egg noodles",
    ]) {
      expect(textViolatesDiet(item, ["gluten-free"]), item).toBe(true);
    }
    for (const item of [
      "rice flour",
      "rice noodles",
      "tamari",
      "buckwheat",
      "gluten-free pasta",
      "cornflour",
    ]) {
      expect(textViolatesDiet(item, ["gluten-free"]), item).toBe(false);
    }
  });

  it("matches whole words only", () => {
    expect(textViolatesDiet("scallions", ["vegetarian"])).toBe(false); // not "scallop"
    expect(textViolatesDiet("butternut squash", ["dairy-free"])).toBe(false);
    expect(textViolatesDiet("kale", ["gluten-free"])).toBe(false); // not "ale"
  });

  it("passes unknown ingredients (best-effort)", () => {
    expect(
      textViolatesDiet("mystery spice blend", ["vegan", "gluten-free"]),
    ).toBe(false);
  });
});

describe("passesDietaryFilters / filterByDiet", () => {
  it("passes everything with no filters", () => {
    expect(passesDietaryFilters(recipe("a", ["Beef"]), [])).toBe(true);
  });

  it("uses provider category metadata", () => {
    const r = recipe("a", ["Rice"], { category: "Seafood" });
    expect(passesDietaryFilters(r, ["vegetarian"])).toBe(false);
    expect(passesDietaryFilters(r, ["gluten-free"])).toBe(true);
  });

  it("filters and reports the removed count", () => {
    const { kept, removedCount } = filterByDiet(
      [
        recipe("a", ["Tofu", "Rice"]),
        recipe("b", ["Beef", "Rice"]),
        recipe("c", ["Butter"]),
      ],
      ["vegan"],
    );
    expect(kept.map((r) => r.id)).toEqual(["a"]);
    expect(removedCount).toBe(2);
  });

  it("can remove every result", () => {
    const { kept, removedCount } = filterByDiet(
      [recipe("a", ["Pork"])],
      ["vegetarian"],
    );
    expect(kept).toEqual([]);
    expect(removedCount).toBe(1);
  });
});

describe("isFoodSafetySensitive", () => {
  it("flags raw proteins and eggs", () => {
    expect(isFoodSafetySensitive("chicken breasts")).toBe(true);
    expect(isFoodSafetySensitive("prawns")).toBe(true);
    expect(isFoodSafetySensitive("Eggs")).toBe(true);
  });

  it("does not flag processed products or produce", () => {
    expect(isFoodSafetySensitive("chicken stock")).toBe(false);
    expect(isFoodSafetySensitive("fish sauce")).toBe(false);
    expect(isFoodSafetySensitive("egg noodles")).toBe(false);
    expect(isFoodSafetySensitive("butter")).toBe(false);
  });
});
