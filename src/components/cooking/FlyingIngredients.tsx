"use client";

import { motion } from "framer-motion";
import IngredientIllustration from "./IngredientIllustration";

export interface Flight {
  name: string;
  /** Viewport coordinates (getBoundingClientRect) of the sprite's center. */
  from: { x: number; y: number };
  /** Viewport coordinates of the pot's mouth. */
  to: { x: number; y: number };
}

const SIZE = 56;
const STAGGER = 0.08;
const DURATION = 0.7;

/**
 * The "cook into the pot" moment: copies of the board's sprites arc from the
 * board into the pot (the board itself keeps its ingredients). Decorative and
 * pointer-transparent; PantryQuest only renders it when motion is allowed.
 */
export default function FlyingIngredients({
  flights,
  onDone,
}: {
  flights: Flight[];
  onDone: () => void;
}) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-50 overflow-hidden"
    >
      {flights.map((f, i) => {
        const x0 = f.from.x - SIZE / 2;
        const y0 = f.from.y - SIZE / 2;
        const x1 = f.to.x - SIZE / 2;
        const y1 = f.to.y - SIZE / 2;
        // Arc: peak above whichever end is higher.
        const peak = Math.min(y0, y1) - 120;
        return (
          <motion.div
            key={`${f.name}-${i}`}
            className="absolute left-0 top-0"
            initial={{ x: x0, y: y0, scale: 1, opacity: 1, rotate: 0 }}
            animate={{
              x: [x0, (x0 + x1) / 2, x1],
              y: [y0, peak, y1],
              scale: [1, 1.1, 0.35],
              opacity: [1, 1, 0],
              rotate: [0, i % 2 ? 160 : -160, i % 2 ? 320 : -320],
            }}
            transition={{
              duration: DURATION,
              delay: i * STAGGER,
              ease: "easeInOut",
              times: [0, 0.45, 1],
            }}
            onAnimationComplete={i === flights.length - 1 ? onDone : undefined}
          >
            <IngredientIllustration name={f.name} size={SIZE} bare />
          </motion.div>
        );
      })}
    </div>
  );
}
