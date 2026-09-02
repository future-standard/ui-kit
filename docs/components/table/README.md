# Table

Schema-driven, responsive data table. Two packages:

| Package | What it is | React? |
|---|---|---|
| `@future-standard-ui/table-core` | Schema, state, row model, DOM contract | No |
| `@future-standard-ui/table` | `DataTable`, composable primitives, `useTable`, CSS module | Yes |

Status: **Phase 2 of the [table plan](../../plans/table.md)** — core features and React renderer.
Responsive pinning/offsets (Phase 3), the standard cell library (Phase 6) and Storybook pages come
later. This page follows the format every component page will use.

---

## Installation

```bash
pnpm add @future-standard-ui/table @future-standard-ui/theme
```

`@future-standard-ui/table-core` is installed as a dependency. The theme package provides the
`--table-*` colour aliases; without it the table renders unstyled colours.

## Import

```tsx
import { DataTable, type TableSchema } from '@future-standard-ui/table';
```

CSS is injected on import — no separate stylesheet.

## Usage

```tsx
const schema: TableSchema = {
  rowKey: 'id',
  columns: [
    { id: 'name', header: 'Camera', sortable: true, emphasis: 'high', pin: 'start' },
    { id: 'route', header: 'Route', accessor: 'location.route' },
    { id: 'clips', header: 'Clips', accessor: 'counts.clips', align: 'end', sortable: true },
    { id: 'lastSeen', header: 'Last seen', cell: { type: 'timestamp' }, visibleFrom: 'lg' },
  ],
  features: { selection: 'multiple', stickyHeader: true },
};

<DataTable schema={schema} data={cameras} clientSorting cells={{ timestamp: TimestampCell }} />
```

The schema is plain JSON — see the [schema reference](./schema.md). Anything that needs code
(renderers, accessors, comparators) goes in props.

### Controlled state (the list-screen pattern)

The table never reorders or filters data unless asked. Own the state, let the server sort:

```tsx
const [sorting, setSorting] = useState<SortingState>([{ id: 'startTime', desc: true }]);
const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
const { data, status } = useClips({ sort: sorting[0] }); // your fetch hook

<DataTable
  schema={schema}
  data={data}
  status={status}                       // 'idle' | 'loading' | 'empty' | 'error'
  state={{ sorting, rowSelection }}
  onSortingChange={setSorting}
  onRowSelectionChange={setRowSelection}
  slots={{ loading: <Spinner />, empty: t('No clips found'), error: t('Failed') }}
/>
```

Any slice left out of `state` is uncontrolled and managed by the table. While `status` is
`loading` and rows exist, the loading slot renders as an overlay; with no rows it renders in place.

### Row hints

Instead of styling cells to dim a row, describe the row:

```tsx
getRowHints={(row) =>
  row.original.fileStatus === 'processing' ? { state: 'pending' }
  : row.original.fileStatus === 'failed' ? { tone: 'danger' }
  : undefined
}
```

`tone` (`info` `success` `warning` `danger`) and `state` (`pending` `disabled`) are styled by the
module; projects add more in an override layer via `[data-tone="…"]`.

### Drawers, grouping, header groups

- `features.expandable: true` + `renderDrawer={(row) => …}` gives each row a toggle and a drawer.
- `features.grouping: { by: 'status', collapsible: true }` renders section rows between adjacent
  rows sharing a value. Pass data sorted by that column.
- `group: 'Location'` on adjacent columns merges their headers under one title.

## `DataTable` props

