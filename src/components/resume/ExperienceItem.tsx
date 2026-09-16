import type { Company } from "@/lib/data/experience";

interface ExperienceItemProps {
  company: Company;
}

function formatDate(date: string | "present"): string {
  if (date === "present") return "Present";
  const [year, month] = date.split("-");
  const d = new Date(Number(year), Number(month) - 1);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short" });
}

export default function ExperienceItem({ company }: ExperienceItemProps) {
  const { name, location, roles } = company;

  return (
    <article>
      {/* Company header */}
      <p
        className="text-base font-semibold mb-2"
        style={{ color: "var(--accent)" }}
      >
        {name}
        {location && (
          <span className="text-muted font-normal"> · {location}</span>
        )}
      </p>

      {/* Roles */}
      <div className="space-y-2">
        {roles.map((role, index) => (
          <div key={`${role.title}-${role.startDate}-${index}`}>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 mb-2">
              <h3 className="text-base font-semibold text-app">{role.title}</h3>
              <time
                className="text-sm text-muted shrink-0 sm:text-right"
                dateTime={`${role.startDate}/${role.endDate === "present" ? "" : role.endDate}`}
              >
                {formatDate(role.startDate)} – {formatDate(role.endDate)}
              </time>
            </div>

            {role.bullets.length > 0 && (
              <ul className="list-disc list-outside pl-5 space-y-1">
                {role.bullets.map((bullet, bi) => (
                  <li key={bi} className="text-app leading-relaxed text-sm">
                    {bullet}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </article>
  );
}
