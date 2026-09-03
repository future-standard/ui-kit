import { createLibraryConfig } from '@future-standard-ui/build-config';

export default createLibraryConfig({
  dirname: import.meta.dirname,
  additionalExternal: [
    '@future-standard-ui/table',
    '@future-standard-ui/table-cells',
    '@future-standard-ui/table-core',
  ],
});
