"use client";

import { useRef, useState, type ReactNode } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

/*
 * Hand-drawn line illustrations for each interest. One shared style: 48px
 * grid, 2px rounded strokes in currentColor (the accent), with a light tint
 * fill for volume. Purely decorative — the tile label carries the meaning.
 */
function Glyph({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className="h-full w-full"
    >
      {children}
    </svg>
  );
}

/** Light tint fill shared by every illustration. */
const TINT = { fill: "currentColor", fillOpacity: 0.14 } as const;

const BlossomIcon = (
  <Glyph>
    {[0, 72, 144, 216, 288].map((deg) => (
      <ellipse
        key={deg}
        cx="24"
        cy="14"
        rx="5.5"
        ry="9"
        transform={`rotate(${deg} 24 24)`}
        {...TINT}
      />
    ))}
    <circle cx="24" cy="24" r="3" fill="currentColor" />
  </Glyph>
);

const BasketballIcon = (
  <Glyph>
    <circle cx="24" cy="24" r="18" {...TINT} />
    <path d="M24 6v36M6 24h36" />
    <path d="M11.5 11.5c5 5.5 5 19.5 0 25M36.5 11.5c-5 5.5-5 19.5 0 25" />
  </Glyph>
);

const ShoeIcon = (
  <Glyph>
    <path
      d="M7 32v-6q0-4 4-4l6-1 5-8q1-1 2.5-.5l5.5 2q1.5.5 1 2L29 22q6 2 11 4.5 3 1.5 3 5.5z"
      {...TINT}
    />
    <rect x="5" y="32" width="38" height="5" rx="2.5" />
    <path d="M19 19l5 2.5M21.5 15.5l5 2.5" />
  </Glyph>
);

const DumbbellIcon = (
  <Glyph>
    <g transform="rotate(-15 24 24)">
      <path d="M14 24h20" />
      <rect x="8" y="14" width="6" height="20" rx="2" {...TINT} />
      <rect x="34" y="14" width="6" height="20" rx="2" {...TINT} />
      <rect x="4" y="18" width="4" height="12" rx="1.5" />
      <rect x="40" y="18" width="4" height="12" rx="1.5" />
    </g>
  </Glyph>
);

const GuitarIcon = (
  <Glyph>
    <g transform="rotate(35 24 24)">
      <rect x="22.5" y="6" width="3" height="12.5" rx="1" />
      <rect x="21.5" y="2.5" width="5" height="4.5" rx="1" />
      <path
        d="M24 18c4.5 0 7 2.5 7 5.5 0 2.5-2.5 4-2.5 5.5s5.5 3 5.5 8c0 4.5-4.5 7-10 7s-10-2.5-10-7c0-5 5.5-6.5 5.5-8s-2.5-3-2.5-5.5c0-3 2.5-5.5 7-5.5z"
        {...TINT}
      />
      <circle cx="24" cy="33" r="3" />
      <path d="M20.5 39.5h7" />
    </g>
  </Glyph>
);

/** Two speech bubbles — languages, without borrowing Duolingo's mascot. */
const LanguageIcon = (
  <Glyph>
    <path
      d="M9 4h14a5 5 0 0 1 5 5v8a5 5 0 0 1-5 5H15l-6 6v-6a5 5 0 0 1-5-5V9a5 5 0 0 1 5-5z"
      {...TINT}
    />
    <path d="M11 18l4-10 4 10M12.5 14.5h5" />
    {/* Second bubble sits on top, so it gets a solid surface fill first. */}
    <path
      d="M25 20h14a5 5 0 0 1 5 5v8a5 5 0 0 1-5 5v6l-6-6h-8a5 5 0 0 1-5-5v-8a5 5 0 0 1 5-5z"
      fill="var(--surface)"
    />
    <path
      d="M25 20h14a5 5 0 0 1 5 5v8a5 5 0 0 1-5 5v6l-6-6h-8a5 5 0 0 1-5-5v-8a5 5 0 0 1 5-5z"
      {...TINT}
    />
    <path d="M26 27h12M26 31.5h8" />
  </Glyph>
);

const PanIcon = (
  <Glyph>
    <path d="M33 21l12-6" strokeWidth={4} />
    <circle cx="20" cy="26" r="14" {...TINT} />
    <path
      d="M13 24c-1-5 4-8 8-6 4-3 9 1 7 6 2 5-3 9-8 8-5 1-9-3-7-8z"
      fill="var(--surface)"
    />
    <circle cx="20.5" cy="25" r="3.5" fill="currentColor" />
  </Glyph>
);

interface InterestList {
  heading: string;
  items: string[];
}

interface Interest {
  label: string;
  /** Decorative line illustration shown in the tile corner. */
  icon: ReactNode;
  /** Grid span classes to size the tile in the bento layout. */
  span: string;
  /** Optional back-face content; when present the tile flips on click. */
  back?: InterestList[];
}

