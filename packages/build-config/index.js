import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { libInjectCss } from 'vite-plugin-lib-inject-css';

/**
 * Shared Vite library config for every published package.
 *
 * @param {{
 *   entry?: string;
 *   dirname: string;
 *   additionalExternal?: string[];
 *   react?: boolean;
 * }} options
 *   - `react` (default `true`): include the React plugin and externalise React. Set to
 *     `false` for framework-free packages such as `table-core`.
 */
export function createLibraryConfig({
  entry = 'src/index.ts',
  dirname,
  additionalExternal = [],
  react: withReact = true,
}) {
  const reactExternal = withReact ? ['react', 'react-dom', 'react/jsx-runtime'] : [];

  return defineConfig({
    plugins: [withReact && react(), libInjectCss()].filter(Boolean),
    css: {
      modules: {
        localsConvention: 'camelCaseOnly',
      },
    },
    build: {
      lib: {
        entry: resolve(dirname, entry),
        formats: ['es', 'cjs'],
        fileName: 'index',
      },

      rolldownOptions: {
        external: [...reactExternal, ...additionalExternal],
      },
    },
    // Vitest reads this block when a package runs `vitest run` against its vite.config.
    test: {
      environment: withReact ? 'jsdom' : 'node',
      include: ['src/**/*.test.{ts,tsx}'],
      passWithNoTests: true,
    },
  });
}
