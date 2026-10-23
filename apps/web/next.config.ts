import type { NextConfig } from "next";

const api = process.env.API_INTERNAL_URL ?? "http://localhost:4000";

const config: NextConfig = {
  transpilePackages: ["@bayhan/shared"],
  poweredByHeader: false,
  // The browser talks to the API through this same-origin proxy, so the session cookie stays first-party.
  async rewrites() {
    return [{ source: "/api/v1/:path*", destination: `${api}/api/v1/:path*` }];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
    ];
  },
};

export default config;
