/** @type {import('next').NextConfig} */
import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/.*\.supabase\.co\/.*/,
      handler: "NetworkFirst",
      options: {
        cacheName: "supabase-cache",
        expiration: { maxEntries: 50, maxAgeSeconds: 300 },
      },
    },
    {
      urlPattern: /\/_next\/static\/.*/,
      handler: "CacheFirst",
      options: {
        cacheName: "static-cache",
        expiration: { maxEntries: 200, maxAgeSeconds: 86400 },
      },
    },
  ],
});

const CSP = [
  "default-src 'self'",
  // Next.js requires unsafe-inline for its own injected scripts/styles
  "script-src 'self' 'unsafe-inline' va.vercel-scripts.com",
  "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
  "font-src 'self' fonts.gstatic.com",
  // Supabase storage + ExerciseDB GIFs
  "img-src 'self' data: blob: *.supabase.co v2.exercisedb.io",
  // Camera feed for barcode scanner
  "media-src 'self' blob:",
  // All external API endpoints the browser talks to directly
  [
    "connect-src 'self'",
    "*.supabase.co *.supabase.io wss://*.supabase.co",
    "api.nal.usda.gov",
    "world.openfoodfacts.org",
    "exercisedb.p.rapidapi.com",
    "va.vercel-scripts.com",
    "vitals.vercel-insights.com",
  ].join(" "),
  "frame-ancestors 'none'",
  // Service worker (PWA offline support)
  "worker-src 'self'",
].join("; ");

// Capacitor (mobile) builds run `next build` with BUILD_TARGET=mobile to
// produce a static export in `out/`. The regular web build is unaffected —
// static export is incompatible with this app's middleware, server actions,
// and dynamic routes, so it must not apply to `next build` / `next start`.
const isMobileBuild = process.env.BUILD_TARGET === "mobile";

const nextConfig = {
  compress: true,

  ...(isMobileBuild ? { output: "export" } : {}),

  images: {
    unoptimized: isMobileBuild,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        // ExerciseDB serves exercise demo GIFs from this domain
        protocol: "https",
        hostname: "v2.exercisedb.io",
        pathname: "/image/**",
      },
    ],
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options",        value: "DENY" },
          { key: "X-Content-Type-Options",  value: "nosniff" },
          { key: "Referrer-Policy",         value: "strict-origin-when-cross-origin" },
          // camera=(self) allows barcode scanner on same origin only
          { key: "Permissions-Policy",      value: "camera=(self)" },
          { key: "Content-Security-Policy", value: CSP },
          // Helps Safari handle the auth redirect flow correctly
          { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
        ],
      },
    ];
  },
};

export default withPWA(nextConfig);
