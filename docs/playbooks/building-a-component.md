# Playbook — Building a Component

Status: **v1 — formed while building the table** ([plan](../plans/table.md)). This is the
process every component follows, for humans and agents alike. It will keep changing; when it does,
change it here and date the lesson that caused it.

The goal is one loop: **research → decide → design the API → build the core → render → style →
exemplify → test → document → connect to Figma → release.** A component is done when every step
has an artefact.

---

## 0. Research before code

Do this before touching a file. Write findings down; they justify decisions later.

- **Read the spec** (Notion feature page) and the **strategy docs** (Foundations, Pitch, CSS pattern).
- **Read the old implementation** (`../scorer-ui-kit`): props, types, features, and especially
  hacks, TODOs and `biome-ignore` comments. They are the debt list.
- **Read real usage** (`../mlit-cctv`): every call site, what cell/content kinds are actually used,
  what consumers fake or override (`nth-child` selectors, `key=` remounts, wrapper components).
  Real usage beats the spec when they disagree.
- **Check for hidden work**: remote branches, draft PRs, stale scaffolds.
- **Ask the strategic questions** as a short list with a recommended answer each. Record the
  answers as locked decisions with a one-line *why*.

Table example: 12 call sites in mlit-cctv, 13 distinct cell kinds, 3 screens remounting the table
to work around mount-time state. Those three facts shaped the whole API.

## 1. Write the plan as a repo document

`docs/plans/<component>.md` with: locked decisions (table with *why*), research summary and its
design consequences, architecture, first-draft API/schema, phases with exit criteria, out-of-scope,
and open decisions with a recommendation and the phase that resolves them. Update it as you go; it
is the changelog of thinking.

## 2. Check co-existence and clashes

The new kit runs alongside the old one. Before naming anything:

- Grep the old kit for the CSS variable prefix you intend to use (`--table-*`). New component
  aliases must be names the old kit does not define. Shared *scale* tokens are fine.
- Remember unlayered CSS beats `@layer component`. Set every property your module relies on
  explicitly on your own elements.
- No global JS state; registries are instance-scoped.

## 3. Housekeeping (Phase 0)

- Branch from the branch that carries the pattern you depend on (here `feature/css-pattern`),
  merge `main` early.
- Test runner in place before writing logic. Tests are the spec for headless code.
- Commit the plan first so the first code commit is clean.

## 4. Design the API schema-first

- **Start from the data the consumer already has**, not from the DOM. The schema names the
  fields (`accessor` paths) and the intent (`cell.type`, `emphasis`, `align`); the renderer owns the
  markup.
- **Everything in the schema must survive `JSON.stringify`.** String accessors, type names, CSS
  lengths. If you need a function, it belongs in runtime options (a registry, `accessors`,
  `comparators`), never in the schema. Test this: `JSON.parse(JSON.stringify(schema))` must equal
  the schema.
- **Key by id, never by index.** Every column has an `id`; every row resolves a `rowKey`. Positional
  coupling was the single largest source of bugs in the old kit.
- **Controlled-first.** Every state slice can be owned by the consumer (`state.x` + `onXChange`) or
  left to the instance. Never copy props into state at mount and forget them.
- **Model state as small, replaceable slices** (`sorting`, `rowSelection`, `expanded`, …), each a
  plain JSON value, so they can be persisted and shared with sibling components later.
- **Write the schema reference (`docs/components/<name>/schema.md`) as you design**, with defaults
  and the runtime-only options listed separately. Validate the schema at runtime with issues that
  name the exact path.

## 5. Build the headless core

- **No framework imports.** Build with `createLibraryConfig({ react: false })`; the package has no
  peer dependencies.
- **One write path.** All state changes go through a single `updateSlice` that reports to the
  consumer and updates internal state only for uncontrolled slices. This is where controlled /
  uncontrolled semantics live, once.
- **Pure derivations, memoised on input identity.** `buildRowModel` and `getVisibleColumns` are
  pure functions; the instance caches them on the identity of their inputs. New data or new state
  invalidates; repeated reads are free.
- **Never mutate consumer data.** Sorting returns copies. Test it with a JSON snapshot.
- **The DOM contract is part of the core.** Attribute helpers live next to the state so every
  renderer emits identical `data-ui` / `data-*` / `aria-*` attributes. Document it in
  `docs/components/<name>/dom-contract.md`.
- **Tests are the spec.** One test file per module plus one for the instance covering
  uncontrolled, controlled, mixed, and memoisation. Use fixtures shaped like real consumer data
  (`*.fixtures.ts`, excluded from declaration emit).
