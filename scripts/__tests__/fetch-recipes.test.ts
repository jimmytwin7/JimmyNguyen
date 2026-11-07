// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import {
  KEPT_FIELDS,
  LETTERS,
  MIN_RECIPES,
  assembleCatalog,
  decideOutcome,
  isFresh,
  mealsFromResponse,
  pickMealFields,
  run,
} from "../fetch-recipes.mjs";

const SECRET = "supporter-secret-987";

function rawMeal(id: string, extra: Record<string, unknown> = {}) {
  return {
    idMeal: id,
    strMeal: `Meal ${id}`,
    strMealThumb: `https://www.themealdb.com/images/media/meals/${id}.jpg`,
    strCategory: "Side",
    strArea: "Unknown",
    strInstructions: "Cook.",
    strSource: null,
    strIngredient1: "Rice",
    strMeasure1: "1 cup",
    // Fields the app doesn't use; must be dropped.
    strTags: "tag",
    strYoutube: "https://youtube.com/x",
    dateModified: null,
    ...extra,
  };
}

describe("pickMealFields", () => {
  it("keeps only the listed fields", () => {
    const meal = pickMealFields(rawMeal("1"));
    expect(Object.keys(meal ?? {}).sort()).toEqual([...KEPT_FIELDS].sort());
    expect(meal).toMatchObject({
      idMeal: "1",
      strMeal: "Meal 1",
      strIngredient1: "Rice",
      strMeasure1: "1 cup",
      strIngredient2: null,
      strSource: null,
    });
    expect(meal).not.toHaveProperty("strTags");
  });

  it("drops records without a numeric id or a title", () => {
    expect(pickMealFields(null)).toBeNull();
    expect(pickMealFields("junk")).toBeNull();
    expect(pickMealFields([])).toBeNull();
    expect(pickMealFields(rawMeal("abc"))).toBeNull();
    expect(pickMealFields(rawMeal("1", { strMeal: " " }))).toBeNull();
  });

  it("turns non-string values into null", () => {
    expect(
      pickMealFields(rawMeal("1", { strArea: 42, strIngredient1: {} })),
    ).toMatchObject({ strArea: null, strIngredient1: null });
  });
});

describe("mealsFromResponse", () => {
  it("treats null, strings, and objects as empty", () => {
    expect(mealsFromResponse({ meals: null })).toEqual([]);
    expect(
      mealsFromResponse({ meals: "Invalid API key or access level" }),
    ).toEqual([]);
    expect(mealsFromResponse({ meals: { message: "upgrade" } })).toEqual([]);
    expect(mealsFromResponse(null)).toEqual([]);
    expect(mealsFromResponse({ meals: [1, 2] })).toEqual([1, 2]);
  });
});

describe("assembleCatalog", () => {
  it("de-duplicates by idMeal and drops unusable records", () => {
    const catalog = assembleCatalog(
      [
        [rawMeal("1"), rawMeal("2"), null],
        [rawMeal("2", { strMeal: "Second copy" }), rawMeal("x")],
      ],
      { source: "test-key", generatedAt: "2025-01-01T00:00:00.000Z" },
    );
    expect(catalog.source).toBe("test-key");
    expect(catalog.generatedAt).toBe("2025-01-01T00:00:00.000Z");
    expect(catalog.meals.map((m: { idMeal: string }) => m.idMeal)).toEqual([
      "1",
      "2",
    ]);
    expect(catalog.meals[1].strMeal).toBe("Meal 2");
  });
});

describe("decideOutcome", () => {
  it("writes a complete, large-enough catalog", () => {
    expect(
      decideOutcome({ hasKey: true, failedLetters: [], count: MIN_RECIPES })
        .action,
    ).toBe("write");
  });

  it("is strict with a key", () => {
    expect(
      decideOutcome({ hasKey: true, failedLetters: ["q"], count: 790 }).action,
    ).toBe("fail");
    expect(
      decideOutcome({
        hasKey: true,
        failedLetters: [],
        count: MIN_RECIPES - 1,
      }).action,
    ).toBe("fail");
  });

  it("is lenient without a key", () => {
    expect(
      decideOutcome({ hasKey: false, failedLetters: ["a"], count: 0 }).action,
    ).toBe("unavailable");
    expect(
      decideOutcome({ hasKey: false, failedLetters: [], count: 10 }).action,
    ).toBe("unavailable");
  });
});

describe("isFresh", () => {
  const day = 24 * 60 * 60 * 1000;
  it("is fresh for under 24 hours", () => {
    expect(isFresh(0, day - 1)).toBe(true);
    expect(isFresh(0, day)).toBe(false);
  });
});

/** Fake TheMealDB: `perLetter` meals per letter, unique ids. */
function fakeUpstream({
  perLetter = 30,
  failLetters = [] as string[],
  body,
}: { perLetter?: number; failLetters?: string[]; body?: string } = {}) {
  return vi.fn(async (input: string) => {
    const url = new URL(input);
    const letter = url.searchParams.get("f") ?? "";
    if (failLetters.includes(letter)) return new Response("", { status: 503 });
    if (body !== undefined) return new Response(body, { status: 200 });
    const offset = LETTERS.indexOf(letter) * 1000;
    return Response.json({
      meals: Array.from({ length: perLetter }, (_, i) =>
        rawMeal(String(offset + i + 1)),
      ),
    });
  });
}

