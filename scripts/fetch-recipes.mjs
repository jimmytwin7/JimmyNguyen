#!/usr/bin/env node
/**
 * Fetches TheMealDB's whole recipe catalog for Scrambl.
 *
 * Runs before every build (`prebuild`) and, when the local copy is older than
 * a day, before `npm run dev` (`predev --if-stale`). It lists the catalog
 * letter by letter (`search.php?f=a..z`), keeps only the fields the app uses,
 * and writes `.data/recipes.json`. That file ships with the /api/recipes
 * function (see `outputFileTracingIncludes` in next.config.ts) and is
 * gitignored: it is never committed or served from public/.
 *
 *   npm run refresh:recipes            # fetch now
 *   node scripts/fetch-recipes.mjs --if-stale   # skip if < 24h old
 *
 * Key handling (RECIPE_API_KEY, optional, read from .env.local / .env / env):
 * - Set (Vercel Production): strict. Uses the v2 API with the supporter key.
 *   Any letter failing after retries, or fewer than MIN_RECIPES recipes,
 *   exits non-zero so the build fails and Vercel keeps the previous
 *   deployment.
 * - Unset (local, Preview): uses v1 with TheMealDB's public test key "1". On
 *   failure it writes an empty catalog marked "unavailable" (the app then
 *   shows a clear message) and exits 0, so the build still succeeds.
 *
 * The key is never logged, and neither are request URLs (they contain it).
 * Logs carry only counts and letters.
 */
