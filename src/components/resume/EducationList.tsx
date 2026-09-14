import Image from "next/image";
import type { Education } from "@/lib/data/education";

interface EducationListProps {
  entries: Education[];
}

export default function EducationList({ entries }: EducationListProps) {
  return (
    <div className="flex rounded-lg overflow-hidden">
      <ul className="w-full">
        {entries.map((entry) => (
          <li key={`${entry.institution}-${entry.graduationYear}`}>
            {/* items-stretch so the logo can match the row's full height */}
            <div className="flex items-stretch gap-4">
              {entry.logo && (
                <Image
                  src={entry.logo}
                  alt={`${entry.institution} logo`}
                  width={96}
                  height={96}
                  className="shrink-0 w-24 h-auto rounded-sm object-contain"
                />
              )}

              {/* Text block grows; Class of pushes to the far right */}
              <div className="flex flex-1 items-start justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {entry.institution}
                  </h3>
                  <p className="text-base text-gray-700">
                    {entry.degree}
                    {entry.fieldOfStudy && (
                      <span className="text-gray-500">
                        {" "}
                        · {entry.fieldOfStudy}
                      </span>
                    )}
                  </p>
                  <p className="text-base text-gray-500">Minor in Management</p>
                </div>
                <p className="text-sm text-gray-500 shrink-0">
                  Class of {entry.graduationYear}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
