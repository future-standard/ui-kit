# @future-standard UI Kit

A React 19 component library built as independently versioned, individually installable packages.

## Packages

| Package | Description |
|---|---|
| `@future-standard/button` | Base button with `primary`/`secondary` variants |
| `@future-standard/loading-button` | Button with a loading spinner state |
| `@future-standard/icon-button` | Icon-only button (requires `aria-label`) |
| `@future-standard/ui-kit` | Kitchen-sink re-export of all components |

## Installation

Install individual packages:

```bash
npm install @future-standard/button
```

Or install everything at once:

```bash
npm install @future-standard/ui-kit
```

## Usage

```tsx
import { Button } from "@future-standard/button";
import "@future-standard/button/style.css";

function App() {
  return <Button variant="primary">Click me</Button>;
}
```

With the kitchen-sink package:

```tsx
import { Button, LoadingButton, IconButton } from "@future-standard/ui-kit";
import "@future-standard/ui-kit/style.css";
```

## Development

### Prerequisites

- Node.js 22+
- pnpm (enabled via `corepack enable`)

### Setup

```bash
pnpm install
```

### Scripts

```bash
pnpm build        # Build all packages (via Turborepo)
pnpm typecheck    # Type-check all packages
pnpm lint         # Lint all packages
```

### Adding a changeset

```bash
pnpm changeset
```

### Project structure

```
packages/
  build-config/     # Shared Vite 8 library config (internal, not published)
  button/           # @future-standard/button
  loading-button/   # @future-standard/loading-button
  icon-button/      # @future-standard/icon-button
  ui-kit/           # @future-standard/ui-kit
```

### Creating a new component package

1. Copy an existing package directory (e.g. `packages/button`)
2. Update `package.json` with the new package name and dependencies
3. Update `vite.config.ts` — add any inter-package deps to `additionalExternal`
4. Add the component to `packages/ui-kit/src/index.ts`
