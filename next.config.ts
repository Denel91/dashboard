import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  reactCompiler: true,
  experimental: {
    // Niente cache di Turbopack su disco per `next build` (12 novembre 2026):
    // Vercel la ripristina a ogni deploy, e una volta ha riusato il CSS di
    // Tailwind di un deploy precedente (barra laterale e Nuova spesa rotte in
    // produzione). La build da zero costa pochi secondi. Il CSS prodotto lo
    // controlla scripts/controlla-css.mjs.
    turbopackFileSystemCacheForBuild: false,
  },
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
