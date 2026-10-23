import type { NextConfig } from "next";

// Local dev: a separate API server (npm run dev:api). Production on Vercel: API is embedded (app/api/v1).
const api = process.env.API_INTERNAL_URL ?? (process.env.NODE_ENV === "development" ? "http://localhost:4000" : undefined);

const config: NextConfig = {
  transpilePackages: ["@bayhan/shared", "@bayhan/api"],
  serverExternalPackages: ["@electric-sql/pglite", "postgres"],
  poweredByHeader: false,
  async rewrites() {
    // The browser always calls same-origin /api/v1, so the session cookie stays first-party.
    return api ? { beforeFiles: [{ source: "/api/v1/:path*", destination: `${api}/api/v1/:path*` }] } : [];
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
