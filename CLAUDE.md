# CLAUDE.md

## Project

pnpm monorepo (Turborepo) for `@future-standard-ui` React 19 component library.

## Commands

```bash
pnpm install          # Install deps
pnpm run build        # Build all packages
pnpm run typecheck    # Type-check all packages
pnpm run check        # Biome: lint + format + import sorting
pnpm run check:fix    # Biome: auto-fix all
pnpm run lint         # Lint only
pnpm run format       # Format only
pnpm biome check .    # Direct biome check
```

Always use `pnpm` — never `npx`.

## Code style

- Biome for linting/formatting (config in `biome.json`)
- Single quotes everywhere (JS, JSX)
- 2-space indent, 100 char line width, LF line endings
- Semicolons always, trailing commas (ES5)

## Structure

- `packages/` — published packages (`button`, `icon-button`, `loading-button`, `theme`, `ui-kit`, `build-config`)
- `apps/dev/` — dev app for testing components
- Scope: `@future-standard-ui`
- Shared Vite build config in `packages/build-config`
- CSS modules with `vite-plugin-lib-inject-css` (CSS auto-injected on import — no separate style.css import needed for component packages)
