import Image from "next/image";
import Link from "next/link";
import CurrentlySection from "@/components/home/CurrentlySection";
import Typewriter from "@/components/home/Typewriter";
import InterestsBento from "@/components/home/InterestsBento";
import ProjectPreviews from "@/components/home/ProjectPreviews";

const GITHUB_URL = "https://github.com/jimmytwin7";
const LINKEDIN_URL = "https://www.linkedin.com/in/jimmytnguyen7";

export default function HomePage() {
  return (
    <>
      {/* ---- Hero: conversational, type-led ---- */}
      <section
        aria-labelledby="hero-heading"
        className="flex flex-col-reverse items-start gap-10 py-14 sm:flex-row sm:items-center sm:gap-12 sm:py-20"
      >
        <div className="flex-1 min-w-0">
          <p className="editorial-meta mb-5">
            Software engineer · Minneapolis, MN
          </p>
          <h1
            id="hero-heading"
            className="font-display text-4xl font-semibold leading-[1.1] tracking-tight text-app sm:text-6xl"
          >
            <Typewriter
              text="hi, i'm jimmy."
              caret={<span className="editorial-caret" aria-hidden="true" />}
            />
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
            <Typewriter
              text="Software engineer building thoughtful things for the web. Explore my work, side projects, and whatever else catches your eye."
              speed={18}
              startDelay={2200}
            />
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
            <Link
              href="/experience"
              className="inline-flex items-center rounded-lg px-5 py-2.5 font-medium text-white transition-transform hover:-translate-y-0.5 motion-reduce:transform-none"
              style={{ backgroundColor: "var(--accent)" }}
            >
              View experience
            </Link>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="editorial-meta inline-flex items-center gap-1 text-app hover:text-[var(--accent)]"
            >
              GitHub ↗
            </a>
            <a
              href={LINKEDIN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="editorial-meta inline-flex items-center gap-1 text-app hover:text-[var(--accent)]"
            >
              LinkedIn ↗
            </a>
          </div>
        </div>

        {/* Headshot — quieter, smaller, square with a hairline rather than a
            heavy ring + shadow. */}
        <div className="shrink-0">
          <div className="relative h-44 w-44 overflow-hidden rounded-2xl border border-line sm:h-56 sm:w-56">
            <Image
              src="/headshot.jpg"
              alt="Jimmy Nguyen"
              fill
              sizes="(min-width: 640px) 14rem, 11rem"
              className="object-cover object-top"
              priority
            />
          </div>
        </div>
      </section>

      {/* ---- 01 Currently ---- */}
      <section aria-labelledby="currently-label" className="pb-16 sm:pb-20">
        <div className="editorial-label">
          <span className="editorial-label__num">01</span>
          <h2 id="currently-label" className="editorial-label__title text-xl">
            Currently
          </h2>
          {/* Pulsing live dot — the "this is current" cue. */}
          <span
            className="relative flex h-2 w-2 self-center"
            aria-hidden="true"
          >
            <span
              className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 motion-reduce:hidden"
              style={{ backgroundColor: "var(--accent)" }}
            />
            <span
              className="relative inline-flex h-2 w-2 rounded-full"
              style={{ backgroundColor: "var(--accent)" }}
            />
          </span>
          <span className="editorial-label__rule" aria-hidden="true" />
        </div>
        <CurrentlySection />
      </section>

      {/* ---- 02 Selected projects ---- */}
      <div className="pb-16 sm:pb-20">
        <ProjectPreviews />
      </div>

      {/* ---- 03 Interests ---- */}
      <section aria-labelledby="interests-label" className="pb-16 sm:pb-20">
        <div className="editorial-label">
          <span className="editorial-label__num">03</span>
          <h2 id="interests-label" className="editorial-label__title text-xl">
            A few of my interests
          </h2>
          <span className="editorial-label__rule" aria-hidden="true" />
        </div>
        <InterestsBento />
      </section>

      {/* ---- 04 Get in touch ---- */}
      <section
        aria-labelledby="contact-label"
        className="border-t border-line py-16 sm:py-20"
      >
        <div className="editorial-label">
          <span className="editorial-label__num">04</span>
          <h2 id="contact-label" className="editorial-label__title text-xl">
            Get in touch
          </h2>
          <span className="editorial-label__rule" aria-hidden="true" />
        </div>
        <p className="max-w-xl text-lg leading-relaxed text-muted">
          Open to connecting — about engineering, a project idea, or just to say
          hi. The quickest ways to reach me:
        </p>
        <div className="mt-6 flex flex-wrap gap-4">
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-line px-5 py-2.5 font-medium text-app transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            GitHub ↗
          </a>
          <a
            href={LINKEDIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-line px-5 py-2.5 font-medium text-app transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            LinkedIn ↗
          </a>
          <a
            href="/Jimmy_Nguyen_Resume.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-line px-5 py-2.5 font-medium text-app transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            Résumé ↗
          </a>
        </div>
      </section>
    </>
  );
}
