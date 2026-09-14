import type { Project } from '@/lib/data/projects';

interface TagFilterProps {
  projects: Project[];
  activeTag: string | null;
  onTagSelect: (tag: string | null) => void;
}

export default function TagFilter({ projects, activeTag, onTagSelect }: TagFilterProps) {
  // Derive unique tags from all projects, preserving first-seen order
  const uniqueTags = Array.from(
    new Set(projects.flatMap((p) => p.tags as string[]))
  );

  if (uniqueTags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Filter projects by technology">
      {/* "All" reset button */}
      <button
        type="button"
        onClick={() => onTagSelect(null)}
        aria-pressed={activeTag === null}
        className={[
          'px-3 py-1 rounded-full text-sm font-medium border transition-colors',
          activeTag === null
            ? 'bg-brand-700 text-white border-brand-700'
            : 'bg-white text-gray-700 border-gray-300 hover:border-brand-500 hover:text-brand-700',
        ].join(' ')}
      >
        All
      </button>

      {uniqueTags.map((tag) => (
        <button
          key={tag}
          type="button"
          onClick={() => onTagSelect(activeTag === tag ? null : tag)}
          aria-pressed={activeTag === tag}
          aria-label={`Filter by ${tag}`}
          className={[
            'px-3 py-1 rounded-full text-sm font-medium border transition-colors',
            activeTag === tag
              ? 'bg-brand-700 text-white border-brand-700'
              : 'bg-white text-gray-700 border-gray-300 hover:border-brand-500 hover:text-brand-700',
          ].join(' ')}
        >
          {tag}
        </button>
      ))}
    </div>
  );
}
