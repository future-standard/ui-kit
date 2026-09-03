/**
 * DOM contract — the attributes every renderer (React, vanilla, anything else) must emit so the
 * shared CSS module and consumer overrides work identically regardless of framework.
 *
 * Rules, matching the CSS-modules pattern used across the kit:
 *  - `data-ui` names the part and is never hashed. It is the documented override hook.
 *  - Booleans are presence attributes: `'true'` when on, `undefined` (omitted) when off.
 *  - Enumerations are string values (`data-align="end"`).
 *  - `aria-*` is emitted alongside so accessibility is not left to each renderer.
 *
 * Renderers must drop attributes whose value is `undefined`.
 */

import { getColumnPin, type PinLayout } from './columns';
import type { Row } from './rowModel';
import { type ColumnSchema, resolveFeatures, type TableSchema } from './schema';
import { getColumnSort } from './sorting';
import type { TableState } from './state';

/** Part names. Values are the `data-ui` attribute values. */
export const PARTS = {
  root: 'table',
  scroll: 'table-scroll',
  element: 'table-element',
  head: 'table-head',
  headerRow: 'table-header-row',
  groupHeaderRow: 'table-group-header-row',
  groupHeaderCell: 'table-group-header-cell',
  headerCell: 'table-header-cell',
  sortButton: 'table-sort-button',
  selectAll: 'table-select-all',
  body: 'table-body',
  row: 'table-row',
  groupRow: 'table-group-row',
  cell: 'table-cell',
  selectRow: 'table-select-row',
  expandToggle: 'table-expand-toggle',
  drawer: 'table-drawer',
  status: 'table-status',
} as const;

export type Part = (typeof PARTS)[keyof typeof PARTS];

/** Async state of the data the table is showing. Rendered as `data-status` on the root. */
export type TableStatus = 'idle' | 'loading' | 'empty' | 'error';

export type Attributes = Record<string, string | undefined>;

const flag = (on: boolean | undefined): 'true' | undefined => (on ? 'true' : undefined);

/**
 * How the table relates to scrolling. `contained` (default) wraps the table in its own
 * horizontal scroll container, which enables pinned columns but means a sticky header can only
 * stick to that container (give it a max height). `page` renders no wrapper: the table takes part
 * in the page's scroll, the header sticks to the nearest scrolling ancestor (offset by
 * `--_sticky-top`), and pinned columns are ignored.
 */
export type TableLayout = 'contained' | 'page';

export type RootAttributeOptions = {
  status?: TableStatus;
  layout?: TableLayout;
};

export function getRootAttributes(
  schema: TableSchema,
  { status = 'idle', layout = 'contained' }: RootAttributeOptions = {}
): Attributes {
  const features = resolveFeatures(schema);
  return {
    'data-ui': PARTS.root,
    'data-layout': layout,
    'data-table-id': schema.id,
    'data-density': features.density,
    'data-selection': features.selection === 'none' ? undefined : features.selection,
    'data-zebra': flag(features.zebra),
    'data-sticky-header': flag(features.stickyHeader),
    'data-expandable': flag(features.expandable),
    'data-grouped': flag(features.grouping !== undefined),
    'data-status': status,
  };
}

/** Attributes shared by a column's header cell and body cells. */
function getColumnAttributes(
  column: ColumnSchema,
  pinning: TableState['columnPinning'],
  pin: PinLayout | undefined
): Attributes {
  return {
    'data-column': column.id,
    'data-align': column.align ?? 'start',
    'data-emphasis': column.emphasis ?? 'normal',
    'data-pin': pin?.side ?? getColumnPin(column.id, pinning),
    'data-pin-edge': flag(pin?.edge),
    'data-visible-from': column.visibleFrom,
    'data-visible-until': column.visibleUntil,
  };
}

export function getHeaderCellAttributes(
  column: ColumnSchema,
  state: Pick<TableState, 'sorting' | 'columnPinning'>,
  pin?: PinLayout
): Attributes {
  const sort = getColumnSort(state.sorting, column.id);
  const direction = sort ? (sort.desc ? 'desc' : 'asc') : undefined;
  return {
    'data-ui': PARTS.headerCell,
    ...getColumnAttributes(column, state.columnPinning, pin),
    'data-sortable': flag(column.sortable),
    'data-sort': direction,
    'aria-sort': column.sortable
      ? direction === 'asc'
        ? 'ascending'
        : direction === 'desc'
          ? 'descending'
          : 'none'
      : undefined,
  };
}

export function getCellAttributes(
  column: ColumnSchema,
  state: Pick<TableState, 'columnPinning'>,
  pin?: PinLayout
): Attributes {
  return {
    'data-ui': PARTS.cell,
    ...getColumnAttributes(column, state.columnPinning, pin),
    'data-cell-type': column.cell?.type ?? 'text',
  };
}

export type RowAttributeOptions = {
  /**
   * Consumer-supplied semantic colouring, e.g. `'warning'`, `'muted'`. The CSS module styles a
   * small set; projects may add their own in an override layer.
   */
  tone?: string;
  /** Consumer-supplied lifecycle hint, e.g. `'pending'`, `'disabled'`. Replaces per-cell dimming hacks. */
  state?: string;
};

export function getRowAttributes<TRow>(
  row: Row<TRow>,
  schema: TableSchema,
  { tone, state }: RowAttributeOptions = {}
): Attributes {
  const selectable = resolveFeatures(schema).selection !== 'none';
  return {
    'data-ui': PARTS.row,
    'data-key': row.key,
    'data-index': String(row.index),
    'data-selected': flag(row.isSelected),
    'data-expanded': flag(row.isExpanded),
    'data-tone': tone,
    'data-state': state,
    'aria-selected': selectable ? String(row.isSelected) : undefined,
    'aria-expanded': schema.features?.expandable ? String(row.isExpanded) : undefined,
  };
}

/** Remove `undefined` values so renderers can spread the result straight onto an element. */
export function compactAttributes(attributes: Attributes): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(attributes)) {
    if (value !== undefined) out[key] = value;
  }
  return out;
}
