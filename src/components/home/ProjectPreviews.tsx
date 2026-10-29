import Image from "next/image";
import Link from "next/link";
import { loadTravelLocations } from "@/lib/travel/loader";
import { ingredientIconUrl } from "@/lib/cooking/ingredient-assets";

/**
 * "Selected projects" — two case-study previews on the home page. Each tile
 * keeps the main portfolio's editorial frame (hairline card, mono metadata)
 * while hinting at the project's own identity: Pantry Quest leans pixel-art +
 * warm paper, Travel leans photography-first. The projects' real interfaces
 * live at /cooking and /travel with their own design languages.
 */

const PANTRY_TAGS = ["Next.js", "API Routes", "TypeScript", "Pixel art"];
const TRAVEL_TAGS = ["react-simple-maps", "Cloudinary", "SVG / d3-geo"];

/** A few pixel ingredient icons to carry Pantry Quest's identity. */
const PREVIEW_ICONS = ["tomato", "egg", "carrot", "cheese", "chili"];

export default function ProjectPreviews() {
  // Real travel photo from the committed manifest (first location with photos),
  // so the Travel preview shows actual photography and stays self-maintaining.
  const locations = loadTravelLocations();
  const featured = locations.find((l) => l.photos.length > 0);
  const heroPhoto = featured?.photos[0];

  return (
    <section aria-labelledby="projects-heading">
      <div className="editorial-label">
        <span className="editorial-label__num">02</span>
        <h2 id="projects-heading" className="editorial-label__title text-xl">
          Selected projects
        </h2>
        <span className="editorial-label__rule" aria-hidden="true" />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* ---- Pantry Quest: playful pixel-art cooking game ---- */}
        <Link
          href="/cooking"
          className="editorial-card group"
          aria-label="Pantry Quest — open the project"
        >
          {/* Pixel-flavored banner: warm paper wash + ingredient sprites. */}
          <div
            className="relative flex h-44 items-center justify-center gap-3 overflow-hidden border-b border-line"
            style={{
              background:
                "linear-gradient(180deg, #fdf7ec 0%, #fbf3e4 55%, #f4e6cd 100%)",
            }}
          >
            {PREVIEW_ICONS.map((icon, i) => (
              <Image
                key={icon}
                src={ingredientIconUrl(icon)}
                alt=""
                width={52}
                height={52}
                unoptimized
                className="h-11 w-11 transition-transform duration-300 [image-rendering:pixelated] group-hover:-translate-y-1 sm:h-13 sm:w-13"
                style={{ transitionDelay: `${i * 40}ms` }}
              />
            ))}
          </div>
          <div className="flex flex-1 flex-col p-6">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold text-app">
                Pantry Quest
              </h3>
              <span className="editorial-meta">recipe finder</span>
            </div>
            <p className="mb-2 text-sm leading-relaxed text-muted">
              <span className="font-medium text-app">Problem.</span> Deciding
              what to cook from whatever is already in the kitchen.
            </p>
            <p className="mb-4 text-sm leading-relaxed text-muted">
              <span className="font-medium text-app">Build.</span> A pixel-art
              cooking game: drop ingredients on a cutting board, and it searches
              real recipes from TheMealDB, scores each by a deterministic
              ingredient-match percentage, and walks through steps in Cooking
              Mode, served from two small serverless routes.
            </p>
            <ul className="mt-auto flex flex-wrap gap-2 pt-2">
              {PANTRY_TAGS.map((tag) => (
                <li key={tag} className="editorial-tag">
                  {tag}
                </li>
              ))}
            </ul>
          </div>
        </Link>

        {/* ---- Travel: photography-first journal ---- */}
        <Link
          href="/travel"
          className="editorial-card group"
          aria-label="Travel map — open the project"
        >
          <div
            className="relative h-44 overflow-hidden border-b border-line bg-surface-raised bg-cover bg-center"
            // The tiny blurred variant shows until the photo decodes. A CSS
            // background, because next/image's blurDataURL only accepts a
            // data URL, not a remote one.
            style={
              heroPhoto
                ? { backgroundImage: `url(${heroPhoto.blurUrl})` }
                : undefined
            }
          >
            {heroPhoto ? (
              <Image
                src={heroPhoto.url}
                alt=""
                fill
                sizes="(min-width: 768px) 24rem, 100vw"
                className="object-cover transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
              />
            ) : null}
            {featured && (
              <span className="editorial-meta absolute bottom-0 left-0 bg-black px-2 py-1 text-white">
                {featured.name}
              </span>
            )}
          </div>
          <div className="flex flex-1 flex-col p-6">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold text-app">
                Travel Map
              </h3>
              <span className="editorial-meta">{locations.length} places</span>
            </div>
            <p className="mb-2 text-sm leading-relaxed text-muted">
              <span className="font-medium text-app">Idea.</span> Give all your
              travel adventures one portfolio
            </p>
            <p className="mb-4 text-sm leading-relaxed text-muted">
              <span className="font-medium text-app">Build.</span> An
              interactive SVG world map and a newest-first photo timeline of the
              same locations, with a full-screen lightbox. Photos are delivered
              from Cloudinary through a committed manifest, so builds stay fast.
            </p>
            <ul className="mt-auto flex flex-wrap gap-2 pt-2">
              {TRAVEL_TAGS.map((tag) => (
                <li key={tag} className="editorial-tag">
                  {tag}
                </li>
              ))}
            </ul>
          </div>
        </Link>
      </div>
    </section>
  );
}
