"use client";

import { useState } from "react";
import Image from "next/image";
import type { Destination } from "@/lib/data/destinations";

interface DestinationCardProps {
  destination: Destination;
}

export default function DestinationCard({ destination }: DestinationCardProps) {
  const { name, description, imagePath, imageAlt } = destination;
  const [imgError, setImgError] = useState(false);

  const showImage = imagePath !== null && !imgError;

  return (
    <article className="rounded-xl overflow-hidden border border-gray-100 shadow-sm bg-white">
      {/* Image or placeholder */}
      <div className="relative w-full h-48 bg-gray-100">
        {showImage ? (
          <Image
            src={`/images/destinations/${imagePath}`}
            alt={imageAlt ?? name}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
            className="object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center bg-gray-200"
            aria-hidden="true"
          >
            <svg
              className="w-12 h-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 22V12h6v10"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Card content */}
      <div className="p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">{name}</h2>
        <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
      </div>
    </article>
  );
}
