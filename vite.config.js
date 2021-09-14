/* eslint-env node */

import path from "path";
import { defineConfig } from "vite";

export default defineConfig(({ mode }) => {
  const isProd = mode === "production";

  return {
    build: {
      lib: {
        entry: path.resolve(__dirname, "src/side-effect-manager.ts"),
        formats: ["es", "cjs"],
      },
      outDir: "dist",
      sourcemap: isProd,
      rollupOptions: {
        external: ["react"],
      },
      minify: isProd,
    },
  };
});
