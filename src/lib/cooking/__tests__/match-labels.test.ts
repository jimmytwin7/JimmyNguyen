import { describe, expect, it } from "vitest";
import {
  bestMatchReason,
  readinessLabel,
  unusedBoardItems,
} from "../match-labels";
import { scoreRecipe } from "../recipe-matcher";
import { pantry, recipe } from "./fixtures";

describe("readinessLabel", () => {
  it("leads with how many ingredients are left to buy", () => {
    expect(readinessLabel(0)).toBe("Ready to cook");
    expect(readinessLabel(1)).toBe("Need 1 more");
    expect(readinessLabel(4)).toBe("Need 4 more");
  });
});

describe("bestMatchReason", () => {
  const board = pantry("chicken", "rice");
  const score = (names: string[]) => scoreRecipe(recipe("a", names), board);

  it("explains why the best match won", () => {
    expect(bestMatchReason(score(["Chicken", "Rice", "Lemon"]), board)).toBe(
      "Uses all 2 of your ingredients.",
    );
    expect(bestMatchReason(score(["Chicken", "Lemon", "Kale"]), board)).toBe(
      "Uses 1 of your 2 ingredients.",
    );
  });

  it("falls back to the shopping count for a single-item board", () => {
    const one = pantry("rice");
    expect(bestMatchReason(scoreRecipe(recipe("a", ["Rice"]), one), one)).toBe(
      "You have everything you need.",
    );
    expect(
      bestMatchReason(scoreRecipe(recipe("a", ["Rice", "Leek"]), one), one),
    ).toBe("Only 1 ingredient to buy.");
  });
});

describe("unusedBoardItems", () => {
  it("lists board items the recipe doesn't use, as the user wrote them", () => {
    const board = pantry("Pasta", "onion", "chicken");
    const m = scoreRecipe(recipe("a", ["Onion", "Beef"]), board);
    expect(unusedBoardItems(m, board)).toEqual(["Pasta", "chicken"]);
  });

  it("counts an item as used when a qualified line matches it", () => {
    const board = pantry("pasta", "onion");
    const m = scoreRecipe(recipe("a", ["Penne Pasta", "Red Onions"]), board);
    expect(unusedBoardItems(m, board)).toEqual([]);
  });

  it("never lists staples, which every recipe assumes", () => {
    const board = pantry("rice", "salt", "olive oil");
    const m = scoreRecipe(recipe("a", ["Rice"]), board);
    expect(unusedBoardItems(m, board)).toEqual([]);
  });

  it("is empty for an empty board", () => {
    const m = scoreRecipe(recipe("a", ["Rice"]), []);
    expect(unusedBoardItems(m, [])).toEqual([]);
  });
});
