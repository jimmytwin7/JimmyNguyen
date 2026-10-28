import { ingredientMatchKey } from "./ingredient-normalizer";

/**
 * Local folder for the two original fallback boxes (committed to the repo).
 * The licensed pixel-art icons are NOT stored here — they're served from
 * Cloudinary (see CLOUDINARY_* below and scripts/upload-ingredients.mjs).
 */
const LOCAL_DIR = "/images/ingredients";

/**
 * Cloudinary delivery base for the ingredient icons. The licensed pack is kept
 * off the repo (git-ignored) and uploaded to the folder below with
 * `npm run upload:ingredients`.
 *
 * Note: no `f_auto`/`q_auto` — those re-encode and blur 16px pixel art. The
 * original PNG is delivered untouched and scaled up with image-rendering:
 * pixelated in the UI.
 */
const CLOUDINARY_CLOUD = "mxlapddp";
const CLOUDINARY_FOLDER = "pantry-quest/ingredients";
const CLOUDINARY_BASE = `https://res.cloudinary.com/${CLOUDINARY_CLOUD}/image/upload/${CLOUDINARY_FOLDER}`;

/**
 * Full Cloudinary delivery URL for a pack icon, given its file name (with or
 * without `.png`). Also used for the pot and knife sprites (StovePot,
 * KnifeButton), which ship in the same licensed pack.
 */
export function ingredientIconUrl(file: string): string {
  return `${CLOUDINARY_BASE}/${file.replace(/\.png$/, "")}`;
}

/**
 * Pixel-style box for a *known* ingredient that has no art in the current
 * pack (fork + knife crate). Distinct from UNKNOWN_IMAGE_PATH.
 */
export const NO_ART_IMAGE_PATH = `${LOCAL_DIR}/no-art.svg`;

/**
 * Pixel-style "?" box for an ingredient with no asset entry at all (free text
 * the app doesn't recognize).
 */
export const UNKNOWN_IMAGE_PATH = `${LOCAL_DIR}/unknown.svg`;

/**
 * Ingredient illustration mapping. Each entry renders its `imagePath`; entries
 * with art set `file` (a PNG icon delivered from Cloudinary), and those
 * without fall back to the "no art" box. Ingredients with no entry at all get
 * the "?" unknown box.
 *
 * Art is from Pixeltier's Food & Cooking RPG Icons (see CREDITS.md).
 */
export interface IngredientAsset {
  label: string;
  /** Tile tint; any CSS color. */
  tint: string;
  /** Icon file name (e.g. `tomato.png`); omit if there's no art. */
  file?: string;
}

