// @vitest-environment node
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { ingredientMatchKey } from "../ingredient-normalizer";
import { buildCatalog, loadCatalog } from "../server/catalog";
import { mealDbMeal } from "./fixtures";

const meals = [
  mealDbMeal("1", "Chicken Rice", [
    ["Chicken Breasts", "2"],
    ["Rice", "1 cup"],
    ["rice", "more"],
  ]),
  mealDbMeal("2", "Egg Plant Stew", [
    ["Egg Plants", "2"],
    ["Rice", "1 cup"],
  ]),
  // Duplicate id: dropped.
  mealDbMeal("1", "Chicken Rice (again)", [["Beef", "1"]]),
  // Unusable records: dropped.
  { idMeal: "x", strMeal: "Bad id" },
  { idMeal: "3" },
  null,
  "junk",
];

describe("buildCatalog", () => {
  const catalog = buildCatalog({
    generatedAt: "2025-01-01T00:00:00.000Z",
    source: "supporter",
    meals,
  });

  it("normalizes records and drops nulls and duplicates", () => {
    expect(catalog.available).toBe(true);
    expect(catalog.source).toBe("supporter");
    expect(catalog.generatedAt).toBe("2025-01-01T00:00:00.000Z");
    expect(catalog.recipes.map((r) => r.id)).toEqual(["mealdb-1", "mealdb-2"]);
    expect(catalog.recipes[0].title).toBe("Chicken Rice");
    expect(catalog.recipes[1].ingredients[0].normalizedName).toBe("eggplant");
  });

  it("indexes each recipe once per ingredient match key", () => {
    expect(ingredientMatchKey("Chicken Breasts")).toBe("chicken");
    expect(catalog.index.get("chicken")).toEqual([0]);
    expect(catalog.index.get("rice")).toEqual([0, 1]);
    expect(catalog.index.get("eggplant")).toEqual([1]);
    expect(catalog.index.has("egg")).toBe(false);
    expect(catalog.index.has("beef")).toBe(false);
  });

  it("treats invalid data as unavailable", () => {
    for (const data of [
      null,
      "junk",
      {},
      { meals: "nope" },
      { source: "unavailable", meals: [] },
      { source: "test-key", meals: [] },
      { source: "unavailable", meals },
    ]) {
      const c = buildCatalog(data);
      expect(c.available, JSON.stringify(data)).toBe(false);
      expect(c.recipes).toEqual([]);
      expect(c.index.size).toBe(0);
      expect(c.source).toBe("unavailable");
    }
  });

  it("treats an unknown source as unavailable", () => {
    expect(buildCatalog({ source: "mystery", meals }).available).toBe(false);
  });
});

describe("loadCatalog", () => {
  let dir: string;
  beforeAll(async () => {
    dir = await mkdtemp(path.join(os.tmpdir(), "pq-catalog-"));
  });
  afterAll(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("reads a valid file", async () => {
    const file = path.join(dir, "ok.json");
    await writeFile(file, JSON.stringify({ source: "test-key", meals }));
    const c = await loadCatalog(file);
    expect(c.available).toBe(true);
    expect(c.recipes).toHaveLength(2);
  });

  it("is unavailable when the file is missing or invalid", async () => {
    expect((await loadCatalog(path.join(dir, "missing.json"))).available).toBe(
      false,
    );
    const bad = path.join(dir, "bad.json");
    await writeFile(bad, "{ not json");
    expect((await loadCatalog(bad)).available).toBe(false);
  });
});
