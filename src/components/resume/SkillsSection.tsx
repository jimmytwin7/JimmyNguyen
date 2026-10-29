import type { SkillCategory } from "@/lib/data/skills";

interface SkillsSectionProps {
  categories: SkillCategory[];
}

export default function SkillsSection({ categories }: SkillsSectionProps) {
  return (
    <div className="grid grid-cols-1 gap-x-10 gap-y-7 sm:grid-cols-2">
      {categories.map((category) => (
        <div key={category.label}>
          <h3 className="editorial-meta mb-3 uppercase">{category.label}</h3>
          <ul className="flex flex-wrap gap-2">
            {category.skills.map((skill) => (
              <li key={skill.name} className="editorial-tag">
                {skill.name}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