- **Exit criteria:** `pnpm check`, `typecheck`, `test`, `build` green; schema and DOM contract
  docs written; changeset added.

## 6. Render (React first, contract for others)

- **Bind, don't wrap.** `useTable` creates the core instance once, syncs props into it silently
  during render, and subscribes with `useSyncExternalStore`. The core must return a *stable* state
  snapshot for this to work — memoise it.
- **Two API tiers.** A schema-driven component for the common case (`DataTable`) built entirely
  from composable primitives (`Table.Root` … `Table.Cell`) that consumers can rearrange. Every
  primitive renders sensible default children when given none, and accepts its native element's
  props.
- **Attributes come from the core.** Call the DOM-contract helpers; never hand-write `data-*`.
  Spread contract attributes before consumer props so consumers can override.
- **Slots over strings.** Loading / empty / error content and accessible labels are props. English
  defaults exist only for `aria-label`s that are never displayed.
- **Registries for the escape hatch.** Cell renderers are looked up by the schema's type name;
  unknown types degrade to text rather than crash.
- **Test with Testing Library in jsdom**: roles, labels and `data-*` attributes, not class names.
  Call `cleanup` in `afterEach` explicitly — Vitest globals are off.
- **The CSS module lives with the core, not the React package.** A second renderer must get the
  same hashed class names and the same stylesheet from a framework-free import. Write the
  non-React renderer early (a few hundred lines of plain DOM) and put a parity check in the dev
  app: render both from one schema and diff every contract attribute. It finds contract leaks
  (attributes one renderer emits and the other forgets) that unit tests miss.

## 7. Style on the CSS-modules pattern

- One module, `@layer component`, states as data attributes, structure in `--_*` vars, colour only
  via theme aliases you add to `packages/theme/src/colors.aliases.css` (checked against the old kit).
- **Container queries for responsiveness**, named breakpoints fixed in the module (they cannot read
  custom properties). Emit the breakpoint on the element (`data-visible-from`) and hide in CSS, so
  the DOM is identical at every width and non-React renderers get it for free.
- Set every property your own anchors / buttons / inputs rely on; unlayered old-kit CSS beats
  this layer.
- Use `:nth-child(even of .row)` style selectors so interleaved rows (drawers, group rows) don't
  break rhythm.
- **Look at it.** Run the dev app and screenshot with the browser tools at two widths and both
  themes before calling a phase done. Two of the three real bugs in Phase 2 were only visible.

## 8. Examples

- One example per API tier and per real consumer pattern: schema-driven with controls that edit the
  schema; controlled + server-sorted (the list-screen pattern); hand-composed primitives.
- Mock data shaped like the real consumer's rows, including nulls and nested objects.
- Hash-routed pages in `apps/dev` so each example has a linkable URL for screenshots and reviews.
- Build packages first; the dev app resolves workspace packages from `dist`. Rebuilding while the
  dev server is open produces transient 404s — reload, don't debug.

## 9. Document

Write docs *as you build*, not after. Each component owns `docs/components/<name>/`:

- **`README.md` — the guide**, in one fixed order: installation, import, usage (the common case
  first, then the real consumer pattern), feature sections, props table, primitives, overrides,
  accessibility, known limits, migration from the old kit. The table guide is the template.
- **`schema.md`** when the component is schema-driven: every property with type, default and
  notes, then the runtime-only options separately, then validation behaviour.
- **`dom-contract.md`** for anything with a non-trivial DOM: parts, attributes, custom
  properties, and a "writing a renderer" recipe.
- Feature-specific references as needed (`cells.md`).
- Update `docs/README.md` (the index) and `CLAUDE.md`/`README.md` package lists.

Rules of thumb: one sentence beats a paragraph; a table beats a list of sentences; every code
sample must be something the examples actually run. Storybook pages will be generated from these
docs later, so keep headings stable.

## 10. Figma and Code Connect

