import { experience } from "@/lib/data/experience";
import { skillCategories } from "@/lib/data/skills";
import { education } from "@/lib/data/education";
import { reverseChronological } from "@/lib/utils/sort";
import ExperienceList from "@/components/resume/ExperienceList";
import SkillsSection from "@/components/resume/SkillsSection";
import EducationList from "@/components/resume/EducationList";
import DownloadButton from "@/components/ui/DownloadButton";

export const metadata = {
  title: "Experience — Jimmy Nguyen",
  description:
    "Professional experience, skills, and education for Jimmy Nguyen.",
};

/** Numbered editorial section header — "01 — Experience". */
function SectionLabel({
  num,
  title,
  id,
  as = "h2",
}: {
  num: string;
  title: string;
  id: string;
  as?: "h1" | "h2";
}) {
  const Heading = as;
  return (
    <div className="editorial-label">
      <span className="editorial-label__num">{num}</span>
      <Heading id={id} className="editorial-label__title text-xl sm:text-2xl">
        {title}
      </Heading>
      <span className="editorial-label__rule" aria-hidden="true" />
    </div>
  );
}

export default function ResumePage() {
  const sortedExperience = reverseChronological(experience);

  return (
    <div className="space-y-16 sm:space-y-20">
      {/* Professional Summary */}
      <section aria-labelledby="summary-heading">
        <SectionLabel num="00" title="Summary" id="summary-heading" as="h1" />
        <p className="max-w-3xl text-lg leading-relaxed text-app">
          Software Engineer with experience in financial services, building
          React-based client web applications integrated with headless CMS and
          RESTful services. Passionate about front-end development, software
          architecture, and cloud-native technologies.
        </p>
        <div className="mt-6">
          <DownloadButton />
        </div>
      </section>

      {/* Work Experience */}
      <section aria-labelledby="experience-heading">
        <SectionLabel num="01" title="Experience" id="experience-heading" />
        <ExperienceList entries={sortedExperience} />
      </section>

      {/* Skills */}
      <section aria-labelledby="skills-heading">
        <SectionLabel num="02" title="Skills" id="skills-heading" />
        <SkillsSection categories={skillCategories} />
      </section>

      {/* Education */}
      <section aria-labelledby="education-heading">
        <SectionLabel num="03" title="Education" id="education-heading" />
        <EducationList entries={education} />
      </section>
    </div>
  );
}
