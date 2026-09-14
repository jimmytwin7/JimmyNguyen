import { destinations } from '@/lib/data/destinations';
import DestinationGrid from '@/components/travel/DestinationGrid';

export const metadata = {
  title: 'Travel — Jimmy Nguyen',
  description: 'Destinations visited and travel stories from Jimmy Nguyen.',
};

export default function TravelPage() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 mb-2">
          Travel
        </h1>
        <p className="text-gray-600 text-lg">
          {destinations.length} destinations visited
        </p>
      </header>

      <DestinationGrid destinations={destinations} />
    </div>
  );
}
