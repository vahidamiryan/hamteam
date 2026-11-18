import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pg یک پکیج مخصوص Node است و نباید داخل باندل سرور بسته‌بندی شود.
  serverExternalPackages: ["pg"],
  cacheComponents: true,
  partialPrefetching: true,
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
