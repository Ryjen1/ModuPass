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
};

export default nextConfig;
