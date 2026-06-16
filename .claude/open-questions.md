# Open Questions / Decisions

Tracking decisions to make as the CSS-modules styling pattern matures. See the
reference implementation in `packages/button/`.

## 1. Override hook attribute name: `data-ui` vs `data-component`

Every component root emits a stable, un-hashed attribute as the documented
selector for targeted consumer overrides (e.g. `[data-ui="button"].my-class`).

- **`data-ui`** — short, currently in use. Reads as "this is a UI-kit element."
- **`data-component`** — more explicit/self-describing; longer.

Decide on one name and apply consistently across all components.

## 2. Alias variable scope: theme-level vs component-scoped

Where do component alias CSS vars (e.g. the `--button-*` tokens in
`packages/theme/src/colors.aliases.css`) live?

- **Theme-level** — one central override surface; lets a consumer retarget to a
  wholly new color set centrally. Couples the theme to every component's internals.
- **Component-scoped** — self-contained, reasonable since private vars are
  namespaced anyway. But not reusable elsewhere and no central re-theme point.

Likely a per-category split: theme-level for values consumers retheme centrally
(colors), component-level for values only that component uses (structural sizing).
Revisit before scaling the pattern to more components.

## 3. CSS transformer / browser support (parked)

Whether to switch Vite's CSS engine from the default to Lightning CSS. Nesting
and CSS-modules hashing already work on the default, so the only real driver is
**vendor prefixing and older-browser support** (Lightning CSS does this via
browser targets; the default does not without autoprefixer).

**Decision rule:** evergreen browsers only → close as *no*. Need prefixing /
older browsers → adopt Lightning CSS.
