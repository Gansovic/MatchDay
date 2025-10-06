import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@matchday/database",
    "@matchday/services",
    "@matchday/auth",
    "@matchday/shared",
  ],
};

export default nextConfig;