Definition of done includes the Figma side (see the plan's Figma track):

1. Variables first: the old library's colour variables are reused; spacing, radius, type and
   component tokens are created fresh from the theme files.
2. Components mirror the schema-facing props as variant properties (density, zebra, selection,
   emphasis, align, pinned, sortable, expanded, status, stacked).
3. Code Connect (`*.figma.tsx` next to the component) maps those properties to props.
4. Annotations for usage guidance; Blocks for composed patterns (a list page).

Direction is code → Figma; Code Connect is the link back.

## 11. Release

- One changeset per package touched, written for a reader who did not see the PR.
- Meta-packages appear when three individual packages share a category (`tables` did).
- Add exports to the `ui-kit` kitchen sink.
- README package table, `CLAUDE.md` structure line, `docs/README.md` index.
- CI is the gate: `pnpm check` (Biome + `data-ui` uniqueness), `typecheck`, `test`, `build`.
- Run the dev app and look at every example page in both themes before opening the PR.

---

## Lessons log

Short, dated notes on what we learned the hard way, to feed back into the steps above.

- **2026-09-02** — A stale Storybook scaffold existed on a remote branch. Always list remote
  branches during research.
- **2026-09-02** — Merging a formatter upgrade (Biome 2) produced conflicts only in files the
  feature branch had rewritten. Resolve with the feature branch's content, then re-run the formatter.
- **2026-09-02** — Sorting descending flipped empty values to the top because the emptiness rank
  was negated with the direction. Handle "empties last" *outside* the direction flip.
- **2026-09-02** — `Array.prototype.sort` never passes `undefined` to a comparator; it moves those
  elements to the end itself. Test comparators on `undefined` directly, not through `sort`.
- **2026-09-02** — Turbo can report a transient failure when a formatter rewrite invalidates a
  build mid-pipeline. Re-run with `--force` before hunting a phantom error.
- **2026-09-02** — A merged header `colspan` cannot respond to container queries. A hidden
  column under a group header left a phantom column. Rule: grouped columns share visibility;
  enforced in the validator, not just documented.
- **2026-09-02** — Testing Library does not auto-clean between tests without Vitest globals;
  14 "failures" were DOM leaking from earlier tests. Add `afterEach(cleanup)` in the setup file.
- **2026-09-02** — Browser tooling writes artefacts into the repo (`.playwright-mcp/`, screenshots)
  and macOS drops `.DS_Store` everywhere; `git add -A` swept them into a commit. Read `git status`
  before every commit, keep the ignore file exhaustive, and check it ends with a newline before
  appending — a missing one fused two patterns into a bogus entry.
- **2026-09-03** — Prefer a schema-derived value over a measured one. Pinned-column offsets
  looked like a ResizeObserver job; a `calc()` built from declared widths plus a validator rule
  ("inner pinned columns need `width`") did it with zero runtime and works for any renderer.
- **2026-09-03** — When CSS physics forbid a combination (horizontal scroll container + header
  sticky to the page), make the trade-off an explicit option (`layout: 'contained' | 'page'`)
  instead of a clever workaround. Document what each mode gives up.
- **2026-09-03** — TypeScript narrowing does not survive into callbacks. Capture the narrowed
  value in a `const` before mapping over it.
- **2026-09-03** — A layout mode that rewrites `display` (the stacked card layout) silently
  out-ranked the breakpoint-visibility rules and showed every column at once. Route the property
  through a custom property (`display: var(--_cell-display, table-cell)`) that the mode switches,
  so the later, lower-specificity visibility rules keep winning. Screenshot caught it; tests didn't.
- **2026-09-03** — Biome suppressions cannot target an attribute on a multi-line JSX tag. When a
  linter fights a deliberate attribute, ask whether the attribute belongs in the contract helpers
  anyway; here explicit ARIA roles moved into `getElementAttributes()` and the lint issue vanished.
- **2026-09-03** — Give every cell one content wrapper (`.cellContent`). Free-floating text nodes
  cannot be laid out; the wrapper made the card layout's label/value split trivial.
- **2026-09-03** — A progress bar rendered empty although its computed colour and `width: 85%`
  were correct: the fill was a `span`, inline, so width was ignored. Computed-style checks are not
  layout checks; when verifying a visual, measure `getBoundingClientRect()` or look at the pixels
  at 1:1. Any element that gets a width must have a block-ish display.
- **2026-09-03 (Figma)** — Alias the new file's semantic colour variables to the *library's* variables
  instead of copying values: light/dark/high-contrast then belong to one collection. The library's
  default mode was Dark, so pin documentation and component frames to Light explicitly.
- **2026-09-03 (Figma)** — `resize()` fixes both axes of an auto-layout frame; set `layoutSizingVertical
  = 'HUG'` afterwards or content is clipped at 1px. Same for swatch cards and restacked rows.
- **2026-09-03 (Figma)** — Multi-path icons: build from SVG with `createNodeFromSvg` and reparent the
  vectors. Setting `x/y` on a vector after assigning `vectorPaths` collapses its position.
- **2026-09-03 (Figma)** — `setBoundVariableForPaint` returns a paint without the `opacity` you passed;
  spread the paint and set opacity after binding.
- **2026-09-03 (Figma)** — Screenshot every component set at ≥2× before moving on; three of the
  fixes above were only visible in pixels.
