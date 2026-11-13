import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Serverless Netlify OpenNext compatible config */
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
