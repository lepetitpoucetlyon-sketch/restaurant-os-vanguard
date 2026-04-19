import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const workspaceRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  output: 'export',
  turbopack: {
    root: workspaceRoot,
  },
  images: {
    unoptimized: true,
  },
  reactStrictMode: false,
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  devIndicators: {
    // @ts-ignore - Hiding the dev indicator
    buildActivity: false,
    // @ts-ignore
    appIsrStatus: false,
  },
};

export default nextConfig;
