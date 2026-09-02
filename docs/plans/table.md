# Table — Experiment Plan

Status: **active** · Branch: `feature/table` · Started: 2026-09-02

The first big-hitter component for the new UI Kit, and the vehicle for forming the
process we will use for every component after it. Spec:
[Responsive Tables (Notion)](https://app.notion.com/p/futurestandard/Responsive-Tables-10bab7b43683804b9fc5c5b370d686b9).
Strategy:
[AI Native UI Kit — Foundations](https://app.notion.com/p/futurestandard/AI-Native-UI-Kit-Foundations-325ab7b4368380788143e2161bc68c07).

---

## 1. Decisions (locked for this experiment)

| # | Decision | Choice | Why |
|---|---|---|---|
| 1 | Core engine | **Own headless core, zero runtime deps.** TanStack Table is the conceptual reference (column defs, row model, feature state, `manual*` flags) so a future swap stays possible. | Growing need to avoid dependencies; the spec's feature set is modest; a familiar shape helps engineers and agents who know TanStack. |
| 2 | Non-React | **Headless core + CSS contract.** React is the first-class renderer. A small vanilla DOM renderer in `apps/dev` proves the core and the CSS contract are framework-free. | Keeps one source of truth for behaviour and styling without committing to Web Components. |
| 3 | Configuration | **Schema-first.** A table is described by a JSON-serialisable schema (string accessors, cell *type names*, CSS lengths). Functions are the escape hatch, supplied at runtime through a registry, never inside the schema. | Designers, agents, saved views and Figma can all produce or consume the same artefact. |
| 4 | Data ownership | **Controlled-first.** The table emits sort / selection / expansion changes and never reorders or filters data by default. Client-side helpers are opt-in. | mlit-cctv is mixed server/client per screen; one API must serve both. |
| 5 | Docs surface | **Examples pages in `apps/dev` + `.md`/`.mdx` in repo now. Storybook later** (light setup, Shadcn-style pages). `origin/add-storybook` is a stale Storybook 10 scaffold (pre-theme, old `@future-standard/` scope): reference only, do not merge. | Get the component right first. |
| 6 | Browsers | **Evergreen only.** Container queries, CSS nesting, `:has()`, `position: sticky` used directly. No Lightning CSS. | Closes the parked question from `open-questions.md`. |
| 7 | Override hook | Keep **`data-ui="table"`** (and `data-ui="table-row"` etc.) as Button already ships `data-ui`. | Consistency with the CSS-modules pattern on this branch. |
| 8 | Theme aliases | **Colours at theme level** (`--table-*` in `packages/theme`), **structure at component level** (`--_row-height` etc. inside the module). | The split the parked question already leaned towards. |
| 9 | Tests | **Vitest + Testing Library** added to the repo. Core logic is unit-tested from day one; React primitives get behaviour tests. | "Build it like it's for production." |
| 10 | Strings | No text inside components. Loading, empty, aria labels are props/slots. | Consumers are i18n'd (i18next in mlit-cctv). |

---

## 2. What the research told us

**Old kit (`scorer-ui-kit` `TypeTable`)**
- Config-object API with **positional coupling**: `columnConfig[i]` ↔ `row.columns[i]`. A mismatch crashes render.
- Header copies `columnConfig` into state on mount and never re-reads it. mlit-cctv remounts the whole table via `key=` on every sort change in three screens.
- Empty state needs a fake `[{ columns: [] }]` row (9 of 12 call sites). `width` is declared, never implemented. Boolean flags (`hasStatus`, `hasThumbnail`, `hasTypeIcon`, `selectable`) each hard-code a leading column.
- No responsive behaviour, no sticky header, no row-level style hook, no headerless/grouped mode, no relationship to `Pagination` at all.

**Real usage (`mlit-cctv`, 12 tables)**
- Grouped cameras = one header-only table + N headerless tables with a `-59px` margin. Sticky header = `nth-child` selector into kit DOM. Dimmed rows = per-cell wrapper. Deep `div > div > div:nth-child(2)` overrides in four files. One screen abandoned the kit for a hand-rolled `<table>`.
- Cell content actually used: text, text + unit, two-line stacked, timestamp (relative over absolute), thumbnail, type icon, checkbox, switch, action icon cluster, internal link, status dot/pill, progress bar, truncated text with tooltip, hover-revealed affordance.
- Filter / sort / page / page-size state lives in a per-screen `useXList` hook, persisted to localStorage. Server-side vs client-side processing differs per screen. Page size options duplicated in five files.
- Only responsive behaviour: a JS `innerWidth >= 1536` listener toggling one column.

**Design consequences**
1. Columns keyed by `id`, never by index. Cells resolve their own value via accessor.
2. All state is controlled/uncontrolled in the React sense: `sort` / `onSortChange` etc. No mount-time copies.
3. Empty/loading/error are first-class `status` states, not row hacks.
4. Rows expose data attributes (`data-state`, `data-tone`, `data-selected`, `data-expanded`) so "dim this row" is a schema-level or per-row hint, not a selector into DOM.
5. Grouping, sticky header and pinned columns are features, not compositions consumers have to fake.
6. A shared **list-view state contract** (sort + selection + pagination + filters) is designed now, even though only the table implements it in this experiment, so Filters and Pagination slot in later without a second API.

---

## 3. Architecture

### Packages

```
packages/
  table-core/     @future-standard-ui/table-core   — pure TS, no React
  table/          @future-standard-ui/table        — React primitives + DataTable + CSS module
  table-cells/    @future-standard-ui/table-cells  — standard cell renderers (phase 6)
apps/dev/
  src/examples/table/*                             — React example pages
  src/examples/table-vanilla/*                     — vanilla DOM renderer proof
packages/theme/
  src/colors.aliases.css                           — --table-* colour aliases
```

### `table-core` (framework-free)

- **Schema types** — `TableSchema`, `ColumnSchema`, `CellSchema` (see §4). JSON-serialisable; validated at runtime with clear errors.
- **Store** — a tiny observable state container (`getState`, `setState`, `subscribe`). Feature slices: `sorting`, `rowSelection`, `expanded`, `columnVisibility`, `columnPinning`, `grouping`. Each slice is controllable from outside (the React layer maps them to props).
- **Row model** — `createRowModel(data, schema, state)` → rows with `key`, `original`, `cells[]` (value resolved via accessor), `depth`, `groupKey`. Opt-in helpers: `applySorting`, `applyGrouping` (client-side only when asked).
- **Accessors** — dot-path resolution (`'camera.displayName'`), array index, with a `resolveAccessor` that can be swapped for custom functions at runtime.
- **Cell registry contract** — `registerCellType(name, renderer)` where the renderer signature is framework-specific; core only defines the context shape `{ value, row, column, table, options }` and the built-in *formatters* (number, unit, date) that renderers share.
- **DOM contract** — the documented `data-ui` parts and `data-*` state attributes every renderer must emit so the CSS module and consumer overrides work identically for React and vanilla.
- **A11y helpers** — sort `aria-sort` values, select-all `aria-checked` state, row/column indexes.

### `table` (React)

- `useTable(schema, options)` — binds the core store to React state; accepts controlled props (`sorting`, `onSortingChange`, `rowSelection`, …) and `manual*` flags.
- **Primitives** for hand-built layouts: `Table.Root`, `Table.Head`, `Table.Body`, `Table.Row`, `Table.HeaderCell`, `Table.Cell`, `Table.GroupRow`, `Table.Drawer`, `Table.Status` (loading/empty/error slot).
- **`DataTable`** — the 90% case: `<DataTable schema={schema} data={rows} {...state} />`, rendering the primitives from the schema.
- **`Table.module.css`** — `@layer component`, data-attribute states, theme aliases for colour, private `--_*` vars for structure, container queries for responsive column visibility.

### Styling contract (from PR #12 / `feature/css-pattern` and the Notion CSS Modules page)

- `@layer component`, one module root class, native nesting for states and children.
- Props → data attributes on the root: booleans as presence (`data-loading`), strings as values
  (`data-density="compact"`). Component logic decides the attributes; no className juggling.
- Un-hashed `data-ui="table"` on the root and `data-ui="table-<part>"` on parts as the
  documented override hook. Consumers override in `@layer overrides`.
- Colour only through theme aliases (`--table-*` in `packages/theme/src/colors.aliases.css`),
  remapped per `[data-design]` in the theme. Structure through private `--_*` vars the module
  owns. Both are overridable because custom properties are not hashed.
- Where the Notion page and the code differ, the code wins: `data-ui` (not `data-component`),
  `data-design` (not `data-theme`, which collides with the light/dark switch), aliases in the
  theme (not raw `var(--primary-9)` inside the module). Notion page to be updated.
- Reviewer question carried forward: add a check that `data-ui` values are unique across
  packages (small script in `pnpm check`). Optional Phase 0 item.

### Co-existence with the old kit (`scorer-ui-kit`)

Both kits will run in the same app for a while. Checked against the old kit's source on 2026-09-02:

- **Scale and alias tokens share names** (`--primary-*`, `--grey-*`, `--button-*`, `--input-*`, `--filter-*`,
  `--switch-*`) on the same scopes. Identical values today, so harmless; if they diverge, last-loaded
  wins silently. Rule: shared *scale* names stay shared (they are the same design tokens, sourced from
  the Figma library). New **component aliases must be names the old kit does not define**. `--table-*`
  is verified clean. `--button-*` is an existing overlap to keep identical or rename later.
- **Unlayered beats layered.** The old kit's global element rules (`a`, `button`, `body`) are unlayered
  and will win over our `@layer component` rules on the same element. The table module therefore sets
  every property it relies on for its own anchors, buttons and inputs explicitly (colour, decoration,
  font, background, border) instead of trusting UA defaults or inheritance.
- **No selector overlap.** Our classes are hashed; the old kit uses no `data-ui` / `data-design`.
  Both kits toggle `.light-theme` / `data-theme` — that sharing is intentional.
- **Fonts.** Both declare `@font-face Monorale` from the same files; harmless. One theme should own
  fonts eventually.
- **No shared JS state.** `table-core` keeps no globals; registries are instance-scoped.

### Layout approach (to validate in phase 2)

Semantic `<table>` with `table-layout: fixed` and a `<colgroup>` generated from the schema widths, inside a scroll container. Sticky header via `thead th { position: sticky }`, pinned columns via `position: sticky; inset-inline-start`. Expanded drawers via `<td colspan>`. If sticky-pinned columns + container queries prove brittle on `<table>`, fall back to CSS grid with ARIA table roles. Decision recorded once the phase 2 prototype has run in the three browsers.

---

## 4. Schema and data ingestion (first draft)

```ts
type TableSchema = {
  id?: string;                     // stable id, useful for saved views / persistence
  rowKey: string;                  // accessor to a unique row id, e.g. 'id'
  columns: ColumnSchema[];
  features?: {
    selection?: 'none' | 'single' | 'multiple';
    expandable?: boolean;          // rows can open a drawer
    stickyHeader?: boolean;
    zebra?: boolean;
    density?: 'compact' | 'normal' | 'comfortable';
    grouping?: { by: string; collapsible?: boolean; stickyGroupHeader?: boolean };
  };
};

type ColumnSchema = {
  id: string;
  header: string;                  // already-translated display text
  accessor?: string;               // dot path into the row; defaults to id
  cell?: CellSchema;               // defaults to { type: 'text' }
  sortable?: boolean;
  align?: 'start' | 'center' | 'end';
  emphasis?: 'low' | 'normal' | 'high';   // replaces cellStyle importance
  width?: string;                  // CSS length or fr, e.g. '200px' | '2fr'
  minWidth?: string;
  maxWidth?: string;
  pin?: 'start' | 'end';           // lockable start/end columns
  visibleFrom?: 'sm' | 'md' | 'lg' | 'xl';   // container breakpoint (CSS-driven)
  visibleUntil?: 'sm' | 'md' | 'lg' | 'xl';  // for the "combined column on small" case
  group?: string;                  // header group title (adjacent equal groups merge)
};

type CellSchema = {
  type: string;                    // 'text' | 'number' | 'timestamp' | 'status' | 'actions' | … or a project-registered name
  options?: Record<string, unknown>;   // e.g. { unit: 'km' }, { boldTime: true }, { accessors: ['ingress','egress'] }
};
```

**Ingestion rules**
- Data in is `TRow[]`. Nothing is copied or transformed up-front; values resolve lazily per cell through the accessor.
- The `rowKey` accessor must resolve to a string or number; selection and expansion are keyed by it.
- Cell types decide how to coerce and format the value. A `composite` cell type reads several accessors (the ingress/egress → combined case).
- Runtime-only options, passed to `useTable`/`DataTable`, never in the schema: cell renderer registry, `getRowAttributes(row)` (tone/state hints), `rowActions`, async `status`, custom accessor functions.
- The schema is validated once; errors name the column id and property.

---

## 5. List-view state contract (design only, this experiment)

A plain object the table, and later Filters and Pagination, all read and write:

```ts
type ListViewState = {
  sorting: { id: string; desc: boolean }[];   // single-column today, array-shaped for later
  rowSelection: Record<string, boolean>;
  expanded: Record<string, boolean>;
  pagination?: { pageIndex: number; pageSize: number };
  filters?: Record<string, unknown>;          // owned by the filter components later
};
```

The table consumes `sorting`, `rowSelection`, `expanded` and emits `on*Change`. Pagination will consume `pagination`. Filters will own `filters`. A `useListViewState` helper (URL/localStorage persistence) is a later package, not part of this experiment, but the shape is fixed here so mlit-cctv's `useXList` hooks have a target.

---

## 6. Phases

Each phase ends with: green `pnpm check`, `pnpm typecheck`, `pnpm test`, `pnpm build`; an example page; a docs update; a changeset.

### Phase 0 — Housekeeping
- [x] Branch `feature/table` from `feature/css-pattern`.
- [x] Biome 2.4.12 upgrade merged to main and into this branch (2026-09-02).
- [ ] Commit the pending `.gitignore` change and this plan.
- [ ] Add Vitest (+ Testing Library for Phase 2) at the root, `pnpm test` via Turbo and CI.
  Why now: `table-core` is pure logic and the tests are its spec; they also prove the React
  and vanilla renderers behave identically (Phase 5). Retrofitting after Phases 2–4 is the
  expensive path, and the old kit's untested table is how the mount-time header bug shipped.

### Phase 1 — `table-core`: schema, store, row model
- Schema types + runtime validation with tests.
- Store with feature slices; controlled/uncontrolled semantics.
- Row model + accessors; opt-in client sorting helper.
- DOM contract document (`docs/components/table/dom-contract.md`).
- Deliverable: a pure-TS package with 100% of logic under test, no React.

### Phase 2 — `table`: React renderer v1 (the "basic looking table with focus on features")
- Primitives + `useTable` + `DataTable`.
- `Table.module.css` on the CSS-modules pattern; `--table-*` aliases added to theme.
- Features: fluid layout, column widths via `<colgroup>`, alignment, emphasis, clickable sortable headers, selection with select-all + indeterminate, `status` slot (loading / empty / error), hover highlight, zebra, density, sticky header, row data-attributes for tone/state.
- Example page: clips-like and users-like tables using mock data shaped like mlit-cctv rows.
- Validate the `<table>` layout decision (§3) in Chrome, Safari, Firefox.
- Add the duplicate-`data-ui` check to `pnpm check` now that parts multiply (`table-row`, `table-cell`, …).

### Phase 3 — Responsive
- Scroll container with pinned start/end columns.
- Container-query driven column visibility (`visibleFrom` / `visibleUntil`) using a fixed breakpoint set from the theme.
- `composite` cell type for the combined-on-small case.
- Example: traffic ingress/egress table from the Notion spec.

### Phase 4 — Structure
- Header groups.
- Foldable grouping when sorted by a category (collapsible sections, sticky group header under the main header).
- Expandable row drawer (`Table.Drawer`, `<td colspan>`), controlled via `expanded`.
- Example: grouped cameras (replacing the header-only/headerless composition in mlit-cctv).

### Phase 5 — Vanilla renderer proof
- `apps/dev/src/examples/table-vanilla/`: same schema + same CSS module, plain DOM, driven by `table-core`'s store.
- Confirms the DOM contract and CSS work without React. Document what a framework renderer must implement.

### Phase 6 — `table-cells` v1
- Registered by name: `text`, `number` (unit), `multiline`, `timestamp`, `link`, `status`, `thumbnail`, `icon`, `actions`, `switch`, `progress`, `truncate`, `composite`.
- Each with a docs entry and example row.

### Phase 7 — System: docs, playbook, adoption prep
- `docs/components/table/*.md(x)`: overview, install, import, schema reference, props tables, examples, DOM contract, override recipes, migration notes from `TypeTable`.
- `docs/playbooks/building-a-component.md`: the process formed here (research → schema/API → core → renderer → CSS contract → examples → tests → docs → Figma/Code Connect → changeset).
- Update `CLAUDE.md`, `README.md`, `docs/META_PACKAGES.md` (tables meta-package appears once `table`, `table-core`, `table-cells` exist).
- Then, outside this experiment: light Storybook setup (reference `origin/add-storybook`), filters + pagination packages against the §5 contract.

### Figma track — runs alongside Phases 2–7

File: [UI Kit (v4 AIN)](https://www.figma.com/design/vQuMH0DtHatIYqkv5A4BVO/UI-Kit--v4-AIN-) — one blank page,
with the **current UI Kit Library enabled** for its colour tokens.
Direction of curation is **code → Figma** (code is the source of truth); **Code Connect** is the
link back so Dev Mode and designers land on the real API. Per the Foundations doc, a component
is not done until its Figma side is connected and annotated.

Rules: **colours come from the old library's variables** (they are the source the CSS `--*` colour
vars in `packages/theme` were ported from — do not recreate them). Everything else (spacing, radius,
type scale, component tokens, components) is created fresh in the new file; duplicate from the old
library only when needed, never wholesale.

| When | Step |
|---|---|
| Before anything lands | Page structure: `Foundations`, `Components`, `Blocks`, `Guidelines`. |
| After Phase 2 | Non-colour tokens → new Figma **variables** (from `components.css`, `layout.css`, `animation.css`). Colour bindings point at the old library's variables. |
| After Phase 4 | Table **components** with variant properties mirroring schema-facing props (density, zebra, selection, emphasis, align, pinned, sortable, expanded, status). Row and cell sub-components. |
| After Phase 4 | **Code Connect**: `Table.figma.tsx` (and cells) in the packages, mapping Figma properties → props. Dev-only dependency `@figma/code-connect`. |
| After Phase 6 | Cell library components + Code Connect for each cell type. A `Blocks` example: list page (header + table + slots for filters/pagination). |
| Phase 7 | Annotations (usage, dos/don'ts); the playbook records Figma + Code Connect as definition-of-done. |

---

## 7. Out of scope (this experiment)

Filters and Pagination components · virtualisation (store is designed so the row model can be windowed later) · mobile card layout (Notion: "later stage") · inline editing · user-driven column resize/reorder · saved-view persistence helper · migration adapter from the `TypeTable` API (a migration *guide* is in phase 7) · Storybook setup (after the API settles).

---

## 8. Open decisions to resolve while building

| Decision | Recommendation | Resolve in |
|---|---|---|
| `<table>` vs CSS grid | `<table>` + `<colgroup>`; fall back to grid only if sticky/pinned/container queries fight it | Phase 2 |
| Column visibility: CSS container queries vs JS ResizeObserver | CSS with named breakpoints first (works for vanilla for free); JS only if state needs to know (e.g. sort dropdown lists) | Phase 3 |
| Sort model | Single column in v1, array-shaped state | Phase 1 |
| Cell renderer signature (React) | `(ctx: CellContext) => ReactNode`; vanilla returns `Node \| string` | Phase 2 / 5 |
| Selection identity | `Set`/record of `rowKey` values; select-all operates on the *current* rows array (consumer decides page vs total) | Phase 1 |
| Header group representation | Flat `group` string on columns, adjacent-equal merge (as today) vs nested column tree | Phase 4 |
| Breakpoint names | Reuse theme layout breakpoints (1280 / 1536 exist) + add `sm`/`md` | Phase 3 |
