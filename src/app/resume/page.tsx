import { experience } from "@/lib/data/experience";
import { skillCategories } from "@/lib/data/skills";
import { education } from "@/lib/data/education";
import { reverseChronological } from "@/lib/utils/sort";
import ExperienceList from "@/components/resume/ExperienceList";
import SkillsSection from "@/components/resume/SkillsSection";
import EducationList from "@/components/resume/EducationList";
import DownloadButton from "@/components/ui/DownloadButton";
import SectionCard from "@/components/ui/SectionCard";

export const metadata = {
  title: "Resume — Jimmy Nguyen",
  description:
    "Professional experience, skills, and education for Jimmy Nguyen.",
};

export default function ResumePage() {
  const sortedExperience = reverseChronological(experience);

  return (
    <div className="space-y-6">
      {/* Professional Summary */}
      <SectionCard id="summary-heading" title="Professional Summary" as="h1">
        <p className="text-gray-700 leading-relaxed max-w-3xl">
          Software Engineer with experience in financial services building
          React-based client web applications integrated with headless CMS and
          RESTful services
        </p>
        <div className="mt-6">
          <DownloadButton />
        </div>
      </SectionCard>

      {/* Work Experience */}
      <SectionCard id="experience-heading" title="Experience">
        <ExperienceList entries={sortedExperience} />
      </SectionCard>

      {/* Skills */}
      <SectionCard id="skills-heading" title="Skills">
        <SkillsSection categories={skillCategories} />
      </SectionCard>

      {/* Education */}
      <SectionCard id="education-heading" title="Education">
        <EducationList entries={education} />
      </SectionCard>
    </div>
  );
}
