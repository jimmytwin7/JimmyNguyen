import { PROJECT_NAME } from "@/lib/cooking/config";

/**
 * Static page header (server-rendered). Pure markup with no interactivity, so
 * it stays out of the PantryQuest client island and ships no JS.
 */
export default function PantryQuestHeader() {
  return (
    <header>
      <p className="pq-ribbon text-xs font-bold uppercase tracking-widest sm:text-sm">
        Cooking project
      </p>
      <h1 className="pq-logo mt-4 text-5xl font-extrabold leading-none sm:text-6xl lg:text-7xl">
        {PROJECT_NAME}
      </h1>
      <p className="mt-5 max-w-xl text-base font-medium text-muted sm:text-lg">
        Turn what&apos;s left, to what&apos;s next. Put what&apos;s in your
        kitchen on the cutting board and find real recipes you can make with an
        honest match score and ideas for what&apos;s missing.
      </p>
    </header>
  );
}
