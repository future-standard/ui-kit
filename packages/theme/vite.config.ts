import { createLibraryConfig } from '@future-standard-ui/build-config';

const base = createLibraryConfig({ dirname: import.meta.dirname });

export default {
  ...base,
  build: {
    ...base.build,
    lib: {
      entry: {
        index: 'src/index.ts',
        hooks: 'src/hooks.ts',
      },
      formats: ['es', 'cjs'],
      fileName: (format: string, entryName: string) =>
        `${entryName}.${format === 'es' ? 'js' : 'cjs'}`,
      cssFileName: 'index',
    },
  },
};
