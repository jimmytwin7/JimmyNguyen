import type { Company } from '@/lib/data/experience';
import ExperienceItem from './ExperienceItem';

interface ExperienceListProps {
  entries: Company[];
}

export default function ExperienceList({ entries }: ExperienceListProps) {
  return (
    <ul className="space-y-6">
      {entries.map((company, index) => (
        <li key={`${company.name}-${index}`}>
          <ExperienceItem company={company} />
        </li>
      ))}
    </ul>
  );
}
