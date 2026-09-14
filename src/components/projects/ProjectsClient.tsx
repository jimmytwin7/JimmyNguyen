'use client';

import { useState } from 'react';
import type { Project } from '@/lib/data/projects';
import ProjectCard from './ProjectCard';
import TagFilter from './TagFilter';

interface ProjectsClientProps {
  projects: Project[];
}

export default function ProjectsClient({ projects }: ProjectsClientProps) {
  const [activeTag, setActiveTag] = useState<string | null>(null);

  // Compute filtered list inline — no useEffect
  const filtered = activeTag
    ? projects.filter((p) => (p.tags as string[]).includes(activeTag))
    : projects;

  return (
    <div className="space-y-8">
      <TagFilter projects={projects} activeTag={activeTag} onTagSelect={setActiveTag} />

      {filtered.length === 0 ? (
        <p role="status" className="text-gray-500 py-8 text-center">
          No projects found for &ldquo;{activeTag}&rdquo;.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((project) => (
            <ProjectCard key={project.name} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
