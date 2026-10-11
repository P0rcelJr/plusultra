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
};

export default nextConfig;
