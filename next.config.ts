import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: "/home/gppusrubuntu/gpp_frontend",
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*/",
        destination: "http://172.22.176.1:8000/api/:path*/",
      },
      {
        source: "/api/:path*",
        destination: "http://172.22.176.1:8000/api/:path*/",
      },
    ];
  },
};

export default nextConfig;
