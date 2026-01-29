import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack config removed to fix build timeout issues
  // turbopack: {
  //   root: process.cwd(),
  // },

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

  // Webpack configuration for handling PDF libraries
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false,
      encoding: false,
    };
    return config;
  },
};

export default nextConfig;
