# Table — DOM Contract

The DOM contract is what makes the table framework-agnostic. Every renderer (React, vanilla DOM,
anything else) emits the same **parts** and **state attributes**, so one CSS module styles all of
them and consumer overrides written once work everywhere.

The source of truth is `packages/table-core/src/domContract.ts`. Renderers must call its helpers
(`getRootAttributes`, `getElementAttributes`, `getHeadAttributes`, `getBodyAttributes`,
`getHeaderCellAttributes`, `getCellAttributes`, `getRowAttributes`) rather than hand-writing
attributes.

## Rules

1. **`data-ui` names the part.** It is never hashed and is the documented override hook:
   `[data-ui="table-row"]`. Never target hashed module classes or DOM shape (`div > div:nth-child(2)`).
2. **Booleans are presence attributes.** `data-zebra="true"` when on, attribute omitted when off.
   Select with `[data-zebra]`.
3. **Enumerations are values.** `data-align="end"`, `data-density="compact"`.
4. **`aria-*` and explicit `role`s ship with the contract.** Renderers do not invent their own
   accessibility. Roles are explicit because the stacked layout changes `display` on table parts,
   which strips implicit table semantics in some browsers. The helpers emit `table`, `rowgroup`,
   `columnheader`, `row` and `cell`.
5. **Renderers drop `undefined`.** `compactAttributes()` does this for you.

## Parts

| `data-ui` | Element (React renderer) | Purpose |
|---|---|---|
| `table` | `div` | Root. Carries feature flags and status. Container for container queries. |
| `table-scroll` | `div` | Horizontal scroll container. Pinned columns stick inside it. |
| `table-element` | `table` | The semantic table. |
| `table-head` | `thead` | |
| `table-group-header-row` | `tr` | Row of merged group titles (only when any column has `group`). |
| `table-group-header-cell` | `th` | One merged group title, `colspan` = span. |
| `table-header-row` | `tr` | Column headers. |
| `table-header-cell` | `th` | One column header. |
| `table-sort-button` | `button` | Clickable sort control inside a sortable header cell. |
| `table-select-all` | `input[type=checkbox]` | Select-all control (multiple selection only). |
| `table-body` | `tbody` | |
| `table-group-row` | `tr` | Section header when grouping is on. |
| `table-row` | `tr` | A data row. |
| `table-cell` | `td` | A data cell. |
| `table-select-row` | `input[type=checkbox|radio]` | Per-row selection control. |
| `table-expand-toggle` | `button` | Opens/closes the row's drawer. |
| `table-drawer` | `tr > td[colspan]` | Expanded content beneath a row. |
| `table-status` | `tr > td[colspan]` or `div` | Loading / empty / error slot. |

Group header cells (`table-group-header-cell`) also carry `data-visible-from` / `data-visible-until`
when every column in the group shares them, plus `data-empty` for the placeholder cells above
ungrouped columns.

## Root attributes — `getRootAttributes(schema, { status })`

| Attribute | Values | From |
|---|---|---|
| `data-layout` | `contained` `page` | `TableOptions.layout` (default `contained`) |
| `data-table-id` | schema `id` | `schema.id` |
| `data-density` | `compact` `normal` `comfortable` | `features.density` (default `normal`) |
| `data-selection` | `single` `multiple` (omitted for `none`) | `features.selection` |
| `data-zebra` | presence | `features.zebra` |
| `data-sticky-header` | presence | `features.stickyHeader` |
| `data-expandable` | presence | `features.expandable` |
| `data-grouped` | presence | `features.grouping` set |
| `data-sticky-group-header` | presence | `features.grouping.stickyGroupHeader` |
| `data-stacked-below` | `sm` `md` `lg` `xl` | `features.stacked.below` — CSS stacks rows into cards under this container width |
| `data-status` | `idle` `loading` `empty` `error` | `TableOptions.status` (default `idle`) |

## Column attributes — on header cells **and** body cells

| Attribute | Values | From |
|---|---|---|
| `data-column` | column id | |
| `data-align` | `start` `center` `end` | `column.align` (default `start`) |
| `data-emphasis` | `low` `normal` `high` | `column.emphasis` (default `normal`) |
| `data-pin` | `start` `end` (omitted when unpinned) | runtime `columnPinning` state, seeded from `column.pin` |
| `data-pin-edge` | presence | innermost pinned column on its side; where the divider/shadow is drawn. Absent in `page` layout. |
| `data-visible-from` | `sm` `md` `lg` `xl` | `column.visibleFrom` — CSS hides below this container breakpoint |
| `data-visible-until` | `sm` `md` `lg` `xl` | `column.visibleUntil` — CSS hides at and above this breakpoint |

