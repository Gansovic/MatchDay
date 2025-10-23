import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@matchday/database",
    "@matchday/services",
    "@matchday/auth",
    "@matchday/shared",
  ],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'twkipeacdamypppxmmhe.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;
