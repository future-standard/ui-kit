# @future-standard-ui UI Kit

A React 19 component library built as independently versioned, individually installable packages.

## Packages

| Package | Description |
|---|---|
| `@future-standard-ui/button` | Base button with `primary`/`secondary` variants |
| `@future-standard-ui/loading-button` | Button with a loading spinner state |
| `@future-standard-ui/icon-button` | Icon-only button (requires `aria-label`) |
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
import { Button } from "@future-standard-ui/button";

function App() {
  return <Button variant="primary">Click me</Button>;
}
```

With the kitchen-sink package:

```tsx
import { Button, LoadingButton, IconButton } from "@future-standard-ui/ui-kit";
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

### Releasing

This project uses [changesets](https://github.com/changesets/changesets) for versioning and npm [Trusted Publishers](https://docs.npmjs.com/trusted-publishers) for tokenless publishing via OIDC.

#### Adding a changeset

Run this when you make a change that should be released:

```bash
pnpm changeset
```

Follow the prompts to select which packages changed and whether it's a patch, minor, or major bump. Commit the generated changeset file with your PR.

#### Stable release

1. Changesets accumulate on `main` as PRs are merged
2. The Publish workflow automatically creates a "Version Packages" PR that bumps versions and updates changelogs
3. Review and merge that PR — this triggers publishing to npm under the `latest` tag

#### Beta release

Two ways to publish a beta:

**Option A — Manual dispatch:** Go to Actions > "Publish Beta" > "Run workflow". Pick the identifier (`beta`, `alpha`, `rc`) and the branch to publish from.

**Option B — Push to a release branch:** Push to the `beta` or `rc` branch and the workflow runs automatically, using the branch name as the identifier.

Either way, packages are published under the pre-release tag:

```bash
npm install @future-standard-ui/button@beta
npm install @future-standard-ui/button@1.2.0-beta.0  # specific version
```

**Beta release from a feature branch:**

1. Create your changesets as usual (`pnpm changeset`)
2. Push your branch to `beta`: `git push origin my-feature:beta`
3. The workflow publishes all packages with pending changesets as beta versions

#### Setting up trusted publishers

Each package needs a trusted publisher on npmjs.com so GitHub Actions can publish without tokens. This discovers all publishable packages in the workspace, checks which ones are already configured, and sets up the rest:

```bash
pnpm setup-trust
```

Run this whenever you add a new package. It skips packages that are already configured.

### CI/CD

| Workflow | Trigger | Description |
|---|---|---|
| CI | Pull request | Biome checks, build, typecheck |
| PR Deploy Preview | Pull request | Deploys dev app preview to GitHub Pages |
| Deploy gh-pages | Push to main | Deploys dev app to GitHub Pages, cleans up stale PR previews |
| Publish | Push to main | Creates version PR or publishes to npm |
| Publish Beta | Manual dispatch or push to `beta`/`rc` branch | Publishes beta/alpha/rc to npm |

### Project structure

```
packages/
  build-config/     # Shared Vite 8 library config (internal, not published)
  button/           # @future-standard-ui/button
  loading-button/   # @future-standard-ui/loading-button
  icon-button/      # @future-standard-ui/icon-button
  ui-kit/           # @future-standard-ui/ui-kit
```

### Creating a new component package

1. Copy an existing package directory (e.g. `packages/button`)
2. Update `package.json` with the new package name and dependencies
3. Update `vite.config.ts` — add any inter-package deps to `additionalExternal`
4. Add the component to `packages/ui-kit/src/index.ts`
5. Run `pnpm setup-trust` to configure npm trusted publishers for the new package