Header cells add:

| Attribute | Values |
|---|---|
| `role` | `columnheader` |
| `data-sortable` | presence |
| `data-sort` | `asc` `desc` (omitted when unsorted) |
| `aria-sort` | `ascending` `descending` `none` (omitted when not sortable) |

Body cells add:

| Attribute | Values |
|---|---|
| `data-cell-type` | the cell type name (`text` by default) |
| `data-label` | the column header text; shown beside the value in the stacked layout via `attr(data-label)` |
| `role` | `cell` |

## Row attributes — `getRowAttributes(row, schema, { tone, state })`

| Attribute | Values | Notes |
|---|---|---|
| `role` | `row` | |
| `data-key` | row key | from `schema.rowKey` |
| `data-index` | render index | |
| `data-selected` | presence | |
| `data-expanded` | presence | |
| `data-tone` | consumer string, e.g. `warning` `muted` | semantic colouring; the CSS module styles a small set, projects add more in an override layer |
| `data-state` | consumer string, e.g. `pending` `disabled` | lifecycle hint; replaces per-cell dimming hacks |
| `aria-selected` | `true` `false` | only when selection is enabled |
| `aria-expanded` | `true` `false` | only when `expandable` |

## Custom properties renderers must set

| Property | On | Value | From |
|---|---|---|---|
| `--_pin-offset` | pinned header/body cells, utility cells | CSS length expression for `left` (start) / `right` (end) | `table.getColumnPinLayout(id)` → `getPinStyle()`; utility cells use `0px` / `calc(var(--_utility-width) * n)` |
| `--_max-height` | root | CSS length | `maxHeight` prop |
| `--_sticky-top` | root | CSS length | `stickyTop` prop (page layout) |

Utility cells (select / expand) additionally carry `data-utility="select" \| "expand" \| "group"`.

## Responsive visibility is CSS

`data-visible-from` / `data-visible-until` are emitted on every render; the CSS module hides the
cells with container queries. The core does **not** drop these columns from the row model, so the
same DOM serves every width and the vanilla renderer gets responsiveness for free. Named breakpoint
widths are defined in the CSS module and mirrored in Figma.

## Writing a renderer

A renderer for any framework needs only `@future-standard-ui/table-core`. The reference
implementations are the React package and `apps/dev/src/examples/table-vanilla/mountTable.ts`
(plain DOM, ~300 lines). The recipe:

1. `createTable(options)` and `subscribe(render)`. Push new props with `setOptions(patch)`
   (`{ silent: true }` if your framework is already re-rendering).
2. Import `tableClasses` for the hashed class names; importing the core injects the stylesheet.
3. Walk `getVisibleColumns()`, `getHeaderGroups()`, `getRowModel()` (`rows`, or `groups` when
   grouping is on) and emit the parts in the table above.
4. Spread the attribute helpers — `getRootAttributes()`, `getElementAttributes()`,
   `getHeadAttributes()`, `getBodyAttributes({ busy })`, `getHeaderCellAttributes(id)`,
   `getCellAttributes(id)`, `getRowAttributes(row, hints)` — and drop `undefined` values.
   Set `data-status` from `getEffectiveStatus(table)`.
5. Set the custom properties: `getPinStyle(getColumnPinLayout(id))` on pinned cells, utility
   cells at `0px` / `calc(var(--_utility-width) * n)`, `--_max-height` and `--_sticky-top` on the root.
6. Wire controls to the instance: sort button → `toggleSort(id)`; row checkbox →
   `toggleRowSelected(key, checked)`; select-all → `toggleAllRowsSelected(checked)` with
   `indeterminate` from `getSelectionSummary() === 'some'`; expand → `toggleExpanded(key)`;
   group toggle → `toggleGroupCollapsed(key)`.
7. Cell renderers are per framework: look up `column.cell.type` in your registry and fall back
   to text.

The dev app's `#/table-vanilla` page renders both implementations from one schema and compares
every contract attribute they emit.

## Override example

```css
@layer overrides {
  [data-ui='table'] [data-ui='table-row'][data-tone='warning'] {
    --table-row-background: var(--caution-3);
  }
}
```
