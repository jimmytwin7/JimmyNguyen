import type { SkillCategory } from "@/lib/data/skills";

interface SkillsSectionProps {
  categories: SkillCategory[];
}

const CHIP_COLORS =
  "bg-blue-100 border-blue-200 text-blue-700 dark:bg-blue-500/15 dark:border-blue-500/30 dark:text-blue-300";

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
                className={`px-3 py-1 text-sm rounded-full border ${CHIP_COLORS}`}
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
