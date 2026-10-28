import Image from "next/image";
import {
  getIngredientAsset,
  UNKNOWN_IMAGE_PATH,
} from "@/lib/cooking/ingredient-assets";

interface IngredientIllustrationProps {
  name: string;
  /** Size in px. */
  size?: number;
  /**
   * Draw the food on its own, with no colored tile behind it — used on the
   * cutting board so ingredients sit directly on the wood.
   */
  bare?: boolean;
}

/**
 * Ingredient art. Purely decorative — the ingredient's name is always shown as
 * text next to it — so images use empty alt text and tiles are aria-hidden.
 *
 * Renders, per ingredient: the pack art, the "no art" box for a known
 * ingredient the pack doesn't cover, or the "?" unknown box for an ingredient
 * with no asset entry at all.
 */
export default function IngredientIllustration({
  name,
  size = 56,
  bare = false,
}: IngredientIllustrationProps) {
  const asset = getIngredientAsset(name);
  const src = asset?.imagePath ?? UNKNOWN_IMAGE_PATH;
  // The "?" and "no art" boxes fill their tile; photos/sprites get breathing room.
  const isBox = !asset;
  const imageSize = bare || isBox ? size : Math.round(size * 0.8);
  const tile = bare
    ? "flex shrink-0 items-center justify-center"
    : "flex shrink-0 items-center justify-center rounded-2xl shadow-inner";

  return (
    <span
      aria-hidden="true"
      className={tile}
      style={{
        width: size,
        height: size,
        backgroundColor: bare ? undefined : asset?.tint,
      }}
    >
      <Image
        src={src}
        alt=""
        width={imageSize}
        height={imageSize}
        // Small sprite/vector files; keep pixel art crisp when scaled up.
        unoptimized
        className="object-contain [image-rendering:pixelated]"
      />
    </span>
  );
}
