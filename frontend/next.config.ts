import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  // Production builds are a static export served by the FastAPI backend.
  // trailingSlash emits nda/index.html so the backend can serve /nda/.
  ...(isDev ? {} : { output: "export", trailingSlash: true }),
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // In development the Next dev server proxies API calls to the backend.
  // Rewrites are not supported by static export, so they are dev-only.
  ...(isDev && {
    async rewrites() {
      return [{ source: "/api/:path*", destination: "http://localhost:8000/api/:path*" }];
    },
  }),
};

export default nextConfig;
