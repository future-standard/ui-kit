# @future-standard-ui UI Kit

A React 19 component library built as independently versioned, individually installable packages.

## Packages

| Package | Description |
|---|---|
| `@future-standard-ui/button` | Base button with `primary`/`secondary` variants |
| `@future-standard-ui/loading-button` | Button with a loading spinner state |
| `@future-standard-ui/icon-button` | Icon-only button (requires `aria-label`) |
| `@future-standard-ui/theme` | Design tokens, fonts, colors, and dark mode support |
| `@future-standard-ui/ui-kit` | Kitchen-sink re-export of all components |

## Installation

Install individual packages:

```bash
npm install @future-standard-ui/button
```

Or install everything at once:

```bash
npm install @future-standard-ui/ui-kit
```

## Usage

```tsx
import { Button } from '@future-standard-ui/button';

function App() {
  return <Button variant='primary'>Click me</Button>;
}
```

With the kitchen-sink package:

```tsx
import { Button, LoadingButton, IconButton } from '@future-standard-ui/ui-kit';
```

CSS is automatically injected when you import a component — no separate style import needed.

## Development

### Prerequisites

- Node.js 24+
- pnpm (enabled via `corepack enable`)

### Setup

```bash
pnpm install
```

### Scripts

```bash
pnpm build        # Build all packages (via Turborepo)
pnpm typecheck    # Type-check all packages
pnpm check        # Run all Biome checks (lint + format + import sorting)
pnpm check:fix    # Auto-fix all Biome issues
pnpm lint         # Lint only
pnpm lint:fix     # Lint and auto-fix
pnpm format       # Format all files
```

### Linting & Formatting

This project uses [Biome](https://biomejs.dev/) for linting, formatting, and import sorting — configured in `biome.json` at the repo root.

#### VS Code Setup

1. Install the [Biome extension](https://marketplace.visualstudio.com/items?itemName=biomejs.biome) from the VS Code marketplace.
2. Add the following to your workspace or user `settings.json`:

```json
{
  "editor.defaultFormatter": "biomejs.biome",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "quickfix.biome": "explicit",
    "source.organizeImports.biome": "explicit"
  }
}
```

This gives you format-on-save, auto-fix lint issues, and import sorting on every save.

### Adding a changeset

```bash
pnpm changeset
```

### Project structure

```
packages/
  build-config/     # Shared Vite 8 library config (internal, not published)
  button/           # @future-standard-ui/button
  loading-button/   # @future-standard-ui/loading-button
  icon-button/      # @future-standard-ui/icon-button
  theme/            # @future-standard-ui/theme
  ui-kit/           # @future-standard-ui/ui-kit
```

### Creating a new component package

1. Copy an existing package directory (e.g. `packages/button`)
2. Update `package.json` with the new package name and dependencies
3. Update `vite.config.ts` — add any inter-package deps to `additionalExternal`
4. Add the component to `packages/ui-kit/src/index.ts`
