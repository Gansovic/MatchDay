import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  transpilePackages: [
    "@matchday/database",
    "@matchday/services",
    "@matchday/auth",
    "@matchday/shared",
  ],
};

export default nextConfig;