const INTERESTS: Interest[] = [
  {
    label: "Anime",
    icon: BlossomIcon,
    span: "sm:col-span-2",
    back: [
      {
        heading: "Currently watching",
        items: ["Dr. Stone", "One Piece (Caught up)"],
      },
      {
        heading: "Favorites",
        items: [
          "Hunter x Hunter",
          "Attack on Titan",
          "Naruto",
          "Black Clover",
          "Demon Slayer",
        ],
      },
    ],
  },
  {
    label: "Sports",
    icon: BasketballIcon,
    span: "sm:col-span-1",
    back: [
      {
        heading: "Minnesota fan!",
        items: ["Timberwolves", "Vikings", "Twins", "Wild"],
      },
    ],
  },
  {
    label: "Running",
    icon: ShoeIcon,
    span: "sm:col-span-1 sm:row-span-1",
    back: [
      {
        heading: "",
        items: ["Half Marathon Training"],
      },
    ],
  },
  {
    label: "Lifting",
    icon: DumbbellIcon,
    span: "sm:col-span-1 sm:row-span-1",
  },
  {
    label: "Acoustic Guitar",
    icon: GuitarIcon,
    span: "sm:col-span-1 sm:row-span-1",
  },
  {
    label: "Languages",
    icon: LanguageIcon,
    span: "sm:col-span-1 sm:row-span-1",
    back: [
      {
        heading: "Learning",
        items: ["Japanese"],
      },
      {
        heading: "Fluent",
        items: ["Vietnamese"],
      },
    ],
  },
  {
    label: "Cooking",
    icon: PanIcon,
    span: "sm:col-span-1 sm:row-span-1 md:col-span-2",
    back: [
      {
        heading: "Specalities",
        items: ["Pad Thai, Chili, Stir Fry, Curry"],
      },
    ],
  },
];

function BentoTile({ interest }: { interest: Interest }) {
  const ref = useRef<HTMLDivElement>(null);
  const [flipped, setFlipped] = useState(false);
  const flippable = Boolean(interest.back?.length);
  const longTile = interest.back?.some((x) => x.items.length >= 2);

  // Cursor-follow tilt (disabled while flipped so it doesn't fight the flip).
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const rotateX = useSpring(useTransform(my, [0, 1], [6, -6]), {
    stiffness: 200,
    damping: 20,
  });
  const rotateY = useSpring(useTransform(mx, [0, 1], [-6, 6]), {
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
      whileHover={{ scale: 1.02 }}
      whileTap={flippable ? { scale: 0.98 } : undefined}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      style={{
        rotateX: flipped ? 0 : rotateX,
        rotateY: flipped ? 0 : rotateY,
        transformPerspective: 1000,
      }}
      className={`group relative ${interest.span} ${longTile ? "row-span-2" : ""} min-h-32 ${flippable ? "cursor-pointer" : "cursor-default"}`}
    >
      {/* Inner flipper: rotates 180° on the Y axis. */}
      <motion.div
        className="relative h-full w-full"
        style={{ transformStyle: "preserve-3d" }}
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 26 }}
      >
        {/* FRONT — paper surface, hairline, accent on hover. */}
        <div
          className="absolute inset-0 overflow-hidden rounded-2xl border border-line bg-surface transition-colors duration-200 group-hover:border-[color-mix(in_srgb,var(--accent)_45%,var(--line))]"
          style={{ backfaceVisibility: "hidden" }}
        >
          {/* Accent line illustration in the corner; lifts and tilts on hover. */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute bottom-3 right-3 h-14 w-14 transition-transform duration-300 group-hover:-translate-y-1 group-hover:-rotate-6 motion-reduce:translate-none motion-reduce:rotate-none sm:h-20 sm:w-20"
            style={{ color: "var(--accent)" }}
          >
            {interest.icon}
          </span>
          <div className="relative flex h-full flex-col justify-between p-5">
            <span className="font-display text-xl font-semibold leading-tight tracking-tight text-app sm:text-2xl">
              {interest.label}
            </span>
            {flippable && (
              <span className="editorial-meta inline-flex items-center gap-1 text-faint transition-colors group-hover:text-[var(--accent)]">
                more
                <svg
                  aria-hidden="true"
                  width="14"
                  height="14"
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
            className="absolute inset-0 overflow-hidden rounded-2xl border border-line bg-surface-raised"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            <div className="flex h-full flex-col p-5">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-display text-sm font-semibold text-app">
                  {interest.label}
                </span>
                <span className="editorial-meta text-faint">back</span>
              </div>
              <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-auto pr-1 md:flex-row md:gap-6">
                {interest.back!.map((group) => (
                  <div key={group.heading} className="md:flex-1">
                    {group.heading && (
                      <p className="editorial-meta uppercase text-faint">
                        {group.heading}
                      </p>
                    )}
                    <ul className="mt-1 space-y-0.5">
                      {group.items.map((item) => (
                        <li key={item} className="text-sm text-app">
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
    <div className="grid grid-cols-2 gap-4 auto-rows-[8rem] sm:grid-cols-4 sm:auto-rows-[minmax(8rem,1fr)]">
      {INTERESTS.map((interest) => (
        <BentoTile key={interest.label} interest={interest} />
      ))}
    </div>
  );
}
