import Image from "next/image";
import type { Education } from "@/lib/data/education";

interface EducationListProps {
  entries: Education[];
}

export default function EducationList({ entries }: EducationListProps) {
  return (
    <ul className="space-y-6">
      {entries.map((entry) => (
        <li key={`${entry.institution}-${entry.graduationYear}`}>
          {/*
            Mobile: top row = logo (left) + university name (right); details fill
            the row below, full width.
            sm+: logo on the left, all text beside it, "Class of" pushed right.
          */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch sm:gap-4">
            {/* Top row on mobile / left column on desktop */}
            <div className="flex items-center gap-4 sm:contents">
              {entry.logo && (
                <Image
                  src={entry.logo}
                  alt={`${entry.institution} logo`}
                  width={96}
                  height={96}
                  className="shrink-0 w-16 sm:w-24 h-auto rounded-sm object-contain"
                />
              )}
              {/* University name — sits top-right on mobile, hidden here on
                  desktop (shown in the detail block instead). */}
              <h3 className="text-lg font-semibold text-gray-900 sm:hidden">
                {entry.institution}
              </h3>
            </div>

            {/* Detail block: full-width bottom on mobile, beside the logo on sm+ */}
            <div className="flex flex-1 items-start justify-between gap-4">
              <div className="flex flex-col gap-1">
                {/* Institution name for desktop only (mobile shows it up top) */}
                <h3 className="hidden text-lg font-semibold text-gray-900 sm:block">
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
  );
}
