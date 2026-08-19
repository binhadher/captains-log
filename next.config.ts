import type { NextConfig } from "next";
import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  register: false,          // we register manually so we can force-reload on updates
  skipWaiting: false,       // page triggers SKIP_WAITING after showing "Updating" overlay
  disable: process.env.NODE_ENV === "development",
  runtimeCaching: [
    {
      // Cache all page navigation requests so the app works offline
      urlPattern: /^https:\/\/[^/]+\/(?!api\/|_next\/|uploads\/|downloads\/|icons\/|manifest\.json).*/i,
      handler: "NetworkFirst",
      options: {
        cacheName: "pages",
        networkTimeoutSeconds: 5,
        plugins: [
          {
            cacheWillUpdate: async ({ response }: { response: Response }) => {
              return response && response.type === "opaqueredirect"
                ? new Response(response.body, { status: 200, statusText: "OK", headers: response.headers })
                : response;
            },
          },
        ],
      },
    },
    {
      urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
      handler: "NetworkFirst",
      options: {
        cacheName: "supabase-cache",
        expiration: {
          maxEntries: 64,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
        },
        networkTimeoutSeconds: 10,
      },
    },
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
      handler: "CacheFirst",
      options: {
        cacheName: "image-cache",
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        },
      },
    },
    {
      urlPattern: /\.(?:js|css)$/i,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "static-resources",
        expiration: {
          maxEntries: 64,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
        },
      },
    },
    {
      urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "google-fonts",
        expiration: {
          maxEntries: 16,
          maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
        },
      },
    },
  ],
});

const nextConfig: NextConfig = {
  // Use webpack for builds (needed for next-pwa)
  // Turbopack doesn't support custom webpack configs yet
  turbopack: {},
  
  // Skip static export to avoid build-time env var issues
  output: 'standalone',
  
  // Allow images from Supabase
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
};

export default withPWA(nextConfig);