All [`TableOptions`](./schema.md#runtime-options-that-are-not-schema) plus:

| Prop | Type | Purpose |
|---|---|---|
| `cells` | `Record<string, CellRenderer>` | Cell type name → renderer. Merged over the built-in `text`. |
| `slots` | `{ loading?, empty?, error? }` | Content for non-idle states. |
| `labels` | `Partial<TableLabels>` | Accessible names for controls with no visible text (English defaults). |
| `getRowHints` | `(row) => { tone?, state? }` | Row-level presentation hints. |
| `renderDrawer` | `(row) => ReactNode` | Drawer content for expanded rows. |
| `renderGroupHeader` | `(group) => ReactNode` | Custom group section label. |
| `maxHeight` | `string` | Caps height; the table scrolls internally and a sticky header sticks to it. |
| `className`, `style`, `id`, … | `div` props | Forwarded to the root. |

### Cell renderer signature

```ts
type CellRenderer<TRow> = (ctx: {
  value: unknown;            // resolved through the column accessor
  row: Row<TRow>;            // key, index, original, getValue()
  column: ColumnSchema;
  table: TableInstance<TRow>;
  options: Record<string, unknown>;  // column.cell.options
}) => ReactNode;
```

## Primitives

For layouts `DataTable` does not express, compose the parts yourself. Everything reads from the
context that `Table.Root` provides.

```tsx
const table = useTable({ schema, data });

<Table.Root table={table} cells={cells}>
  <Table.Scroll>
    <Table.Element>
      <Table.Head />
      {offices.map((office) => (
        <Table.Body key={office}>
          <Table.Status status='idle'>{office}</Table.Status>
          {rowsFor(office).map((row) => <Table.Row key={row.key} row={row} />)}
        </Table.Body>
      ))}
    </Table.Element>
  </Table.Scroll>
</Table.Root>
```

Parts: `Root`, `Scroll`, `Element`, `Head`, `HeaderCell`, `Body`, `Row`, `Cell`, `GroupRow`,
`Drawer`, `Status`. Each accepts its native element's props and renders its default children when
given none.

## Overriding styles

Target the un-hashed parts from the [DOM contract](./dom-contract.md) in an `overrides` layer:

```css
@layer component, overrides;

@layer overrides {
  /* Colour: retarget the theme aliases the module reads. */
  [data-ui='table'].my-table {
    --table-header-background: var(--primary-2);
    --table-row-hover-background: var(--primary-3);
  }

  /* Structure: the private vars are not hashed either. */
  [data-ui='table'][data-density='compact'] {
    --_row-height: 32px;
  }

  /* A project-specific tone. */
  [data-ui='table-row'][data-tone='maintenance'] {
    --_row-background: var(--orange-3);
  }
}
```

## Accessibility

Semantic `<table>`, `<th scope>`, `aria-sort` on sortable headers, `aria-selected` /
`aria-expanded` on rows, `aria-busy` on the body while loading, labelled selection and expand
controls, `:focus-visible` rings on every interactive part.

## Known limits (this phase)

- Sticky header sticks to the table's own scroll container (`maxHeight`) or the nearest scrolling
  ancestor. A horizontally scrollable table on a page-scrolling layout cannot stick its header to
  the viewport; revisited in Phase 3.
- Multiple pinned columns on one side overlap; per-column offsets land in Phase 3.
- Columns sharing a header group must share `visibleFrom` / `visibleUntil`.
- Widths are CSS lengths (`px`, `%`, `rem`); there is no `fr`.

## Migration from `TypeTable` (scorer-ui-kit)

| Old | New |
|---|---|
| `columnConfig[i]` ↔ `row.columns[i]` positional pairs | Columns keyed by `id`, cells resolve values via `accessor` |
| `cellStyle: 'highImportance'` | `emphasis: 'high'` |
| `hasStatus` / `hasThumbnail` / `hasTypeIcon` flags | Ordinary columns with `cell: { type: 'status' \| 'thumbnail' \| 'icon' }` |
| `customComponent` per cell | Registered cell type, or `<Table.Cell>` children |
| `rows={[{ columns: [] }]}` for empty | `data={[]}` + `slots.empty` |
| `key=` remount on sort | Controlled `state.sorting` / `onSortingChange` |
| `selectCallback` / `toggleAllCallback` | `onRowSelectionChange` with a key → boolean record |
| Header-only + headerless tables for groups | `features.grouping` or multiple `<Table.Body>` |
| `nth-child` selectors into kit DOM | `[data-ui="…"]` parts in `@layer overrides` |
