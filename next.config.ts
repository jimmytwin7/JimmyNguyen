import type { NextConfig } from "next";

/**
 * Content-Security-Policy for the whole site. Kept deliberately tight, with a
 * few necessary allowances:
 * - `script-src 'unsafe-inline'`: next-themes injects a pre-paint inline script
 *   to restore the saved theme before hydration; blocking it breaks theming.
 *   `https://va.vercel-scripts.com` is the Vercel Analytics script.
 * - `style-src 'unsafe-inline'`: Next.js and Tailwind inject inline <style>.
 * - `img-src`: Cloudinary (travel photos, ingredient icons) and TheMealDB
 *   (recipe photos), matching next.config's image remotePatterns, plus data:
 *   for inline/blur placeholders.
 * - `connect-src`: TheMealDB is never called from the browser (the API routes
 *   proxy it server-side), but Vercel Analytics beacons to vercel-insights.
 * - `font-src 'self'`: next/font self-hosts the Figtree font; no external CDN.
 */
const CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "img-src 'self' https://res.cloudinary.com https://www.themealdb.com data:",
  "script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self'",
  "connect-src 'self' https://*.vercel-insights.com",
  "form-action 'self'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: CSP },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

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
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
