import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  experimental: {
    useTypeScriptCli: false,
  },
  turbopack: {
    root: path.resolve(__dirname),
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*/",
        destination: "http://localhost:8000/api/:path*/", // ← use localhost
      },
      {
        source: "/api/:path*",
        destination: "http://localhost:8000/api/:path*/", // ← use localhost
      },
    ];
  },
};

export default nextConfig;
