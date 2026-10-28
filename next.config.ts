import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Travel photos are served from Cloudinary, so next/image needs the host
    // allow-listed. The pathname is scoped to this account's cloud name to
    // avoid acting as an open image proxy for any Cloudinary account.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/mxlapddp/**",
      },
      // Pantry Quest recipe photos, scoped to TheMealDB's meal image path.
      {
        protocol: "https",
        hostname: "www.themealdb.com",
        pathname: "/images/media/meals/**",
      },
    ],
  },
};

export default nextConfig;