import { mkdir, readFile, rename, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

export const OUT_FILE = path.join(ROOT, ".data", "recipes.json");

/**
 * Smallest catalog a keyed build accepts: about 90% of the 790 recipes
 * TheMealDB listed when this was written. A big drop means something went
 * wrong upstream, and shipping a fraction of the catalog would be worse than
 * keeping the previous deployment.
 */
export const MIN_RECIPES = 710;

export const LETTERS = "abcdefghijklmnopqrstuvwxyz".split("");

/** Raw TheMealDB fields kept. Normalization happens at runtime in TS. */
export const KEPT_FIELDS = [
  "idMeal",
  "strMeal",
  "strMealThumb",
  "strCategory",
  "strArea",
  "strInstructions",
  "strSource",
  ...Array.from({ length: 20 }, (_, i) => `strIngredient${i + 1}`),
  ...Array.from({ length: 20 }, (_, i) => `strMeasure${i + 1}`),
];

const TEST_KEY = "1";
// Fixed upstream hosts; nothing user-controlled ever reaches these URLs.
const BASE_URL_V1 = "https://www.themealdb.com/api/json/v1";
// v1 `search.php?f=` answers an empty body for supporter keys, so keyed
// builds use v2 (identical records, measured on all 26 letters).
const BASE_URL_V2 = "https://www.themealdb.com/api/json/v2";

const CONCURRENCY = 3;
const TIMEOUT_MS = 10_000;
const RETRIES = 2;
const BACKOFF_MS = [800, 2000];
const STALE_AFTER_MS = 24 * 60 * 60 * 1000;

/**
 * Keep only KEPT_FIELDS from one meal. String values are kept as-is; anything
 * else becomes null. Returns null if the record has no usable id or title.
 */
export function pickMealFields(meal) {
  if (typeof meal !== "object" || meal === null || Array.isArray(meal))
    return null;
  const id = typeof meal.idMeal === "string" ? meal.idMeal.trim() : "";
  const title = typeof meal.strMeal === "string" ? meal.strMeal.trim() : "";
  if (!/^\d+$/.test(id) || !title) return null;
  /** @type {Record<string, string | null>} */
  const out = {};
  for (const field of KEPT_FIELDS) {
    const value = meal[field];
    out[field] = typeof value === "string" ? value : null;
  }
  out.idMeal = id;
  return out;
}

/**
 * The `meals` array from a search response. TheMealDB answers `null` for no
 * results and sometimes a string or object "access-level message"; both are
 * treated as empty.
 */
export function mealsFromResponse(body) {
  const meals =
    typeof body === "object" && body !== null ? body.meals : undefined;
  return Array.isArray(meals) ? meals : [];
}

/** Merge per-letter meal lists into a catalog, de-duplicated by idMeal. */
export function assembleCatalog(mealLists, { source, generatedAt }) {
  const byId = new Map();
  for (const list of mealLists) {
    for (const raw of list) {
      const meal = pickMealFields(raw);
      if (meal && !byId.has(meal.idMeal)) byId.set(meal.idMeal, meal);
    }
  }
  return { generatedAt, source, meals: [...byId.values()] };
}

/**
 * What to do with a fetch result.
 * - "write": the catalog is good.
 * - "fail": keyed build with a problem; exit non-zero.
 * - "unavailable": keyless build with a problem; write an empty catalog.
 */
export function decideOutcome({
  hasKey,
  failedLetters,
  count,
  minRecipes = MIN_RECIPES,
}) {
  const problems = [];
  if (failedLetters.length > 0)
    problems.push(`letters failed after retries: ${failedLetters.join(",")}`);
  if (count < minRecipes)
    problems.push(`only ${count} recipes (need at least ${minRecipes})`);
  if (problems.length === 0) return { action: "write", problems };
  return { action: hasKey ? "fail" : "unavailable", problems };
}

/** True if a file modified at `mtimeMs` is still fresh at `now`. */
export function isFresh(mtimeMs, now, maxAgeMs = STALE_AFTER_MS) {
  return now - mtimeMs < maxAgeMs;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * One letter, with timeout and retries. Throws a generic error that never
 * contains the URL (and so never the key).
 */
async function fetchLetter(letter, { baseUrl, key, fetchImpl, delay }) {
  const url = `${baseUrl}/${encodeURIComponent(key)}/search.php?f=${letter}`;
  for (let attempt = 0; attempt <= RETRIES; attempt++) {
    try {
      const res = await fetchImpl(url, {
        signal: AbortSignal.timeout(TIMEOUT_MS),
        headers: { accept: "application/json" },
      });
      if (!res.ok) throw new Error("bad status");
      // An empty or non-JSON body throws here and is retried.
      return mealsFromResponse(JSON.parse(await res.text()));
    } catch {
      if (attempt === RETRIES) throw new Error(`letter ${letter} failed`);
      await delay(BACKOFF_MS[attempt] ?? 2000);
    }
  }
  return [];
}

/** Fetch every letter, CONCURRENCY at a time. */
export async function fetchAllLetters({
  key,
  baseUrl,
  fetchImpl = fetch,
  delay = sleep,
  letters = LETTERS,
  logger = console,
}) {
  const mealLists = [];
  const failedLetters = [];
  for (let i = 0; i < letters.length; i += CONCURRENCY) {
    const batch = letters.slice(i, i + CONCURRENCY);
    const results = await Promise.allSettled(
      batch.map((l) => fetchLetter(l, { baseUrl, key, fetchImpl, delay })),
    );
    results.forEach((result, j) => {
      if (result.status === "fulfilled") mealLists.push(result.value);
      else {
        failedLetters.push(batch[j]);
        logger.warn(`[fetch-recipes] ${batch[j]}: failed after retries`);
      }
    });
    if (i + CONCURRENCY < letters.length) await delay(200);
  }
  return { mealLists, failedLetters };
}

async function writeJsonAtomic(file, data) {
  await mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.tmp`;
  await writeFile(tmp, JSON.stringify(data), "utf8");
  await rename(tmp, file);
}

async function hasValidCatalog(file) {
  try {
    const data = JSON.parse(await readFile(file, "utf8"));
    return Array.isArray(data?.meals) && data.meals.length > 0;
  } catch {
    return false;
  }
}

/**
 * @typedef {object} Logger
 * @property {(message: string) => void} info
 * @property {(message: string) => void} warn
 * @property {(message: string) => void} error
 */

/**
 * The whole script, with every side effect injectable for tests. Returns the
 * process exit code.
 *
 * @param {{
 *   env?: Record<string, string | undefined>,
 *   argv?: string[],
 *   fetchImpl?: (url: string, init?: RequestInit) => Promise<Response>,
 *   delay?: (ms: number) => Promise<void>,
 *   logger?: Logger,
 *   outFile?: string,
 *   now?: () => number,
 *   statFile?: (file: string) => Promise<{ mtimeMs: number }>,
 *   writeCatalog?: (file: string, data: unknown) => Promise<void>,
 *   catalogIsValid?: (file: string) => Promise<boolean>,
 * }} [options]
 * @returns {Promise<number>}
 */
export async function run({
  env = process.env,
  argv = process.argv.slice(2),
  fetchImpl = fetch,
  delay = sleep,
  logger = console,
  outFile = OUT_FILE,
  now = () => Date.now(),
  statFile = stat,
  writeCatalog = writeJsonAtomic,
  catalogIsValid = hasValidCatalog,
} = {}) {
  const ifStale = argv.includes("--if-stale");
  const rel = path.relative(ROOT, outFile) || outFile;

  let existingMtime = null;
  try {
    existingMtime = (await statFile(outFile)).mtimeMs;
  } catch {
    existingMtime = null;
  }
  if (
    ifStale &&
    existingMtime !== null &&
    isFresh(existingMtime, now()) &&
    (await catalogIsValid(outFile))
  ) {
    logger.info(`[fetch-recipes] ${rel} is less than 24h old; skipping.`);
    return 0;
  }

  const key = env.RECIPE_API_KEY?.trim() || "";
  const hasKey = key !== "";
  const source = hasKey ? "supporter" : "test-key";
  logger.info(
    `[fetch-recipes] fetching the catalog (${hasKey ? "supporter key" : "public test key"})…`,
  );

  const { mealLists, failedLetters } = await fetchAllLetters({
    key: hasKey ? key : TEST_KEY,
    baseUrl: hasKey ? BASE_URL_V2 : BASE_URL_V1,
    fetchImpl,
    delay,
    logger,
  });
  const catalog = assembleCatalog(mealLists, {
    source,
    generatedAt: new Date(now()).toISOString(),
  });
  const outcome = decideOutcome({
    hasKey,
    failedLetters,
    count: catalog.meals.length,
  });

  if (outcome.action === "write") {
    await writeCatalog(outFile, catalog);
    logger.info(
      `[fetch-recipes] wrote ${catalog.meals.length} recipes (${source}) → ${rel}`,
    );
    return 0;
  }

  for (const problem of outcome.problems)
    logger.error(`[fetch-recipes] ${problem}`);

  // A dev refresh shouldn't throw away a working local catalog because the
  // network is down; keep it and carry on.
  if (ifStale && existingMtime !== null && (await catalogIsValid(outFile))) {
    logger.warn(`[fetch-recipes] keeping the existing (stale) ${rel}.`);
    return 0;
  }

  if (outcome.action === "fail") {
    logger.error(
      "[fetch-recipes] RECIPE_API_KEY is set, so this is fatal. The build " +
        "stops here and the previous deployment stays live.",
    );
    return 1;
  }

  await writeCatalog(outFile, {
    generatedAt: catalog.generatedAt,
    source: "unavailable",
    meals: [],
  });
  logger.warn(
    `[fetch-recipes] WARNING: wrote an empty catalog to ${rel}. Pantry ` +
      "Quest will show “Recipe data isn't available in this build.” Run " +
      "`npm run refresh:recipes` to try again.",
  );
  return 0;
}

const isMain =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  // Same env loading as refresh-photos.mjs: .env.local first, then .env.
  dotenv.config({ path: path.join(ROOT, ".env.local"), quiet: true });
  dotenv.config({ path: path.join(ROOT, ".env"), quiet: true });
  run()
    .then((code) => process.exit(code))
    .catch(() => {
      // Deliberately no error details: they could include a request URL.
      // Keyless builds must still succeed (the app reports "unavailable").
      const strict = Boolean(process.env.RECIPE_API_KEY?.trim());
      console.error("[fetch-recipes] failed unexpectedly.");
      process.exit(strict ? 1 : 0);
    });
}
