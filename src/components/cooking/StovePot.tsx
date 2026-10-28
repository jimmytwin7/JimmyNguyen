import Image from "next/image";
import type { Ref } from "react";
import { ingredientIconUrl } from "@/lib/cooking/ingredient-assets";

interface StovePotProps {
  /** Steam and a gentle bob while a search runs. */
  cooking: boolean;
  /** Ingredients are flying in: give the pot a receiving bounce. */
  lidOpen?: boolean;
  /** Invisible marker at the pot's mouth: where flying ingredients land. */
  mouthRef?: Ref<HTMLSpanElement>;
}

/**
 * The stove: ingredients hop into this pixel-art pot when you search. Purely
 * decorative (aria-hidden); search status is announced by PantryQuest's live
 * region and shown in the chef's speech bubble. The steam and bob are CSS
 * (globals.css) and switch off under prefers-reduced-motion.
 */
export default function StovePot({
  cooking,
  lidOpen = false,
  mouthRef,
}: StovePotProps) {
  return (
    <div
      aria-hidden="true"
      className={`pq-pot relative mx-auto w-36 sm:w-40 ${
        cooking ? "pq-pot-cooking" : ""
      } ${lidOpen ? "pq-pot-filling" : ""}`}
    >
      {/* steam puffs rising from the pot's mouth */}
      <span className="pq-steam">
        <span />
        <span />
        <span />
      </span>
      {/* where flying ingredients land */}
      <span
        ref={mouthRef}
        className="absolute left-1/2 top-[30%] h-1 w-1 -translate-x-1/2"
      />
      <Image
        src={ingredientIconUrl("cooking-pot")}
        alt=""
        width={160}
        height={160}
        // 16px pixel sprite; keep it crisp when scaled up.
        unoptimized
        className="pq-pot-img block w-full [image-rendering:pixelated]"
      />
    </div>
  );
}
