# Meta-Package Strategy

This document outlines the plan for organizing `@future-standard-ui` packages into logical meta-package groups as the component library grows.

## Principles

1. **Every component is its own package** -- consumers can install only what they need (`@future-standard-ui/button`)
2. **Category meta-packages** group related components -- convenient for teams adopting a whole feature area (`@future-standard-ui/forms`)
3. **One kitchen-sink meta-package** re-exports everything -- easiest onboarding path (`@future-standard-ui/ui-kit`)
4. **Meta-packages are pure re-exports** -- they contain no code of their own, only `dependencies` and barrel exports

## Planned categories

Based on the scorer-ui-kit feature set we intend to cover:

| Meta-package | Components (examples) | When to create |
|---|---|---|
| `@future-standard-ui/buttons` | button, icon-button, loading-button, split-button | 4+ button variants exist |
| `@future-standard-ui/forms` | input, select, checkbox, radio, switch, textarea, slider, password-field | First form input lands |
| `@future-standard-ui/layout` | sidebar, topbar, content, main-container, split-layout | First layout primitive lands |
| `@future-standard-ui/tables` | type-table, edit-cell, table-header | Table package lands |
| `@future-standard-ui/feedback` | alert-bar, notification, tooltip, modal, confirmation-modal, spinner | 3+ feedback components exist |
| `@future-standard-ui/filters` | date-picker, filter-dropdown, sort-dropdown, filter-bar | Filter system lands |
| `@future-standard-ui/tabs` | tabs, tab-list, tab-content | Tab system lands |
| `@future-standard-ui/media` | camera-panels, media-stream, line-ui, ptz-control | First media component lands |
| `@future-standard-ui/hooks` | use-interval, use-click-outside, use-copy-to-clipboard, use-breakpoints | 3+ hooks exist |
| `@future-standard-ui/ui-kit` | *everything* | Already exists |

## When to introduce a category meta-package

Don't create a category package until there are **3+ individual packages** that belong to it. Until then the kitchen-sink `ui-kit` and individual packages cover all use-cases without unnecessary indirection.

## How a meta-package works

A meta-package is a thin wrapper:

```jsonc
// packages/buttons/package.json
{
  "name": "@future-standard-ui/buttons",
  "dependencies": {
    "@future-standard-ui/button": "workspace:*",
    "@future-standard-ui/icon-button": "workspace:*",
    "@future-standard-ui/loading-button": "workspace:*"
  }
}
```

```ts
// packages/buttons/src/index.ts
export { Button, type ButtonProps } from "@future-standard-ui/button";
export { IconButton, type IconButtonProps } from "@future-standard-ui/icon-button";
export { LoadingButton, type LoadingButtonProps } from "@future-standard-ui/loading-button";
```

```css
/* packages/buttons/src/styles.css */
@import "@future-standard-ui/button/style.css";
@import "@future-standard-ui/icon-button/style.css";
@import "@future-standard-ui/loading-button/style.css";
```

## Versioning

- Individual packages are versioned independently via changesets
- Meta-packages bump automatically when any of their dependencies bump (`updateInternalDependencies` in changeset config)
- The `ui-kit` kitchen-sink follows the same pattern -- it always picks up the latest of everything
