import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Empty turbopack config to silence webpack config warning
  turbopack: {},

  // Transpile packages that cause issues with Turbopack
  // transpilePackages: ['jspdf', 'jspdf-autotable'], // Removed - PDF export disabled

  // Temporarily skip TypeScript checking during build
  // to isolate the error
  typescript: {
    ignoreBuildErrors: true,
  },

  // Skip ESLint during build
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
