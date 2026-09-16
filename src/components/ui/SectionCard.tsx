import type { ReactNode } from "react";

interface SectionCardProps {
  /** Section heading text */
  title: string;
  /** Stable id for aria-labelledby wiring */
  id: string;
  /** Optional: render the title as an <h1> (used for the top section) */
  as?: "h1" | "h2";
  children: ReactNode;
}

export default function SectionCard({
  title,
  id,
  as = "h2",
  children,
}: SectionCardProps) {
  const Heading = as;
  return (
    <section
      aria-labelledby={id}
      className="rounded-2xl border border-edge bg-surface p-6 sm:p-8 shadow-sm"
    >
      <Heading
        id={id}
        className={
          as === "h1"
            ? "text-2xl sm:text-3xl font-bold tracking-tight text-app mb-4"
            : "text-xl font-bold tracking-tight text-app mb-6"
        }
      >
        {title}
      </Heading>
      {children}
    </section>
  );
}
