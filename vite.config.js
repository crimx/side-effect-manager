/* eslint-env node */

import path from "path";
import { defineConfig } from "vite";

export default defineConfig(() => {
  return {
    build: {
      lib: {
        entry: path.resolve(__dirname, "src/index.ts"),
        formats: ["es", "cjs"],
      },
      outDir: "dist",
      sourcemap: true,
      rollupOptions: {
        external: ["react"],
      },
      minify: false,
    },
  };
});
