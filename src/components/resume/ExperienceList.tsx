import type { Company } from "@/lib/data/experience";
import ExperienceItem from "./ExperienceItem";

interface ExperienceListProps {
  entries: Company[];
}

export default function ExperienceList({ entries }: ExperienceListProps) {
  return (
    <ul className="relative ml-2 space-y-8 border-l border-gray-200 pl-6">
      {entries.map((company, index) => (
        <li key={`${company.name}-${index}`} className="relative">
          {/* Timeline dot, centered on the rail.
              Rail = ul's left border, 24px (pl-6) left of the li content, 1px wide.
              Dot is 12px (w-3); to center it on the 1px border:
              left = -(24px padding + 6px half-dot - 0.5px half-border). */}
          <span
            aria-hidden="true"
            className="absolute top-1.5 h-3 w-3 rounded-full ring-4 ring-white"
            style={{
              left: "calc(-1.5rem - 7px + 0.5px)",
              backgroundColor: "var(--color-brand-500)",
            }}
          />
          <ExperienceItem company={company} />
        </li>
      ))}
    </ul>
  );
}