const ASSETS: Record<string, IngredientAsset> = {
  chicken: { label: "Chicken", tint: "#fde68a", file: "chicken.png" },
  egg: { label: "Egg", tint: "#fef3c7", file: "egg.png" },
  rice: { label: "Rice", tint: "#e0f2fe", file: "rice.png" },
  pasta: { label: "Pasta", tint: "#fde68a", file: "pasta.png" },
  tomato: { label: "Tomato", tint: "#fecaca", file: "tomato.png" },
  onion: { label: "Onion", tint: "#f5d0fe", file: "onion.png" },
  garlic: { label: "Garlic", tint: "#f5f5f4", file: "garlic.png" },
  carrot: { label: "Carrot", tint: "#fed7aa", file: "carrot.png" },
  potato: { label: "Potato", tint: "#e7e5e4", file: "potato.png" },
  spinach: { label: "Spinach", tint: "#bbf7d0", file: "spinach.png" },
  "bell pepper": {
    label: "Bell pepper",
    tint: "#bbf7d0",
    file: "bell-pepper.png",
  },
  mushroom: { label: "Mushroom", tint: "#fecdd3", file: "mushroom.png" },
  tofu: { label: "Tofu", tint: "#f5f5f4", file: "tofu.png" },
  bean: { label: "Beans", tint: "#fecaca", file: "bean.png" },
  cheese: { label: "Cheese", tint: "#fef08a", file: "cheese.png" },
  milk: { label: "Milk", tint: "#e0f2fe", file: "milk.png" },
  butter: { label: "Butter", tint: "#fef9c3", file: "butter.png" },
  lemon: { label: "Lemon", tint: "#fef08a", file: "lemon.png" },
  "soy sauce": { label: "Soy sauce", tint: "#e7e5e4" },
  "olive oil": { label: "Olive oil", tint: "#d9f99d" },
  salt: { label: "Salt", tint: "#f1f5f9", file: "salt.png" },
  "black pepper": { label: "Black pepper", tint: "#a8a29e" },
  chili: { label: "Chili", tint: "#fecaca", file: "chili.png" },
  beef: { label: "Beef", tint: "#fecaca", file: "beef.png" },
  bacon: { label: "Bacon", tint: "#fecdd3", file: "bacon.png" },
  fish: { label: "Fish", tint: "#bae6fd", file: "fish.png" },
  shrimp: { label: "Shrimp", tint: "#fed7aa" },
  broccoli: { label: "Broccoli", tint: "#bbf7d0", file: "broccoli.png" },
  corn: { label: "Corn", tint: "#fef08a", file: "corn.png" },
  avocado: { label: "Avocado", tint: "#d9f99d", file: "avocado.png" },
  cucumber: { label: "Cucumber", tint: "#bbf7d0", file: "cucumber.png" },
  ginger: { label: "Ginger", tint: "#fed7aa" },
  bread: { label: "Bread", tint: "#fde68a", file: "bread.png" },
  flour: { label: "Flour", tint: "#fef3c7", file: "flour.png" },
  honey: { label: "Honey", tint: "#fde68a" },
  coconut: { label: "Coconut", tint: "#f5f5f4", file: "coconut.png" },
  apple: { label: "Apple", tint: "#fecaca", file: "apple.png" },
  banana: { label: "Banana", tint: "#fef08a", file: "banana.png" },
  "green onion": {
    label: "Green onion",
    tint: "#bbf7d0",
    file: "green-onion.png",
  },
};

/**
 * Returns the asset for an ingredient (with its match key and a resolved
 * `imagePath` — the art, or the "no art" box when the entry has none), or null
 * for an unrecognized ingredient so the caller shows the "?" unknown box.
 */
export function getIngredientAsset(
  name: string,
): (IngredientAsset & { imagePath: string; key: string }) | null {
  const key = ingredientMatchKey(name);
  const asset = ASSETS[key];
  if (!asset) return null;
  return {
    ...asset,
    imagePath: asset.file ? ingredientIconUrl(asset.file) : NO_ART_IMAGE_PATH,
    key,
  };
}

/** True when the ingredient has real art (not the "no art" box). */
export function hasIngredientArt(name: string): boolean {
  return Boolean(ASSETS[ingredientMatchKey(name)]?.file);
}

/** Quick-add items on the pantry shelf (all keys in the asset map). */
export const SHELF_INGREDIENTS: string[] = [
  "chicken",
  "egg",
  "rice",
  "pasta",
  "tomato",
  "onion",
  "garlic",
  "potato",
  "carrot",
  "cheese",
  "beef",
  "spinach",
];

/** Every ingredient key with an asset entry (tests check each has a file). */
export const INGREDIENT_ASSET_KEYS: string[] = Object.keys(ASSETS);

/**
 * Autocomplete vocabulary: everything with art, plus common extras that
 * TheMealDB uses as ingredient names. Free text is still allowed.
 */
export const INGREDIENT_SUGGESTIONS: string[] = Array.from(
  new Set([
    ...Object.values(ASSETS).map((a) => a.label.toLowerCase()),
    "red onion",
    "lime",
    "cilantro",
    "basil",
    "parsley",
    "thyme",
    "chickpeas",
    "lentils",
    "zucchini",
    "eggplant",
    "cabbage",
    "pork",
    "lamb",
    "salmon",
    "tuna",
    "noodles",
    "yogurt",
    "cream",
    "sugar",
    "vegetable oil",
    "chicken stock",
    "vegetable stock",
    "tomato paste",
    "cumin",
    "paprika",
    "chili powder",
    "peanut butter",
    "coconut milk",
    "spaghetti",
    "cornstarch",
  ]),
).sort();
