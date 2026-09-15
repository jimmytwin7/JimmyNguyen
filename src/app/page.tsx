import Image from "next/image";
import Link from "next/link";
import CurrentlySection from "@/components/home/CurrentlySection";
import Typewriter from "@/components/home/Typewriter";
import InterestsBento from "@/components/home/InterestsBento";

export default function HomePage() {
  return (
    <>
      <section
        aria-labelledby="hero-heading"
        className="py-16 sm:py-24 flex flex-col-reverse sm:flex-row items-center gap-12"
      >
        {/* Left: text + CTAs */}
        <div className="flex-1 min-w-0">
          <h1
            id="hero-heading"
            className="text-4xl sm:text-5xl font-bold tracking-tight mb-6 min-h-[1.2em]"
          >
            <Typewriter text="Hi, I'm Jimmy Nguyen" />
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mb-8 leading-relaxed min-h-[3.5em]">
            <Typewriter
              text="Software engineer who loves building clean, fast web experiences and exploring the world one city at a time."
              speed={25}
              startDelay={3000}
            />
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/resume"
              className="inline-flex items-center px-5 py-2.5 rounded-lg font-medium text-white"
              style={{ backgroundColor: "var(--color-brand-700)" }}
            >
              View Resume
            </Link>
            <Link
              href="/projects"
              className="inline-flex items-center px-5 py-2.5 rounded-lg font-medium border border-gray-300 text-gray-700 hover:border-gray-400"
            >
              See Projects
            </Link>
            <a
              href="https://github.com/jimmytwin7"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-5 py-2.5 rounded-lg font-medium border border-gray-300 text-gray-700 hover:border-gray-400"
            >
              GitHub ↗
            </a>
          </div>
        </div>

        {/* Right: headshot */}
        <div className="shrink-0">
          <div className="relative w-48 h-48 sm:w-64 sm:h-64 rounded-full overflow-hidden ring-4 ring-white shadow-xl">
            <Image
              src="/headshot.jpg"
              alt="Jimmy Nguyen"
              fill
              sizes="(min-width: 640px) 16rem, 12rem"
              className="object-cover object-top"
              priority
            />
          </div>
        </div>
      </section>

      <div className="pb-10">
        <CurrentlySection />
      </div>

      <div className="pb-16 sm:pb-24">
        <InterestsBento />
      </div>
    </>
  );
}
