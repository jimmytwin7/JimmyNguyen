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
      <p className="mb-3 font-display text-base font-semibold text-app">
        {name}
        {location && (
          <span className="editorial-meta ml-2 font-normal">{location}</span>
        )}
      </p>

      {/* Roles */}
      <div className="space-y-3">
        {roles.map((role, index) => (
          <div key={`${role.title}-${role.startDate}-${index}`}>
            <div className="mb-2 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
              <h3 className="text-base font-semibold text-app">{role.title}</h3>
              <time
                className="editorial-meta shrink-0 sm:text-right"
                dateTime={`${role.startDate}/${role.endDate === "present" ? "" : role.endDate}`}
              >
                {formatDate(role.startDate)} – {formatDate(role.endDate)}
              </time>
            </div>

            {role.bullets.length > 0 && (
              <ul className="space-y-1.5">
                {role.bullets.map((bullet, bi) => (
                  <li
                    key={bi}
                    className="flex gap-2.5 text-sm leading-relaxed text-app"
                  >
                    {/* Dash marker, echoing the reference's dense bullet list. */}
                    <span aria-hidden="true" className="select-none text-faint">
                      –
                    </span>
                    <span>{bullet}</span>
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
