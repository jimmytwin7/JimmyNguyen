import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import {
  getIngredientAsset,
  hasIngredientArt,
  INGREDIENT_ASSET_KEYS,
  NO_ART_IMAGE_PATH,
  UNKNOWN_IMAGE_PATH,
} from "@/lib/cooking/ingredient-assets";
import IngredientIllustration from "../IngredientIllustration";

const publicPath = (p: string) => join(process.cwd(), "public", p);

describe("IngredientIllustration", () => {
  it("resolves every asset to art on Cloudinary or the local no-art box", () => {
    for (const key of INGREDIENT_ASSET_KEYS) {
      const { imagePath } = getIngredientAsset(key)!;
      if (hasIngredientArt(key)) {
        // Licensed icons are served from Cloudinary, not the repo.
        expect(imagePath).toMatch(
          /^https:\/\/res\.cloudinary\.com\/mxlapddp\/image\/upload\/pantry-quest\/ingredients\//,
        );
      } else {
        expect(imagePath).toBe(NO_ART_IMAGE_PATH);
      }
    }
  });

  it("ships both local fallback boxes", () => {
    expect(existsSync(publicPath(NO_ART_IMAGE_PATH))).toBe(true);
    expect(existsSync(publicPath(UNKNOWN_IMAGE_PATH))).toBe(true);
  });

  it("renders pack art for a known ingredient, matched by key", () => {
    const { container } = render(
      <IngredientIllustration name="Cherry Tomatoes" />,
    );
    const img = container.querySelector("img")!;
    expect(img.getAttribute("src")).toContain(
      "res.cloudinary.com/mxlapddp/image/upload/pantry-quest/ingredients/tomato",
    );
    expect(img).toHaveAttribute("alt", "");
    expect(hasIngredientArt("Cherry Tomatoes")).toBe(true);
  });

  it("renders the no-art box for a known ingredient the pack lacks", () => {
    const { container } = render(<IngredientIllustration name="honey" />);
    expect(container.querySelector("img")!.getAttribute("src")).toContain(
      NO_ART_IMAGE_PATH,
    );
    expect(hasIngredientArt("honey")).toBe(false);
  });

  it("renders the unknown box for an unrecognized ingredient", () => {
    const { container } = render(<IngredientIllustration name="dragonfruit" />);
    expect(container.querySelector("img")!.getAttribute("src")).toContain(
      UNKNOWN_IMAGE_PATH,
    );
    expect(getIngredientAsset("dragonfruit")).toBeNull();
  });
});
