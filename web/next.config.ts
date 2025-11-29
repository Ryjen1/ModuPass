import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  reactCompiler: true,
  turbopack: {
    // Treat the ModuPass repo as the workspace root instead of your home directory.
    root: path.join(__dirname, ".."),
  },
  webpack: (config) => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    return config;
  },
};

export default nextConfig;
