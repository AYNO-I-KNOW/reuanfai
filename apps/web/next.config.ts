import type { NextConfig } from "next";

const API_ORIGIN = process.env.API_ORIGIN ?? "http://localhost:8787";

const nextConfig: NextConfig = {
  // Same-origin proxy so the api session cookie is first-party (ADR-0013)
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${API_ORIGIN}/:path*` }];
  },
  // Old placeholder entry points → current prototypes. Exact paths only, so
  // /provider/design-preview keeps working. /dtam is left alone: it is the
  // design-system workspace shell. Temporary (307) until URLs are final.
  async redirects() {
    return [
      { source: "/m", destination: "/ruenfai", permanent: false },
      { source: "/provider", destination: "/clinic", permanent: false },
    ];
  },
};

export default nextConfig;
