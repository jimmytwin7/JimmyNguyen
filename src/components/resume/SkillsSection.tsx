import type { SkillCategory } from "@/lib/data/skills";

interface SkillsSectionProps {
  categories: SkillCategory[];
}

const CHIP_COLORS = [
  "bg-orange-100 border-orange-200 text-orange-700",
  "bg-green-100 border-green-200 text-green-700",
  "bg-cyan-100 border-cyan-200 text-cyan-700",
  "bg-blue-100 border-blue-200 text-blue-700",
  "bg-indigo-100 border-indigo-200 text-indigo-700",
  "bg-pink-100 border-pink-200 text-pink-700",
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {categories.map((category) => (
        <div
          key={category.label}
          className="bg-white rounded-xl p-5 border border-gray-100"
        >
          <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3">
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
