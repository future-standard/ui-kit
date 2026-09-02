import type { ColumnSchema, PinSide, TableSchema } from './schema';
import type { TableState } from './state';

export function getColumnById(schema: TableSchema, id: string): ColumnSchema | undefined {
  return schema.columns.find((column) => column.id === id);
}

/** Runtime pin side for a column, from state (which is seeded from the schema). */
export function getColumnPin(
  columnId: string,
  pinning: TableState['columnPinning']
): PinSide | undefined {
  if (pinning.start.includes(columnId)) return 'start';
  if (pinning.end.includes(columnId)) return 'end';
  return undefined;
}

/**
 * Columns to render, in render order: pinned-start (in pinning order), unpinned (in schema
 * order), pinned-end (in pinning order). Columns hidden via `columnVisibility` are dropped.
 * Breakpoint visibility (`visibleFrom` / `visibleUntil`) is *not* applied here — it is CSS-driven
 * so the same DOM serves every container width.
 */
export function getVisibleColumns(
  schema: TableSchema,
  state: Pick<TableState, 'columnVisibility' | 'columnPinning'>
): ColumnSchema[] {
  const visible = schema.columns.filter((column) => state.columnVisibility[column.id] !== false);
  const byId = new Map(visible.map((column) => [column.id, column]));
  const pick = (ids: readonly string[]) =>
    ids.map((id) => byId.get(id)).filter((column): column is ColumnSchema => column !== undefined);

  const start = pick(state.columnPinning.start);
  const end = pick(state.columnPinning.end);
  const pinned = new Set([...state.columnPinning.start, ...state.columnPinning.end]);
  const middle = visible.filter((column) => !pinned.has(column.id));

  return [...start, ...middle, ...end];
}

export type HeaderGroup = {
  /** `undefined` for columns without a group; they still occupy a slot with `span: 1`. */
  title: string | undefined;
  columnIds: string[];
  span: number;
};

/**
 * Merge adjacent columns sharing a `group` title into one header group. Order follows the
 * columns given, so pass the output of `getVisibleColumns`.
 */
export function getHeaderGroups(columns: readonly ColumnSchema[]): HeaderGroup[] {
  const groups: HeaderGroup[] = [];
  for (const column of columns) {
    const last = groups[groups.length - 1];
    if (last && last.title !== undefined && last.title === column.group) {
      last.columnIds.push(column.id);
      last.span += 1;
    } else {
      groups.push({ title: column.group, columnIds: [column.id], span: 1 });
    }
  }
  return groups;
}

export function hasHeaderGroups(columns: readonly ColumnSchema[]): boolean {
  return columns.some((column) => column.group !== undefined);
}
