# Table — Standard Cells

`@future-standard-ui/table-cells` provides the cell renderers real screens need, each configured
from plain JSON in the column's `cell.options`. Interactions (action buttons, switches, links
without a URL) reach the screen through one callback, `onCellAction`, so the schema stays
serialisable and behaviour is wired once.

```tsx
import { createTableCells } from '@future-standard-ui/table-cells';

const cells = createTableCells({ locale: 'ja-JP', timeZone: 'Asia/Tokyo', icons: { play: <PlayIcon /> } });

<DataTable schema={schema} data={rows} cells={cells} onCellAction={({ action, row }) => …} />
```

`createTableCells(config)` returns a `CellRenderers` map you can spread and extend with
project-specific types. `standardCells` is the default-configured set.

| `config` | Purpose |
|---|---|
| `locale`, `timeZone` | Defaults for numbers and dates (per-column `options.locale` / `options.timeZone` override). |
| `icons` | `Record<string, ReactNode>` used by `icon` cells and action buttons. The kit has no icon dependency; pass your own. |
| `placeholder` | Rendered for empty values. Default `—`. |
| `now` | Injectable clock for relative timestamps. |

## Conditions

Several options accept a **condition**, a JSON-safe test against the row:

```json
{ "accessor": "fileStatus", "equals": "completed" }
{ "accessor": "role", "in": ["admin", "owner"] }
{ "accessor": "lockedBy", "not": null }
{ "accessor": "archived", "truthy": false }
```

## Cell types

| `cell.type` | Value | Options | Emits |
|---|---|---|---|
| `text` | anything | — | |
| `number` | number | `unit`, `digits`, `locale`, `intl` (`Intl.NumberFormat` options) | |
| `bytes` | bytes | `digits`, `locale` → `61.8 MB` (1000-based) | |
| `duration` | seconds | — → `05:05` / `1:02:05` | |
| `boolean` | boolean | `yes`, `no` labels | |
| `timestamp` | ISO string / epoch / Date | `primary: 'time' \| 'date'`, `secondary: 'date' \| 'time' \| 'relative' \| 'none'`, `bold`, `time` / `date` (`Intl.DateTimeFormat` options), `locale`, `timeZone`. Renders a `<time datetime>`. | |
| `multiline` | (row) | `lines: [{ accessor, emphasis?, prefix? }]` | |
| `composite` | (row) | `parts: [{ accessor, label?, unit? }]`, `separator` | |
| `status` | string key | `tones: { key: tone }`, `labels: { key: text }`, `variant: 'dot' \| 'badge'` | |
| `thumbnail` | URL | `width`, `height`, `altAccessor`. Empty → placeholder block. | |
| `link` | label text | `href` template (`'/cameras/{camera.id}'`, dot paths in braces, URL-encoded), `target`, `action`. Without `href` renders a button. | `action` or `navigate:<columnId>` |
| `actions` | (row) | `actions: [{ id, label, icon?, design?: 'default' \| 'danger', iconOnly?, enabledWhen?, visibleWhen? }]` | the action `id` |
| `switch` | boolean | `label`, `enabledWhen`, `action` | `action` or `switch`, `detail` = new checked state |
| `progress` | number | `max` or `maxAccessor`, `thresholds: [{ from, tone }]`, `showValue`, `valueFormat: 'percent' \| 'raw'`, `unit`, `digits`, `label` | |
| `truncate` | string | `maxWidth`. Full text in `title`. | |
| `icon` | icon name | `icons: { value: iconName }` remap, `labels: { value: text }` | |

Tones: `neutral` `info` `success` `warning` `danger`, coloured by the `--table-cell-tone-*` aliases.

## Handling actions

```tsx
onCellAction={({ action, row, detail }) => {
  switch (action) {
    case 'play':     return openPlayer(row.original);
    case 'delete':   return confirmDelete(row.original);
    case 'switch':   return setEnabled(row.original.id, detail as boolean);
    case 'navigate:camera': return navigate(`/cameras/${row.original.camera.id}`);
  }
}}
```

One handler per screen, keyed by action id, replaces the per-cell `customComponent` closures of
the old kit. Screens that use a router give `link` cells no `href` and navigate in the handler.

## Parts and overrides

Each cell kind emits `data-ui="cell-<kind>"` (`cell-status`, `cell-actions`, …) and state as
`data-*` (`data-tone`, `data-variant`, `data-action`, `data-design`). Override in
`@layer overrides` as with the table itself. Colours come from `--table-cell-*` and the existing
`--switch-*` aliases in the theme.

## Writing your own

```tsx
const cells = {
  ...createTableCells(),
  kilopost: ({ value, options }) => `${Number(value).toFixed(1)} ${options.unit ?? 'km'}`,
};
```

A renderer receives `{ value, row, column, table, options, emit }`. Keep it pure, read options
from the schema, and `emit` anything the screen must act on.