function harness(env: Record<string, string>, fetchImpl: typeof fetch) {
  const lines: string[] = [];
  const log = (...args: unknown[]) => lines.push(args.map(String).join(" "));
  type Written = { source: string; meals: unknown[] };
  const written: { file: string; data: Written }[] = [];
  const deps = {
    env,
    argv: [] as string[],
    fetchImpl,
    delay: async () => {},
    logger: { info: log, warn: log, error: log },
    outFile: "/tmp/never-written/.data/recipes.json",
    now: () => Date.parse("2025-01-01T00:00:00.000Z"),
    statFile: async () => {
      throw new Error("ENOENT");
    },
    writeCatalog: async (file: string, data: unknown) => {
      written.push({ file, data: data as Written });
    },
    catalogIsValid: async () => false,
  };
  return { deps, lines, written };
}

describe("run", () => {
  it("uses v2 with the key, writes the catalog, and never logs the key", async () => {
    const fetchImpl = fakeUpstream();
    const { deps, lines, written } = harness(
      { RECIPE_API_KEY: SECRET },
      fetchImpl as unknown as typeof fetch,
    );
    expect(await run(deps)).toBe(0);
    expect(fetchImpl).toHaveBeenCalledTimes(26);
    for (const [url] of fetchImpl.mock.calls) {
      expect(String(url)).toContain(`/api/json/v2/${SECRET}/search.php?f=`);
    }
    expect(written).toHaveLength(1);
    expect(written[0].data.source).toBe("supporter");
    expect(written[0].data.meals).toHaveLength(26 * 30);
    expect(lines.join("\n")).not.toContain(SECRET);
    expect(lines.join("\n")).not.toContain("themealdb.com");
  });

  it("fails a keyed build when a letter fails, without logging the key", async () => {
    const fetchImpl = fakeUpstream({ failLetters: ["q"] });
    const { deps, lines, written } = harness(
      { RECIPE_API_KEY: SECRET },
      fetchImpl as unknown as typeof fetch,
    );
    expect(await run(deps)).toBe(1);
    expect(written).toHaveLength(0);
    // One try plus two retries for the failing letter.
    const qCalls = fetchImpl.mock.calls.filter(([u]) =>
      String(u).endsWith("f=q"),
    );
    expect(qCalls).toHaveLength(3);
    const log = lines.join("\n");
    expect(log).toContain("q");
    expect(log).not.toContain(SECRET);
    expect(log).not.toContain("themealdb.com");
  });

  it("fails a keyed build below MIN_RECIPES", async () => {
    const { deps, written } = harness(
      { RECIPE_API_KEY: SECRET },
      fakeUpstream({ perLetter: 1 }) as unknown as typeof fetch,
    );
    expect(await run(deps)).toBe(1);
    expect(written).toHaveLength(0);
  });

  it("treats an empty 200 body as a failure", async () => {
    const { deps } = harness(
      { RECIPE_API_KEY: SECRET },
      fakeUpstream({ body: "" }) as unknown as typeof fetch,
    );
    expect(await run(deps)).toBe(1);
  });

  it("uses the v1 test key without a key", async () => {
    const fetchImpl = fakeUpstream();
    const { deps, written } = harness({}, fetchImpl as unknown as typeof fetch);
    expect(await run(deps)).toBe(0);
    for (const [url] of fetchImpl.mock.calls) {
      expect(String(url)).toContain("/api/json/v1/1/search.php?f=");
    }
    expect(written[0].data.source).toBe("test-key");
  });

  it("writes an empty 'unavailable' catalog and exits 0 when keyless fetching fails", async () => {
    const { deps, lines, written } = harness(
      {},
      fakeUpstream({ failLetters: [...LETTERS] }) as unknown as typeof fetch,
    );
    expect(await run(deps)).toBe(0);
    expect(written).toHaveLength(1);
    expect(written[0].data).toMatchObject({ source: "unavailable", meals: [] });
    expect(lines.join("\n")).toMatch(/WARNING/);
  });

  it("skips with --if-stale when the file is fresh", async () => {
    const fetchImpl = fakeUpstream();
    const { deps, written } = harness({}, fetchImpl as unknown as typeof fetch);
    const now = deps.now();
    expect(
      await run({
        ...deps,
        argv: ["--if-stale"],
        statFile: async () => ({ mtimeMs: now - 60_000 }),
        catalogIsValid: async () => true,
      }),
    ).toBe(0);
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(written).toHaveLength(0);
  });

  it("keeps a stale local catalog with --if-stale if fetching fails", async () => {
    const { deps, written } = harness(
      { RECIPE_API_KEY: SECRET },
      fakeUpstream({ failLetters: [...LETTERS] }) as unknown as typeof fetch,
    );
    expect(
      await run({
        ...deps,
        argv: ["--if-stale"],
        statFile: async () => ({ mtimeMs: 0 }),
        catalogIsValid: async () => true,
      }),
    ).toBe(0);
    expect(written).toHaveLength(0);
  });
});
