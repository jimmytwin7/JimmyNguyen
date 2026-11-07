// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mealDbMeal } from "@/lib/cooking/__tests__/fixtures";
import {
  buildCatalog,
  UNAVAILABLE_CATALOG,
  type RecipeCatalog,
} from "@/lib/cooking/server/catalog";
import { GET } from "../recipes/route";
import { POST } from "../substitutions/route";

// The route reads the build-time catalog through getCatalog(); swap in an
// in-memory one so these tests never touch the filesystem or the network.
let catalog: RecipeCatalog;
vi.mock("@/lib/cooking/server/catalog", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/cooking/server/catalog")>();
  return { ...actual, getCatalog: async () => catalog };
});

const testCatalog = () =>
  buildCatalog({
    generatedAt: "2025-01-01T00:00:00.000Z",
    source: "test-key",
    meals: [
      mealDbMeal("11", "Chicken Rice", [
        ["Chicken", "1"],
        ["Rice", "2 cups"],
        ["Salt", "pinch"],
      ]),
      mealDbMeal(
        "12",
        "Beef Rice",
        [
          ["Beef", "500g"],
          ["Rice", "2 cups"],
        ],
        { strCategory: "Beef" },
      ),
      mealDbMeal(
        "13",
        "Potato Bake",
        [
          ["Potatoes", "4"],
          ["Eggs", "2"],
        ],
        { strCategory: "Vegetarian" },
      ),
    ],
  });

// A fresh client IP per request, so these tests never trip the per-IP limiter
// (which is module-level and would otherwise couple the tests together).
let clientCounter = 0;
const search = (query: string) =>
  GET(
    new Request(`http://test/api/recipes?${query}`, {
      headers: { "x-forwarded-for": `10.0.0.${clientCounter++}` },
    }),
  );
const substitutions = (body: unknown, raw?: string) =>
  POST(
    new Request("http://test/api/substitutions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: raw ?? JSON.stringify(body),
    }),
  );

beforeEach(() => {
  catalog = testCatalog();
  // Searches must never reach the network.
  vi.stubGlobal(
    "fetch",
    vi.fn(() => Promise.reject(new Error("unexpected fetch"))),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("GET /api/recipes", () => {
  it("scores the catalog locally and returns ranked matches", async () => {
    const res = await search("ingredients=chicken,rice");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(
      body.matches.map((m: { recipe: { id: string } }) => m.recipe.id),
    ).toEqual(["mealdb-11", "mealdb-12"]);
    // Salt is assumed, so Chicken Rice is a full match.
    expect(body.matches[0]).toMatchObject({
      matchPercentage: 100,
      recipe: { title: "Chicken Rice", sourceName: "TheMealDB" },
    });
    expect(body.meta).toEqual({
      provider: "TheMealDB",
      recipeCount: 3,
      candidateCount: 2,
      filteredOutCount: 0,
      catalogDate: "2025-01-01T00:00:00.000Z",
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("applies dietary filters on the server", async () => {
    const res = await search("ingredients=rice,potato&diet=vegetarian");
    const body = await res.json();
    expect(
      body.matches.map((m: { recipe: { id: string } }) => m.recipe.id),
    ).toEqual(["mealdb-13"]);
    expect(body.meta.filteredOutCount).toBe(2);
  });

  it("ignores the removed staples param", async () => {
    const res = await search("ingredients=chicken,rice&staples=0");
    const body = await res.json();
    expect(body.matches[0].matchPercentage).toBe(100);
    expect(body.matches[0].assumedIngredients).toHaveLength(1);
  });

  it("rejects invalid or oversized input", async () => {
    expect((await search("ingredients=")).status).toBe(400);
    expect((await search("ingredients=%3Cscript%3E")).status).toBe(400);
    expect((await search(`ingredients=${"a,".repeat(20)}`)).status).toBe(400);
    const res = await search("ingredients=rice&diet=keto");
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      error: expect.any(String),
      retryable: false,
    });
  });

  it("returns a safe 503 when the build has no catalog", async () => {
    catalog = UNAVAILABLE_CATALOG;
    const res = await search("ingredients=chicken");
    expect(res.status).toBe(503);
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(await res.json()).toEqual({
      error: "Recipe data isn't available in this build.",
      retryable: false,
    });
  });

  it("rate limits a single client at 30 a minute", async () => {
    const statuses: number[] = [];
    for (let n = 0; n < 31; n++) {
      const res = await GET(
        new Request("http://test/api/recipes?ingredients=chicken", {
          headers: { "x-forwarded-for": "203.0.113.9" },
        }),
      );
      statuses.push(res.status);
    }
    expect(statuses.slice(0, 30).every((s) => s === 200)).toBe(true);
    expect(statuses[30]).toBe(429);
  });

  it("is not cached by shared caches", async () => {
    for (const query of ["ingredients=chicken", "ingredients="]) {
      const res = await search(query);
      expect(res.headers.get("cache-control")).toBe("no-store");
    }
  });
});

describe("POST /api/substitutions", () => {
  const body = {
    recipeTitle: "Stew",
    missing: ["butter", "beef"],
    available: ["rice"],
  };

  it("returns dictionary suggestions and skips unsafe items", async () => {
    const res = await substitutions(body);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.suggestions[0]).toMatchObject({
      ingredient: "butter",
      substitute: "olive oil",
    });
    expect(
      data.skipped.map((s: { ingredient: string }) => s.ingredient),
    ).toEqual(["beef"]);
  });

  it("validates the request", async () => {
    expect((await substitutions(null, "not json")).status).toBe(400);
    expect((await substitutions({ ...body, missing: [] })).status).toBe(400);
    expect(
      (
        await substitutions(
          null,
          JSON.stringify({ ...body, recipeTitle: "x".repeat(5000) }),
        )
      ).status,
    ).toBe(413);
  });
});
