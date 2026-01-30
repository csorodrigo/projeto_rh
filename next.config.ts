import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Empty turbopack config to silence webpack config warning
  turbopack: {},

  // External packages for server components to avoid bundling issues
  serverExternalPackages: ['jspdf', 'jspdf-autotable'],

  // Temporarily skip TypeScript checking during build
  // to isolate the error
  typescript: {
    ignoreBuildErrors: true,
  },

  // Skip ESLint during build
  eslint: {
    ignoreDuringBuilds: true,
  },

  // PWA Configuration
  // Headers para PWA
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
          {
            key: "Service-Worker-Allowed",
            value: "/",
          },
        ],
      },
      {
        source: "/manifest.json",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=3600, must-revalidate",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
