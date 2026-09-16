import { loadTravelLocations } from "@/lib/travel/loader";
import TravelMapClient from "@/components/travel/TravelMapClient";

export const metadata = {
  title: "Travel — Jimmy Nguyen",
  description: "An interactive map of the places Jimmy Nguyen has traveled.",
};

export default function TravelPage() {
  const locations = loadTravelLocations();

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-app mb-2">
          Travel
        </h1>
        <p className="text-muted text-lg">
          {locations.length} places so far. Click a pin to zoom in.
        </p>
      </header>

      <TravelMapClient locations={locations} />
    </div>
  );
}
