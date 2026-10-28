import Image from "next/image";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { ingredientIconUrl } from "@/lib/cooking/ingredient-assets";

/**
 * "Find my recipe" button: the pixel-art kitchen knife *is* the button. The
 * label is visually hidden but read by screen readers and used as the
 * accessible name; the knife image is decorative. Hover lifts the knife and
 * pressing it "chops" (globals.css `.pq-knife-btn`).
 */
export default function KnifeButton({
  children,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  return (
    <button
      type="button"
      {...props}
      className={`pq-knife-btn block ${className}`}
    >
      <span className="sr-only">{children}</span>
      <Image
        src={ingredientIconUrl("kitchen-knife")}
        alt=""
        width={128}
        height={128}
        // 16px pixel sprite; keep it crisp when scaled up.
        unoptimized
        aria-hidden="true"
        className="h-20 w-20 object-contain [image-rendering:pixelated] sm:h-24 sm:w-24"
      />
    </button>
  );
}
