import { Inter_Tight } from "next/font/google";
import { loadTravelLocations } from "@/lib/travel/loader";
import { parseTravelDate } from "@/lib/travel/dates";
import TravelViews from "@/components/travel/TravelViews";

// Neo-grotesk for the travel journal's Swiss typography. Loaded only on this
// route and scoped to .travel-stage via --font-travel (see globals.css).
const grotesk = Inter_Tight({
  variable: "--font-travel",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "Travel — Jimmy Nguyen",
  description: "An interactive map of the places Jimmy Nguyen has traveled.",
};

export default function TravelPage() {
  const locations = loadTravelLocations();

  const countries = new Set(locations.map((l) => l.country)).size;
  const photos = locations.reduce((n, l) => n + l.photos.length, 0);
  const years = locations.map((l) => parseTravelDate(l.date).getFullYear());
  const first = Math.min(...years);
  const last = Math.max(...years);
  const span = first === last ? `${first}` : `${first}–${last}`;

  const stats = [
    { label: "Places", value: locations.length },
    { label: "Countries", value: countries },
    { label: "Photographs", value: photos },
  ];

  return (
    <div className={`travel-stage ${grotesk.variable}`}>
      <div className="mx-auto max-w-[90rem] px-4 pb-24 pt-10 sm:px-6 sm:pt-14 lg:px-10">
        <header className="grid grid-cols-12 gap-x-6 gap-y-6 border-t-2 border-[var(--accent-bold)] pt-5">
          <p className="col-span-12 font-mono text-xs font-medium uppercase tracking-[0.18em] text-muted lg:col-span-3">
            A personal map of places, memories, and experiences worth
            revisiting.
          </p>
          <div className="col-span-12 lg:col-span-9">
            <h1 className="text-[clamp(3.5rem,11vw,9rem)] font-semibold leading-[0.85] tracking-[-0.045em] text-[var(--accent-bold)]">
              Footprints
            </h1>
            <p className="mt-6 max-w-[46ch] text-lg leading-snug text-muted">
              {locations.length} places so far. Explore them on the map, or read
              the timeline newest-first.
            </p>
          </div>

          <dl className="col-span-12 grid grid-cols-3 border-t border-line pt-4 lg:col-span-9 lg:col-start-4">
            {stats.map((s) => (
              <div key={s.label}>
                <dt className="font-mono text-xs uppercase tracking-[0.14em] text-muted">
                  {s.label}
                </dt>
                <dd className="mt-1 text-3xl font-semibold tabular-nums tracking-[-0.03em] sm:text-4xl">
                  {`${s.value}`}
                </dd>
              </div>
            ))}
          </dl>
        </header>

        <TravelViews locations={locations} />
      </div>
    </div>
  );
}
