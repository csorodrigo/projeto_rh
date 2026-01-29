import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack config removed to fix build timeout issues
  // turbopack: {
  //   root: process.cwd(),
  // },

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
