import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  reactCompiler: true,

  // Turbopack config (empty to silence warning - webpack still used for production builds)
  turbopack: {},

  webpack: (config) => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding', 'thread-stream');
    return config;
  },
  async rewrites() {
    return [
      {
        source: "/api/krnl-node/:path*",
        destination: "https://v0-1-0.node.lat/:path*",
      },
    ];
  },
};

export default nextConfig;
