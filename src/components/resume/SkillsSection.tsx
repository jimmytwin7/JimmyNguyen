import type { SkillCategory } from "@/lib/data/skills";

interface SkillsSectionProps {
  categories: SkillCategory[];
}

const CHIP_COLORS = [
  "bg-orange-100 border-orange-200 text-orange-700 dark:bg-orange-500/15 dark:border-orange-500/30 dark:text-orange-300",
  "bg-green-100 border-green-200 text-green-700 dark:bg-green-500/15 dark:border-green-500/30 dark:text-green-300",
  "bg-cyan-100 border-cyan-200 text-cyan-700 dark:bg-cyan-500/15 dark:border-cyan-500/30 dark:text-cyan-300",
  "bg-blue-100 border-blue-200 text-blue-700 dark:bg-blue-500/15 dark:border-blue-500/30 dark:text-blue-300",
  "bg-indigo-100 border-indigo-200 text-indigo-700 dark:bg-indigo-500/15 dark:border-indigo-500/30 dark:text-indigo-300",
  "bg-pink-100 border-pink-200 text-pink-700 dark:bg-pink-500/15 dark:border-pink-500/30 dark:text-pink-300",
];

/** Stable hash so the same skill always gets the same color */
function hashColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return CHIP_COLORS[hash % CHIP_COLORS.length];
}

export default function SkillsSection({ categories }: SkillsSectionProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
      {categories.map((category) => (
        <div key={category.label}>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted mb-3">
            {category.label}
          </h3>
          <ul className="flex flex-wrap gap-2">
            {category.skills.map((skill) => (
              <li
                key={skill.name}
                className={`px-3 py-1 text-sm rounded-full border ${hashColor(skill.name)}`}
              >
                {skill.name}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
