import type { NextConfig } from "next";

const API_ORIGIN = process.env.API_ORIGIN ?? "http://localhost:8787";

const nextConfig: NextConfig = {
  // Same-origin proxy so the api session cookie is first-party (ADR-0013)
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${API_ORIGIN}/:path*` }];
  },
};

export default nextConfig;
