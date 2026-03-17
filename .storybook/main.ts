import type { StorybookConfig } from "@storybook/react-vite";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");

const config: StorybookConfig = {
  stories: ["../packages/*/src/**/*.stories.@(ts|tsx)"],
  framework: "@storybook/react-vite",
  viteFinal(config) {
    config.resolve ??= {};
    config.resolve.alias = {
      ...config.resolve.alias,
      "@future-standard/button": resolve(root, "packages/button/src"),
      "@future-standard/loading-button": resolve(root, "packages/loading-button/src"),
      "@future-standard/icon-button": resolve(root, "packages/icon-button/src"),
    };
    return config;
  },
};

export default config;
