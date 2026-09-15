"use client";

import { useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

interface InterestList {
  heading: string;
  items: string[];
}

interface Interest {
  label: string;
  emoji: string;
  /** Tailwind gradient classes for the tile background. */
  gradient: string;
  /** Grid span classes to size the tile in the bento layout. */
  span: string;
  /** Optional back-face content; when present the tile flips on click. */
  back?: InterestList[];
}

const INTERESTS: Interest[] = [
  {
    label: "Anime",
    emoji: "🌸",
    gradient: "from-fuchsia-600 via-pink-500 to-rose-500",
    span: "sm:col-span-2",
    back: [
      {
        heading: "Currently watching",
        items: ["Dr. Stone", "One Piece"],
      },
      {
        heading: "Favorites",
        items: ["Hunter x Hunter", "Attack on Titan", "Naruto", "Demon Slayer"],
      },
    ],
  },
  {
    label: "Sports",
    emoji: "🏀",
    gradient: "from-blue-700 via-indigo-600 to-purple-600",
    span: "sm:col-span-1",
    back: [
      {
        heading: "Minnesota teams",
        items: ["Timberwolves", "Vikings", "Twins", "Wild"],
      },
    ],
  },
  {
    label: "Running",
    emoji: "",
    gradient: "from-sky-500 via-cyan-500 to-teal-500",
    span: "sm:col-span-1 sm:row-span-1",
  },
  {
    label: "Lifting",
    emoji: "🏋️",
    gradient: "from-slate-600 via-gray-600 to-zinc-700",
    span: "sm:col-span-1 sm:row-span-1",
  },
  {
    label: "Acoustic Guitar",
    emoji: "🎸",
    gradient: "from-orange-500 via-amber-500 to-yellow-500",
    span: "sm:col-span-1 sm:row-span-1",
  },
  {
    label: "Duolingo",
    emoji: "🦉",
    gradient: "from-green-500 via-emerald-500 to-lime-500",
    span: "sm:col-span-1 sm:row-span-1",
  },
  {
    label: "Cooking",
    emoji: "🍳",
    gradient: "from-amber-500 via-orange-500 to-red-500",
    span: "sm:col-span-1 sm:row-span-1",
  },
];

function BentoTile({ interest }: { interest: Interest }) {
  const ref = useRef<HTMLDivElement>(null);
  const [flipped, setFlipped] = useState(false);
  const flippable = Boolean(interest.back?.length);

  // Cursor-follow tilt (disabled while flipped so it doesn't fight the flip).
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const rotateX = useSpring(useTransform(my, [0, 1], [8, -8]), {
    stiffness: 200,
    damping: 20,
  });
  const rotateY = useSpring(useTransform(mx, [0, 1], [-8, 8]), {
    stiffness: 200,
    damping: 20,
  });

  const handleMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (flipped) return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    mx.set((e.clientX - rect.left) / rect.width);
    my.set((e.clientY - rect.top) / rect.height);
  };

  const reset = () => {
    mx.set(0.5);
    my.set(0.5);
  };

  const toggle = () => {
    if (!flippable) return;
    setFlipped((f) => !f);
    reset();
  };

  return (
    <motion.div
      ref={ref}
      onPointerMove={handleMove}
      onPointerLeave={reset}
      onClick={toggle}
      onKeyDown={(e) => {
        if (flippable && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          toggle();
        }
      }}
      role={flippable ? "button" : undefined}
      tabIndex={flippable ? 0 : undefined}
      aria-pressed={flippable ? flipped : undefined}
      aria-label={flippable ? `${interest.label} — click to flip` : undefined}
      whileHover={{ scale: 1.03 }}
      whileTap={flippable ? { scale: 0.98 } : undefined}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      style={{
        rotateX: flipped ? 0 : rotateX,
        rotateY: flipped ? 0 : rotateY,
        transformPerspective: 1000,
      }}
      className={`group relative ${interest.span} ${flippable ? "row-span-2" : ""} min-h-32 ${flippable ? "cursor-pointer" : "cursor-default"}`}
    >
      {/* Inner flipper: rotates 180° on the Y axis. */}
      <motion.div
        className="relative h-full w-full"
        style={{ transformStyle: "preserve-3d" }}
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 26 }}
      >
        {/* FRONT */}
        <div
          className={`absolute inset-0 overflow-hidden rounded-2xl bg-gradient-to-br ${interest.gradient} shadow-md`}
          style={{ backfaceVisibility: "hidden" }}
        >
          {/* Sheen sweep on hover */}
          <div className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
          <span
            aria-hidden="true"
            className="absolute -bottom-2 -right-1 text-7xl opacity-30 transition-transform duration-300 group-hover:-translate-y-1 group-hover:scale-110"
          >
            {interest.emoji}
          </span>
          <div className="relative flex h-full flex-col justify-between p-5">
            <span className="text-2xl sm:text-3xl font-extrabold leading-tight tracking-tight text-white drop-shadow-md">
              {interest.label}
            </span>
            {flippable && (
              <span className="inline-flex items-center gap-1 text-sm font-medium text-white/90">
                Click to see more
                <svg
                  aria-hidden="true"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </span>
            )}
          </div>
        </div>

        {/* BACK */}
        {flippable && (
          <div
            className="absolute inset-0 overflow-hidden rounded-2xl bg-white shadow-md ring-1 ring-gray-100"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            <div className="flex h-full flex-col p-5">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-900">
                  {interest.label}
                </span>
                <span className="text-xs text-gray-400">tap to flip back</span>
              </div>
              <div className="min-h-0 flex-1 overflow-auto pr-1 flex flex-col gap-3 md:flex-row md:gap-6">
                {interest.back!.map((group) => (
                  <div key={group.heading} className="md:flex-1">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                      {group.heading}
                    </p>
                    <ul className="mt-1 space-y-0.5">
                      {group.items.map((item) => (
                        <li key={item} className="text-sm text-gray-700">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

export default function InterestsBento() {
  return (
    <section aria-labelledby="interests-heading">
      <h2
        id="interests-heading"
        className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-4"
      >
        A few of my interests
      </h2>
      <div className="grid grid-cols-2 gap-4 auto-rows-[8rem] sm:grid-cols-4 sm:auto-rows-[minmax(8rem,1fr)]">
        {INTERESTS.map((interest) => (
          <BentoTile key={interest.label} interest={interest} />
        ))}
      </div>
    </section>
  );
}
