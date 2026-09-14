import { projects } from '@/lib/data/projects';
import ProjectsClient from '@/components/projects/ProjectsClient';

export const metadata = {
  title: 'Projects — Jimmy Nguyen',
  description: 'A showcase of personal and professional software projects by Jimmy Nguyen.',
};

export default function ProjectsPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">Projects</h1>
      <ProjectsClient projects={projects} />
    </div>
  );
}
