# Table Schema — Quickstart for Agents

You are producing a **TableSchema**: a plain JSON object that describes a table for
`@future-standard-ui/table`. Follow this page and the result will validate and render. The full
property reference is [schema.md](./schema.md); the machine-readable definition is
`@future-standard-ui/table-core/schema.json`; cell options are in [cells.md](./cells.md).

## The ten rules

1. **JSON only.** No functions. Values come from the row through string **accessor paths**
   (`"location.route"`, `"tags.0"`). Renderers are named by **cell type**.
2. **`rowKey` is required** and must resolve to a unique string or number per row.
3. **Every column has a unique `id`** and a `header` (already translated; may be `""`).
4. **`accessor` defaults to `id`.** Only set it when the field path differs.
5. **Widths are CSS lengths** (`"160px"`, `"20%"`). They are floors: the table scrolls instead of
   squeezing. No `fr`.
6. **Pin sparingly.** A pinned column cannot have `visibleFrom`/`visibleUntil`; when two columns
   are pinned on the same side, all but the outermost need `width`.
7. **Responsive is by container breakpoint** (`sm` 480, `md` 720, `lg` 960, `xl` 1200 px of the
   table's own width). Hide with `visibleFrom`; show a combined column with `visibleUntil` +
   `cell.type: "composite"`.
8. **Columns that share a `group` share their visibility** (`visibleFrom`/`visibleUntil`).
9. **Sorting, selection, expansion and grouping are features**, not columns: set `sortable` on
   columns and `features.selection` / `features.expandable` / `features.grouping` on the table.
10. **The table never mutates data.** Sorting is reported to the screen unless the runtime passes
    `clientSorting: true`.

## Minimal template

```json
{
  "rowKey": "id",
  "columns": [
    { "id": "name", "header": "Name", "sortable": true, "emphasis": "high" },
    { "id": "status", "header": "Status", "cell": { "type": "status", "options": { "tones": { "online": "success", "offline": "danger" } } } },
    { "id": "updatedAt", "header": "Updated", "cell": { "type": "timestamp", "options": { "secondary": "relative" } }, "sortable": true }
  ],
  "features": { "selection": "multiple", "stickyHeader": true }
}
```

## Recipes

**List screen with actions (controlled by the screen)**

```json
{
  "id": "clips",
  "rowKey": "id",
  "columns": [
    { "id": "thumbnail", "header": "", "accessor": "thumbnailUrl", "cell": { "type": "thumbnail", "options": { "altAccessor": "displayName" } }, "width": "80px" },
    { "id": "displayName", "header": "Clip", "cell": { "type": "truncate", "options": { "maxWidth": "220px" } }, "sortable": true, "emphasis": "high" },
    { "id": "camera", "header": "Camera", "accessor": "camera.displayName", "cell": { "type": "link", "options": { "href": "/cameras/{camera.id}" } }, "sortable": true },
    { "id": "fileStatus", "header": "Status", "cell": { "type": "status", "options": { "variant": "badge", "tones": { "completed": "success", "processing": "info", "failed": "danger" } } }, "width": "130px" },
    { "id": "size", "header": "Size", "accessor": "sizeBytes", "cell": { "type": "bytes" }, "align": "end", "sortable": true, "width": "100px" },
    { "id": "actions", "header": "", "cell": { "type": "actions", "options": { "actions": [
      { "id": "play", "label": "Play", "icon": "play", "iconOnly": true, "enabledWhen": { "accessor": "fileStatus", "equals": "completed" } },
      { "id": "delete", "label": "Delete", "design": "danger", "iconOnly": true, "icon": "delete" }
    ] } }, "align": "end", "width": "96px", "pin": "end" }
  ],
  "features": { "selection": "multiple", "stickyHeader": true }
}
```

Runtime (not schema): `state.sorting` + `onSortingChange`, `state.rowSelection` +
`onRowSelectionChange`, `status: 'loading' | 'idle' | 'error'`, `onCellAction`, `cells`, `icons`.

**Responsive: separate columns wide, one combined column narrow**

```json
{ "id": "ingress", "header": "Ingress", "accessor": "traffic.ingress", "cell": { "type": "number", "options": { "unit": "Mb/s" } }, "align": "end", "visibleFrom": "lg", "group": "Traffic" },
{ "id": "egress",  "header": "Egress",  "accessor": "traffic.egress",  "cell": { "type": "number", "options": { "unit": "Mb/s" } }, "align": "end", "visibleFrom": "lg", "group": "Traffic" },
{ "id": "traffic", "header": "Traffic", "accessor": "traffic.total", "visibleUntil": "lg",
  "cell": { "type": "composite", "options": { "parts": [
    { "accessor": "traffic.ingress", "label": "↓", "unit": "Mb/s" },
    { "accessor": "traffic.egress",  "label": "↑", "unit": "Mb/s" } ] } } }
```

**Pinned identity + pinned actions**

```json
{ "id": "code", "header": "ID", "pin": "start", "width": "90px", "emphasis": "low" },
{ "id": "name", "header": "Device", "pin": "start", "width": "160px", "emphasis": "high", "sortable": true },
{ "id": "actions", "header": "", "pin": "end", "width": "96px", "cell": { "type": "actions", "options": { "actions": [ { "id": "edit", "label": "Edit" } ] } } }
```

**Grouped sections (data sorted by the group column)**

```json
"features": { "grouping": { "by": "status", "collapsible": true, "stickyGroupHeader": true } }
```

**Mobile cards**

```json
"features": { "stacked": { "below": "md" }, "selection": "multiple" }
```

The `emphasis: "high"` column becomes the card title; give it one.

**Editable toggle and progress**

```json
{ "id": "enabled", "header": "Enabled", "cell": { "type": "switch", "options": { "enabledWhen": { "accessor": "locked", "truthy": false } } }, "align": "center", "width": "90px" },
{ "id": "storage", "header": "Storage", "accessor": "storage.usedGb", "cell": { "type": "progress", "options": { "maxAccessor": "storage.totalGb", "thresholds": [ { "from": 75, "tone": "warning" }, { "from": 90, "tone": "danger" } ] } }, "width": "150px" }
```

## Checklist before you hand a schema over

- [ ] `rowKey` set; every row will have it.
- [ ] Column ids unique; each has `header`.
- [ ] Every `accessor` matches a real field path in the data.
- [ ] Every `cell.type` is `text`, `composite`, one of the standard set, or registered by the project.
- [ ] `visibleUntil` > `visibleFrom` where both are set; grouped columns agree on both.
- [ ] Pinned columns: no breakpoint visibility; inner pins have `width`.
- [ ] Nothing in the object is a function, `Date`, `undefined` or `NaN`.

Validation at runtime: `validateSchema(schema)` returns `[{ path, message }]`; `createTable` and
`DataTable` throw a `SchemaError` listing every issue.
