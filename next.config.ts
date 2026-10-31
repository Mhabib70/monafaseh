import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone", // برای Docker — تصویر سبک‌تر
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Allow embedding Jitsi Meet iframe and loading its resources
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "ALLOWALL",
          },
        ],
      },
    ];
  },
  // Ensure env vars are available
  env: {
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    DATABASE_URL: process.env.DATABASE_URL,
  },
};

export default nextConfig;
