import { experience } from "@/lib/data/experience";
import { skillCategories } from "@/lib/data/skills";
import { education } from "@/lib/data/education";
import { reverseChronological } from "@/lib/utils/sort";
import ExperienceList from "@/components/resume/ExperienceList";
import SkillsSection from "@/components/resume/SkillsSection";
import EducationList from "@/components/resume/EducationList";
import DownloadButton from "@/components/ui/DownloadButton";

export const metadata = {
  title: "Resume — Jimmy Nguyen",
  description:
    "Professional experience, skills, and education for Jimmy Nguyen.",
};

export default function ResumePage() {
  const sortedExperience = reverseChronological(experience);

  return (
    <div className="space-y-8">
      {/* Professional Summary */}
      <section aria-labelledby="summary-heading">
        <h1
          id="summary-heading"
          className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 mb-4"
        >
          Professional Summary
        </h1>
        <p className="text-gray-700 leading-relaxed max-w-3xl">
          Software Engineer with experience in financial services building
          React-based client web applications integrated with headless CMS and
          RESTful services
        </p>
      </section>

      {/* Work Experience */}
      <section aria-labelledby="experience-heading">
        <h2
          id="experience-heading"
          className="text-2xl font-bold tracking-tight text-gray-900 mb-6"
        >
          Experience
        </h2>
        <ExperienceList entries={sortedExperience} />
      </section>

      {/* Skills */}
      <section aria-labelledby="skills-heading">
        <h2
          id="skills-heading"
          className="text-2xl font-bold tracking-tight text-gray-900 mb-6"
        >
          Skills
        </h2>
        <SkillsSection categories={skillCategories} />
      </section>

      {/* Education */}
      <section aria-labelledby="education-heading">
        <h2
          id="education-heading"
          className="text-2xl font-bold tracking-tight text-gray-900 mb-6"
        >
          Education
        </h2>
        <EducationList entries={education} />
      </section>

      {/* Download */}
      <div className="pt-4">
        <DownloadButton />
      </div>
    </div>
  );
}
