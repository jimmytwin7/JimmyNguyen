import type { Project } from '@/lib/data/projects';

interface ProjectCardProps {
  project: Project;
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const { name, description, tags, demoUrl, repoUrl } = project;

  return (
    <article className="flex flex-col rounded-xl border border-gray-100 shadow-sm bg-white p-5 gap-4">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">{name}</h2>
        <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
      </div>

      {/* Tech tags */}
      <ul className="flex flex-wrap gap-2" aria-label="Technologies used">
        {tags.map((tag) => (
          <li
            key={tag}
            className="px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-700 text-xs font-medium border border-brand-500/20"
          >
            {tag}
          </li>
        ))}
      </ul>

      {/* Links */}
      {(demoUrl || repoUrl) && (
        <div className="flex gap-3 mt-auto pt-2 border-t border-gray-100">
          {demoUrl && (
            <a
              href={demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-brand-700 hover:text-brand-500 transition-colors"
              aria-label={`View live demo of ${name}`}
            >
              Live Demo ↗
            </a>
          )}
          {repoUrl && (
            <a
              href={repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-brand-700 hover:text-brand-500 transition-colors"
              aria-label={`View source code for ${name}`}
            >
              Source Code ↗
            </a>
          )}
        </div>
      )}
    </article>
  );
}
