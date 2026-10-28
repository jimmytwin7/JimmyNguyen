// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mealDbMeal } from "@/lib/cooking/__tests__/fixtures";
import { GET } from "../recipes/route";
import { POST } from "../substitutions/route";

const RECIPE_KEY = "recipe-secret-key-123";

const meals: Record<string, Record<string, unknown>> = {
  "11": mealDbMeal("11", "Chicken Rice", [
    ["Chicken", "1"],
    ["Rice", "2 cups"],
    ["Salt", "pinch"],
  ]),
  "12": mealDbMeal(
    "12",
    "Beef Stew",
    [
      ["Beef", "500g"],
      ["Carrots", "2"],
    ],
    { strCategory: "Beef" },
  ),
};

/** Fake TheMealDB provider. Set `mode` to simulate failures. */
let mode: "ok" | "provider-down" = "ok";

function fakeFetch(input: RequestInfo | URL) {
  const url = new URL(String(input));
  if (url.hostname === "www.themealdb.com") {
    if (mode === "provider-down")
      return Promise.resolve(new Response("down", { status: 503 }));
    const i = url.searchParams.get("i") ?? "";
    if (url.pathname.endsWith("/filter.php")) {
      const ids =
        i === "chicken"
          ? ["11"]
          : i === "beef"
            ? ["12"]
            : i === "rice"
              ? ["11"]
              : [];
      return Promise.resolve(
        Response.json({
          meals: ids.length ? ids.map((idMeal) => ({ idMeal })) : null,
        }),
      );
    }
    if (url.pathname.endsWith("/lookup.php")) {
      return Promise.resolve(
        Response.json({ meals: meals[i] ? [meals[i]] : null }),
      );
    }
  }
  return Promise.reject(new Error(`unexpected fetch ${url}`));
}

const search = (query: string) =>
  GET(new Request(`http://test/api/recipes?${query}`));
const substitutions = (body: unknown, raw?: string) =>
  POST(
    new Request("http://test/api/substitutions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: raw ?? JSON.stringify(body),
    }),
  );

beforeEach(() => {
  mode = "ok";
  vi.stubGlobal("fetch", vi.fn(fakeFetch));
  vi.stubEnv("RECIPE_API_KEY", RECIPE_KEY);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("GET /api/recipes", () => {
  it("returns normalized, scored matches", async () => {
    const res = await search("ingredients=chicken,rice&staples=1");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.matches).toHaveLength(1);
    expect(body.matches[0]).toMatchObject({
      matchPercentage: 100,
      recipe: {
        id: "mealdb-11",
        title: "Chicken Rice",
        sourceName: "TheMealDB",
      },
    });
    expect(body.meta.provider).toBe("TheMealDB");
  });

  it("uses the configured recipe key server-side but never returns it", async () => {
    const res = await search("ingredients=chicken");
    const calledUrl = String(vi.mocked(fetch).mock.calls[0][0]);
    expect(calledUrl).toContain(`/v1/${RECIPE_KEY}/filter.php`);
    expect(await res.text()).not.toContain(RECIPE_KEY);
  });

  it("rejects invalid or oversized input", async () => {
    expect((await search("ingredients=")).status).toBe(400);
    expect((await search("ingredients=%3Cscript%3E")).status).toBe(400);
    expect((await search(`ingredients=${"a,".repeat(20)}`)).status).toBe(400);
    expect((await search("ingredients=rice&diet=keto")).status).toBe(400);
  });

  it("returns a safe 502 when the provider is down", async () => {
    mode = "provider-down";
    const res = await search("ingredients=chicken");
    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body).toEqual({ error: expect.any(String), retryable: true });
    expect(JSON.stringify(body)).not.toMatch(/503|stack|Error:/);
  });

  it("is not cached by shared caches", async () => {
    const res = await search("ingredients=chicken");
    expect(res.headers.get("cache-control")).toBe("no-store");
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
