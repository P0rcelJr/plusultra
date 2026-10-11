import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output is what the Docker runner stage copies (see Dockerfile).
  output: "standalone",
  // Cache Components is intentionally off: every screen is per-user and dynamic,
  // so the static-shell model would only add Suspense boundaries without a payoff.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  experimental: {
    serverActions: {
      // Profile photos are capped at 5 MB (decision A6) and travel inside the intake form's
      // multipart body; the extra room covers the other fields and multipart overhead.
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
