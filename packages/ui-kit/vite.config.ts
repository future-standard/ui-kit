import { createLibraryConfig } from "@future-standard/build-config";

export default createLibraryConfig({
  dirname: import.meta.dirname,
  additionalExternal: [
    "@future-standard/button",
    "@future-standard/icon-button",
    "@future-standard/loading-button",
  ],
});
