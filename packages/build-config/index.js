import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { libInjectCss } from "vite-plugin-lib-inject-css";

/**
 * @param {{ entry?: string; dirname: string; additionalExternal?: string[] }} options
 */
export function createLibraryConfig({ entry = "src/index.ts", dirname, additionalExternal = [] }) {
  return defineConfig({
    plugins: [react(), libInjectCss()],
    css: {
      modules: {
        localsConvention: "camelCaseOnly",
      },
    },
    build: {
      lib: {
        entry: resolve(dirname, entry),
        formats: ["es", "cjs"],
        fileName: "index",
      },

      rolldownOptions: {
        external: ["react", "react-dom", "react/jsx-runtime", ...additionalExternal],
      },
    },
  });
}
