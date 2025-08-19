import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configure Turbopack for development (now stable)  
  turbopack: {
    resolveAlias: {
      '@shared': './shared',
    },
  },
  // Webpack fallback for production builds
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@shared': require('path').resolve(__dirname, './shared'),
    };
    return config;
  },
};

export default nextConfig;
